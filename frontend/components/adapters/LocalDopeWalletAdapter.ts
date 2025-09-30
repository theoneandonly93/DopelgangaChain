"use client";

import { ed25519 } from '@noble/curves/ed25519';
import {
  BaseSignInMessageSignerWalletAdapter,
  isVersionedTransaction,
  WalletNotConnectedError,
  WalletReadyState,
} from '@solana/wallet-adapter-base';
import { createSignInMessage } from '@solana/wallet-standard-util';
import { Keypair, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

export const LocalDopeWalletName = 'Dope Wallet';

export class LocalDopeWalletAdapter extends BaseSignInMessageSignerWalletAdapter {
  name = LocalDopeWalletName as typeof LocalDopeWalletName;
  url = '/dope-wallet';
  icon = 'data:image/svg+xml;utf8,' +
    encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="34" height="30" viewBox="0 0 34 30"><rect x="1" y="5" rx="6" ry="6" width="32" height="20" fill="#fff"/><circle cx="25" cy="15" r="3" fill="#000"/></svg>');
  supportedTransactionVersions = new Set(['legacy', 0]);

  private _keypair: Keypair | null = null;

  get connecting() { return false; }
  get publicKey(): PublicKey | null { return this._keypair?.publicKey || null; }
  get readyState() { return WalletReadyState.Loadable; }

  async connect(): Promise<void> {
    // Load from localStorage (set by Dope Wallet page)
    const skb58 = typeof window !== 'undefined' ? localStorage.getItem('dopeWallet:secretKey') : null;
    if (!skb58) throw new Error('No Dope Wallet configured. Generate it first.');
    const sk = bs58.decode(skb58);
    this._keypair = Keypair.fromSecretKey(sk);
    this.emit('connect', this._keypair.publicKey);
  }

  async disconnect(): Promise<void> {
    this._keypair = null;
    this.emit('disconnect');
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    if (!this._keypair) throw new WalletNotConnectedError();
    if (isVersionedTransaction(tx)) {
      tx.sign([this._keypair]);
    } else {
      tx.partialSign(this._keypair);
    }
    return tx;
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    if (!this._keypair) throw new WalletNotConnectedError();
    return ed25519.sign(message, this._keypair.secretKey.subarray(0, 32));
  }

  async signIn(input: { domain?: string; address?: string } = {}) {
    const { publicKey, secretKey } = (this._keypair || (() => {
      // Lazy-load on sign-in too
      const skb58 = typeof window !== 'undefined' ? localStorage.getItem('dopeWallet:secretKey') : null;
      if (!skb58) throw new Error('No Dope Wallet configured.');
      this._keypair = Keypair.fromSecretKey(bs58.decode(skb58));
      return this._keypair;
    })());
    const domain = input.domain || (typeof window !== 'undefined' ? window.location.host : 'localhost');
    const address = input.address || publicKey.toBase58();
    const signedMessage = createSignInMessage({ ...input, domain, address });
    const signature = ed25519.sign(signedMessage, secretKey.slice(0, 32));
    this.emit('connect', publicKey);
    return {
      account: { address, publicKey: publicKey.toBytes(), chains: [], features: [] },
      signedMessage,
      signature,
    };
  }
}

