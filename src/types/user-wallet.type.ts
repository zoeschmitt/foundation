import { WalletCryptoData } from "./wallet-crypto-data.type";

export type UserWallet = {
  walletId: string;
  orgId: string;
  wallet: WalletCryptoData;
};
