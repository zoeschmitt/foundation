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
import { AlchemyProvider } from "@ethersproject/providers";
import { parseAlchemyApiKey } from "src/utils/parse-alchemy-api-key";
import deployNFTContract from "../../../scripts/deploy-nft-contract";

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
    const ourWallet = (await getSecret(process.env.WALLET)) as any;

    /// CREATE ORG ETH WALLET REGISTER IT -----------------------------------
    const orgWallet: ZWallet = await createZWallet();

    /// DEPLOY ORG CONTRACT -----------------------------------
    const alchemyApiKey = await getSecret(getEnv("ALCHEMY_KEY"));

    const contractRequest = {
      provider: new AlchemyProvider(
        network, // mumbai
        await parseAlchemyApiKey(alchemyApiKey["key"])
      ),
      name: org.nftName,
      symbol: org.nftSymbol,
      privateKey: orgWallet.privateKey,
    };
    const contractResponse = await deployNFTContract(contractRequest);

    /// CREATE ORG OBJECT -----------------------------------
    const newOrg: Org = {
      orgId: orgId,
      name: org.name,
      tier: org.tier,
      apiKey: org.apiKey,
      wallet: orgWallet,
      email: org.email,
      contract: contractResponse.contractAddress,
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
      newOrg.royalties.push(royalties);
    }

    if (org.creatorRoyaltyPercentage)
      newOrg.creatorRoyaltyPercentage = org.creatorRoyaltyPercentage;

    /// CREATE DYNAMO OBJECTS -----------------------------------
    const orgKeyData = {
      TableName: DB_TABLE,
      Item: {
        PK: `KEY#${org.apiKey}`,
        SK: `KEY#${org.apiKey}`,
        ...newOrg,
      },
    };

    const orgIdData = {
      TableName: DB_TABLE,
      Item: {
        PK: `ORG#${orgId}`,
        SK: `METADATA#${orgId}`,
        ...newOrg,
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

    console.log(newOrg);
    console.log(`CreateOrg - Successful`);
    return handlerResponse(StatusCode.OK, newOrg);
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
