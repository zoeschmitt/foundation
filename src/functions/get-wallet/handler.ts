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

export const getWallet: APIGatewayProxyHandler = async (
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

    let walletData;
    try {
      walletData = await dynamoService.get({
        TableName: DB_TABLE,
        Key: {
          PK: `ORG#${org.orgId}#WAL#${walletId}`,
          SK: `ORG#${org.orgId}`,
        },
      });
      if (walletData.Item === undefined) throw "walletData.Item is undefined.";
    } catch (e) {
      console.log(e);
      return handlerResponse(StatusCode.NOT_FOUND, {
        message: `Wallet not found with walletId ${walletId}`,
      });
    }

    const walletResponse = {
      walletId: walletData.Item.walletId,
      address: walletData.Item.wallet.address,
      privateKey: walletData.Item.wallet.privateKey,
      mnemonic: walletData.Item.wallet.mnemonic.phrase,
    };

    console.log(`getWallet Finished successfully`);
    return handlerResponse(StatusCode.OK, walletResponse);
  } catch (e) {
    console.log(`getNFT error: ${e.toString()}`);
    return handlerResponse(StatusCode.ERROR, {
      message:
        "Failed to get wallet, please check your request or contact support.",
    });
  }
};

export const main = getWallet;
