import type { AWS } from "@serverless/typescript";
import dynamoDbTables from "./resources/dynamodb-tables";

import createOrg from "@functions/create-org";
import getOrg from "@functions/get-org";
import getWallet from "@functions/get-wallet";
import createWallet from "@functions/create-wallet";
import createNFT from "@functions/create-nft";

const serverlessConfiguration: AWS = {
  service: "polygon-api",
  frameworkVersion: "2",
  plugins: [
    "serverless-esbuild",
    "serverless-offline",
    "serverless-dotenv-plugin",
    "serverless-dynamodb-local",
  ],
  provider: {
    name: "aws",
    runtime: "nodejs14.x",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    lambdaHashingVersion: "20201221",
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: [
          "dynamodb:DescribeTable",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
        ],
        Resource: [{ "Fn::GetAtt": ["XTable", "Arn"] }],
      },
    ],
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
      STAGE: "${self:custom.stage}",
      DB_TABLE: "${self:custom.db_table}",
      NETWORK: "${self:custom.environment.NETWORK.${self:custom.stage}}",
      TEST_NETWORK: "${self:custom.environment.TEST_NETWORK}",
      WALLET: "${self:custom.environment.WALLET.${self:custom.stage}}",
      ALCHEMY_KEY:
        "${self:custom.environment.ALCHEMY_KEY.${self:custom.stage}}",
      TEST_ALCHEMY_KEY: "${self:custom.environment.TEST_ALCHEMY_KEY}",
      NFT_STORAGE_API_KEY: "${self:custom.environment.NFT_STORAGE_API_KEY}",
      OPENSEA_URL:
        "${self:custom.environment.OPENSEA_URL.${self:custom.stage}}",
    },
  },
  // import the function via paths
  functions: { createOrg, getOrg, getWallet, createWallet, createNFT },
  package: { individually: true },
  custom: {
    stage: "${opt:stage, self:provider.stage}",
    db_table: "polygon-api-${opt:stage, self:provider.stage}",
    table_throughputs: {
      prod: 5,
      default: 1,
    },
    table_throughput:
      "${self:custom.TABLE_THROUGHPUTS.${self:custom.stage}, self:custom.table_throughputs.default}",
    environment: {
      NETWORK: {
        dev: "maticmum",
        prod: "mainnet",
      },
      TEST_NETWORK: "maticmum",
      WALLET: { dev: "prod/wallet", prod: "prod/wallet" },
      ALCHEMY_KEY: {
        dev: "dev/alchemy",
        prod: "prod/alchemy",
      },
      TEST_ALCHEMY_KEY: "dev/alchemy",
      NFT_STORAGE_API_KEY: "prod/nftStorageApiKey",
      OPENSEA_URL: {
        dev: "https://testnets.opensea.io/assets/mumbai",
        prod: "https://opensea.io/assets/matic",
      },
    },
    dynamodb: {
      stages: ["dev"],
      start: {
        port: 8008,
        inMemory: true,
        heapInitial: "200m",
        heapMax: "1g",
        migrate: true,
        seed: true,
        convertEmptyValues: true,
        // Uncomment only if you already have a DynamoDB running locally
        // noStart: true
      },
    },
    ["serverless-offline"]: {
      httpPort: 3000,
      babelOptions: {
        presets: ["env"],
      },
    },
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["aws-sdk"],
      target: "node14",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10,
      external: ["electron"],
    },
  },
  resources: {
    Resources: dynamoDbTables,
  },
};

module.exports = serverlessConfiguration;
