import {
  APIGatewayEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { handlerResponse } from "src/utils/handler-response";
import { StatusCode } from "src/enums/status-code.enum";
import DynamoService from "src/services/dynamo.service";

export const getOrg: APIGatewayProxyHandler = async (
  event: APIGatewayEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const DB_TABLE = process.env.DB_TABLE;
  const dynamoService = new DynamoService();

  try {
    if (!event.queryStringParameters || !event.queryStringParameters.orgId)
      return handlerResponse(StatusCode.NOT_FOUND, {
        message: "orgId not found in path.",
      });

    const orgId = event.queryStringParameters.orgId;

    const params = {
      TableName: DB_TABLE,
      Key: {
        PK: `ORG#${orgId}`,
        SK: `METADATA#${orgId}`,
      },
    };
    const res = await dynamoService.get(params);
    return handlerResponse(StatusCode.OK, res.Item);
  } catch (e) {
    console.log(`getOrg error: ${e.toString()}`);
    return handlerResponse(StatusCode.ERROR, {
      message: `Error - getOrg:  ${e.toString()}`,
    });
  }
};

export const main = getOrg;
