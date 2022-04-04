import DynamoService from "src/services/dynamo.service";
import { NFT } from "src/types/nft.type";

type StoreNFTProps = {
  nft: NFT;
  tableName: string;
  dynamoService: DynamoService;
};

const storeNFT = async (props: StoreNFTProps) => {
  const { nft, dynamoService, tableName } = props;
  await dynamoService.put({
    TableName: tableName,
    Item: {
      PK: `ORG#${nft.orgId}`,
      SK: `WAL#${nft.walletId}#NFT#${nft.nftId}`,
      ...nft,
    },
  });

  // For single nft queries
  await dynamoService.put({
    TableName: tableName,
    Item: {
      PK: `ORG#${nft.orgId}#NFT#${nft.nftId}`,
      SK: `ORG#${nft.orgId}`,
      ...nft,
    },
  });
};

export default storeNFT;
