/** Type declarations for Go WASM runtime */
declare class Go {
  argv: string[];
  env: Record<string, string>;
  importObject: WebAssembly.Imports;
  run(instance: WebAssembly.Instance): Promise<void>;
}
