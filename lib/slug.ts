/**
 * Generate URL-safe slug from text
 * Converts to lowercase, replaces spaces with dashes, removes special characters
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, and hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading and trailing hyphens
    .substring(0, 50); // Limit to 50 characters
}

/**
 * Generate unique slug by appending random suffix if needed
 */
export function generateUniqueSlug(baseText: string, existingSlugs: string[] = []): string {
  let slug = generateSlug(baseText);
  let counter = 1;
  
  // If slug already exists, append counter
  while (existingSlugs.includes(slug)) {
    slug = `${generateSlug(baseText)}-${counter}`;
    counter++;
  }
  
  return slug;
}
