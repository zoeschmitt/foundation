import Web3 from "web3";

type MintNFTProps = {
  nftContract: any;
  alchemyKey: string;
  ourWallet: any;
  clientWalletAddress: string;
  contractAddress: string;
  tokenURI: string;
  royalty: number;
};

const mintNFT = async (props: MintNFTProps) => {
  const {
    nftContract,
    alchemyKey,
    ourWallet,
    clientWalletAddress,
    contractAddress,
    tokenURI,
    royalty
  } = props;

  try {
    const ourAddress = ourWallet.address;
    const ourPrivateKey = ourWallet.privateKey;
    const web3 = new Web3(alchemyKey);

    console.log(`contractAddress: ${contractAddress}`);
    console.log(`clientWalletAddress: ${clientWalletAddress}`);

    const contract = new web3.eth.Contract(nftContract.abi, contractAddress);
    const txn = contract.methods.mintNFT(clientWalletAddress, tokenURI, royalty);
    const gas = await txn.estimateGas({ from: ourAddress });
    const gasPrice = await web3.eth.getGasPrice();

    console.log(`gas: ${gas}`);
    console.log(`gasPrice: ${gasPrice}`);

    const data = txn.encodeABI();
    const nonce = await web3.eth.getTransactionCount(ourAddress, "latest");
    const signedTxn = await web3.eth.accounts.signTransaction(
      {
        from: ourAddress,
        to: contractAddress,
        nonce: nonce,
        data,
        gas,
        gasPrice,
      },
      ourPrivateKey
    );
    console.log(`Sending raw transaction at: ${new Date().toISOString()}`);
    const txnReceipt = await web3.eth.sendSignedTransaction(
      signedTxn.rawTransaction
    );
    const tokenId = web3.utils.hexToNumber(txnReceipt.logs[0].topics[3]);
    return { tokenId: tokenId, transactionHash: txnReceipt.transactionHash };
  } catch (e) {
    console.log(e);
    throw "Blockchain error, please try again in a few minutes or contact support.";
  }
};

export default mintNFT;
