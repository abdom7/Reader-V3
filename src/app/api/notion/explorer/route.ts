import { NextRequest, NextResponse } from "next/server";
import { notionFetch } from "@/lib/notion-client";
import { getTokenFromRequest } from "@/lib/notion-session";
import type {
  NotionProperties,
  NotionTitleProperty,
  NotionNumberProperty,
  NotionSelectProperty,
  NotionMultiSelectProperty,
  NotionFormulaProperty,
  NotionFilesProperty,
  NotionUrlProperty,
  NotionPageListResponse,
  NotionPage,
} from "@/lib/notion-types";

// ─── Property Helpers ─────────────────────────────────────────────────────────

function getTitle(properties: NotionProperties): string {
  const titleProp = Object.values(properties).find(
    (p): p is NotionTitleProperty => p?.type === "title"
  );
  return (
    titleProp?.title?.map((part) => part.plain_text).join("").trim() ||
    "Untitled Book"
  );
}

function getNumber(
  properties: NotionProperties,
  names: string[]
): number | null {
  for (const name of names) {
    const prop = properties[name];
    if (prop?.type === "number") {
      return (prop as NotionNumberProperty).number ?? null;
    }
  }
  return null;
}

function getSelect(
  properties: NotionProperties,
  names: string[]
): string | null {
  for (const name of names) {
    const prop = properties[name];
    if (prop?.type === "select") {
      return (prop as NotionSelectProperty).select?.name ?? null;
    }
  }
  return null;
}

function getMultiSelect(
  properties: NotionProperties,
  names: string[]
): string[] {
  for (const name of names) {
    const prop = properties[name];
    if (prop?.type === "multi_select") {
      return (prop as NotionMultiSelectProperty).multi_select
        .map((item) => item?.name)
        .filter(Boolean) as string[];
    }
  }
  return [];
}

function getFormulaString(prop: NotionProperties[string]): string | null {
  if (!prop || prop.type !== "formula") return null;
  const formula = (prop as NotionFormulaProperty).formula;
  if (!formula) return null;

  switch (formula.type) {
    case "string":
      return formula.string ?? null;
    case "number":
      return typeof formula.number === "number" ? String(formula.number) : null;
    case "boolean":
      return formula.boolean != null ? String(formula.boolean) : null;
    case "rich_text":
      return (
        formula.rich_text?.map((item) => item.plain_text).join("").trim() ||
        null
      );
    default:
      return null;
  }
}

function getDailyRecommendation(properties: NotionProperties) {
  const prop =
    properties["Daily Pages"] ||
    properties["Daily pages"] ||
    properties["daily pages"];

  const text = getFormulaString(prop)?.trim() || null;

  let pages: number | null = null;
  if (text) {
    const match = text.match(/(\d+)/);
    if (match) pages = Number.parseInt(match[1], 10);
  }

  const missingDeadline = text
    ? /please select the deadline/i.test(text)
    : false;

  return { text, pages: missingDeadline ? null : pages, missingDeadline };
}

// ─── PDF Resolution ───────────────────────────────────────────────────────────

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.pdf$/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scorePdfMatch(
  bookTitle: string,
  fileName: string,
  fileUrl: string
): number {
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

interface PdfCandidate {
  name: string;
  url: string;
  propertyName: string;
  score: number;
}

function getPdfFile(
  properties: NotionProperties,
  bookTitle: string
): PdfCandidate | null {
  const candidates = ["PDF", "Pdf", "pdf", "File", "Files", "Book PDF", "Book Pdf"];
  const files: PdfCandidate[] = [];

  for (const name of candidates) {
    const prop = properties[name];
    if (!prop) continue;

    if (prop.type === "files") {
      for (const file of (prop as NotionFilesProperty).files) {
        const url =
          file.type === "external" ? file.external?.url : file.file?.url;
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

    if (prop.type === "url" && (prop as NotionUrlProperty).url) {
      const url = (prop as NotionUrlProperty).url!;
      files.push({
        name: "book.pdf",
        url,
        propertyName: name,
        score: scorePdfMatch(bookTitle, "book.pdf", url),
      });
    }
  }

  return files.sort((a, b) => b.score - a.score)[0] ?? null;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Token from HttpOnly cookie
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated. Please reconnect Notion." },
        { status: 401 }
      );
    }

    const { booksDatabaseId } = await req.json();

    if (!booksDatabaseId) {
      return NextResponse.json(
        { success: false, error: "Books Database ID is required" },
        { status: 400 }
      );
    }

    const data = await notionFetch<NotionPageListResponse>(
      token,
      `/v1/databases/${booksDatabaseId}/query`,
      {
        method: "POST",
        body: JSON.stringify({
          sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
          page_size: 50,
        }),
      }
    );

    const books = (data.results ?? []).map((page: NotionPage) => {
      const properties = page.properties ?? ({} as NotionProperties);
      const title = getTitle(properties);
      const pdf = getPdfFile(properties, title);
      const recommendation = getDailyRecommendation(properties);

      return {
        id: page.id,
        title,
        notionUrl: page.url,
        currentPage: getNumber(properties, ["Current Page", "currentPage", "Current page"]),
        totalPages: getNumber(properties, ["Total Pages", "totalPages", "Total pages"]),
        status: getSelect(properties, ["Status", "status"]),
        genre: getSelect(properties, ["Genre", "Genres"]),
        hasPdf: Boolean(pdf?.url),
        pdfName: pdf?.name ?? null,
        pdfUrl: pdf?.url ?? null,
        pdfPropertyName: pdf?.propertyName ?? null,
        dailyRecommendationPages: recommendation.pages,
        dailyRecommendationText: recommendation.text,
        dailyRecommendationMissingDeadline: recommendation.missingDeadline,
        lastEditedTime: page.last_edited_time,
      };
    });

    return NextResponse.json({ success: true, books });
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
