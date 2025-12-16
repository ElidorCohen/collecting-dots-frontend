/**
 * Utility functions for API configuration
 */

/**
 * Get the base URL for API calls
 * Always use relative paths to avoid CORS issues and domain mismatches
 * This ensures API calls use the same domain as the page (www or non-www)
 */
export function getApiBaseUrl(): string {
  // Always use relative paths to ensure same-origin requests
  // This prevents CORS issues and domain redirect problems (www vs non-www)
  return '';
}

/**
 * Build a complete API URL
 * @param endpoint - The API endpoint (e.g., '/api/get-artists-data')
 * @returns Complete URL for the API call (relative path)
 */
export function buildApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${endpoint}`;
}
