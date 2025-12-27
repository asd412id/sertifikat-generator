/**
 * HTML Filter Utilities - Enhanced Version
 * Filter backticks, penjelasan AI, dan extract HTML murni
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
 * Remove penjelasan AI (text before/after HTML container)
 */
export function removeAiExplanations(text: string): string {
  if (!text) return text;

  let cleaned = text;

  // Remove common AI introduction patterns
  cleaned = cleaned.replace(/^(Berikut adalah|Ini adalah|Berikut ini|Silakan gunakan|Here is|Here's|Below is)[^<]*/gi, '');

  // Remove common AI closing patterns
  cleaned = cleaned.replace(/(Semoga bermanfaat|Semoga membantu|Hope this helps|Good luck|Terima kasih)[^<]*$/gi, '');

  // Remove explanations between paragraphs
  cleaned = cleaned.replace(/\n\n[A-Za-z\s.,]*:\n\n/g, '\n\n');

  // Remove single line explanations
  cleaned = cleaned.replace(/\n[A-Za-z\s.,]*\n/g, '\n');

  return cleaned.trim();
}

/**
 * Extract pure HTML from various AI response formats
 */
export function extractPureHtml(text: string): string {
  if (!text) return '';

  // Step 1: Remove backticks first
  let cleaned = filterBackticks(text);

  // Step 2: Remove AI explanations
  cleaned = removeAiExplanations(cleaned);

  // Step 3: Extract HTML container
  // Try to find the main div container
  const divMatch = cleaned.match(/<div[^>]*>[\s\S]*<\/div>/i);
  if (divMatch) {
    return divMatch[0].trim();
  }

  // Step 4: If no div found, try to find any HTML structure
  const htmlMatch = cleaned.match(/<html[^>]*>[\s\S]*<\/html>/i);
  if (htmlMatch) {
    return htmlMatch[0].trim();
  }

  // Step 5: Fallback - return the whole cleaned text
  return cleaned.trim();
}

/**
 * Clean AI response from various formats
 */
export function cleanAiResponse(text: string): string {
  if (!text) return text;

  // Try to extract from code blocks
  const codeBlockMatch = text.match(/```html\s*\n?([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    return extractPureHtml(codeBlockMatch[1]);
  }

  // Try to extract HTML directly
  const htmlMatch = text.match(/<div[\s\S]*<\/div>/i);
  if (htmlMatch) {
    return extractPureHtml(htmlMatch[0]);
  }

  // Fallback: clean the whole text
  return extractPureHtml(text);
}

/**
 * Extract pure HTML from various AI response formats
 */
export function extractHtmlFromAiResponse(response: any): string {
  if (typeof response === 'string') {
    return cleanAiResponse(response);
  }

  if (response && typeof response === 'object') {
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
