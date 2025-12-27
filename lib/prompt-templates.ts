/**
 * Premium Prompt Templates for Certificate Generation
 * Membuat hasil generate lebih robust, elegan, dan konsisten
 */

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  buildPrompt: (data: {
    instruction: string;
    seed: number;
    paperSize: "a4" | "f4";
    paperSpec: {
      label: string;
      widthPx: number;
      heightPx: number;
      widthMm: number;
      heightMm: number;
    };
  }) => string;
}

// Data default Indonesia (Dummy/Contoh)
export const DEFAULT_DATA_ID = {
  section1: {
    judul: "SERTIFIKAT",
    nomor: "001.2025/X/SCERT",
  },
  section2: {
    nama: "ANDI SAPUTRA, S.Kom.",
    asalSekolah: "SMK NEGERI 1 JAKARTA",
  },
  section3: {
    peran: "PESERTA",
    kegiatan: "Pelatihan Pengembangan Profesi Guru Dalam Rangka Peningkatan Kompetensi Melalui Workshop Teknologi Pembelajaran Berbasis Digital Tingkat Dasar Tahun 2025",
    lokasi: "Aula Convention Center",
    tanggal: "15 Desember 2025",
  },
  section4: {
    tempatTanggal: "Jakarta, 15 Desember 2025",
    jabatan: "Kepala Dinas Pendidikan Provinsi",
    nama: "Drs. BUDIANTO, M.Pd.",
    nip: "19801231 200501 2 001",
  },
};

// Fungsi untuk mendapatkan instruction default dalam bahasa Indonesia
export function getDefaultInstruction(): string {
  const data = DEFAULT_DATA_ID;
  return [
    "Isi sertifikat dengan data berikut:",
    "",
    "# Section 1 - Header (Tengah, rapat)",
    `Judul: ${data.section1.judul}`,
    `Nomor Sertifikat: ${data.section1.nomor}`,
    "",
    "# Section 2 - Peserta (Tengah, rapat)",
    `Nama: ${data.section2.nama}`,
    `Asal Sekolah: ${data.section2.asalSekolah}`,
    "",
    "# Section 3 - Kegiatan (Gabung tanpa label)",
    `Peran: ${data.section3.peran}`,
    `Kegiatan: ${data.section3.kegiatan}`,
    `Lokasi: ${data.section3.lokasi}`,
    `Tanggal: ${data.section3.tanggal}`,
    "",
    "# Section 4 - Tanda Tangan (Tengah horizontal)",
    `TempatTanggal: ${data.section4.tempatTanggal}`,
    `Jabatan: ${data.section4.jabatan}`,
    `NamaTTD: ${data.section4.nama}`,
    `NIP: ${data.section4.nip}`,
    "",
    "# Style Requirements:",
    "- Font: Kaushan Script untuk nama, Lobster untuk sekolah, Poppins untuk body",
    "- Layout: Section grouping, rapat vertikal",
    "- Garis pemisah tipis antara nama dan sekolah",
    "- Space TTD: 3cm tinggi",
    "- Tema: Edukasi modern dengan gradien artistik",
  ].join("\n");
}

