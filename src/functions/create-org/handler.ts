import {
  APIGatewayEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import DynamoService from "../../services/dynamo.service";
import { StatusCode } from "src/enums/status-code.enum";
import { handlerResponse } from "src/utils/handler-response";
import { CreateOrgRequest } from "src/types/requests/create-org-request.type";
import { Org } from "src/types/org.type";
import { ZWallet } from "src/types/z-wallet.type";
import createZWallet from "src/utils/wallet/create-z-wallet";
import { v4 as uuid } from "uuid";
import { getEnv } from "src/utils/env-utils";
import validator from "@middy/validator";
import middy from "@middy/core";
import inputSchema from "./schema";
import jsonBodyParser from "@middy/http-json-body-parser";
import httpErrorHandler from "@middy/http-error-handler";
import jsonSchemaError from "src/middleware/json-schema-error";
import { getSecret } from "src/utils/get-secret";
import { Royalties } from "src/types/royalties.type";

export const createOrg: APIGatewayProxyHandler = async (
  event: APIGatewayEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  console.log(event);

  const org: CreateOrgRequest = event.body as any;
  console.log(org);

  const orgId: string = uuid();
  console.log(`orgId ${orgId}`);

  const { DB_TABLE } = process.env;
  const dynamoService = new DynamoService();

  /// MAKE SURE ORG DOESN'T ALREADY EXIST -----------------------------------
  try {
    const res = await dynamoService.get({
      TableName: DB_TABLE,
      Key: {
        PK: `KEY#${org.apiKey}`,
        SK: `KEY#${org.apiKey}`,
      },
    });
    if (res.Item !== undefined) throw `Org with that API key already exists.`;
  } catch (e) {
    console.log(e);
    return handlerResponse(StatusCode.BAD_REQUEST, {
      message: e,
    });
  }

  try {
    const network = process.env.NETWORK;
    const ourWallet = (await getSecret(process.env.OUR_WALLET)) as any;

    /// CREATE ORG ETH WALLET REGISTER IT -----------------------------------
    const orgWallet: ZWallet = await createZWallet();

    /// CREATE ORG OBJECT -----------------------------------
    const xImxOrg: Org = {
      orgId: orgId,
      name: org.name,
      tier: org.tier,
      apiKey: org.apiKey,
      wallet: orgWallet,
      email: org.email,
      contract: getEnv("NFT_CONTRACT_ADDRESS"),
      royalties: [
        {
          recipient: ourWallet.address,
          percentage: 5,
        },
      ],
    };

    /// ADD ROYALTIES -----------------------------------
    if (org.orgRoyaltyPercentage) {
      const royalties: Royalties = {
        recipient: orgWallet.address,
        percentage: org.orgRoyaltyPercentage,
      };
      xImxOrg.royalties.push(royalties);
    }

    if (org.creatorRoyaltyPercentage)
      xImxOrg.creatorRoyaltyPercentage = org.creatorRoyaltyPercentage;

    /// CREATE DYNAMO OBJECTS -----------------------------------
    const orgKeyData = {
      TableName: DB_TABLE,
      Item: {
        PK: `KEY#${org.apiKey}`,
        SK: `KEY#${org.apiKey}`,
        ...xImxOrg,
      },
    };

    const orgIdData = {
      TableName: DB_TABLE,
      Item: {
        PK: `ORG#${orgId}`,
        SK: `METADATA#${orgId}`,
        ...xImxOrg,
      },
    };

    // ADD ENTRIES TO DYNAMO -----------------------------------
    await dynamoService.put(orgKeyData);
    await dynamoService.put(orgIdData);

    // ORG NFT COUNTER -----------------------------------
    const counterQuery = {
      TableName: DB_TABLE,
      Item: {
        PK: `ORG#${orgId}#COUNTER`,
        SK: `COUNTER#${orgId}`,
      },
    };
    counterQuery.Item[network] = 0;
    await dynamoService.put(counterQuery);

    /// RETURN RESPONSE -----------------------------------

    console.log(xImxOrg);
    console.log(`CreateOrg - Successful`);
    return handlerResponse(StatusCode.OK, xImxOrg);
  } catch (e) {
    console.log(`CreateOrg - Failed`);
    console.log(e);
    return handlerResponse(StatusCode.ERROR, { message: e });
  }
};

export const main = middy(createOrg)
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
