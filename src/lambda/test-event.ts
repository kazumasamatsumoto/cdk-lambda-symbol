import { handler } from "./index.js";

const testEvent = {
  // テストに必要なパラメータがあれば追加
};

async function runTest() {
  try {
    const result = await handler(testEvent);
    console.log("テスト結果:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("エラー:", error);
  }
}

runTest();
