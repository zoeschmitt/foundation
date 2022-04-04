import DynamoService from "src/services/dynamo.service";

const getWalletWithId = async (
  orgId: string,
  walletId: string,
  dynamoService: DynamoService,
  tableName: string
) => {
  try {
    const walletData = await dynamoService.get({
      TableName: tableName,
      Key: {
        PK: `ORG#${orgId}#WAL#${walletId}`,
        SK: `ORG#${orgId}`,
      },
    });
    return walletData.Item;
  } catch (e) {
    console.log(e);
    return undefined;
  }
};

export default getWalletWithId;
