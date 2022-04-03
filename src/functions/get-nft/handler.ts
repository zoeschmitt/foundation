import {
  APIGatewayEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { handlerResponse } from "src/utils/handler-response";
import { StatusCode } from "src/enums/status-code.enum";
import { getOrgWithApiKey } from "src/utils/org/get-org-with-api-key";
import DynamoService from "src/services/dynamo.service";
import { NFT } from "src/types/nft.type";
import { Org } from "src/types/org.type";
import NFTUtils from "src/utils/nft/nft-utils";

export const getNFT: APIGatewayProxyHandler = async (
  event: APIGatewayEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const DB_TABLE = process.env.DB_TABLE;
  const dynamoService = new DynamoService();

  try {
    if (!event.queryStringParameters || !event.queryStringParameters.nftId)
      return handlerResponse(StatusCode.NOT_FOUND, {
        message: "nftId not found in path.",
      });

    const nftId = event.queryStringParameters.nftId;

    const org: Org = (await getOrgWithApiKey(event["headers"])) as Org;
    if (org === null)
      return handlerResponse(StatusCode.ERROR, {
        message: "Error authenticating API key, our team has been notiifed.",
      });

    const params = {
      TableName: DB_TABLE,
      Key: {
        PK: `ORG#${org.orgId}#NFT#${nftId}`,
        SK: `ORG#${org.orgId}`,
      },
    };

    const nft: NFT = (await dynamoService.get(params)).Item as any;

    if (!nft)
      return handlerResponse(StatusCode.NOT_FOUND, {
        message: `Failed to find nft with nftId ${nftId}.`,
      });

    const nftResponse = await NFTUtils.formatNFT(nft);

    console.log(nftResponse);
    console.log(`getNFT Finished successfully.`);
    return handlerResponse(StatusCode.OK, nftResponse);
  } catch (e) {
    console.log(`getNFT error: ${e.toString()}`);
    return handlerResponse(StatusCode.ERROR, {
      message:
        "Failed to get nft, please check your request or contact support.",
    });
  }
};

export const main = getNFT;
