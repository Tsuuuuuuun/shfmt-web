import type { HighlighterCore } from "@shikijs/core";

let highlighter: HighlighterCore | null = null;

/** Load Shiki highlighter asynchronously (fire-and-forget) */
export async function loadHighlighter(): Promise<void> {
  try {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }, theme, lang] =
      await Promise.all([
        import("@shikijs/core"),
        import("@shikijs/engine-javascript"),
        import("@shikijs/themes/tokyo-night"),
        import("@shikijs/langs/shellscript"),
      ]);

    highlighter = await createHighlighterCore({
      engine: createJavaScriptRegexEngine(),
      themes: [theme.default],
      langs: [lang.default],
    });
  } catch (e) {
    console.warn("Failed to load syntax highlighter:", e);
  }
}

/** Return highlighted HTML for shell code, or null if highlighter is unavailable */
export function highlightShell(code: string): string | null {
  if (!highlighter) {
    return null;
  }

  try {
    return highlighter.codeToHtml(code, {
      lang: "shellscript",
      theme: "tokyo-night",
      colorReplacements: { "#1a1b26": "transparent" },
    });
  } catch {
    return null;
  }
}
