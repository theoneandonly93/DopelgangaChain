#!/usr/bin/env node
// Umi-based reliable Create/Update Metadata script (bypasses legacy builder ambiguity)
// Supports: CREATE (default), UPDATE=1, DRY_RUN=1, VERIFY=1 similar to legacy script.
// Extras: DEBUG=1 verbose, payer balance check, structured error handling.

const fs = require('fs');
const { PublicKey, clusterApiUrl } = require('@solana/web3.js');
const { generateSigner, keypairIdentity, percentAmount } = require('@metaplex-foundation/umi');
const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const tm = require('@metaplex-foundation/mpl-token-metadata');
// Plugin import for Umi (required so builders know the program ID)
const { mplTokenMetadata } = require('@metaplex-foundation/mpl-token-metadata');

function usage() {
  console.log(`\nUmi Token Metadata Manager (v1)\n--------------------------------\nEnv Vars:\n  KEYPAIR_PATH (path to JSON secret key)\n  DOP_MINT     (mint pubkey)\n  METADATA_URI (ipfs://CID or https URL)\n  TOKEN_NAME   (<=32 chars)\n  TOKEN_SYMBOL (<=10 chars)\nOptional:\n  SELLER_FEE_BPS (default 0)\n  NETWORK=devnet|mainnet-beta|testnet|localnet (default mainnet-beta)\n  RPC_URL (overrides NETWORK)\n  UPDATE=1  switch to update mode\n  DRY_RUN=1 only print planned action\n  VERIFY=1 verify on-chain after tx\n`);
}
function requireEnv(n){const v=process.env[n]; if(!v){console.error('Missing env '+n); usage(); process.exit(1);} return v;}
function loadKeypair(path){const raw=fs.readFileSync(path,'utf8'); return JSON.parse(raw);} // array of numbers

