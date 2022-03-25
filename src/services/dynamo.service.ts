import * as AWS from "aws-sdk";
const config: IConfig = { region: "us-east-1" };
AWS.config.update(config);

// Enums
import { StatusCode } from "../enums/status-code.enum";
import { handlerResponse } from "src/utils/handler-response";
import { IConfig } from "src/types/i-config.type";

// Put
type PutItem = AWS.DynamoDB.DocumentClient.PutItemInput;
type PutItemOutput = AWS.DynamoDB.DocumentClient.PutItemOutput;

// Batch write
type BatchWrite = AWS.DynamoDB.DocumentClient.BatchWriteItemInput;
type BatchWriteOutPut = AWS.DynamoDB.DocumentClient.BatchWriteItemOutput;

// Update
type UpdateItem = AWS.DynamoDB.DocumentClient.UpdateItemInput;
type UpdateItemOutPut = AWS.DynamoDB.DocumentClient.UpdateItemOutput;

// Query
type QueryItem = AWS.DynamoDB.DocumentClient.QueryInput;
type QueryItemOutput = AWS.DynamoDB.DocumentClient.QueryOutput;

// Get
type GetItem = AWS.DynamoDB.DocumentClient.GetItemInput;
type GetItemOutput = AWS.DynamoDB.DocumentClient.GetItemOutput;

// Delete
type DeleteItem = AWS.DynamoDB.DocumentClient.DeleteItemInput;
type DeleteItemOutput = AWS.DynamoDB.DocumentClient.DeleteItemOutput;

type Item = { [index: string]: string };

const {
  STAGE,
  DYNAMODB_LOCAL_STAGE,
  DYNAMODB_LOCAL_ACCESS_KEY_ID,
  DYNAMODB_LOCAL_SECRET_ACCESS_KEY,
  DYNAMODB_LOCAL_ENDPOINT,
} = process.env;

if (STAGE === DYNAMODB_LOCAL_STAGE) {
  config.accessKeyId = DYNAMODB_LOCAL_ACCESS_KEY_ID; // local dynamodb accessKeyId
  config.secretAccessKey = DYNAMODB_LOCAL_SECRET_ACCESS_KEY; // local dynamodb secretAccessKey
  config.endpoint = DYNAMODB_LOCAL_ENDPOINT; // local dynamodb endpoint
}

const documentClient = new AWS.DynamoDB.DocumentClient();

export default class DynamoService {
  getItem = async ({ key, hash, hashValue, tableName }: Item) => {
    const params = {
      TableName: tableName,
      Key: {
        id: key,
      },
    };
    if (hash) {
      params.Key[hash] = hashValue;
    }
    const results = await this.get(params);
    if (Object.keys(results).length) {
      return results;
    }
    console.error("Item does not exist");
    throw handlerResponse(StatusCode.BAD_REQUEST, { id: key });
  };

  put = async (params: PutItem): Promise<PutItemOutput> => {
    return await documentClient.put(params).promise();
  };

  batchCreate = async (params: BatchWrite): Promise<BatchWriteOutPut> => {
    return await documentClient.batchWrite(params).promise();
  };

  update = async (params: UpdateItem): Promise<UpdateItemOutPut> => {
    return await documentClient.update(params).promise();
  };

  query = async (params: QueryItem): Promise<QueryItemOutput> => {
    return await documentClient.query(params).promise();
  };

  get = async (params: GetItem): Promise<GetItemOutput> => {
    return await documentClient.get(params).promise();
  };

  delete = async (params: DeleteItem): Promise<DeleteItemOutput> => {
    return await documentClient.delete(params).promise();
  };
}
