import "dotenv/config";
import { AlchemyProvider } from "@ethersproject/providers";
import { ethers } from "ethers";
import nftContract from "../artifacts/contracts/NFT.sol/NFT.json";

type Props = {
  provider: AlchemyProvider;
  name: string;
  symbol: string;
  privateKey: string;
};

const deployNFTContract = async (props: Props) => {
  try {
    const { provider, name, symbol, privateKey } = props;
    console.log(`deployNFTContract: ${JSON.stringify(provider)}`);

    let wallet = new ethers.Wallet(privateKey, provider);
    let factory = new ethers.ContractFactory(
      nftContract.abi,
      nftContract.bytecode,
      wallet
    );

    let contract = await factory.deploy(name, symbol);

    console.log(`Deploying contract on ${provider._network.name}...`);
    await contract.deployed();

    console.log(`\nContract Address ${contract.address}\n`);
    console.log(
      `\nContract Deployment Hash ${contract.deployTransaction.hash}\n`
    );

    return {
      contractAddress: contract.address,
      contractTxnHash: contract.deployTransaction.hash,
    };
  } catch (e) {
    if (e["reason"]) {
      console.log(e.reason);
      throw e.reason;
    }
    console.log(e);
    throw e;
  }
};

// const params = {
//   provider: new AlchemyProvider(
//     "maticmum", // mumbai
//     getEnv("ALCHEMY_KEY")
//   ),
//   name: "NFT",
//   symbol: "ZNFT",
//   privateKey: getEnv("PRIVATE_KEY"),
// };

// // console.log(params);
// deployNFTContract(params);

export default deployNFTContract;
