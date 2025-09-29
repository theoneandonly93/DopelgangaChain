#!/usr/bin/env node
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { keypairIdentity, publicKey, createSignerFromKeypair } from '@metaplex-foundation/umi';
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { findMetadataPda, fetchMetadataFromSeeds } from '@metaplex-foundation/mpl-token-metadata';
import { updateMetadataAccountV2 } from '@metaplex-foundation/mpl-token-metadata';

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.replace(/^--/, '').split('=');
      if (v !== undefined) args[k] = v; else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) { args[k] = argv[++i]; } else { args[k] = true; }
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const RPC_URL = args.rpc || process.env.RPC_URL || process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
  const MINT = (args.mint || process.env.MINT || process.env.DOP_MINT || '').trim();
  const KEYPAIR = args.keypair || process.env.KEYPAIR || process.env.WALLET || path.join(process.env.HOME || '', '.config/solana/id.json');

  if (!MINT) {
    console.error('Missing --mint or DOP_MINT env.');
    process.exit(1);
  }

  const umi = createUmi(RPC_URL).use(mplTokenMetadata());
  // Load keypair
  let secret;
  try {
    const raw = fs.readFileSync(KEYPAIR, 'utf8');
    const json = JSON.parse(raw);
    secret = Array.isArray(json) ? new Uint8Array(json) : new Uint8Array(json.secretKey);
  } catch (e) {
    console.error('Failed to read keypair at', KEYPAIR, e?.message || e);
    process.exit(1);
  }
  const kp = umi.eddsa.createKeypairFromSecretKey(secret);
  const signer = await createSignerFromKeypair(umi, kp);
  umi.use(keypairIdentity(signer));

  const mintPk = publicKey(MINT);
  const metadataPda = findMetadataPda(umi, { mint: mintPk });

  // Inspect current metadata to avoid unnecessary tx
  try {
    const meta = await fetchMetadataFromSeeds(umi, { mint: mintPk });
    if (meta?.data?.isMutable === false) {
      console.log('🔒 Metadata already immutable for mint', MINT);
      return;
    }
  } catch (e) {
    console.warn('Warning: Could not fetch current metadata; proceeding to lock.', e?.message || '');
  }

  console.log('Locking metadata (isMutable=false) for mint', MINT);
  const sig = await updateMetadataAccountV2(umi, {
    metadata: metadataPda,
    updateAuthority: signer,
    isMutable: false,
  }).sendAndConfirm(umi);
  console.log('✅ Metadata locked. Signature:', sig);
}

main().catch((e) => {
  console.error('Lock metadata error:', e);
  process.exit(1);
});

