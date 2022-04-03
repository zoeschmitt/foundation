export const parseAlchemyApiKey = async (apiKeyWithUrl) => {
  // apiKeyWithUrl format: https://polygon-mumbai.g.alchemy.com/v2/apiKey
  const parts = apiKeyWithUrl.split("/");
  return parts[parts.length - 1];
};
