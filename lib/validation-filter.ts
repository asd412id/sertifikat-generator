/**
 * HTML Filter Utilities
 * Filter backticks and other artifacts from AI-generated HTML
 */

/**
 * Remove markdown code blocks (```html and ```) from HTML
 */
export function filterBackticks(html: string): string {
  if (!html) return html;

  let cleaned = html;

  // Remove ```html at the beginning (case insensitive)
  cleaned = cleaned.replace(/^```html\s*\n?/i, '');

  // Remove ``` at the end
  cleaned = cleaned.replace(/\s*```$/i, '');

  // Remove any remaining triple backticks
  cleaned = cleaned.replace(/```/g, '');

  // Remove any remaining double backticks
  cleaned = cleaned.replace(/``/g, '');

  // Remove single backticks if they remain
  cleaned = cleaned.replace(/`/g, '');

  // Trim whitespace
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Remove markdown code blocks from raw AI response
 */
export function cleanAiResponse(text: string): string {
  if (!text) return text;

  // Try to extract HTML from code blocks
  const codeBlockMatch = text.match(/```html\s*\n?([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // If no code blocks, try to find HTML directly
  const divMatch = text.match(/<div[\s\S]*<\/div>/i);
  if (divMatch) {
    return divMatch[0];
  }

  // Fallback: remove all backticks
  return filterBackticks(text);
}

/**
 * Extract pure HTML from various AI response formats
 */
export function extractHtmlFromAiResponse(response: any): string {
  if (typeof response === 'string') {
    return cleanAiResponse(response);
  }

  if (response && typeof response === 'object') {
    // Handle different response structures
    if (response.html) {
      return cleanAiResponse(response.html);
    }

    if (response.content) {
      return cleanAiResponse(response.content);
    }

    if (response.choices && response.choices[0]) {
      return cleanAiResponse(response.choices[0].message?.content || '');
    }
  }

  return '';
}
