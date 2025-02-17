import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import * as path from "path";
import { fileURLToPath } from "url";
import { Duration } from "aws-cdk-lib";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda関数の作成
    const lambdaFunction = new nodejs.NodejsFunction(this, "MyLambdaFunction", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(path.dirname(__dirname), "src", "lambda", "index.ts"),
      handler: "handler",
      bundling: {
        format: nodejs.OutputFormat.ESM,
        target: "node22",
        sourceMap: true,
        minify: true,
        banner:
          'import { createRequire } from "module"; import { fileURLToPath } from "url"; import { dirname } from "path"; const require = createRequire(import.meta.url); const __filename = fileURLToPath(import.meta.url); const __dirname = dirname(__filename);',
        esbuildArgs: {
          "--platform": "node",
          "--external:aws-sdk": "",
        },
        nodeModules: ["symbol-crypto-wasm-node"],
      },
      timeout: Duration.seconds(30),
      memorySize: 256,
      environment: {
        NODE_OPTIONS: "--enable-source-maps",
      },
    });

    // WASMファイルをアセットとして追加
    const wasmAsset = lambda.Code.fromAsset(
      path.join(__dirname, "..", "node_modules", "symbol-crypto-wasm-node"),
      {
        exclude: ["**/*", "!*.wasm"],
      }
    );

    // WASMファイルをLambda関数のコードにマージ
    const mergedCode = lambda.Code.fromAsset(path.dirname(__dirname), {
      bundling: {
        image: lambda.Runtime.NODEJS_22_X.bundlingImage,
        command: [
          "bash",
          "-c",
          "cp -r /asset-input/node_modules/symbol-crypto-wasm-node/*.wasm /asset-output/",
        ],
      },
    });

    // API Gatewayの作成
    const api = new apigateway.RestApi(this, "SymbolTransactionApi", {
      restApiName: "Symbol Transaction API",
      description: "API for Symbol blockchain transactions",
      endpointTypes: [apigateway.EndpointType.REGIONAL],
      deployOptions: {
        stageName: "prod",
        description: "Production stage",
        tracingEnabled: true,
        dataTraceEnabled: true,
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
        ],
      },
    });

    // API GatewayにLambda統合を追加
    const transaction = api.root.addResource("transaction");

    // Lambda統合の設定
    const lambdaIntegration = new apigateway.LambdaIntegration(lambdaFunction, {
      proxy: true,
      allowTestInvoke: true,
      timeout: Duration.seconds(29),
    });

    // POSTメソッドの追加
    transaction.addMethod("POST", lambdaIntegration, {
      apiKeyRequired: false,
      methodResponses: [
        {
          statusCode: "200",
          responseModels: {
            "application/json": apigateway.Model.EMPTY_MODEL,
          },
        },
      ],
    });

    // API GatewayがLambdaを呼び出すための権限を追加
    lambdaFunction.addPermission("ApiGatewayInvoke", {
      principal: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      sourceArn: api.arnForExecuteApi(),
    });

    // スタックの出力を追加
    new cdk.CfnOutput(this, "ApiEndpoint", {
      value: `${api.url}transaction`,
      description: "API Gateway endpoint URL for the transaction endpoint",
      exportName: "SymbolTransactionApiEndpoint",
    });
  }
}
