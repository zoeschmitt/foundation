import { Royalties } from "./royalties.type";
import { ZWallet } from "./z-wallet.type";

export type Org = {
  orgId: string;
  name: string;
  tier: string;
  apiKey: string;
  email: string;
  wallet: ZWallet;
  contract: string;
  network: string;
  royalties?: Royalties[];
  creatorRoyaltyPercentage?: number;
};
