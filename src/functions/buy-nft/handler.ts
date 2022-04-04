import {
  APIGatewayEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import { handlerResponse } from "src/utils/handler-response";
import { StatusCode } from "src/enums/status-code.enum";
import jsonBodyParser from "@middy/http-json-body-parser";
import validator from "@middy/validator";
import jsonSchemaError from "src/middleware/json-schema-error";
import inputSchema from "./schema";
import DynamoService from "src/services/dynamo.service";
import { NFT } from "src/types/nft.type";
import { getOrgWithApiKey } from "src/utils/org/get-org-with-api-key";
import { Org } from "src/types/org.type";
import { BuyNFTRequest } from "src/types/requests/buy-nft-request.type";
import getWalletWithId from "src/utils/wallet/get-wallet-with-id";
import Web3 from "web3";
import { getSecret } from "src/utils/get-secret";
import nftContract from "../../../artifacts/contracts/NFT.sol/NFT.json";
import NFTUtils from "src/utils/nft/nft-utils";

export const buyNFT: APIGatewayProxyHandler = async (
  event: APIGatewayEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const DB_TABLE = process.env.DB_TABLE;
  const dynamoService = new DynamoService();
  const transactionGas = "21000";
  // transfer nft
  // update nft info
  try {
    /// VALIDATE REQUESTS PARAMS -----------------------------------

    if (!event.queryStringParameters || !event.queryStringParameters.nftId)
      return handlerResponse(StatusCode.NOT_FOUND, {
        message: "nftId not found in path.",
      });

    const nftId = event.queryStringParameters.nftId;

    const request: BuyNFTRequest = event.body as any;

    /// GET ORG -----------------------------------

    const org: Org = (await getOrgWithApiKey(event["headers"])) as Org;
    if (org === null)
      return handlerResponse(StatusCode.ERROR, {
        message: "Error authenticating API key, our team has been notiifed.",
      });

    /// GET NFT -----------------------------------

    const params = {
      TableName: DB_TABLE,
      Key: {
        PK: `ORG#${org.orgId}#NFT#${nftId}`,
        SK: `ORG#${org.orgId}`,
      },
    };

    const nft: NFT = (await dynamoService.get(params)).Item as any;

    if (!nft)
      return handlerResponse(StatusCode.NOT_FOUND, {
        message: `Failed to find nft with nftId ${nftId}.`,
      });

    /// CHECK SELLER IS OWNER -----------------------------------

    if (request.sellerWalletId !== nft.walletId)
      return handlerResponse(StatusCode.NOT_FOUND, {
        message: `Seller with walletId ${request.sellerWalletId} is not the owner of nft with nftId ${nftId}.`,
      });

    /// GET BUYER/SELLER WALLETS -----------------------------------

    const buyerWallet = await getWalletWithId(
      org.orgId,
      request.buyerWalletId,
      dynamoService,
      DB_TABLE
    );

    if (!buyerWallet)
      return handlerResponse(StatusCode.NOT_FOUND, {
        message: `Failed to find wallet with walletId ${request.buyerWalletId}.`,
      });

    const sellerWallet = await getWalletWithId(
      org.orgId,
      request.sellerWalletId,
      dynamoService,
      DB_TABLE
    );

    if (!sellerWallet)
      return handlerResponse(StatusCode.NOT_FOUND, {
        message: `Failed to find wallet with walletId ${request.sellerWalletId}.`,
      });

    console.log(
      `seller: walletId - ${sellerWallet.walletId}  address: ${sellerWallet.wallet.address}`
    );
    console.log(
      `buyer: walletId - ${buyerWallet.walletId}  address: ${buyerWallet.wallet.address}`
    );

    /// TRANSFER MATIC -----------------------------------

    const alchemyApiKey = (await getSecret(process.env.ALCHEMY_KEY)) as any;
    const web3 = new Web3(alchemyApiKey.https);

    const signedTxn = await web3.eth.accounts.signTransaction(
      {
        from: buyerWallet.wallet.address,
        to: sellerWallet.wallet.address,
        value: web3.utils.toWei(nft.listPrice.toString()),
        gas: transactionGas,
      },
      buyerWallet.wallet.privateKey
    );

    let txnReceipt;
    try {
      console.log(`Sending raw transaction at: ${new Date().toISOString()}`);
      txnReceipt = await web3.eth.sendSignedTransaction(
        signedTxn.rawTransaction
      );
      console.log(txnReceipt);
    } catch (e) {
      console.log(e);
      return handlerResponse(StatusCode.ERROR, { e });
    }

    /// TRANSFER NFT -----------------------------------

    const contract = new web3.eth.Contract(
      nftContract.abi as any,
      org.contract
    );
    const txn = contract.methods.safeTransferFrom(
      sellerWallet.wallet.address,
      buyerWallet.wallet.address,
      nft.tokenId
    );
    const gas = await txn.estimateGas({ from: sellerWallet.wallet.address });
    const gasPrice = await web3.eth.getGasPrice();

    console.log(`gas: ${gas}`);
    console.log(`gasPrice: ${gasPrice}`);

    const data = txn.encodeABI();
    const nonce = await web3.eth.getTransactionCount(
      sellerWallet.wallet.address,
      "latest"
    );
    const transferSignedTxn = await web3.eth.accounts.signTransaction(
      {
        from: sellerWallet.wallet.address,
        to: org.contract,
        nonce: nonce,
        data,
        gas,
        gasPrice,
      },
      sellerWallet.wallet.privateKey
    );
    console.log(`Sending raw transaction at: ${new Date().toISOString()}`);
    const transferTxnReceipt = await web3.eth.sendSignedTransaction(
      transferSignedTxn.rawTransaction
    );
    console.log(transferTxnReceipt);

    /// UPDATE NFT IN DB -----------------------------------

    // Delete old NFT entries

    console.log(`Deleting old nft entries...`);

    await dynamoService.delete({
      TableName: DB_TABLE,
      Key: {
        PK: `ORG#${org.orgId}`,
        SK: `WAL#${request.sellerWalletId}#NFT#${nftId}`,
      },
    });

    await dynamoService.delete({
      TableName: DB_TABLE,
      Key: {
        PK: `ORG#${org.orgId}#NFT#${nftId}`,
        SK: `ORG#${org.orgId}`,
      },
    });

    // New NFT entries

    console.log(`Adding new nft entries...`);

    nft.isListed = false;
    nft.walletId = request.buyerWalletId;

    // For multiple nft queries
    await dynamoService.put({
      TableName: DB_TABLE,
      Item: {
        PK: `ORG#${org.orgId}`,
        SK: `WAL#${request.buyerWalletId}#NFT#${nftId}`,
        ...nft,
      },
    });

    // For single nft queries
    await dynamoService.put({
      TableName: DB_TABLE,
      Item: {
        PK: `ORG#${org.orgId}#NFT#${nftId}`,
        SK: `ORG#${org.orgId}`,
        ...nft,
      },
    });

    const nftResponse = await NFTUtils.formatNFT(nft);

    /// RETURN RESPONSE -----------------------------------

    console.log(`buyNFT Complete`);
    return handlerResponse(StatusCode.OK, nftResponse);
  } catch (e) {
    console.log(`buyNFT error: ${e.toString()}`);
    return handlerResponse(StatusCode.ERROR, {
      message: "Failed, please check your request or contact support.",
    });
  }
};

export const main = middy(buyNFT)
  .use(jsonBodyParser())
  .use(
    validator({
      inputSchema,
      ajvOptions: {
        strict: true,
        coerceTypes: "array",
        allErrors: true,
        useDefaults: "empty",
        messages: false,
      },
    })
  )
  .use(jsonSchemaError())
  .use(httpErrorHandler());
