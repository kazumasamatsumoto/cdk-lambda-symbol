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
      },
    });
  }
}
