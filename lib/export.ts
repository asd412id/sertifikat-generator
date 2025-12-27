import { formatRgb, parse } from "culori";

type ImageFormat = "png" | "jpg";

function replaceUnsupportedCssColors(input: string) {
  if (!input) return input;
  if (!/(oklab\(|oklch\(|lab\(|lch\(|color\()/i.test(input)) return input;

  return input.replace(/(?:okl(?:ab|ch)|l(?:ab|ch)|color)\([^)]*\)/gi, (match) => {
    try {
      const parsed = parse(match);
      const legacy = parsed ? formatRgb(parsed) : null;
      return legacy ?? "rgba(0, 0, 0, 0)";
    } catch {
      return "rgba(0, 0, 0, 0)";
    }
  });
}

function normalizeUnsupportedColors(root: Element) {
  const nodes = [root, ...Array.from(root.querySelectorAll("*"))];
  for (const node of nodes) {
    if (!(node instanceof Element)) continue;

    const el = node as HTMLElement;
    const cs = getComputedStyle(el);

    const props: Array<[keyof CSSStyleDeclaration, string]> = [
      ["color", cs.color],
      ["backgroundColor", cs.backgroundColor],
      ["backgroundImage", cs.backgroundImage],
      ["borderTopColor", cs.borderTopColor],
      ["borderRightColor", cs.borderRightColor],
      ["borderBottomColor", cs.borderBottomColor],
      ["borderLeftColor", cs.borderLeftColor],
      ["outlineColor", cs.outlineColor],
      ["textDecorationColor", cs.textDecorationColor],
    ];

    for (const [prop, value] of props) {
      if (!value) continue;
      if (!/(oklab\(|oklch\(|lab\(|lch\(|color\()/i.test(value)) continue;
      (el.style as any)[prop] = replaceUnsupportedCssColors(value);
    }

    // SVG colors
    if (el instanceof SVGElement) {
      const fill = el.getAttribute("fill");
      if (fill && /(oklab\(|oklch\(|lab\(|lch\(|color\()/i.test(fill)) {
        el.setAttribute("fill", replaceUnsupportedCssColors(fill));
      }
      const stroke = el.getAttribute("stroke");
      if (stroke && /(oklab\(|oklch\(|lab\(|lch\(|color\()/i.test(stroke)) {
        el.setAttribute("stroke", replaceUnsupportedCssColors(stroke));
      }
      const styleAttr = el.getAttribute("style");
      if (styleAttr && /(oklab\(|oklch\(|lab\(|lch\(|color\()/i.test(styleAttr)) {
        el.setAttribute("style", replaceUnsupportedCssColors(styleAttr));
      }
    }
  }
}

function downloadUrl(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  try {
    downloadUrl(url, filename);
  } finally {
    // Give the browser a moment to start the download.
    setTimeout(() => URL.revokeObjectURL(url), 2500);
  }
}

// Fungsi untuk mendapatkan ukuran kertas yang tepat
function getPaperDimensions(paperSize?: "a4" | "f4") {
  if (paperSize === "f4") {
    return {
      widthMm: 330,
      heightMm: 215,
      widthPx: 1200,
      heightPx: 764,
    };
  }

  return {
    widthMm: 275,
    heightMm: 210,
    widthPx: 1200,
    heightPx: 850,
  };
}

// Fungsi untuk mengukur konten dengan lebih akurat
function measureContentExtent(root: HTMLElement, paperSize?: "a4" | "f4") {
  const paper = getPaperDimensions(paperSize);

  // Gunakan ukuran dari paper spec sebagai base
  const baseWidth = paper.widthPx;
  const baseHeight = paper.heightPx;

  // Cek apakah konten melebihi batas
  const rootRect = root.getBoundingClientRect();
  const nodes = root.querySelectorAll<HTMLElement>("*");

  let maxRight = 0;
  let maxBottom = 0;
  let hasOverflow = false;

  for (const el of Array.from(nodes)) {
    const rect = el.getBoundingClientRect();
    if (rect.right > maxRight) maxRight = rect.right;
    if (rect.bottom > maxBottom) maxBottom = rect.bottom;

    // Cek overflow
    if (rect.right > rootRect.right + 10 || rect.bottom > rootRect.bottom + 10) {
      hasOverflow = true;
    }
  }

  const extraW = Math.max(0, Math.ceil(maxRight - rootRect.right));
  const extraH = Math.max(0, Math.ceil(maxBottom - rootRect.bottom));

  // Jika ada overflow, gunakan base size yang lebih besar
  if (hasOverflow) {
    console.warn("Content overflow detected, adjusting dimensions...");
    return {
      width: Math.max(baseWidth, Math.ceil(rootRect.width) + extraW),
      height: Math.max(baseHeight, Math.ceil(rootRect.height) + extraH),
      hasOverflow: true,
    };
  }

  return {
    width: Math.ceil(rootRect.width) + extraW,
    height: Math.ceil(rootRect.height) + extraH,
    hasOverflow: false,
  };
}

async function renderCanvas(element: HTMLElement, scale: number, paperSize?: "a4" | "f4") {
  const html2canvas = (await import("html2canvas")).default;
  const extent = measureContentExtent(element, paperSize);

  // Jika ada overflow, tambahkan padding
  const padding = extent.hasOverflow ? 50 : 0;
  const renderWidth = extent.width + padding;
  const renderHeight = extent.height + padding;

  return html2canvas(element, {
    scale,
    backgroundColor: null,
    useCORS: true,
    logging: false,
    width: renderWidth,
    height: renderHeight,
    windowWidth: renderWidth,
    windowHeight: renderHeight,
    onclone: (doc) => {
      const cloned = doc.body.querySelector("[data-export-root='true']");
      if (cloned instanceof HTMLElement) {
        // Reset dan set ukuran yang tepat
        cloned.style.overflow = "visible";
        cloned.style.width = `${renderWidth}px`;
        cloned.style.height = `${renderHeight}px`;
        cloned.style.maxWidth = "none";
        cloned.style.maxHeight = "none";
        cloned.style.minWidth = "none";
        cloned.style.minHeight = "none";
        (cloned.style as any).aspectRatio = "auto";

        // Tambahkan padding jika overflow
        if (extent.hasOverflow) {
          cloned.style.padding = "20px";
          cloned.style.boxSizing = "border-box";
        }

        // Make sure the cloned document itself doesn't clip.
        doc.documentElement.style.overflow = "visible";
        doc.body.style.overflow = "visible";
        doc.body.style.margin = "0";
        doc.body.style.width = `${renderWidth}px`;
        doc.body.style.height = `${renderHeight}px`;
        doc.body.style.padding = "0";

        normalizeUnsupportedColors(cloned);
      }
    },
  });
}

export async function exportElementAsImage(
  element: HTMLElement,
  opts: {
    filename: string;
    format: ImageFormat;
    scale?: number;
    jpegQuality?: number;
    paperSize?: "a4" | "f4";
  },
) {
  const canvas = await renderCanvas(element, opts.scale ?? 4, opts.paperSize);

  const mime = opts.format === "png" ? "image/png" : "image/jpeg";
  const quality = opts.format === "png" ? undefined : (opts.jpegQuality ?? 0.95);

  // Prefer Blob download (lebih stabil di banyak browser).
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, quality),
  );

  if (blob) {
    downloadBlob(blob, opts.filename);
    return;
  }

  // Fallback.
  const dataUrl =
    opts.format === "png"
      ? canvas.toDataURL("image/png")
      : canvas.toDataURL("image/jpeg", opts.jpegQuality ?? 0.95);
  downloadUrl(dataUrl, opts.filename);
}

export async function exportElementAsPdf(
  element: HTMLElement,
  opts: {
    filename: string;
    scale?: number;
    paperSize?: "a4" | "f4";
  },
) {
  const canvas = await renderCanvas(element, opts.scale ?? 4, opts.paperSize);

  // Gunakan PNG untuk kualitas lebih baik, lalu kompres ke JPEG
  const imgData = canvas.toDataURL("image/png");

  // Konversi PNG ke JPEG dengan kualitas tinggi untuk PDF
  const jpegData = await new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const ctx = tempCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.drawImage(img, 0, 0);
        resolve(tempCanvas.toDataURL("image/jpeg", 0.98));
      } else {
        resolve(imgData);
      }
    };
    img.src = imgData;
  });

  const { jsPDF } = await import("jspdf");

  const paper = opts.paperSize === "f4" ? "f4" : "a4";
  const format =
    paper === "f4"
      ? ([330, 215] as [number, number])
      : ([275, 210] as [number, number]);
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Fit image to page while preserving aspect ratio.
  const imgWidthPx = canvas.width;
  const imgHeightPx = canvas.height;
  const imgAspect = imgWidthPx / imgHeightPx;
  const pageAspect = pageWidth / pageHeight;

  let renderWidth = pageWidth;
  let renderHeight = pageHeight;

  if (imgAspect > pageAspect) {
    renderHeight = renderWidth / imgAspect;
  } else {
    renderWidth = renderHeight * imgAspect;
  }

  const x = (pageWidth - renderWidth) / 2;
  const y = (pageHeight - renderHeight) / 2;

  pdf.addImage(jpegData, "JPEG", x, y, renderWidth, renderHeight);

  // Prefer Blob download for stability.
  const blob = pdf.output("blob");
  downloadBlob(blob, opts.filename);
}
