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
import { Org } from "src/types/org.type";
import getWalletWithId from "src/utils/wallet/get-wallet-with-id";
import Web3 from "web3";
import { getSecret } from "src/utils/get-secret";

export const getBalance: APIGatewayProxyHandler = async (
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

    const userWallet = await getWalletWithId(
      org.orgId,
      walletId,
      dynamoService,
      DB_TABLE
    );

    if (!userWallet)
      return handlerResponse(StatusCode.NOT_FOUND, {
        message: `Failed to find wallet with walletId ${walletId}.`,
      });

    const alchemyApiKey = (await getSecret(process.env.ALCHEMY_KEY)) as any;
    const web3 = new Web3(alchemyApiKey.https);
    const balance = web3.utils.fromWei(
      await web3.eth.getBalance(userWallet.wallet.address)
    );
    
    console.log(`getBalance Finished successfully - balance: ${balance}.`);
    return handlerResponse(StatusCode.OK, { balance: balance });
  } catch (e) {
    console.log(`getBalance error: ${e.toString()}`);
    return handlerResponse(StatusCode.ERROR, {
      message:
        "Failed to get balance, please check your request or contact support.",
    });
  }
};

export const main = getBalance;
