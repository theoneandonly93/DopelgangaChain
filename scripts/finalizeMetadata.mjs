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

function trim0(s) {
  return typeof s === 'string' ? s.replace(/\0/g, '').trim() : s;
}

async function verify(umi, mintPk) {
  const meta = await fetchMetadataFromSeeds(umi, { mint: mintPk });
  const d = meta.data;
  return {
    updateAuthority: String(d.updateAuthority),
    isMutable: d.isMutable,
    primarySaleHappened: d.primarySaleHappened,
    sellerFeeBasisPoints: d.sellerFeeBasisPoints,
    name: trim0(d.name),
    symbol: trim0(d.symbol),
    uri: trim0(d.uri),
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const RPC_URL = args.rpc || process.env.RPC_URL || process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
  const MINT = (args.mint || process.env.MINT || process.env.DOP_MINT || '').trim();
  const NAME = (args.name || process.env.NAME || 'Dopelganga').trim();
  const SYMBOL = (args.symbol || process.env.SYMBOL || 'DOPE').trim();
  const URI = normalizeIpfsUri((args.uri || process.env.METADATA_URI || '').trim());
  const KEYPAIR = args.keypair || process.env.KEYPAIR || process.env.WALLET || path.join(process.env.HOME || '', '.config/solana/id.json');
  const DRY_RUN = Boolean(args['dry-run'] || args.dryRun || process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true');

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

  // 1) Create or update
  let meta = null;
  try {
    meta = await fetchMetadataFromSeeds(umi, { mint: mintPk });
  } catch (_) {
    meta = null;
  }

  const data = {
    name: safeName,
    symbol: safeSymbol,
    uri: URI,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  };

  if (!meta) {
    if (DRY_RUN) {
      console.log('[DRY-RUN] Would create metadata for mint', MINT, 'with data:', data);
    } else {
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
    }
  } else if (meta?.data?.isMutable === true) {
    const current = {
      name: trim0(meta.data.name),
      symbol: trim0(meta.data.symbol),
      uri: trim0(meta.data.uri),
    };
    if (DRY_RUN) {
      console.log('[DRY-RUN] Would update metadata for mint', MINT, 'from', current, 'to', data);
    } else {
      console.log('Updating metadata for mint', MINT);
      const txSig = await updateMetadataAccountV2(umi, {
        metadata: metadataPda,
        updateAuthority: signer,
        data,
      }).sendAndConfirm(umi);
      console.log('✅ Updated metadata. Signature:', txSig);
    }
  } else {
    console.log('🔒 Metadata is already immutable; skipping update.');
  }

  // Verify current state pre-lock
  try {
    const info = await verify(umi, mintPk);
    console.log('verify:preLock', JSON.stringify(info, null, 2));
  } catch (e) {
    console.warn('Warning: verify before lock failed:', e?.message || e);
  }

  // 2) Lock if not already
  try {
    const latest = await fetchMetadataFromSeeds(umi, { mint: mintPk });
    if (latest?.data?.isMutable === false) {
      console.log('🔒 Metadata already immutable.');
    } else if (DRY_RUN) {
      console.log('[DRY-RUN] Would lock metadata (isMutable=false) for mint', MINT);
    } else {
      console.log('Locking metadata (isMutable=false) for mint', MINT);
      const sig = await updateMetadataAccountV2(umi, {
        metadata: metadataPda,
        updateAuthority: signer,
        isMutable: false,
      }).sendAndConfirm(umi);
      console.log('✅ Metadata locked. Signature:', sig);
    }
  } catch (e) {
    console.error('Failed to lock metadata:', e?.message || e);
    process.exit(2);
  }

  // Verify final state
  try {
    const info = await verify(umi, mintPk);
    console.log('verify:postLock', JSON.stringify(info, null, 2));
  } catch (e) {
    console.warn('Warning: verify after lock failed:', e?.message || e);
  }
}

main().catch((e) => {
  console.error('Finalize metadata error:', e);
  process.exit(1);
});
