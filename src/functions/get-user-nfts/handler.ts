import {
  APIGatewayEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { handlerResponse } from "src/utils/handler-response";
import { StatusCode } from "src/enums/status-code.enum";
import { Org } from "src/types/org.type";
import { getOrgWithApiKey } from "src/utils/org/get-org-with-api-key";
import DynamoService from "src/services/dynamo.service";
import NFTUtils from "src/utils/nft/nft-utils";

export const getUserNFTs: APIGatewayProxyHandler = async (
  event: APIGatewayEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const DB_TABLE = process.env.DB_TABLE;
  const dynamoService = new DynamoService();

  try {
    if (!event.queryStringParameters || !event.queryStringParameters.walletId)
      return handlerResponse(StatusCode.NOT_FOUND, {
        message: "walletId not found in path.",
      });

    const walletId = event.queryStringParameters.walletId;

    const org: Org = (await getOrgWithApiKey(event["headers"])) as Org;
    if (org === null)
      return handlerResponse(StatusCode.ERROR, {
        message: "Error authenticating API key, our team has been notiifed.",
      });

    const nftQuery = (await dynamoService.query({
      TableName: DB_TABLE,
      KeyConditionExpression: "#PK = :PK and begins_with(#SK, :SK)",
      ExpressionAttributeNames: { "#PK": "PK", "#SK": "SK" },
      ExpressionAttributeValues: {
        ":PK": `ORG#${org.orgId}`,
        ":SK": `WAL#${walletId}`,
      },
    })) as any;

    console.log(nftQuery);

    if (!nftQuery)
      return handlerResponse(StatusCode.NOT_FOUND, {
        message:
          "Failed to find nfts, please check your request or contact support.",
      });

    const nfts = await NFTUtils.formatNFTList(nftQuery.Items);

    console.log(`getUserNFTs Finished successfully`);
    return handlerResponse(StatusCode.OK, nfts);
  } catch (e) {
    console.log(`getUserNFTs error: ${e.toString()}`);
    return handlerResponse(StatusCode.ERROR, {
      message:
        "Failed to get nfts, please check your request or contact support.",
    });
  }
};

export const main = getUserNFTs;
