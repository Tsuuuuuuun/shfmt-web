/** Indent style for shfmt */
export type IndentType = "tab" | "2" | "4";

/** Shell dialect */
export type ShellDialect = "bash" | "posix" | "mksh";

/** Binary operator placement */
export type BinaryNextLine = "default" | "start" | "end";

/** Format options */
export interface FormatOptions {
  indent: IndentType;
  shell: ShellDialect;
  binaryOps: BinaryNextLine;
}

/** Format result */
export type FormatResult =
  | { ok: true; formatted: string }
  | { ok: false; error: string };

/** WASM load status */
export type WasmStatus = "loading" | "ready" | "error";