// Template Premium - Hasil paling elegan dengan dekorasi ramai dan kreatif
export const PREMIUM_TEMPLATE: PromptTemplate = {
  id: "premium",
  name: "Premium Creative",
  description: "Sertifikat premium dengan dekorasi ramai, gradien kreatif, dan visual artistik",

  buildPrompt: ({ instruction, seed, paperSize, paperSpec }) => {
    return [
      "=== PREMIUM CREATIVE CERTIFICATE GENERATION ===",
      "You are a professional certificate designer. Create a stunning, print-ready certificate with CREATIVE and RAMAI decorations.",
      "",
      "🎯 GOAL: Create a VIBRANT, DYNAMIC certificate with creative background and multiple decoration layers",
      "📊 FORMAT: HTML only, inline styles, single root div",
      "🚫 RESTRICTIONS: No scripts, no external assets, no event handlers",
      "",
      "=== CREATIVE VISUAL SPECIFICATIONS ===",
      "🎨 CREATIVE BACKGROUND SYSTEM (Multi-layer):",
      "  - Layer 1: Base gradient (2-3 colors, MEDIUM-HIGH saturation)",
      "  - Layer 2: Radial gradient overlay (center focus)",
      "  - Layer 3: Diagonal grid pattern (lines, 5-10% opacity)",
      "  - Layer 4: Dot matrix pattern (dots, 3-8% opacity)",
      "  - Layer 5: Subtle glow/shadow effects",
      "",
      "🎨 COLOR PALETTE (Vibrant & Professional):",
      "  - Primary: Deep blue/purple (#1e3a8a, #4c1d95)",
      "  - Secondary: Teal/cyan (#0d9488, #06b6d4)",
      "  - Accent: Gold/amber (#f59e0b, #fbbf24)",
      "  - Background: Light gradient (sky/white)",
      "  - ALL colors: hex/rgb/rgba ONLY",
      "",
      "✨ DECORATION LAYERS (4-5 layers, RAMAI but balanced):",
      "  - Layer A: Corner ribbons & polygons (15-25% opacity)",
      "  - Layer B: Geometric shapes (circles, hexagons, triangles) - floating",
      "  - Layer C: Diagonal lines & cross patterns (5-12% opacity)",
      "  - Layer D: Border frame with inner glow (2-3px width)",
      "  - Layer E: Subtle shadows on decorations (blur 15-25px)",
      "",
      "📝 TYPOGRAPHY HIERARCHY:",
      "  - Heading (Title): 50px, bold, uppercase (SERTIFIKAT)",
      "  - Name: 37px, Kaushan Script, bold (if available, fallback to system)",
      "  - School: Lobster font (if available, fallback to system)",
      "  - Body text: 16-20px, Poppins (if available, fallback to system)",
      "  - Small text: 12-14px, light",
      "  - Line height: 1.2-1.4 for headings, 1.5-1.6 for body",
      "",
      "📐 LAYOUT & SPACING:",
      "  - Safe area: 6-8% padding from edges",
      "  - Content container: flex column, space-between",
      "  - Section grouping: distinct sections with tight vertical spacing",
      "  - Gap between sections: 8-12px (tight as requested)",
      "  - Max width for text blocks: 85% of container",
      "  - Alignment: Center for all sections",
      "",
      "🎭 CREATIVE EFFECTS (RAMAI & ARTISTIC):",
      "  - Shadows: Multiple layers (soft 15px, medium 20px, hard 8px)",
      "  - Glows: Inner glow on borders (color: accent, opacity 0.15-0.25)",
      "  - Overlays: Gradient overlays on shapes (20-30% opacity)",
      "  - Patterns: Diagonal grids, dot matrices, hexagon patterns",
      "  - Shapes: Circles, triangles, hexagons, diamonds, polygons",
      "  - Positioning: Corners, edges, center, floating elements",
      "  - Layering: 3-4 layers of decorations with blend modes",
      "",
      "📏 CONSTRAINTS (CRITICAL):",
      "  - NO overflow outside paper boundaries",
      "  - ALL content within safe area (6-8% padding)",
      "  - Text wrapping: word-break + overflow-wrap",
      "  - Font size reduction: if content long, reduce 10-20%",
      "  - Height adaptation: flex layout, no fixed heights",
      "  - Aspect ratio: ${paperSpec.label} (${paperSpec.widthMm}x${paperSpec.heightMm}mm)",
      "",
      "=== CONTENT STRUCTURE ===",
      "Root element:",
      "<div style=\"position:relative;width:100%;height:100%;overflow:hidden;box-sizing:border-box;\">",
      "  <!-- Layer 1: Base gradient background -->",
      "  <!-- Layer 2: Radial overlay -->",
      "  <!-- Layer 3: Diagonal grid pattern -->",
      "  <!-- Layer 4: Dot matrix pattern -->",
      "  <!-- Layer 5: Decorative shapes (circles, hexagons, triangles) -->",
      "  <!-- Layer 6: Corner ribbons & polygons -->",
      "  <!-- Layer 7: Border frame with glow -->",
      "  <!-- Content container (safe area) -->",
      "</div>",
      "",
      "Content container:",
      "<div style=\"position:absolute;inset:6%;display:flex;flex-direction:column;justify-content:space-between;gap:12px;overflow:hidden;box-sizing:border-box;z-index:10;\">",
      "  <!-- Section 1: Header (Tengah, rapat) -->",
      "  <!-- Section 2: Peserta (Tengah, rapat) + Garis pemisah -->",
      "  <!-- Section 3: Kegiatan (Gabung tanpa label) -->",
      "  <!-- Section 4: Tanda Tangan (Tengah horizontal) + Space 3cm -->",
      "</div>",
      "",
      "=== SECTION SPECIFICATIONS ===",
      "Section 1 - Header:",
      "  - Judul: SERTIFIKAT (50px, bold, center)",
      "  - Nomor: 001.2025/X/SCERT (rapat ke judul)",
      "",
      "Section 2 - Peserta:",
      "  - Nama: ANDI SAPUTRA, S.Kom. (37px, Kaushan Script, bold)",
      "  - Garis pemisah tipis (1px, opacity 0.3)",
      "  - Asal Sekolah: SMK NEGERI 1 JAKARTA (Lobster)",
      "",
      "Section 3 - Kegiatan:",
      "  - Peran: PESERTA (badge style, rounded)",
      "  - Kegiatan: Pelatihan Pengembangan Profesi Guru... (Poppins, justified)",
      "  - Lokasi: Aula Convention Center",
      "  - Tanggal: 15 Desember 2025",
      "",
      "Section 4 - Tanda Tangan:",
      "  - TempatTanggal: Jakarta, 15 Desember 2025",
      "  - Jabatan: Kepala Dinas Pendidikan Provinsi",
      "  - Space TTD: 3cm height (113px at 96dpi)",
      "  - Nama: Drs. BUDIANTO, M.Pd. (bold)",
      "  - Garis pemisah tipis (1px, opacity 0.3)",
      "  - NIP: 19801231 200501 2 001",
      "",
      "=== CREATIVE DECORATION EXAMPLES ===",
      "  - Corner top-left: Polygon ribbon with gradient (purple-blue)",
      "  - Corner top-right: Circle with dot pattern (gold)",
      "  - Corner bottom-left: Triangle cluster (teal)",
      "  - Corner bottom-right: Hexagon with glow (amber)",
      "  - Center floating: 2-3 small circles/triangles (low opacity)",
      "  - Diagonal lines: 2-3 lines crossing (5% opacity)",
      "  - Border: Double frame with inner glow",
      "",
      "=== USER INSTRUCTION ===",
      "Interpret this user data and create certificate:",
      `"${instruction}"`,
      "",
      "USER STYLE PREFERENCES:",
      "- User can specify font sizes (e.g., 'font besar untuk nama', 'heading 60px')",
      "- User can specify colors (e.g., 'warna merah', 'biru tua')",
      "- User can specify layout (e.g., 'rata kiri', 'center', 'kanan')",
      "- User can specify spacing (e.g., 'gap kecil', 'rapat', 'longgar')",
      "- User can specify font families (e.g., 'font mewah', 'font modern')",
      "- RESPECT user preferences over template defaults",
      "",
      "IMPORTANT: If user instruction contains style preferences, APPLY THEM IMMEDIATELY.",
      "Example: 'font besar untuk nama' → increase name font size to 40px+",
      "Example: 'warna merah' → use red color for headings",
      "Example: 'rata kiri' → align text left",
      "Example: 'font mewah' → use elegant fonts (serif or script)",
      "Example: 'gap kecil' → reduce section gap to 6-8px",
      "",
      "=== SEED & VARIATION ===",
      `Variation seed: ${seed}`,
      "Use seed for consistent randomization of decorations and colors",
      "",
      "=== FINAL CHECKLIST ===",
      "✓ All text within safe area",
      "✓ No overflow detected",
      "✓ Colors are export-compatible",
      "✓ Typography is hierarchical and readable",
      "✓ Decorations are RAMAI and CREATIVE (4-5 layers)",
      "✓ Layout is balanced and professional",
      "✓ HTML structure is clean and valid",
      "✓ Section grouping as specified",
      "✓ Tight vertical spacing (8-12px)",
      "✓ Font fallbacks for Kaushan Script, Lobster, Poppins",
      "✓ Multiple decoration layers with blend effects",
      "✓ Creative background with patterns and gradients",
      "",
      "Output: Single HTML div with inline styles only."
    ].join("\n");
  }
};

// Helper function to get template by ID (hanya premium yang digunakan)
export function getTemplate(id: string): PromptTemplate {
  return PREMIUM_TEMPLATE; // Always return premium template
}

// Validation schema for HTML output
export const HTML_VALIDATION_RULES = {
  requiredTags: ["div", "style"],
  forbiddenTags: ["script", "iframe", "object", "embed"],
  forbiddenAttributes: ["onload", "onclick", "onerror", "onmouseover"],
  maxInlineStyles: 50, // Max style declarations per element
  maxElements: 100, // Max DOM elements
  maxTextLength: 5000, // Max text content
  allowedColors: ["hex", "rgb", "rgba"],
  forbiddenColors: ["oklab", "oklch", "lab", "lch", "color"],
};

// Quality presets configuration (hanya premium yang digunakan)
export const QUALITY_PRESETS = {
  premium: {
    temperature: 0.7,
    maxRetries: 3,
    validation: "strict",
    timeout: 60000,
    description: "Premium creative dengan dekorasi ramai"
  }
};
