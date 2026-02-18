import type { FormatOptions, FormatResult, WasmStatus } from "./types";

let wasmModule: WebAssembly.Module | null = null;
let status: WasmStatus = "loading";

/** Convert FormatOptions to shfmt CLI arguments */
function buildArgs(options: FormatOptions): string[] {
  const args: string[] = [];

  if (options.indent === "tab") {
    args.push("-i", "0");
  } else {
    args.push("-i", options.indent);
  }

  args.push("-ln", options.shell);

  if (options.binaryOps === "start") {
    args.push("-bn");
  }

  return args;
}

/** Load the WASM module and report status via callback */
export async function loadWasm(
  callback: (status: WasmStatus) => void
): Promise<void> {
  status = "loading";
  callback(status);

  try {
    wasmModule = await WebAssembly.compileStreaming(fetch("/shfmt.wasm"));
    status = "ready";
    callback(status);
  } catch (e) {
    console.error("Failed to load WASM:", e);
    status = "error";
    callback(status);
  }
}

/** Return the current WASM load status */
export function getWasmStatus(): WasmStatus {
  return status;
}

/** Run shfmt WASM to format source code */
export async function formatWithShfmt(
  source: string,
  options: FormatOptions
): Promise<FormatResult> {
  if (wasmModule === null) {
    return { ok: false, error: "WASM module not loaded" };
  }

  const go = new Go();
  go.argv = ["shfmt", ...buildArgs(options)];

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const inputBytes = encoder.encode(source);
  let inputPos = 0;

  const stdoutBuf: Uint8Array[] = [];
  const stderrBuf: Uint8Array[] = [];

  const originalFs = (globalThis as Record<string, unknown>).fs as Record<
    string,
    unknown
  >;
  const hookedFs = Object.assign({}, originalFs);

  hookedFs.read = (
    fd: number,
    buffer: Uint8Array,
    offset: number,
    length: number,
    _position: number | null,
    callback: (err: Error | null, bytesRead: number) => void
  ): void => {
    if (fd === 0) {
      const remaining = inputBytes.length - inputPos;
      if (remaining === 0) {
        callback(null, 0);
        return;
      }
      const bytesToRead = Math.min(length, remaining);
      buffer.set(
        inputBytes.subarray(inputPos, inputPos + bytesToRead),
        offset
      );
      inputPos += bytesToRead;
      callback(null, bytesToRead);
    } else {
      (originalFs.read as Function)(
        fd,
        buffer,
        offset,
        length,
        _position,
        callback
      );
    }
  };

  hookedFs.writeSync = (fd: number, buf: Uint8Array | string): number => {
    const bytes =
      buf instanceof Uint8Array ? buf : encoder.encode(buf as string);
    if (fd === 1) {
      stdoutBuf.push(new Uint8Array(bytes));
    } else if (fd === 2) {
      stderrBuf.push(new Uint8Array(bytes));
    }
    return bytes.length;
  };

  (globalThis as Record<string, unknown>).fs = hookedFs;

  try {
    const instance = await WebAssembly.instantiate(
      wasmModule,
      go.importObject
    );
    await go.run(instance);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown WASM error",
    };
  } finally {
    (globalThis as Record<string, unknown>).fs = originalFs;
  }

  const stderr = stderrBuf.map((b) => decoder.decode(b)).join("");
  if (stderr.length > 0) {
    return { ok: false, error: stderr.trim() };
  }

  const stdout = stdoutBuf.map((b) => decoder.decode(b)).join("");
  return { ok: true, formatted: stdout };
}
