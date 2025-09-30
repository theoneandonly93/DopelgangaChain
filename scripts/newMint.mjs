#!/usr/bin/env node
// One-shot helper: create a new SPL mint, create your ATA, optionally mint
// initial supply, set Metaplex metadata, and update local env files.

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, createAssociatedTokenAccount, getAssociatedTokenAddress, mintTo, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { keypairIdentity, createSignerFromKeypair, publicKey } from '@metaplex-foundation/umi';
import { mplTokenMetadata, createMetadataAccountV3, updateMetadataAccountV2, findMetadataPda } from '@metaplex-foundation/mpl-token-metadata';

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

function toUnitsBigInt(humanStr, decimals) {
  // Safe decimal conversion without float rounding.
  const s = String(humanStr);
  if (!/^[0-9]+(\.[0-9]+)?$/.test(s)) throw new Error('Invalid numeric amount for --initial');
  const [intPart, fracPart = ''] = s.split('.');
  const frac = (fracPart + '0'.repeat(decimals)).slice(0, decimals);
  return BigInt(intPart + frac);
}

function updateEnvFile(fp, newMint) {
  try {
    let content = '';
    try { content = fs.readFileSync(fp, 'utf8'); } catch (_) {}
    if (content.includes('\nDOP_MINT=')) {
      content = content.replace(/\nDOP_MINT=.*/g, `\nDOP_MINT=${newMint}`);
    } else if (/^DOP_MINT=/.test(content)) {
      content = content.replace(/^DOP_MINT=.*/m, `DOP_MINT=${newMint}`);
    } else {
      if (content.length && !content.endsWith('\n')) content += '\n';
      content += `DOP_MINT=${newMint}\n`;
    }
    fs.writeFileSync(fp, content, 'utf8');
    console.log('Updated', fp);
  } catch (e) {
    console.warn('Could not update', fp, e?.message || e);
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const RPC_URL = args.rpc || process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
  const KEYPAIR = args.keypair || process.env.KEYPAIR || path.join(process.env.HOME || '', '.config/solana/id.json');
  const NAME = (args.name || process.env.NAME || 'Dopelganga').slice(0, 32);
  const SYMBOL = (args.symbol || process.env.SYMBOL || 'DOPE').slice(0, 10);
  const URI = normalizeIpfsUri(args.uri || process.env.METADATA_URI || '');
  const DECIMALS = Number(args.decimals || 9);
  const OWNER = args.owner || null; // default to payer
  const INITIAL = args.initial || null; // human units
  const INITIAL_RAW = args.initialRaw || null; // raw base units (as string recommended)
  const LOCK = Boolean(args.lock || args['lock-metadata'] || process.env.LOCK_METADATA === '1');
  const DRY_RUN = Boolean(args['dry-run'] || args.dryRun || process.env.DRY_RUN === '1');

  if (!URI) {
    console.error('Missing --uri or METADATA_URI.');
    process.exit(1);
  }

  // Load payer keypair
  let secret;
  try {
    const raw = fs.readFileSync(KEYPAIR, 'utf8');
    const json = JSON.parse(raw);
    secret = Array.isArray(json) ? new Uint8Array(json) : new Uint8Array(json.secretKey);
  } catch (e) {
    console.error('Failed to read keypair at', KEYPAIR, e?.message || e);
    process.exit(1);
  }
  const payer = Keypair.fromSecretKey(secret);

  if (DRY_RUN) {
    console.log('[DRY-RUN] Would create new mint with:', { RPC_URL, payer: payer.publicKey.toBase58(), decimals: DECIMALS, owner: OWNER || payer.publicKey.toBase58(), name: NAME, symbol: SYMBOL, uri: URI, initial: INITIAL, initialRaw: INITIAL_RAW, lock: LOCK });
    process.exit(0);
  }

  const connection = new Connection(RPC_URL, 'confirmed');

  // 1) Create mint (payer is mint authority; no freeze authority by default)
  console.log('Creating new mint...');
  const mint = await createMint(connection, payer, payer.publicKey, null, DECIMALS);
  console.log('New mint:', mint.toBase58());

  // 2) Create ATA for owner (default payer)
  const ownerPk = new PublicKey(OWNER || payer.publicKey);
  let ata;
  try {
    ata = await getOrCreateAssociatedTokenAccount(connection, payer, mint, ownerPk);
  } catch (e) {
    if (String(e?.name || e).includes('TokenAccountNotFoundError')) {
      console.log('ATA not found yet, creating explicitly...');
      const addr = await createAssociatedTokenAccount(connection, payer, mint, ownerPk);
      ata = { address: addr };
    } else {
      throw e;
    }
  }
  console.log('Owner ATA:', ata.address.toBase58());

  // 3) Optional: Mint initial supply
  if (INITIAL_RAW || INITIAL) {
    const amount = INITIAL_RAW ? BigInt(String(INITIAL_RAW)) : toUnitsBigInt(String(INITIAL), DECIMALS);
    await mintTo(connection, payer, mint, ata.address, payer, amount);
    console.log('Minted initial supply (raw units):', amount.toString());
  }

  // 4) Set metadata (Metaplex)
  const umi = createUmi(RPC_URL).use(mplTokenMetadata());
  const kp = umi.eddsa.createKeypairFromSecretKey(payer.secretKey);
  const signer = await createSignerFromKeypair(umi, kp);
  umi.use(keypairIdentity(signer));
  const mintPkUmi = publicKey(mint.toBase58());
  const metadataPda = findMetadataPda(umi, { mint: mintPkUmi });

  const data = {
    name: NAME,
    symbol: SYMBOL,
    uri: URI,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  };

  console.log('Creating metadata...');
  const sigCreate = await createMetadataAccountV3(umi, {
    mint: mintPkUmi,
    mintAuthority: signer,
    payer: signer,
    updateAuthority: signer.publicKey,
    data,
    isMutable: true,
    collectionDetails: null,
  }).sendAndConfirm(umi);
  console.log('Metadata signature:', sigCreate);

  if (LOCK) {
    console.log('Locking metadata (isMutable=false)...');
    const sigLock = await updateMetadataAccountV2(umi, {
      metadata: metadataPda,
      updateAuthority: signer,
      isMutable: false,
    }).sendAndConfirm(umi);
    console.log('Locked. Signature:', sigLock);
  }

  // 5) Update env files
  const repoRoot = process.cwd();
  const envPaths = [
    path.join(repoRoot, '.env'),
    path.join(repoRoot, 'indexer', '.env'),
    path.join(repoRoot, 'frontend', '.env'),
  ];
  for (const p of envPaths) updateEnvFile(p, mint.toBase58());

  console.log('All done. New mint:', mint.toBase58());
  console.log('Next steps:');
  console.log('- Restart indexer and frontend so they pick up the new DOP_MINT.');
  console.log('- Optional: disable freeze authority and (when ready) mint authority via spl-token authorize.');
}

main().catch((e) => {
  console.error('newMint error:', e);
  process.exit(1);
});
