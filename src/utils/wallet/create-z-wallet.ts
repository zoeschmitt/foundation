import { Wallet } from '@ethersproject/wallet';
import { WalletCryptoData } from 'src/types/wallet-crypto-data.type';

const generateWalletPrivateKey = async () => {
  return Wallet.createRandom();
};

const ZWallet = async () => {
  const wallet = await generateWalletPrivateKey();
  const keys = wallet._signingKey();
  const mnemonic = wallet._mnemonic();

  const zWallet: WalletCryptoData = {
    address: wallet.address,
    privateKey: keys.privateKey,
    mnemonic: mnemonic,
    publicKey: keys.publicKey,
    compressedPublicKey: keys.compressedPublicKey,
    curve: keys.curve,
  };

  console.log(`zWallet: ${wallet.address}`);
  return zWallet;
};

export default ZWallet;
