import { Royalties } from "./royalties.type";
import { WalletCryptoData } from "./wallet-crypto-data.type";

export type Org = {
  orgId: string;
  name: string;
  tier: string;
  apiKey: string;
  email: string;
  wallet: WalletCryptoData;
  contract: string;
  network: string;
  royalties?: Royalties[];
  creatorRoyaltyPercentage?: number;
};
