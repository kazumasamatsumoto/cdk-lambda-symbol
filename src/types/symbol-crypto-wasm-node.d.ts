declare module "symbol-crypto-wasm-node/symbol_crypto_wasm.js" {
  export default function (): Promise<void>;
  export const memory: WebAssembly.Memory;
}
