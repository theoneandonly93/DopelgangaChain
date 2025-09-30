'use client';

import { Keypair, PublicKey } from '@solana/web3.js';
import { generateMnemonic, mnemonicToSeedSync } from '@scure/bip39';
import { wordlist as english } from '@scure/bip39/wordlists/english';
import { hmac } from '@noble/hashes/hmac';
import { sha512 } from '@noble/hashes/sha512';
import bs58 from 'bs58';

const ED25519_SEED = new TextEncoder().encode('ed25519 seed');

function ser32(i: number) {
  const buf = new Uint8Array(4);
  buf[0] = (i >>> 24) & 0xff;
  buf[1] = (i >>> 16) & 0xff;
  buf[2] = (i >>> 8) & 0xff;
  buf[3] = i & 0xff;
  return buf;
}

function concatBytes(...arrays: Uint8Array[]) {
  const length = arrays.reduce((sum, a) => sum + a.length, 0);
  const out = new Uint8Array(length);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

// SLIP-0010 Ed25519 key derivation (hardened only) for Solana path m/44'/501'/0'/0'
function slip10Ed25519FromSeed(seed: Uint8Array) {
  const I = hmac(sha512, ED25519_SEED, seed);
  const key = I.slice(0, 32);
  const chainCode = I.slice(32);
  return { key, chainCode };
}

function derivePathEd25519(path: string, seed: Uint8Array) {
  if (!path.startsWith('m/')) throw new Error('Invalid path');
  const segments = path
    .split('/')
    .slice(1)
    .map((p) => {
      const hardened = p.endsWith("'");
      const numStr = hardened ? p.slice(0, -1) : p;
      const n = Number(numStr);
      if (!Number.isFinite(n)) throw new Error(`Invalid path segment: ${p}`);
      return (n | 0) + 0x80000000; // enforce hardened
    });

  let { key, chainCode } = slip10Ed25519FromSeed(seed);
  for (const idx of segments) {
    const data = concatBytes(new Uint8Array([0]), key, ser32(idx >>> 0));
    const I = hmac(sha512, chainCode, data);
    key = I.slice(0, 32);
    chainCode = I.slice(32);
  }
  return key; // 32-byte private key seed
}

export type GeneratedWallet = {
  mnemonic: string;
  derivationPath: string;
  publicKey: string; // base58
  secretKey: string; // base58 (64 bytes)
};

export function generateDopeWallet(): GeneratedWallet {
  const mnemonic = generateMnemonic(english, 128); // 12 words
  const seed = mnemonicToSeedSync(mnemonic); // 64 bytes
  const path = "m/44'/501'/0'/0'"; // Solana default
  const privSeed = derivePathEd25519(path, seed);
  const kp = Keypair.fromSeed(privSeed);
  return {
    mnemonic,
    derivationPath: path,
    publicKey: kp.publicKey.toBase58(),
    secretKey: bs58.encode(kp.secretKey),
  };
}

export function saveDopeWalletToStorage(w: GeneratedWallet) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('dopeWallet:mnemonic', w.mnemonic);
    localStorage.setItem('dopeWallet:path', w.derivationPath);
    localStorage.setItem('dopeWallet:publicKey', w.publicKey);
    localStorage.setItem('dopeWallet:secretKey', w.secretKey);
  } catch {}
}

export function loadDopeWalletFromStorage(): {
  publicKey: PublicKey | null;
  secretKey: Uint8Array | null;
} {
  if (typeof window === 'undefined') return { publicKey: null, secretKey: null };
  try {
    const skb58 = localStorage.getItem('dopeWallet:secretKey');
    const pub = localStorage.getItem('dopeWallet:publicKey');
    if (!skb58 || !pub) return { publicKey: null, secretKey: null };
    return { publicKey: new PublicKey(pub), secretKey: bs58.decode(skb58) };
  } catch {
    return { publicKey: null, secretKey: null };
  }
}
