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

export const getOrgWallet: APIGatewayProxyHandler = async (
  event: APIGatewayEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const DB_TABLE = process.env.DB_TABLE;
  const dynamoService = new DynamoService();

  try {
    let org: Org;
    if (!event.queryStringParameters || !event.queryStringParameters.orgId) {
      org = (await getOrgWithApiKey(event["headers"])) as Org;
      if (org === null)
        return handlerResponse(StatusCode.ERROR, {
          message: "Error authenticating API key, our team has been notiifed.",
        });
    } else {
      const orgId = event.queryStringParameters.orgId;
      const params = {
        TableName: DB_TABLE,
        Key: {
          PK: `ORG#${orgId}`,
          SK: `METADATA#${orgId}`,
        },
      };
      const res = await dynamoService.get(params);
      org = res.Item as Org;
    }

    if (!org)
      return handlerResponse(StatusCode.ERROR, {
        message:
          "Error retrieving wallet information, please try again or contact support.",
      });

    const walletResponse = {
      address: org.wallet.address,
      privateKey: org.wallet.privateKey,
      mnemonic: org.wallet.mnemonic.phrase,
    };

    return handlerResponse(StatusCode.OK, walletResponse);
  } catch (e) {
    console.log(`getOrg error: ${e.toString()}`);
    return handlerResponse(StatusCode.ERROR, {
      message: `Error - getOrg:  ${e.toString()}`,
    });
  }
};

export const main = getOrgWallet;
