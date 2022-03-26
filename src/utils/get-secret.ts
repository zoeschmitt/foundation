import * as AWS from "aws-sdk";
const sm = new AWS.SecretsManager({ region: "us-east-1" });

export const getSecret = async (SecretId) => {
  return await new Promise((resolve, reject) => {
    sm.getSecretValue({ SecretId }, (err, result) => {
      if (err) reject(err.code.toString());
      else resolve(JSON.parse(result.SecretString));
    });
  });
};
