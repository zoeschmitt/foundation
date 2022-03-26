import "dotenv/config";
import { getEnv } from "src/utils/env-utils";

export default {
  // alchemyApiKey: getEnv("ALCHEMY_KEY"),
  ethNetwork: getEnv("ETH_NETWORK"),
  client: {
    publicApiUrl: getEnv("PUBLIC_API_URL"),
    starkContractAddress: getEnv("STARK_CONTRACT_ADDRESS"),
    registrationContractAddress: getEnv("REGISTRATION_CONTRACT_ADDRESS"),
    gasLimit: getEnv("GAS_LIMIT"),
    gasPrice: getEnv("GAS_PRICE"),
  },
  testClient: {
    publicApiUrl: getEnv("PUBLIC_TEST_API_URL"),
    starkContractAddress: getEnv("STARK_TEST_CONTRACT_ADDRESS"),
    registrationContractAddress: getEnv("REGISTRATION_TEST_ADDRESS"),
    gasLimit: getEnv("GAS_LIMIT"),
    gasPrice: getEnv("GAS_PRICE"),
  },
};
