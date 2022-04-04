import {
  APIGatewayEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import { handlerResponse } from "src/utils/handler-response";
import { StatusCode } from "src/enums/status-code.enum";
import jsonBodyParser from "@middy/http-json-body-parser";
import validator from "@middy/validator";
import jsonSchemaError from "src/middleware/json-schema-error";
import inputSchema from "./schema";
import { getOrgWithApiKey } from "src/utils/org/get-org-with-api-key";
import { Org } from "src/types/org.type";
import DynamoService from "src/services/dynamo.service";
import { NFT } from "src/types/nft.type";
import NFTUtils from "src/utils/nft/nft-utils";

export const listNFT: APIGatewayProxyHandler = async (
  event: APIGatewayEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  console.log(event);

  const DB_TABLE = process.env.DB_TABLE;
  const dynamoService = new DynamoService();

  try {

    /// VERIFY REQUEST PARAMS -----------------------------------

    if (!event.queryStringParameters || !event.queryStringParameters.nftId)
      return handlerResponse(StatusCode.NOT_FOUND, {
        message: "nftId not found in path.",
      });

    const nftId = event.queryStringParameters.nftId;

    const request = event.body as any;

    if (!request || request.listPrice === undefined) {
      return handlerResponse(StatusCode.NOT_FOUND, {
        message: "List price not found in request body.",
      });
    }

    /// FETCH ORG -----------------------------------

    const org: Org = (await getOrgWithApiKey(event["headers"])) as Org;
    if (org === null)
      return handlerResponse(StatusCode.ERROR, {
        message: "Error authenticating API key, our team has been notiifed.",
      });

    /// FETCH NFT -----------------------------------

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

    /// UPDATE NFT -----------------------------------

    const updatedNFT = await NFTUtils.updateNFTListing({
      table: DB_TABLE,
      orgId: org.orgId,
      nftId: nft.nftId,
      walletId: nft.walletId,
      isListed: true,
      listPrice: request.listPrice,
      dynamoService: dynamoService,
    });

    console.log(`listNFT Finished successfully.`);
    return handlerResponse(StatusCode.OK, {
      message: "Successfully listed NFT.",
      nft: updatedNFT,
    });
  } catch (e) {
    console.log(`listNFT error: ${e.toString()}`);
    return handlerResponse(StatusCode.ERROR, {
      message:
        "Failed to udpate nft listing, please check your request or contact support.",
    });
  }
};

export const main = middy(listNFT)
  .use(jsonBodyParser())
  .use(
    validator({
      inputSchema,
      ajvOptions: {
        strict: true,
        coerceTypes: "array",
        allErrors: true,
        useDefaults: "empty",
        messages: false,
      },
    })
  )
  .use(jsonSchemaError())
  .use(httpErrorHandler());
