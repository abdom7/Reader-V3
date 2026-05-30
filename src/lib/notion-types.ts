/**
 * Minimal Notion API response types used across the app.
 * These are approximations of the Notion API shape — not exhaustive.
 */

// ─── Rich Text ────────────────────────────────────────────────────────────────

export interface NotionRichText {
  type: string;
  plain_text: string;
  annotations?: Record<string, boolean | string>;
  text?: { content: string; link?: { url: string } | null };
}

// ─── Property Values ──────────────────────────────────────────────────────────

export interface NotionTitleProperty {
  type: "title";
  title: NotionRichText[];
}

export interface NotionRichTextProperty {
  type: "rich_text";
  rich_text: NotionRichText[];
}

export interface NotionNumberProperty {
  type: "number";
  number: number | null;
}

export interface NotionSelectProperty {
  type: "select";
  select: { id?: string; name: string; color?: string } | null;
}

export interface NotionMultiSelectProperty {
  type: "multi_select";
  multi_select: Array<{ id?: string; name: string; color?: string }>;
}

export interface NotionFormulaProperty {
  type: "formula";
  formula:
    | { type: "string"; string?: string | null }
    | { type: "number"; number?: number | null }
    | { type: "boolean"; boolean?: boolean | null }
    | { type: "rich_text"; rich_text?: NotionRichText[] | null }
    | { type: "date" };
}

export interface NotionFilesProperty {
  type: "files";
  files: Array<
    | { type: "file"; name: string; file: { url: string; expiry_time?: string } }
    | { type: "external"; name: string; external: { url: string } }
  >;
}

export interface NotionUrlProperty {
  type: "url";
  url: string | null;
}

export interface NotionDateProperty {
  type: "date";
  date: { start: string; end?: string | null; time_zone?: string | null } | null;
}

export interface NotionRelationProperty {
  type: "relation";
  relation: Array<{ id: string }>;
}

export type NotionPropertyValue =
  | NotionTitleProperty
  | NotionRichTextProperty
  | NotionNumberProperty
  | NotionSelectProperty
  | NotionMultiSelectProperty
  | NotionFormulaProperty
  | NotionFilesProperty
  | NotionUrlProperty
  | NotionDateProperty
  | NotionRelationProperty;

// ─── Pages & Databases ────────────────────────────────────────────────────────

export type NotionProperties = Record<string, NotionPropertyValue>;

export interface NotionPage {
  object: "page";
  id: string;
  url: string;
  created_time: string;
  last_edited_time: string;
  properties: NotionProperties;
}

export interface NotionBlock {
  object: "block";
  id: string;
  type: string;
}

export interface NotionTemplateRef {
  id: string;
  name?: string;
  is_default?: boolean;
  title?: NotionRichText[];
}

export interface NotionDatabase {
  object: "database";
  id: string;
  title: NotionRichText[];
  template_pages?: NotionTemplateRef[];
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface NotionListResponse<T> {
  results: T[];
  next_cursor: string | null;
  has_more: boolean;
}

export type NotionPageListResponse = NotionListResponse<NotionPage>;
export type NotionBlockListResponse = NotionListResponse<NotionBlock>;
export type NotionDatabaseListResponse = NotionListResponse<NotionDatabase>;
