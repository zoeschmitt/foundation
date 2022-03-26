export type CreateOrgRequest = {
  name: string;
  tier: string;
  apiKey: string;
  email: string;
  orgRoyaltyPercentage?: number;
  creatorRoyaltyPercentage?: number;
};
