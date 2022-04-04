import { NFT } from "../../../src/types/nft.type";
import DynamoService from "src/services/dynamo.service";

const formatNFTList = async (items: NFT[]) => {
  let nfts = [];
  for (let nft in items) {
    const nftResponse = await formatNFT(items[nft]);
    nfts.push(nftResponse);
  }
  return nfts;
};

const formatNFT = async (nft: NFT) => {
  const nftResponse = {
    nftId: nft.nftId,
    walletId: nft.walletId,
    network: nft.network,
    contract: nft.contract,
    tokenId: nft.tokenId,
    transactionHash: nft.transactionHash,
    filename: nft.filename,
    ipfsHash: nft.ipfsHash,
    createdAt: nft.createdAt,
    openseaURL: nft.openseaURL,
    royalties: nft.royalties,
    metadata: nft.metadata,
    isListed: nft.isListed,
    listPrice: nft.listPrice,
  };
  nftResponse["nftUrl"] = `https://ipfs.io/ipfs/${nft.ipfsHash}/metadata.json`;
  return nftResponse;
};

type UpdateNFTPostPurchaseProps = {
  table: string;
  orgId: string;
  nftId: string;
  previousOwnerId: string;
  newOwnerId: string;
  dynamoService: DynamoService;
};

const updateNFTPostPurchase = async (props: UpdateNFTPostPurchaseProps) => {
  const { table, orgId, nftId, previousOwnerId, newOwnerId, dynamoService } =
    props;

  const params = {
    TableName: table,
    Key: {},
    UpdateExpression: `set isListed = :isListed, walletId = :walletId`,
    ExpressionAttributeValues: {
      ":isListed": false,
      ":walletId": newOwnerId,
    },
    ReturnValues: "UPDATED_NEW",
  };

  const multipleQueryUpdate = params;
  const singleQueryUpdate = params;

  singleQueryUpdate.Key = {
    PK: `ORG#${orgId}#NFT#${nftId}`,
    SK: `ORG#${orgId}`,
  };

  console.log(singleQueryUpdate);

  await dynamoService.update(singleQueryUpdate);
  console.log(
    `updateNFTPostPurchase NFT singleQueryUpdate ${nftId} successfully.`
  );

  multipleQueryUpdate.Key = {
    PK: `ORG#${orgId}`,
    SK: `WAL#${previousOwnerId}#NFT#${nftId}`,
  };
  multipleQueryUpdate["ExpressionAttributeValues"][
    ":SK"
  ] = `WAL#${newOwnerId}#NFT#${nftId}`;
  multipleQueryUpdate["UpdateExpression"] += `, SK = :SK`;

  console.log(multipleQueryUpdate);
  const res = await dynamoService.update(multipleQueryUpdate);
  console.log(
    `updateNFTPostPurchase NFT multipleQueryUpdate ${nftId} successfully.`
  );

  return res.Attributes;
};

type UpdateNFTListingProps = {
  table: string;
  orgId: string;
  nftId: string;
  walletId: string;
  isListed: boolean;
  listPrice: number;
  dynamoService: DynamoService;
};

const updateNFTListing = async (props: UpdateNFTListingProps) => {
  const { table, orgId, nftId, walletId, isListed, listPrice, dynamoService } =
    props;

  const params = {
    TableName: table,
    Key: {},
    UpdateExpression: `set isListed = :isListed, listPrice = :listPrice`,
    ExpressionAttributeValues: {
      ":isListed": isListed,
      ":listPrice": listPrice,
    },
    ReturnValues: "UPDATED_NEW",
  };

  const multipleQueryUpdate = params;
  const singleQueryUpdate = params;

  multipleQueryUpdate.Key = {
    PK: `ORG#${orgId}`,
    SK: `WAL#${walletId}#NFT#${nftId}`,
  };

  console.log(multipleQueryUpdate);
  const res = await dynamoService.update(multipleQueryUpdate);
  console.log(`Updated NFT multipleQueryUpdate ${nftId} successfully.`);

  singleQueryUpdate.Key = {
    PK: `ORG#${orgId}#NFT#${nftId}`,
    SK: `ORG#${orgId}`,
  };

  console.log(singleQueryUpdate);

  await dynamoService.update(singleQueryUpdate);
  console.log(`Updated NFT singleQueryUpdate ${nftId} successfully.`);

  return res.Attributes;
};

export default {
  formatNFTList,
  formatNFT,
  updateNFTListing,
  updateNFTPostPurchase,
};
