import 'dotenv/config';
import { AlchemyProvider } from '@ethersproject/providers';
import { ethers } from 'ethers';

type Props = {
  provider: AlchemyProvider;
  name: string;
  symbol: string;
  owner: string;
  imxAddress: string;
  ourPK: string;
};

const deployNFTContract = async (props: Props) => {
  try {
    const { provider, name, symbol, owner, imxAddress, ourPK } = props;
    console.log(`deployNFTContract: ${JSON.stringify(props)}`);

    let wallet = new ethers.Wallet(ourPK, provider);
    let factory = new ethers.ContractFactory(
      nftContract.abi,
      nftContract.bytecode,
      wallet,
    );

    let contract = await factory.deploy(name, symbol, owner, imxAddress);

    console.log(`Deploying contract on ${provider._network.name}...`);
    await contract.deployed();

    console.log(`\nContract Address ${contract.address}\n`);
    console.log(`\nContract Deployment Hash ${contract.deployTransaction.hash}\n`);

    // return {
    //   contractAddress: contract.address,
    //   contractTxnHash: contract.deployTransaction.hash,
    // };
  } catch (e) {
    console.log(e);
  }
};

const params = {
  provider: new AlchemyProvider(
   'ropsten',
    '_JPE8xuJJpKHIzqbkDz1BwopJAOb2RLf',
  ),
  name: 'NFT',
  symbol: 'NFT',
  owner: '0x8A919a063FE82e718D2bB3Deb16c5c82501e1E2D', //dev
  imxAddress: '0x4527BE8f31E2ebFbEF4fCADDb5a17447B27d2aef',
  ourPK: '',//dev
};
console.log(params);
deployNFTContract(params);
//export default deployNFTContract;
