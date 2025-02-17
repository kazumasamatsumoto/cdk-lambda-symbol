# AWS Lambda (Node.js 22 + ESM) + CDK デプロイ手順

## 1. プロジェクトの初期化

```bash
# プロジェクトディレクトリの作成と初期化
mkdir symbol-app
cd symbol-app
npm init -y
```

## 2. 必要なパッケージのインストール

```bash
# 開発依存パッケージのインストール
npm install -D aws-cdk aws-cdk-lib constructs typescript @types/node esbuild rimraf ts-node
```

## 3. TypeScript 設定

`tsconfig.json`を作成：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2022",
    "lib": ["ES2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "moduleResolution": "node",
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "cdk.out", "dist"]
}
```

## 4. プロジェクト構造の作成

```bash
mkdir -p src/lambda
```

## 5. Lambda 関数の実装

`src/lambda/index.ts`を作成：

```typescript
export const handler = async (event: any) => {
  console.log("Event:", JSON.stringify(event, null, 2));

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "Hello from Lambda!",
      event,
    }),
  };
};
```

## 6. CDK スタックの実装

`src/lambda-stack.ts`を作成：

```typescript
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaFunction = new nodejs.NodejsFunction(this, "MyLambdaFunction", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(path.dirname(__dirname), "src", "lambda", "index.ts"),
      handler: "handler",
      bundling: {
        format: nodejs.OutputFormat.ESM,
        target: "node22",
        sourceMap: true,
        minify: true,
      },
    });
  }
}
```

## 7. CDK アプリケーションのエントリーポイント

`src/app.ts`を作成：

```typescript
import * as cdk from "aws-cdk-lib";
import { LambdaStack } from "./lambda-stack.js";

