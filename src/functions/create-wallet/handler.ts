import {
  APIGatewayEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import env from "../../config/client";
import { AlchemyProvider } from "@ethersproject/providers";
import DynamoService from "../../services/dynamo.service";
import { StatusCode } from "src/enums/status-code.enum";
import { handlerResponse } from "src/utils/handler-response";
import createZWallet from "src/utils/wallet/create-z-wallet";
import { v4 as uuidv4 } from "uuid";
import { getOrgWithApiKey } from "src/utils/org/get-org-with-api-key";
import { Org } from "src/types/org.type";
import { getSecret } from "src/utils/get-secret";
import { getEnv } from "src/utils/env-utils";
import { parseAlchemyApiKey } from "src/utils/parse-alchemy-api-key";

export const createWallet: APIGatewayProxyHandler = async (
  event: APIGatewayEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const walletId = uuidv4();
  console.log(`walletId ${walletId}`);

  const DB_TABLE = process.env.DB_TABLE;
  const dynamoService = new DynamoService();
  const alchemyApiKey = await getSecret(getEnv("ALCHEMY_KEY"));

  try {
    // GET ORG ASSOCIATED WITH API KEY -----------------------------------

    const org: Org = (await getOrgWithApiKey(event["headers"])) as Org;
    console.log(org);

    if (org === null)
      return handlerResponse(
        StatusCode.ERROR,
        "Error authenticating API key, our team has been notiifed."
      );

    const provider = new AlchemyProvider(
      env.ethNetwork,
      await parseAlchemyApiKey(alchemyApiKey["key"])
    );

    // CREATE API KEY AND REGISTER IT WITH IMX  -----------------------------------

    console.log(`Creating wallet.`);
    const wallet = await createZWallet();

    /// CREATE WALLET OBJECT AND ADD TO DYNAMO -----------------------------------

    const walletData = {
      TableName: DB_TABLE,
      Item: {
        PK: `ORG#${org.orgId}#WAL#${walletId}`,
        SK: `ORG#${org.orgId}`,
        walletId: walletId,
        orgId: org.orgId,
        wallet: wallet,
      },
    };

    console.log(`Adding to dynamo.`);
    await dynamoService.put(walletData);

    console.log(`CreateWallet - Successful`);
    return handlerResponse(StatusCode.OK, { walletId: walletId });
  } catch (e) {
    console.log(e);
    console.log(`CreateWallet - Failed`);
    return handlerResponse(StatusCode.ERROR, {
      message: "Failed, our team has been notified.",
    });
  }
};

export const main = createWallet;
