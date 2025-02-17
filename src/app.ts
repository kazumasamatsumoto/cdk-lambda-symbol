#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { LambdaStack } from "./lambda-stack.js";

const app = new cdk.App();

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

app.synth();