const app = new cdk.App();
new LambdaStack(app, "MyLambdaStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
```

## 8. スクリプトの設定

`package.json`のスクリプトセクションを更新：

```json
{
  "scripts": {
    "clean": "rimraf dist",
    "prebuild": "npm run clean",
    "build": "tsc",
    "watch": "tsc -w",
    "bootstrap": "npm run build && npx cdk bootstrap",
    "deploy": "npm run build && npx cdk deploy",
    "destroy": "npm run build && npx cdk destroy"
  }
}
```

## 9. CDK 設定

`cdk.json`を作成：

```json
{
  "app": "node dist/app.js",
  "watch": {
    "include": ["**"],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  }
}
```

## 10. デプロイ手順

```bash
# 1. AWSの認証情報が設定されていることを確認

# 2. CDKブートストラップの実行（初回のみ）
npm run bootstrap

# 3. スタックのデプロイ
npm run deploy

# 4. スタックの削除（必要な場合）
npm run destroy
```

## 注意点

- Node.js 22 と ESModules を使用
- TypeScript のコンパイル結果を使用して CDK を実行
- Lambda 関数のバンドリングに esbuild を使用
- 適切なパス解決のための設定が必要

これで、Node.js 22 と ESModules を使用した Lambda 関数が AWS 上にデプロイされ、実行可能な状態になります。

`npx tsx`がうまく動作した理由を説明させていただきます：

1. **Volta の実行コンテキストの違い**:

   - 元の`tsx`コマンドは、Volta のグローバルコンテキストで実行しようとしていました
   - Volta はプロジェクト固有の`tsx`を見つけられなかったためエラーになっていました

2. **`npx`の動作の特徴**:

   - `npx`は最初にローカルの`node_modules/.bin`ディレクトリを探索します
   - プロジェクトの`node_modules`内にインストールされた`tsx`を見つけて実行します
   - Volta のグローバルコンテキストをバイパスして、プロジェクト固有の環境で実行できます

3. **パッケージの解決順序**:
   ```
   npx tsx の場合:
   1. ローカルの node_modules/.bin を確認
   2. プロジェクトの package.json の devDependencies から tsx を見つける
   3. ローカルにインストールされた tsx を使用
   ```

つまり、`npx`を使用することで、Volta のグローバル環境に依存せず、プロジェクト固有の`tsx`を確実に実行できるようになったということです。これは Node.js のパッケージ管理の仕組みをより直接的に活用する方法だと言えます。

# Symbol Transaction API の構築

## アーキテクチャ概要

このプロジェクトは AWS CDK を使用して、Symbol ブロックチェーンのトランザクションを処理する API を構築します。

### 主要コンポーネント

- AWS Lambda
- Amazon API Gateway
- Symbol SDK

## インフラストラクチャの設定

### Lambda 関数の設定

```typescript
const lambdaFunction = new nodejs.NodejsFunction(this, "MyLambdaFunction", {
  runtime: lambda.Runtime.NODEJS_22_X,
  entry: path.join(path.dirname(__dirname), "src", "lambda", "index.ts"),
  handler: "handler",
  bundling: {
    format: nodejs.OutputFormat.ESM,
    target: "node22",
    sourceMap: true,
    minify: true,
  },
  timeout: Duration.seconds(30),
  memorySize: 256,
  environment: {
    NODE_OPTIONS: "--enable-source-maps",
  },
});
```

### API Gateway の設定

```typescript
const api = new apigateway.RestApi(this, "SymbolApi", {
  restApiName: "Symbol Transaction API",
  description: "API for Symbol blockchain transactions",
  defaultCorsPreflightOptions: {
    allowOrigins: apigateway.Cors.ALL_ORIGINS,
    allowMethods: apigateway.Cors.ALL_METHODS,
  },
});
```

## エンドポイント

### トランザクション作成

- **パス**: `/transaction`
- **メソッド**: POST
- **統合タイプ**: Lambda プロキシ統合

## デプロイメント

```bash
npm run deploy
```

## 主要な機能

1. Symbol トランザクションの作成
2. トランザクションの署名
3. ネットワークへのアナウンス
4. CORS サポート
5. ソースマップ対応（デバッグ用）

## 設定詳細

### タイムアウト設定

- Lambda 関数: 30 秒

### メモリ設定

- Lambda 関数: 256MB

### CORS 設定

- すべてのオリジンを許可
- すべてのメソッドを許可

## 出力

デプロイ完了時に API Gateway の URL が出力されます：

```typescript
new cdk.CfnOutput(this, "ApiUrl", {
  value: api.url,
  description: "API Gateway endpoint URL",
});
```

## 注意事項

1. Node.js 22.x ランタイムを使用
2. ESM モジュール形式を採用
3. ソースコードは最小化されてデプロイ
4. デバッグのためのソースマップを生成

## 今後の拡張可能性

1. API キーの導入
2. 使用量プランの設定
3. カスタムドメインの設定
4. WAF の導入
5. より詳細なモニタリングの設定

# Symbol Transaction API 開発ログ

## 1. 初期セットアップと実装

### Lambda 関数の実装

```typescript
// src/lambda/index.ts
export const handler = async (event: any) => {
  try {
    // Symbolブロックチェーンへのトランザクション処理
    const messageData = new Uint8Array([
      0x00,
      ...new TextEncoder().encode("TS-NODE Hello, Symbol!"),
    ]);

    // トランザクションの作成と署名
    const tx = facade.transactionFactory.create({...});
    const sig = facade.signTransaction(keyPair, tx);

    // トランザクションのアナウンス
    const res = await fetch(new URL("/transactions", NODE), {...});

    return {
      statusCode: 200,
      body: JSONStringifyWithBigInt({...})
    };
  } catch (error) {...}
};
```

### ローカルテストの実装

1. テストイベントファイルの作成

```typescript
// src/lambda/test-event.ts
const testEvent = {};
async function runTest() {
  const result = await handler(testEvent);
  console.log("テスト結果:", JSON.stringify(result, null, 2));
}
```

2. `package.json`にテストスクリプトを追加

```json
{
  "scripts": {
    "test-lambda": "set NODE_OPTIONS=--loader ts-node/esm && node src/lambda/index.ts",
    "test-with-event": "set NODE_OPTIONS=--loader ts-node/esm && node src/lambda/test-event.ts"
  }
}
```

## 2. インフラストラクチャの構築（CDK）

### 最初の試み（問題発生）

```typescript
const api = new apigateway.RestApi(this, "SymbolApi", {
  deploy: true,
  deployOptions: {
    stageName: "prod",
  },
});
```

- API Gateway のリソースが作成されない問題が発生

### 問題の解決

1. **CloudWatch ロールの有効化**

```json
// cdk.json
{
  "context": {
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": false
  }
}
```

2. **IAM 権限の明示的な設定**

```typescript
lambdaFunction.addPermission("ApiGatewayInvoke", {
  principal: new iam.ServicePrincipal("apigateway.amazonaws.com"),
  sourceArn: api.arnForExecuteApi(),
});
```

3. **API Gateway 設定の詳細化**

```typescript
const api = new apigateway.RestApi(this, "SymbolTransactionApi", {
  endpointTypes: [apigateway.EndpointType.REGIONAL],
  deployOptions: {
    stageName: "prod",
    tracingEnabled: true,
    dataTraceEnabled: true,
    metricsEnabled: true,
    loggingLevel: apigateway.MethodLoggingLevel.INFO,
  },
  defaultCorsPreflightOptions: {
    allowOrigins: apigateway.Cors.ALL_ORIGINS,
    allowMethods: apigateway.Cors.ALL_METHODS,
    allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"],
  },
});
```

## 3. デプロイメント設定

### アプリケーションエントリーポイントの設定

```typescript
// src/app.ts
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: "ap-northeast-1",
};

