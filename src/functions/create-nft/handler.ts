import {
  APIGatewayEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import DynamoService from "../../services/dynamo.service";
import { StatusCode } from "src/enums/status-code.enum";
import { handlerResponse } from "src/utils/handler-response";
import { v4 as uuidv4 } from "uuid";
import { getOrgWithApiKey } from "src/utils/org/get-org-with-api-key";
import { Org } from "src/types/org.type";
import { getSecret } from "src/utils/get-secret";
import { CreateNFTRequest } from "src/types/requests/create-nft-request.type";
import { NFT } from "../../../src/types/nft.type";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import { NFTStorage, File } from "nft.storage";
import { NFTStorageResponse } from "src/types/responses/nft-storage-response";
import axios from "axios";
import jsonBodyParser from "@middy/http-json-body-parser";
import NFTUtils from "src/utils/nft/nft-utils";
import getNFTContent from "src/utils/nft/get-nft-content";
import mintNFT from "src/utils/nft/mint-nft";
import nftContract from "../../../artifacts/contracts/NFT.sol/NFT.json";
import getWalletWithId from "src/utils/wallet/get-wallet-with-id";
import storeNFT from "src/utils/nft/store-nft";

export const createNFT: APIGatewayProxyHandler = async (
  event: APIGatewayEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  // console.log(event);

  /// REQUEST VALIDATION -----------------------------------

  if (!event.queryStringParameters || !event.queryStringParameters.walletId)
    return handlerResponse(StatusCode.NOT_FOUND, {
      message: "walletId not found in path.",
    });

  const walletId = event.queryStringParameters.walletId.toLowerCase();
  const nft: CreateNFTRequest = JSON.parse(event.body);

  try {
    await validateRequest(nft);
  } catch (e) {
    console.log(e);
    return handlerResponse(StatusCode.BAD_REQUEST, {
      message: e.toString(),
    });
  }

  const metadata = nft.metadata;
  const nftId = uuidv4();
  const DB_TABLE = process.env.DB_TABLE;
  const dynamoService = new DynamoService();
  const network = process.env.NETWORK;
  const ipfsLink = "https://ipfs.io/ipfs/";

  try {
    /// FETCH ORG & USER WALLET FROM DYNAMO -----------------------------------

    const org: Org = (await getOrgWithApiKey(event["headers"])) as Org;
    if (org === null)
      return handlerResponse(StatusCode.ERROR, {
        message: "Error authenticating API key, our team has been notiifed.",
      });

    const minterWallet = await getWalletWithId(
      org.orgId,
      walletId,
      dynamoService,
      DB_TABLE
    );

    if (!minterWallet)
      return handlerResponse(StatusCode.NOT_FOUND, {
        message: `Failed to find wallet with walletId ${walletId}.`,
      });

    /// PIN TO IPFS -----------------------------------

    const nftStorageApiKey = (await getSecret(
      process.env.NFT_STORAGE_API_KEY
    )) as any;
    console.log(nftStorageApiKey);
    const nftstorage = new NFTStorage({ token: nftStorageApiKey.key });

    const nftStorageRequest = {
      name: metadata.name,
      description: metadata.description,
      image: null,
      fee_recipient: minterWallet.wallet.address,
      seller_fee_basis_points: org.creatorRoyaltyPercentage * 100, // 10 * 10 = 1000 == 10% (OpenSea max)
      properties: {
        ...metadata,
      },
    };

    if (nft.image) {
      const { nftContent, nftFilename, mime } = await getNFTContent(
        nft.image,
        nft.filename
      );
      console.log(
        `Adding nft.image with filename ${nftFilename}, and mime: ${mime}`
      );
      const file = new File([nftContent], nftFilename, {
        type: mime,
      });
      nftStorageRequest["image"] = file;
    }

    if (nft.file) {
      const { nftContent, nftFilename, mime } = await getNFTContent(
        nft.file,
        nft.filename
      );
      console.log(
        `Adding nft.file with filename ${nftFilename}, and mime: ${mime}`
      );

      const file = new File([nftContent], nftFilename, {
        type: mime,
      });
      nftStorageRequest.properties["nft"] = file;
      if (nftStorageRequest.image === null) nftStorageRequest.image = file;
    }

    console.log(nftStorageRequest);

    const nftStorageResponse: NFTStorageResponse = await nftstorage.store(
      nftStorageRequest
    );

    console.log(nftStorageResponse);

    const tokenURI = ipfsLink + nftStorageResponse.ipnft + "/metadata.json";
    metadata.nft = tokenURI;

    /// MINT -----------------------------------

    const alchemyApiKey = (await getSecret(process.env.ALCHEMY_KEY)) as any;
    const openseaBaseUrl = process.env.OPENSEA_URL;
    const ourWallet = (await getSecret(process.env.WALLET)) as any;

    const { tokenId, transactionHash } = await mintNFT({
      nftContract,
      alchemyKey: alchemyApiKey.https,
      ourWallet,
      clientWalletAddress: minterWallet.wallet.address,
      contractAddress: org.contract,
      tokenURI,
      royalty: org.creatorRoyaltyPercentage * 100 ?? 1000,
    });

    console.log(`NFT with tokenId ${tokenId} minted. Txn ${transactionHash}`);

    /// CHEKCK FOR UPDATED IPFS LINK -----------------------------------

    try {
      console.log(
        `Checking ipfs link for nft hash: ${nftStorageResponse.ipnft}`
      );
      const ipfsNFTRes = await axios.get(
        ipfsLink + nftStorageResponse.ipnft + "/metadata.json",
        { timeout: 5000 }
      );
      if (ipfsNFTRes.data) {
        console.log(ipfsNFTRes.data);
        metadata.file = ipfsNFTRes.data["properties"]["nft"];
        metadata.image = ipfsLink + ipfsNFTRes.data["image"].split("//")[1];
      }
    } catch (e) {
      console.log(e);
    }

    /// STORE NFT DATA IN DYNAMO -----------------------------------

    const newNFT: NFT = {
      nftId: nftId,
      orgId: org.orgId,
      walletId: minterWallet.walletId,
      creatorWalletId: minterWallet.walletId,
      network: network,
      contract: org.contract,
      tokenId: tokenId.toString(),
      transactionHash: transactionHash,
      ipfsHash: nftStorageResponse.ipnft,
      royalties: [],
      filename: nft.filename,
      metadata: metadata,
      isListed: false,
      listPrice: 0,
      openseaURL: `${openseaBaseUrl}/${org.contract}/${tokenId}`,
      createdAt: new Date().toISOString(),
    };

    // royalties
    if (org.creatorRoyaltyPercentage !== undefined)
      newNFT.royalties.push({
        recipient: minterWallet.wallet.address,
        percentage: org.creatorRoyaltyPercentage,
      });

    if (org.royalties !== undefined) newNFT.royalties.push(...org.royalties);

    console.log(newNFT);

    await storeNFT({
      nft: newNFT,
      tableName: DB_TABLE,
      dynamoService: dynamoService,
    });

    const nftResponse = await NFTUtils.formatNFT(newNFT);
    console.log(nftResponse);

    /// RETURN RESPONSE -----------------------------------

    console.log(`Completed createNFT.`);
    return handlerResponse(StatusCode.OK, nftResponse);
  } catch (e) {
    console.log(`createNFT failed.`);
    console.log(e);
    return handlerResponse(StatusCode.ERROR, {
      message: "Failed, our team has been notified.",
    });
  }
};

const validateRequest = async (nft: CreateNFTRequest) => {
  console.log(nft.metadata);
  console.log(nft.filename);

  /// METADATA

  if (nft.metadata === undefined || typeof nft.metadata !== "object")
    throw "Invalid metadata. Either not found in request body or not a valid json object.";

  if (nft.metadata.name === undefined || typeof nft.metadata.name !== "string")
    throw "Invalid metadata name. Either not found in metadata or is not a valid string.";

  if (
    nft.metadata.description === undefined ||
    typeof nft.metadata.description !== "string"
  )
    throw "Invalid metadata description. Either not found in metadata or is not a valid string.";

  /// FILE & IMAGE

  if (nft.file === undefined && nft.image === undefined)
    throw "No NFT file or image was found in request body. You must provide one of these content types.";

  if (nft.file !== undefined && typeof nft.file !== "string")
    throw "NFT file must be a valid base64 string.";

  if (nft.file !== undefined && nft.filename === undefined)
    throw "Please supply a filename for your uploaded file.";

  if (nft.image !== undefined && typeof nft.image !== "string")
    throw "NFT image must be a valid base64 string.";
};

export const main = middy(createNFT)
  .use(jsonBodyParser())
  .use(httpErrorHandler());
