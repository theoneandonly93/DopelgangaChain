#!/usr/bin/env node
import 'dotenv/config';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { publicKey } from '@metaplex-foundation/umi';
import { mplTokenMetadata, findMetadataPda, fetchMetadataFromSeeds } from '@metaplex-foundation/mpl-token-metadata';

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

function trim0(s) {
  return typeof s === 'string' ? s.replace(/\0/g, '').trim() : s;
}

function ipfsToHttp(uri) {
  if (!uri) return uri;
  if (uri.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${uri.slice('ipfs://'.length)}`;
  return uri;
}

async function main() {
  const args = parseArgs(process.argv);
  const RPC_URL = args.rpc || process.env.RPC_URL || process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
  const MINT = (args.mint || process.env.MINT || process.env.DOP_MINT || '').trim();
  const FETCH_JSON = Boolean(args.fetchJson || args['fetch-json'] || process.env.FETCH_JSON === '1');

  if (!MINT) {
    console.error('Missing --mint or DOP_MINT env.');
    process.exit(1);
  }

  const umi = createUmi(RPC_URL).use(mplTokenMetadata());

  try {
    const mintPk = publicKey(MINT);
    const metadataPda = findMetadataPda(umi, { mint: mintPk });
    const meta = await fetchMetadataFromSeeds(umi, { mint: mintPk });
    const d = meta.data;
    const info = {
      mint: MINT,
      metadataPda: String(metadataPda[0] ?? metadataPda),
      updateAuthority: String(d.updateAuthority),
      isMutable: d.isMutable,
      primarySaleHappened: d.primarySaleHappened,
      sellerFeeBasisPoints: d.sellerFeeBasisPoints,
      name: trim0(d.name),
      symbol: trim0(d.symbol),
      uri: trim0(d.uri),
    };
    console.log(JSON.stringify(info, null, 2));

    if (FETCH_JSON && typeof fetch !== 'undefined') {
      try {
        const url = ipfsToHttp(info.uri);
        const r = await fetch(url, { headers: { 'accept': 'application/json' } });
        const json = await r.json();
        console.log('offchain', JSON.stringify(json, null, 2));
      } catch (e) {
        console.warn('Could not fetch offchain JSON:', e?.message || e);
      }
    }
  } catch (e) {
    console.error('Metadata not found or fetch failed:', e?.message || e);
    process.exit(2);
  }
}

main();

