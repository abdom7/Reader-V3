import { NextRequest, NextResponse } from "next/server";

const NOTION_VERSION = "2022-06-28";

function notionHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

function getTitle(properties: Record<string, any>) {
  const titleProperty = Object.values(properties).find((property) => property?.type === "title");
  return titleProperty?.title?.map((part: any) => part.plain_text).join("").trim() || "Untitled Book";
}

function getNumber(properties: Record<string, any>, names: string[]) {
  for (const name of names) {
    const property = properties[name];
    if (property?.type === "number") return property.number ?? null;
  }
  return null;
}

function getSelect(properties: Record<string, any>, names: string[]) {
  for (const name of names) {
    const property = properties[name];
    if (property?.type === "select") return property.select?.name ?? null;
  }
  return null;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/\.pdf$/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scorePdfMatch(bookTitle: string, fileName: string, fileUrl: string) {
  const titleWords = normalizeText(bookTitle)
    .split(" ")
    .filter((word) => word.length > 2);
  const target = normalizeText(`${fileName} ${decodeURIComponent(fileUrl)}`);

  if (!titleWords.length) return 0;

  return titleWords.reduce(
    (score, word) => score + (target.includes(word) ? 1 : 0),
    0
  );
}

function getPdfFile(properties: Record<string, any>, bookTitle: string) {
  const candidates = ["PDF", "Pdf", "pdf", "File", "Files", "Book PDF", "Book Pdf"];
  const files: { name: string; url: string; propertyName: string; score: number }[] = [];

  for (const name of candidates) {
    const property = properties[name];
    if (!property) continue;

    if (property.type === "files") {
      for (const file of property.files || []) {
        const url = file.type === "external" ? file.external?.url : file.file?.url;
        if (!url) continue;

        const fileName = file.name || "book.pdf";
        files.push({
          name: fileName,
          url,
          propertyName: name,
          score: scorePdfMatch(bookTitle, fileName, url),
        });
      }
    }

    if (property.type === "url" && property.url) {
      files.push({
        name: "book.pdf",
        url: property.url,
        propertyName: name,
        score: scorePdfMatch(bookTitle, "book.pdf", property.url),
      });
    }
  }

  return files.sort((a, b) => b.score - a.score)[0] || null;
}

export async function POST(req: NextRequest) {
  try {
    const { token, booksDatabaseId } = await req.json();

    if (!token || !booksDatabaseId) {
      return NextResponse.json(
        { success: false, error: "Token and Books Database ID are required" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://api.notion.com/v1/databases/${booksDatabaseId}/query`,
      {
        method: "POST",
        headers: notionHeaders(token),
        body: JSON.stringify({
          sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
          page_size: 50,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: err.message || `Notion API error (${res.status})` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const books = (data.results || []).map((page: any) => {
      const properties = page.properties || {};
      const title = getTitle(properties);
      const pdf = getPdfFile(properties, title);

      return {
        id: page.id,
        title,
        notionUrl: page.url,
        currentPage: getNumber(properties, ["Current Page", "currentPage", "Current page"]),
        totalPages: getNumber(properties, ["Total Pages", "totalPages", "Total pages"]),
        status: getSelect(properties, ["Status", "status"]),
        hasPdf: Boolean(pdf?.url),
        pdfName: pdf?.name || null,
        pdfUrl: pdf?.url || null,
        pdfPropertyName: pdf?.propertyName || null,
        lastEditedTime: page.last_edited_time,
      };
    });

    return NextResponse.json({ success: true, books });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
