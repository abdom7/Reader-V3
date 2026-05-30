import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "buffer";
import { getTokenFromRequest, clearTokenCookie } from "@/lib/notion-session";

export async function POST(req: NextRequest) {
  try {
    // Read token from HttpOnly cookie — never from request body
    const token = getTokenFromRequest(req);

    if (!token) {
      const res = NextResponse.json(
        { success: true, revoked: false, warning: "No token found in session" },
        { status: 200 }
      );
      clearTokenCookie(res);
      return res;
    }

    const clientId = process.env.NOTION_CLIENT_ID;
    const clientSecret = process.env.NOTION_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      const res = NextResponse.json(
        {
          success: true,
          revoked: false,
          warning: "Notion credentials missing on server; token cleared locally only",
        },
        { status: 200 }
      );
      clearTokenCookie(res);
      return res;
    }

    let revoked = false;
    let warning: string | null = null;

    try {
      const revokeRes = await fetch("https://api.notion.com/v1/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        },
        body: JSON.stringify({ grant_type: "revoke_token", token }),
      });

      if (revokeRes.ok) {
        revoked = true;
      } else {
        const err = (await revokeRes.json().catch(() => ({}))) as Record<string, string>;
        if (err?.error === "invalid_request") {
          warning = "Notion already considers this token revoked. You're safely disconnected.";
          revoked = true;
        } else {
          warning = err.error || err.message || `Notion revoke failed (${revokeRes.status})`;
        }
      }
    } catch (err) {
      warning =
        err instanceof Error ? err.message : "Failed to reach Notion revoke endpoint";
    }

    const res = NextResponse.json({ success: true, revoked, warning });
    // Always clear the cookie regardless of revocation outcome
    clearTokenCookie(res);
    return res;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
