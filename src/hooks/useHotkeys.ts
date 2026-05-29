import { useEffect } from "react";

const SKIPPED_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export type Modifier = "shift" | "ctrl" | "alt" | "meta";

export interface HotkeyConfig {
  key: string;
  modifiers?: Modifier[];
  handler: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
  enabled?: boolean;
  description?: string;
}

function eventMatchesHotkey(event: KeyboardEvent, config: HotkeyConfig) {
  const expectedKey = config.key.toLowerCase();
  const actualKey = event.key.toLowerCase();

  if (expectedKey !== actualKey) return false;

  const modifiers = config.modifiers || [];
  const modifierSet = new Set(modifiers.map((m) => m.toLowerCase() as Modifier));

  if (modifierSet.has("ctrl") !== event.ctrlKey) return false;
  if (modifierSet.has("meta") !== event.metaKey) return false;
  if (modifierSet.has("shift") !== event.shiftKey) return false;
  if (modifierSet.has("alt") !== event.altKey) return false;

  // Ensure no unexpected modifiers are pressed
  if (!modifierSet.has("ctrl") && event.ctrlKey) return false;
  if (!modifierSet.has("meta") && event.metaKey) return false;
  if (!modifierSet.has("shift") && event.shiftKey) return false;
  if (!modifierSet.has("alt") && event.altKey) return false;

  return true;
}

export function useHotkeys(configs: HotkeyConfig[]) {
  useEffect(() => {
    const activeConfigs = configs.filter((config) => config.enabled !== false);
    if (activeConfigs.length === 0) return;

    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (SKIPPED_TAGS.has(target.tagName) || target.isContentEditable)) {
        return;
      }

      for (const config of activeConfigs) {
        if (eventMatchesHotkey(event, config)) {
          if (config.preventDefault) {
            event.preventDefault();
          }
          config.handler(event);
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [configs]);
}
