import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { success: false, error: "PDF URL is required" },
        { status: 400 }
      );
    }

    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return NextResponse.json(
        { success: false, error: "Invalid PDF URL" },
        { status: 400 }
      );
    }

    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch PDF (${res.status})` },
        { status: res.status }
      );
    }

    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": res.headers.get("content-type") || "application/pdf",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
