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
