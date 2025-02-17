import * as cdk from 'aws-cdk-lib';
import { LambdaStack } from './lambda-stack.js';

const app = new cdk.App();
new LambdaStack(app, 'MyLambdaStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
}); 