"use client";

import { useReaderStore } from "@/lib/store";
import { UploadScreen } from "@/components/UploadScreen";
import { LaunchSequence } from "@/components/LaunchSequence";
import { ReadingScreen } from "@/components/ReadingScreen";

export default function EmbedPage() {
  const { phase } = useReaderStore();

  return (
    <div className="w-full h-screen overflow-hidden">
      {phase === "launch" && <UploadScreen />}
      {phase === "upload" && <UploadScreen />}
      {phase === "countdown" && <LaunchSequence />}
      {phase === "reading" && <ReadingScreen />}
    </div>
  );
}
