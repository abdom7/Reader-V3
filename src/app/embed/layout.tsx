import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Infinity Reader — Embed",
  description: "Embeddable distraction-free PDF reader widget",
};

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
