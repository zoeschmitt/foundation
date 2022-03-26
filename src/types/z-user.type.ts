import { ZWallet } from "./z-wallet.type";

export type ZUser = {
  walletId: string;
  orgId: string;
  wallet: ZWallet;
};
