import DynamoService from "src/services/dynamo.service";
import { NFT } from "src/types/nft.type";

type StoreNFTProps = {
  nft: NFT;
  tableName: string;
  dynamoService: DynamoService;
};

const storeNFT = async (props: StoreNFTProps) => {
  const { nft, dynamoService, tableName } = props;
  console.log(`Storing NFT with walletId ${nft.walletId} & nftId ${nft.nftId}`);
  await dynamoService
    .put({
      TableName: tableName,
      Item: {
        PK: `ORG#${nft.orgId}`,
        SK: `WAL#${nft.walletId}#NFT#${nft.nftId}`,
        ...nft,
      },
    })
    .catch((err) => console.log(err));

  // For single nft queries
  await dynamoService
    .put({
      TableName: tableName,
      Item: {
        PK: `ORG#${nft.orgId}#NFT#${nft.nftId}`,
        SK: `ORG#${nft.orgId}`,
        ...nft,
      },
    })
    .catch((err) => console.log(err));
};

export default storeNFT;
