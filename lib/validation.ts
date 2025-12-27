/**
 * HTML Validation Utilities
 * Memastikan hasil generate AI valid dan aman
 */

import { HTML_VALIDATION_RULES } from "./prompt-templates";
import { filterBackticks, cleanAiResponse, extractHtmlFromAiResponse } from "./validation-filter";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedHtml: string;
}

/**
 * Validasi HTML structure dan content
 */
export function validateHtmlStructure(html: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check 1: Basic HTML structure
  if (!html.includes("<div")) {
    errors.push("Missing root div element");
  }

  if (html.includes("<script")) {
    errors.push("Forbidden: script tag detected");
  }

  // Check 2: Forbidden tags
  const forbiddenTags = HTML_VALIDATION_RULES.forbiddenTags;
  for (const tag of forbiddenTags) {
    if (html.includes(`<${tag}`)) {
      errors.push(`Forbidden tag detected: <${tag}>`);
    }
  }

  // Check 3: Forbidden attributes (event handlers)
  const forbiddenAttrs = HTML_VALIDATION_RULES.forbiddenAttributes;
  for (const attr of forbiddenAttrs) {
    if (html.includes(attr)) {
      errors.push(`Forbidden attribute detected: ${attr}`);
    }
  }

  // Check 4: Color format validation
  const colorRegex = /(oklab|oklch|lab|lch|color)\s*\(/gi;
  const forbiddenColors = html.match(colorRegex);
  if (forbiddenColors) {
    errors.push(`Forbidden color format detected: ${forbiddenColors.join(", ")}`);
  }

  // Check 5: Length validation
  if (html.length > HTML_VALIDATION_RULES.maxTextLength) {
    warnings.push(`HTML length (${html.length}) exceeds recommended max (${HTML_VALIDATION_RULES.maxTextLength})`);
  }

  // Check 6: Element count estimation
  const divCount = (html.match(/<div/g) || []).length;
  if (divCount > HTML_VALIDATION_RULES.maxElements) {
    warnings.push(`High element count (${divCount}), may impact performance`);
  }

  // Check 7: Inline styles count (basic estimation)
  const styleCount = (html.match(/style="/g) || []).length;
  if (styleCount > HTML_VALIDATION_RULES.maxInlineStyles) {
    warnings.push(`High inline style count (${styleCount}), consider simplifying`);
  }

  // Check 8: Overflow protection
  if (html.includes("overflow:visible") && !html.includes("overflow:hidden")) {
    warnings.push("Overflow:visible detected without overflow:hidden fallback");
  }

  // Check 9: Safe area padding
  if (!html.includes("inset:") && !html.includes("padding:")) {
    warnings.push("No safe area padding detected");
  }

  // Check 10: Aspect ratio
  if (!html.includes("aspect-ratio") && !html.includes("width:") && !html.includes("height:")) {
    warnings.push("No aspect ratio or dimensions specified");
  }

  // Sanitization: Remove any dangerous patterns
  let sanitized = html;

  // Remove script tags and content
  sanitized = sanitized.replace(/<script[\s\S]*?<\/script>/gi, "");

  // Remove event handlers
  for (const attr of forbiddenAttrs) {
    const regex = new RegExp(`${attr}\\s*=\\s*["'][^"']*["']`, "gi");
    sanitized = sanitized.replace(regex, "");
  }

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, "");

  // Remove dangerous CSS functions
  sanitized = sanitized.replace(/expression\([^)]*\)/gi, "");

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedHtml: sanitized
  };
}

/**
 * Retry wrapper untuk API calls dengan exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Fallback template jika AI generate gagal
 */