new LambdaStack(app, "MyLambdaStack", {
  env,
  description: "Symbol Transaction API Stack",
  tags: {
    Environment: "prod",
    Project: "SymbolTransactionAPI",
  },
});
```

### デプロイコマンド

```bash
npm run deploy
```

## 4. 作成されたリソース

- Lambda 関数
- API Gateway REST API
- API Gateway ステージ（prod）
- CloudWatch ロール
- Lambda 実行ロール
- API Gateway CloudWatch ロール

## 5. 学んだ教訓

1. API Gateway の作成には適切な CloudWatch ロールの設定が必要
2. IAM 権限は具体的に設定する必要がある
3. API Gateway 設定は詳細に指定することで、より確実なデプロイが可能
4. CDK のコンテキスト設定が重要な役割を果たす

## 6. 次のステップ

1. API 認証の追加
2. エラーハンドリングの強化
3. モニタリングとロギングの設定
4. カスタムドメインの設定
5. WAF の導入検討
   はい、もちろんです。各変更の必要性と理由について解説させていただきます：

6. **WASM モジュールの初期化問題**

```typescript
try {
  const wasmBuffer = readFileSync(wasmPath);
  const wasmModule = await WebAssembly.compile(wasmBuffer);
  const symbolCrypto = await import(
    "symbol-crypto-wasm-node/symbol_crypto_wasm.js"
  );
  global.WebAssembly = WebAssembly;
  await symbolCrypto.default();
} catch (error) {
  console.error("Error initializing WASM:", error);
}
```

**変更が必要だった理由：**

- Lambda 環境では WASM ファイルのパスが通常の環境と異なる
- `LAMBDA_TASK_ROOT`環境変数を使用してパスを正しく解決する必要がある
- グローバルな`WebAssembly`オブジェクトが Lambda 環境で正しく設定されていない場合がある
- エラーハンドリングが不十分だとデバッグが困難

2. **プロジェクト構成の最適化**

```json
{
  "scripts": {
    "deploy": "npx tsx node_modules/aws-cdk/bin/cdk deploy"
  }
}
```

**変更が必要だった理由：**

- ESM モジュールと CommonJS の混在による問題の解決
- Volta のグローバル環境との競合を避ける
- ローカル開発環境と Lambda 環境の差異を最小化
- デプロイプロセスの安定性向上

3. **TypeScript 設定の改善**

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

**変更が必要だった理由：**

- Node.js 22.x での ESM 対応
- パッケージの解決方法の統一
- 型定義の正確性向上
- ビルドプロセスの最適化

4. **インフラストラクチャの強化**

```typescript
const lambdaFunction = new nodejs.NodejsFunction(this, "MyLambdaFunction", {
  bundling: {
    nodeModules: ["symbol-crypto-wasm-node"],
  },
});
```

**変更が必要だった理由：**

- WASM ファイルが正しくバンドルされない問題の解決
- Lambda 関数のコールドスタート時間の最適化
- メモリ使用量の適切な設定
- API Gateway との連携強化

5. **エラーハンドリングの強化**

```typescript
try {
  // トランザクション処理
} catch (error) {
  console.error("Error details:", error);
  return {
    statusCode: 500,
    body: JSON.stringify({
      message: "Error processing transaction",
      error: error instanceof Error ? error.message : "Unknown error",
    }),
  };
}
```

**変更が必要だった理由：**

- 本番環境でのデバッグ容易性の向上
- エラーの詳細な情報収集
- クライアントへの適切なエラー応答
- システムの安定性向上

6. **開発環境の整備**

```typescript
// テスト環境の設定
const testEvent = {
  // テストパラメータ
};

async function runTest() {
  const result = await handler(testEvent);
  console.log("テスト結果:", JSON.stringify(result, null, 2));
}
```

**変更が必要だった理由：**

- ローカルでのテスト実行の容易化
- デプロイ前の動作確認
- 開発サイクルの短縮
- バグの早期発見

7. **セキュリティとパフォーマンスの最適化**

```typescript
const api = new apigateway.RestApi(this, "SymbolTransactionApi", {
  deployOptions: {
    tracingEnabled: true,
    metricsEnabled: true,
  },
});
```

**変更が必要だった理由：**

- 本番環境でのモニタリング強化
- パフォーマンス指標の収集
- セキュリティ設定の適切な構成
- スケーラビリティの確保

これらの変更は、以下の目標を達成するために必要でした：

1. **安定性の向上**

   - エラーの適切な処理
   - 環境差異の吸収
   - 信頼性の確保

2. **開発効率の改善**

   - 開発環境の整備
   - テスト容易性の向上
   - デバッグ機能の強化

3. **運用性の向上**

   - モニタリングの強化
   - トラブルシューティングの容易化
   - メンテナンス性の向上

4. **パフォーマンスの最適化**
   - リソース使用の効率化
   - レスポンス時間の改善
   - コスト最適化

これらの変更により、より安定した本番環境での運用が可能になり、開発者の生産性も向上しました。
