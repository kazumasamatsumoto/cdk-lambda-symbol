import { TextEncoder } from "util";
import {
  facade,
  AlicePublicKey,
  BobAddress,
  AlicePrivateKey,
  NODE,
} from "./account/configure.js";
import { KeyPair, models } from "symbol-sdk/symbol";
import { PrivateKey } from "symbol-sdk";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

// ESMでの__dirnameの定義
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// グローバルスコープでrequireを設定
const requireShim = (await import("module")).createRequire(import.meta.url);
global.require = requireShim;

// WASMファイルのパスを設定
const wasmPath = join(
  process.env.LAMBDA_TASK_ROOT || __dirname,
  "node_modules",
  "symbol-crypto-wasm-node",
  "symbol_crypto_wasm_bg.wasm"
);
console.log("WASM file path:", wasmPath);

try {
  // WASMファイルの存在確認
  const wasmBuffer = readFileSync(wasmPath);
  console.log("WASM file size:", wasmBuffer.length);

  // WASMモジュールの初期化
  const wasmModule = await WebAssembly.compile(wasmBuffer);
  const symbolCrypto = await import(
    "symbol-crypto-wasm-node/symbol_crypto_wasm.js"
  );
  global.WebAssembly = WebAssembly;
  await symbolCrypto.default();
} catch (error) {
  console.error("Error initializing WASM:", error);
}

// BigIntのシリアライズ対応
const JSONStringifyWithBigInt = (obj: any) => {
  return JSON.stringify(obj, (_, value) =>
    typeof value === "bigint" ? value.toString() : value
  );
};

export const handler = async (event: any) => {
  console.log("Event received:", JSONStringifyWithBigInt(event));

  try {
    // 入力の検証
    if (!event.body) {
      console.log("No body in event");
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Request body is required",
        }),
      };
    }

    const body =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    console.log("Parsed body:", JSONStringifyWithBigInt(body));

    // メッセージデータの作成
    const messageText =
      body.message || "TS-NODE Hello, Symbol! with AWS Lambda API Gateway";
    console.log("Message text:", messageText);

    const messageData = new Uint8Array([
      0x00,
      ...new TextEncoder().encode(messageText),
    ]);

    console.log("Creating transaction...");
    // トランザクションの作成
    const tx = facade.transactionFactory.create({
      type: "transfer_transaction_v1",
      signerPublicKey: AlicePublicKey,
      deadline: facade.network.fromDatetime(new Date()).addHours(2).timestamp,
      recipientAddress: BobAddress,
      mosaics: [{ mosaicId: 0x72c0212e67a08bcen, amount: 1000000n }],
      message: messageData,
    });

    // トランザクションの手数料設定
    tx.fee = new models.Amount(BigInt(tx.size * 100));
    console.log("Transaction created:", JSONStringifyWithBigInt(tx));

    // キーペアの生成と署名
    console.log("Signing transaction...");
    const keyPair = new KeyPair(new PrivateKey(AlicePrivateKey));
    const sig = facade.signTransaction(keyPair, tx);
    const jsonPayload = facade.transactionFactory.static.attachSignature(
      tx,
      sig
    );
    console.log("Transaction signed");

    // トランザクションのアナウンス
    console.log("Announcing transaction to:", NODE);
    const res = await fetch(new URL("/transactions", NODE), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: jsonPayload,
    });

    const result = await res.json();
    console.log("Announcement result:", result);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSONStringifyWithBigInt({
        message: "Transaction announced successfully",
        transaction: tx,
        result: result,
      }),
    };
  } catch (error) {
    console.error("Error details:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Error processing transaction",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      }),
    };
  }
};