export function getFallbackTemplate(instruction: string, paperSpec: any): string {
  return `
    <div style="position:relative;width:100%;height:100%;overflow:hidden;box-sizing:border-box;background:linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);">
      <!-- Fallback Certificate -->
      <div style="position:absolute;inset:6%;display:flex;flex-direction:column;justify-content:space-between;gap:16px;overflow:hidden;box-sizing:border-box;border:2px solid #cbd5e1;border-radius:12px;padding:24px;background:white;">
        <div style="text-align:center;padding:20px;">
          <h1 style="font-family:system-ui,Segoe UI,Helvetica,Arial;font-size:32px;font-weight:bold;color:#1e293b;margin:0 0 8px 0;">SERTIFIKAT</h1>
          <p style="font-family:system-ui,Segoe UI,Helvetica,Arial;font-size:16px;color:#475569;margin:0;">Sementara - Generate Ulang Diperlukan</p>
        </div>
        <div style="text-align:center;padding:16px;background:#f1f5f9;border-radius:8px;">
          <p style="font-family:system-ui,Segoe UI,Helvetica,Arial;font-size:14px;color:#334155;margin:0;">
            <strong>Data:</strong><br/>
            ${instruction}
          </p>
        </div>
        <div style="text-align:center;padding:12px;font-size:12px;color:#64748b;">
          Paper: ${paperSpec.label}
        </div>
      </div>
    </div>
  `.trim();
}

/**
 * Analyze HTML quality and provide suggestions
 */
export function analyzeHtmlQuality(html: string): {
  score: number;
  suggestions: string[];
  quality: "poor" | "fair" | "good" | "excellent";
} {
  const suggestions: string[] = [];
  let score = 100;

  // Check for premium indicators
  const hasGradients = html.includes("gradient");
  const hasShadows = html.includes("box-shadow");
  const hasBorderRadius = html.includes("border-radius");
  const hasFlex = html.includes("display:flex");
  const hasOpacity = html.includes("opacity");

  // Score based on features
  if (!hasGradients) {
    score -= 15;
    suggestions.push("Add subtle gradients for depth");
  }

  if (!hasShadows) {
    score -= 10;
    suggestions.push("Add soft shadows for elevation");
  }

  if (!hasBorderRadius) {
    score -= 5;
    suggestions.push("Add border-radius for modern look");
  }

  if (!hasFlex) {
    score -= 10;
    suggestions.push("Use flexbox for better layout control");
  }

  if (!hasOpacity) {
    score -= 5;
    suggestions.push("Use opacity for subtle overlays");
  }

  // Check typography
  const fontSizes = html.match(/font-size:\s*(\d+)px/g);
  if (fontSizes) {
    const sizes = fontSizes.map(f => parseInt(f.match(/\d+/)?.[0] || "0")).filter(s => s > 0);
    const uniqueSizes = new Set(sizes);
    if (uniqueSizes.size < 3) {
      score -= 10;
      suggestions.push("Add more typography hierarchy (different font sizes)");
    }
  } else {
    score -= 15;
    suggestions.push("Add font-size declarations");
  }

  // Check color variety
  const colors = html.match(/#[0-9a-fA-F]{3,6}|rgb\([^)]*\)|rgba\([^)]*\)/g);
  if (colors) {
    const uniqueColors = new Set(colors);
    if (uniqueColors.size < 3) {
      score -= 10;
      suggestions.push("Use more color variety (3-5 colors)");
    }
  }

  // Determine quality level
  let quality: "poor" | "fair" | "good" | "excellent";
  if (score >= 90) quality = "excellent";
  else if (score >= 75) quality = "good";
  else if (score >= 60) quality = "fair";
  else quality = "poor";

  return {
    score,
    suggestions,
    quality
  };
}

/**
 * Extract metadata from generated HTML
 */
export function extractMetadata(html: string): {
  hasOverflow: boolean;
  elementCount: number;
  colorCount: number;
  hasSafeArea: boolean;
  hasTypography: boolean;
} {
  return {
    hasOverflow: html.includes("overflow:visible") && !html.includes("overflow:hidden"),
    elementCount: (html.match(/<div/g) || []).length,
    colorCount: (html.match(/#[0-9a-fA-F]{3,6}|rgb\([^)]*\)|rgba\([^)]*\)/g) || []).length,
    hasSafeArea: html.includes("inset:") || html.includes("padding:"),
    hasTypography: html.includes("font-size") || html.includes("font-weight")
  };
}
