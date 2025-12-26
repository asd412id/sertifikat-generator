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

function measureMaxContentExtent(root: HTMLElement) {
  const rootRect = root.getBoundingClientRect();
  let maxRight = rootRect.right;
  let maxBottom = rootRect.bottom;

  const nodes = root.querySelectorAll<HTMLElement>("*");
  for (const el of Array.from(nodes)) {
    const rect = el.getBoundingClientRect();
    if (rect.right > maxRight) maxRight = rect.right;
    if (rect.bottom > maxBottom) maxBottom = rect.bottom;
  }

  const extraW = Math.max(0, Math.ceil(maxRight - rootRect.right));
  const extraH = Math.max(0, Math.ceil(maxBottom - rootRect.bottom));

  return {
    width: Math.ceil(rootRect.width) + extraW,
    height: Math.ceil(rootRect.height) + extraH,
  };
}

async function renderCanvas(element: HTMLElement, scale: number) {
  const html2canvas = (await import("html2canvas")).default;
  const extent = measureMaxContentExtent(element);
  return html2canvas(element, {
    scale,
    backgroundColor: null,
    useCORS: true,
    logging: false,
    width: extent.width,
    height: extent.height,
    windowWidth: extent.width,
    windowHeight: extent.height,
    onclone: (doc) => {
      const cloned = doc.body.querySelector("[data-export-root='true']");
      if (cloned instanceof HTMLElement) {
        // Ensure overflow content isn't clipped during capture.
        cloned.style.overflow = "visible";
        cloned.style.width = `${extent.width}px`;
        cloned.style.height = `${extent.height}px`;
        cloned.style.maxWidth = "none";
        cloned.style.maxHeight = "none";
        (cloned.style as any).aspectRatio = "auto";

        // Make sure the cloned document itself doesn't clip.
        doc.documentElement.style.overflow = "visible";
        doc.body.style.overflow = "visible";
        doc.body.style.margin = "0";
        doc.body.style.width = `${extent.width}px`;
        doc.body.style.height = `${extent.height}px`;

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
  },
) {
  const canvas = await renderCanvas(element, opts.scale ?? 4);

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
  const canvas = await renderCanvas(element, opts.scale ?? 4);
  const imgData = canvas.toDataURL("image/jpeg", 0.98);

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

  pdf.addImage(imgData, "JPEG", x, y, renderWidth, renderHeight, undefined, "FAST");

  // Prefer Blob download for stability.
  const blob = pdf.output("blob");
  downloadBlob(blob, opts.filename);
}
