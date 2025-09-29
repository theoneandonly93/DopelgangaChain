#!/usr/bin/env node
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { keypairIdentity, publicKey, createSignerFromKeypair } from '@metaplex-foundation/umi';
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { findMetadataPda, fetchMetadataFromSeeds } from '@metaplex-foundation/mpl-token-metadata';
import { createMetadataAccountV3 } from '@metaplex-foundation/mpl-token-metadata';
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

function normalizeIpfsUri(uri) {
  if (!uri) return uri;
  if (uri.startsWith('https://ipfs://')) return uri.replace('https://ipfs://', 'ipfs://');
  return uri;
}

async function main() {
  const args = parseArgs(process.argv);
  const RPC_URL = args.rpc || process.env.RPC_URL || process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
  const MINT = (args.mint || process.env.MINT || process.env.DOP_MINT || '').trim();
  const NAME = (args.name || process.env.NAME || 'Dopelganga').trim();
  const SYMBOL = (args.symbol || process.env.SYMBOL || 'DOPE').trim();
  let URI = normalizeIpfsUri((args.uri || process.env.METADATA_URI || '').trim());
  const KEYPAIR = args.keypair || process.env.KEYPAIR || process.env.WALLET || path.join(process.env.HOME || '', '.config/solana/id.json');

  if (!MINT) {
    console.error('Missing --mint or DOP_MINT env.');
    process.exit(1);
  }
  if (!URI) {
    console.error('Missing --uri or METADATA_URI env.');
    process.exit(1);
  }

  const safeName = NAME.slice(0, 32);
  const safeSymbol = SYMBOL.slice(0, 10);

  const umi = createUmi(RPC_URL).use(mplTokenMetadata());
  // Load keypair
  let secret;
  try {
    const raw = fs.readFileSync(KEYPAIR, 'utf8');
    const json = JSON.parse(raw);
    // Allow array or object with secretKey
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

  const data = {
    name: safeName,
    symbol: safeSymbol,
    uri: URI,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  };

  // Check if metadata exists and whether it's mutable
  let meta = null;
  try {
    meta = await fetchMetadataFromSeeds(umi, { mint: mintPk });
  } catch (_) {
    meta = null;
  }

  if (!meta) {
    console.log('Creating metadata for mint', MINT);
    const txSig = await createMetadataAccountV3(umi, {
      mint: mintPk,
      mintAuthority: signer,
      payer: signer,
      updateAuthority: signer.publicKey,
      data,
      isMutable: true,
      collectionDetails: null,
    }).sendAndConfirm(umi);
    console.log('✅ Created metadata. Signature:', txSig);
  } else {
    if (meta?.data?.isMutable === false) {
      console.log('🔒 Metadata already immutable for mint', MINT, '- aborting update.');
      process.exit(0);
    }
    console.log('Updating metadata for mint', MINT);
    const txSig = await updateMetadataAccountV2(umi, {
      metadata: metadataPda,
      updateAuthority: signer,
      data,
    }).sendAndConfirm(umi);
    console.log('✅ Updated metadata. Signature:', txSig);
  }
}

main().catch((e) => {
  console.error('Metadata set error:', e);
  process.exit(1);
});
