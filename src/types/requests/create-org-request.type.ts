export type CreateOrgRequest = {
  name: string;
  tier: string;
  apiKey: string;
  email: string;
  nftName: string;
  nftSymbol: string;
  orgRoyaltyPercentage?: number;
  creatorRoyaltyPercentage?: number;
};
