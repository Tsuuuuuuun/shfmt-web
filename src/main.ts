import "./style.css";
import { loadWasm, formatWithShfmt, getWasmStatus } from "./formatter";
import { loadHighlighter, highlightShell } from "./highlighter";
import type {
  FormatOptions,
  IndentType,
  ShellDialect,
  BinaryNextLine,
  WasmStatus,
} from "./types";

// --- DOM helpers ---

function getElement<T extends HTMLElement>(testId: string): T {
  const el = document.querySelector<T>(`[data-testid="${testId}"]`);
  if (!el) {
    throw new Error(`Element with data-testid="${testId}" not found`);
  }
  return el;
}

// --- Elements ---

const inputEditor = getElement<HTMLTextAreaElement>("input-editor");
const outputArea = getElement<HTMLDivElement>("output-area");
const formatButton = getElement<HTMLButtonElement>("format-button");
const clearButton = getElement<HTMLButtonElement>("clear-button");
const copyButton = getElement<HTMLButtonElement>("copy-button");
const optionIndent = getElement<HTMLSelectElement>("option-indent");
const optionShell = getElement<HTMLSelectElement>("option-shell");
const optionBinop = getElement<HTMLSelectElement>("option-binop");
const statusText = getElement<HTMLSpanElement>("status-text");
const statusDot = getElement<HTMLDivElement>("status-dot");
const shortcutHint = formatButton.querySelector<HTMLSpanElement>(".shortcut-hint");
const lineNumbers = document.querySelector<HTMLDivElement>(".line-numbers")!;

// --- OS detection ---

const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
if (shortcutHint) {
  shortcutHint.textContent = isMac ? "\u2318 Enter" : "Ctrl Enter";
}

// --- Line numbers (input) ---

const mirror = document.createElement("div");
mirror.style.cssText =
  "visibility:hidden;position:absolute;left:-9999px;white-space:pre-wrap;overflow-wrap:break-word;";
document.body.appendChild(mirror);

function syncMirrorStyle(): void {
  const cs = getComputedStyle(inputEditor);
  mirror.style.fontFamily = cs.fontFamily;
  mirror.style.fontSize = cs.fontSize;
  mirror.style.lineHeight = cs.lineHeight;
  mirror.style.paddingLeft = cs.paddingLeft;
  mirror.style.paddingRight = cs.paddingRight;
  mirror.style.borderLeft = cs.borderLeft;
  mirror.style.borderRight = cs.borderRight;
  mirror.style.width = `${inputEditor.clientWidth}px`;
}

function updateLineNumbers(): void {
  syncMirrorStyle();
  const text = inputEditor.value;
  const lines = text.split("\n");

  // Measure each line's rendered height
  mirror.textContent = "";
  const heights: number[] = [];
  for (const line of lines) {
    const div = document.createElement("div");
    div.style.whiteSpace = "pre-wrap";
    div.style.overflowWrap = "break-word";
    div.textContent = line || "\u200b"; // zero-width space for empty lines
    mirror.appendChild(div);
    heights.push(div.offsetHeight);
    mirror.removeChild(div);
  }

  // Build gutter content
  lineNumbers.textContent = "";
  for (let i = 0; i < lines.length; i++) {
    const div = document.createElement("div");
    div.className = "line-num";
    div.style.height = `${heights[i]}px`;
    div.textContent = String(i + 1);
    lineNumbers.appendChild(div);
  }
}

inputEditor.addEventListener("input", updateLineNumbers);
new ResizeObserver(updateLineNumbers).observe(inputEditor);

inputEditor.addEventListener("scroll", () => {
  lineNumbers.scrollTop = inputEditor.scrollTop;
});

// Initial line numbers
updateLineNumbers();

// --- Last formatted text (for copy) ---

let lastFormattedText = "";

// --- Status management ---

