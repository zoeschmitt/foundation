import { Royalties } from "./royalties.type";

export type NFT = {
  nftId: string;
  orgId: string;
  walletId: string;
  network: string;
  contract: string;
  tokenId: string;
  transactionHash: string;
  ipfsHash: string;
  royalties: Royalties[];
  filename: string;
  metadata: any;
  isListed: boolean;
  listPrice?: number;
  openseaURL: string;
  createdAt: string;
};
