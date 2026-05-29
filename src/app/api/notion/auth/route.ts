import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.NOTION_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/notion/callback`;

  if (!clientId) {
    return NextResponse.json(
      { error: "NOTION_CLIENT_ID not configured" },
      { status: 500 }
    );
  }

  const authUrl = new URL("https://api.notion.com/v1/oauth/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("owner", "user");
  authUrl.searchParams.set("redirect_uri", redirectUri);

  return NextResponse.redirect(authUrl.toString());
}
