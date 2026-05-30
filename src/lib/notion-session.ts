/**
 * Utilities for managing the Notion OAuth token via an HttpOnly cookie.
 * The token is never exposed to JavaScript — it is set and read server-side only.
 */

import { NextRequest, NextResponse } from "next/server";

export const NOTION_TOKEN_COOKIE = "notion_token";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

/** Set the Notion OAuth token in a secure HttpOnly cookie on the given response. */
export function setTokenCookie(response: NextResponse, token: string): void {
  response.cookies.set(NOTION_TOKEN_COOKIE, token, COOKIE_OPTIONS);
}

/** Clear the Notion token cookie (zero maxAge expires it immediately). */
export function clearTokenCookie(response: NextResponse): void {
  response.cookies.set(NOTION_TOKEN_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
}

/** Read the Notion token from the HttpOnly cookie on an incoming request. */
export function getTokenFromRequest(req: NextRequest): string | null {
  return req.cookies.get(NOTION_TOKEN_COOKIE)?.value ?? null;
}
