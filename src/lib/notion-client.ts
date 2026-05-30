/**
 * Shared Notion API client utilities.
 * All API routes should import from here instead of defining their own headers/constants.
 */

export const NOTION_VERSION = "2022-06-28";

/** Build standard Notion API request headers for a given bearer token. */
export function notionHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

/** Structured error thrown when a Notion API call returns a non-OK status. */
export class NotionApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "NotionApiError";
  }
}

/**
 * Typed wrapper around `fetch` for Notion API calls.
 * Automatically attaches auth headers and throws `NotionApiError` on failure.
 *
 * @param token  Notion OAuth access token
 * @param path   Notion API path (e.g. "/v1/pages")
 * @param init   Standard fetch init options (method, body, etc.)
 * @returns Parsed JSON response body
 */
export async function notionFetch<T = unknown>(
  token: string,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const url = path.startsWith("http")
    ? path
    : `https://api.notion.com${path}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      ...notionHeaders(token),
      ...(init.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, string>;
    const message =
      body?.message || body?.error || `Notion API error (${res.status})`;
    throw new NotionApiError(message, res.status, body?.code);
  }

  return res.json() as Promise<T>;
}
