import DynamoService from "../../services/dynamo.service";

export const getOrgWithApiKey = async (headers) => {
  try {
    const apiKey =
      headers["x-api-key"] !== undefined
        ? headers["x-api-key"]
        : headers["X-API-KEY"];
    const tableName = process.env.DB_TABLE;
    const params = {
      TableName: tableName,
      Key: {
        PK: `KEY#${apiKey}`,
        SK: `KEY#${apiKey}`,
      },
    };

    const dynamoService = new DynamoService();
    const res = await dynamoService.get(params);
    return res.Item;
  } catch (e) {
    console.log(`Error getOrg: ${e}`);
    return null;
  }
};
