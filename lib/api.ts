/**
 * Utility functions for API configuration
 */

/**
 * Get the base URL for API calls
 * In development, use relative paths (empty string)
 * In production, use the NEXT_PUBLIC_API_URL environment variable
 */
export function getApiBaseUrl(): string {
  // In development (localhost), use relative paths
  if (process.env.NODE_ENV === 'development') {
    return '';
  }
  
  // In production, use the environment variable or fallback to current domain
  return process.env.NEXT_PUBLIC_API_URL || '';
}

/**
 * Build a complete API URL
 * @param endpoint - The API endpoint (e.g., '/api/get-artists-data')
 * @returns Complete URL for the API call
 */
export function buildApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${endpoint}`;
}