(async () => {
  const started = Date.now();
  const log = (...a) => console.log('[meta]', ...a);
  const debug = (...a) => { if (process.env.DEBUG) console.log('[debug]', ...a); };
  if (process.argv.includes('--help')) { usage(); return; }
  const KEYPAIR_PATH = requireEnv('KEYPAIR_PATH');
  const DOP_MINT = requireEnv('DOP_MINT');
  const METADATA_URI = requireEnv('METADATA_URI');
  const NAME = process.env.TOKEN_NAME || 'Dopelganga';
  const SYMBOL = process.env.TOKEN_SYMBOL || 'DOPEL';
  const FEE_BPS = parseInt(process.env.SELLER_FEE_BPS || '0',10);
  if(NAME.length===0||NAME.length>32){console.error('TOKEN_NAME length 1-32 required');process.exit(1);} if(SYMBOL.length===0||SYMBOL.length>10){console.error('TOKEN_SYMBOL length 1-10 required');process.exit(1);} if(!METADATA_URI.startsWith('ipfs://') && !/^https?:\/\//.test(METADATA_URI)){console.warn('METADATA_URI not ipfs:// or http(s):// (continuing)');}

  const NETWORK = process.env.NETWORK || 'mainnet-beta';
  const RPC = process.env.RPC_URL || (NETWORK==='localnet' ? 'http://localhost:8899' : clusterApiUrl(NETWORK));
  const isUpdate = !!process.env.UPDATE;
  const DRY_RUN = !!process.env.DRY_RUN; const VERIFY = !!process.env.VERIFY;

  let secret;
  try { secret = loadKeypair(KEYPAIR_PATH); } catch (e) { console.error('Failed reading keypair:', e.message); process.exit(1); }
  let umi;
  try { umi = createUmi(RPC); } catch (e) { console.error('Failed to init Umi (npm install run?):', e.message); process.exit(1); }
  // Register token-metadata plugin to configure program IDs & serializers
  try { umi.use(mplTokenMetadata()); } catch (e) { console.error('Failed to register mplTokenMetadata plugin:', e.message); }
  // convert web3 secret to Umi signer
  const { createSignerFromKeypair, keypairFromSecretKey, publicKey } = require('@metaplex-foundation/umi');
  const kp = keypairFromSecretKey(new Uint8Array(secret));
  const signer = createSignerFromKeypair(umi, kp);
  umi.use(keypairIdentity(signer));

  const mint = publicKey(DOP_MINT);
  const metadataPda = tm.findMetadataPda(umi, { mint });
  // metadataPda is a Pda object (has .publicKey) or a PublicKey depending on lib version
  const metadataPk = metadataPda.publicKey ? metadataPda.publicKey : metadataPda; // normalize
  log('RPC:', RPC);
  log('Mint:', DOP_MINT);
  log('Metadata PDA:', metadataPk.toString());
  log('Mode:', isUpdate ? 'UPDATE' : 'CREATE');
  debug('tm keys sample:', Object.keys(tm).slice(0,25));

  // Balance pre-check
  try {
    const { Connection } = require('@solana/web3.js');
    const conn = new Connection(RPC, 'confirmed');
    const lamports = await conn.getBalance(new PublicKey(signer.publicKey));
    const sol = lamports / 1_000_000_000;
    log('Payer balance:', sol.toFixed(6), 'SOL');
    if (lamports < 500_000) { console.error('Balance too low (<0.0005 SOL). Fund this wallet.'); process.exit(1); }
  } catch (e) { debug('Balance check skipped:', e.message); }

  // fetch if exists
  let existing = null;
  try { existing = await tm.fetchMetadata(umi, metadataPda); } catch (_) {}
  const exists = !!existing; log('Exists:', exists);
  if (exists && !isUpdate) { console.error('Already exists; set UPDATE=1 to modify.'); process.exit(1); }
  if (!exists && isUpdate) { console.error('Does not exist yet; omit UPDATE to create.'); process.exit(1); }

  const data = {
    name: NAME,
    symbol: SYMBOL,
    uri: METADATA_URI,
    sellerFeeBasisPoints: FEE_BPS, // stays number; umi converts
    creators: null,
    collection: null,
    uses: null
  };

  if (exists) {
    const diffs = {};
    if (existing.data.name !== NAME) diffs.name = { from: existing.data.name, to: NAME };
    if (existing.data.symbol !== SYMBOL) diffs.symbol = { from: existing.data.symbol, to: SYMBOL };
    if (existing.data.uri !== METADATA_URI) diffs.uri = { from: existing.data.uri, to: METADATA_URI };
    if (existing.data.sellerFeeBasisPoints !== FEE_BPS) diffs.sellerFeeBasisPoints = { from: existing.data.sellerFeeBasisPoints, to: FEE_BPS };
    if (Object.keys(diffs).length === 0) log('No diffs (fields identical).'); else log('Diffs:', diffs);
  } else {
    log('Planned data:', data);
  }

  if (DRY_RUN) { log('DRY_RUN=1 -> exiting before tx.'); process.exit(0); }

  let signature;
  try {
    if (!exists) {
      const ixBuilder = tm.createMetadataAccountV3(umi, {
        mint,
        mintAuthority: signer,
        payer: signer,
        updateAuthority: signer.publicKey,
        data,
        isMutable: true,
        collectionDetails: null
      });
      const tx = await ixBuilder.sendAndConfirm(umi);
      signature = tx.signature;
      log('Create sig:', signature);
    } else {
      const ixBuilder = tm.updateMetadataAccountV2(umi, {
        metadata: metadataPda,
        updateAuthority: signer,
        data,
        primarySaleHappened: null,
        isMutable: true,
        updateAuthorityAsSigner: true
      });
      const tx = await ixBuilder.sendAndConfirm(umi);
      signature = tx.signature;
      log('Update sig:', signature);
    }
  } catch (e) {
    console.error('Transaction failed:', e.message);
    if (e.logs) console.error('Program logs:\n' + e.logs.join('\n'));
    debug('Error object:', e);
    process.exit(1);
  }

  if (VERIFY) {
    try {
      const refreshed = await tm.fetchMetadata(umi, metadataPda);
      if (!refreshed) { console.error('VERIFY failed: metadata not found.'); process.exit(1); }
      const errs=[]; if(refreshed.data.name!==NAME) errs.push('name mismatch'); if(refreshed.data.symbol!==SYMBOL) errs.push('symbol mismatch'); if(refreshed.data.uri!==METADATA_URI) errs.push('uri mismatch'); if(refreshed.data.sellerFeeBasisPoints!==FEE_BPS) errs.push('fee mismatch');
      if (errs.length) { console.error('VERIFY mismatches:', errs); process.exit(1); } else log('VERIFY passed.');
    } catch (e) {
      console.error('VERIFY phase failed:', e.message);
      process.exit(1);
    }
  }
  log('Done in', ((Date.now()-started)/1000).toFixed(2)+'s');
})();

process.on('unhandledRejection', r => { console.error('UnhandledRejection:', r); });
process.on('uncaughtException', e => { console.error('UncaughtException:', e); process.exit(1); });
