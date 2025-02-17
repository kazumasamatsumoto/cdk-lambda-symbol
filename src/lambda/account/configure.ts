import { KeyPair, SymbolFacade } from "symbol-sdk/symbol";
import { PrivateKey } from "symbol-sdk";

export const AlicePrivateKey =
  "33047CFD3ABA8E1B6FE047182F9B0118E2FA7E7D9E33865533AB582973F3B2A8";
export const AlicePublicKey =
  "ABC57E7B68FF6AA2E5F3D7E674D071697F00F1B377AE484C1EDBA3EEB29761B8";
export const aliceAddress = "TBBTGWHSQGQRYF7GGCNSQEVO4CLKYRZPVZ4B7GA";

export const BobPrivateKey =
  "882D7238279D504CAC04CAFAF9165A9FEFEB39E37F837152DB3C9828FC8E6F78";
export const BobPublicKey =
  "11DF928F12E742AEE9DE9BE813A1AA7D7C3AABE0512E530AFE39C82CE33FFABF";
export const BobAddress = "TCSMJNJTRI76YPGQFDEZBFL3XTM4L3AWELOGBDY";
export const facade = new SymbolFacade("testnet");

export const NODE = "http://sym-test-03.opening-line.jp:3000/";

export const aliceKeyPairRecoveredFromPrivateKeyString = new KeyPair(
  new PrivateKey(AlicePrivateKey)
);

export const nowDate = new Date();