function updateStatus(wasmStatus: WasmStatus): void {
  statusDot.className = "status-dot";

  switch (wasmStatus) {
    case "loading":
      statusDot.classList.add("loading");
      statusText.textContent = "Loading shfmt WASM...";
      formatButton.disabled = true;
      break;
    case "ready":
      statusDot.classList.add("ready");
      statusText.textContent = "WASM loaded \u2014 all processing stays local";
      formatButton.disabled = false;
      break;
    case "error":
      statusDot.classList.add("error");
      statusText.textContent = "Failed to load WASM \u2014 please reload the page";
      formatButton.disabled = true;
      break;
  }
}

// --- Options ---

function getOptions(): FormatOptions {
  const indent = optionIndent.value as IndentType;
  const shell = optionShell.value as ShellDialect;
  const binaryOps = optionBinop.value as BinaryNextLine;
  return { indent, shell, binaryOps };
}

// --- Output helpers ---

const PLACEHOLDER_TEXT = "Formatted output will appear here";

function setOutputPlaceholder(): void {
  outputArea.textContent = PLACEHOLDER_TEXT;
  outputArea.className = "output-area placeholder";
}

function setOutputSuccess(text: string): void {
  lastFormattedText = text;
  const html = highlightShell(text);
  if (html) {
    outputArea.innerHTML = html;
    outputArea.className = "output-area highlighted";
  } else {
    outputArea.textContent = "";
    const lines = text.split("\n");
    for (const line of lines) {
      const div = document.createElement("div");
      div.className = "output-line";
      div.textContent = line || "\u200b"; // zero-width space for empty lines
      outputArea.appendChild(div);
    }
    outputArea.className = "output-area";
  }
}

function setOutputError(text: string): void {
  outputArea.textContent = text;
  outputArea.className = "output-area error";
}

// --- Formatting ---

let isFormatting = false;

async function handleFormat(): Promise<void> {
  if (isFormatting || getWasmStatus() !== "ready") {
    return;
  }

  const source = inputEditor.value;
  if (source.trim() === "") {
    setOutputPlaceholder();
    return;
  }

  isFormatting = true;
  formatButton.textContent = "Formatting...";
  formatButton.disabled = true;

  try {
    const result = await formatWithShfmt(source, getOptions());
    if (result.ok) {
      setOutputSuccess(result.formatted);
    } else {
      setOutputError(result.error);
    }
  } catch {
    setOutputError("Unexpected error during formatting");
  } finally {
    isFormatting = false;
    formatButton.disabled = false;
    formatButton.textContent = "";
    formatButton.append(
      document.createTextNode("Format "),
      (() => {
        const span = document.createElement("span");
        span.className = "shortcut-hint";
        span.textContent = isMac ? "\u2318 Enter" : "Ctrl Enter";
        return span;
      })()
    );
  }
}

// --- Event: Format button ---
formatButton.addEventListener("click", () => {
  void handleFormat();
});

// --- Event: Clear button ---
clearButton.addEventListener("click", () => {
  inputEditor.value = "";
  lastFormattedText = "";
  setOutputPlaceholder();
  updateLineNumbers();
});

// --- Event: Copy button ---
copyButton.addEventListener("click", () => {
  if (lastFormattedText === "") {
    return;
  }

  void navigator.clipboard.writeText(lastFormattedText).then(() => {
    copyButton.textContent = "Copied!";
    setTimeout(() => {
      copyButton.textContent = "Copy";
    }, 1200);
  });
});

// --- Event: Tab key in textarea ---
inputEditor.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    const start = inputEditor.selectionStart;
    const end = inputEditor.selectionEnd;
    inputEditor.value =
      inputEditor.value.substring(0, start) +
      "\t" +
      inputEditor.value.substring(end);
    inputEditor.selectionStart = start + 1;
    inputEditor.selectionEnd = start + 1;
  }
});

// --- Event: Keyboard shortcuts ---
document.addEventListener("keydown", (e) => {
  const mod = isMac ? e.metaKey : e.ctrlKey;

  // Cmd/Ctrl + Enter → Format
  if (mod && e.key === "Enter") {
    e.preventDefault();
    void handleFormat();
    return;
  }

  // Cmd/Ctrl + Shift + C → Copy output
  if (mod && e.shiftKey && e.key === "C") {
    e.preventDefault();
    copyButton.click();
  }
});

// --- Init ---
void loadWasm(updateStatus);
void loadHighlighter();
