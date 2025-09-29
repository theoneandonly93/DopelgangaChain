#!/usr/bin/env node
// Create / Update / Finalize token metadata with safety checks, diff & optional dry-run.
// Features:
//  - CREATE vs UPDATE gate (existing behavior)
//  - DRY_RUN=1: show planned action and data diff, no transaction sent
//  - VERIFY=1: after tx, refetch & assert on-chain matches intended fields
//  - SKIP_IF_UNCHANGED=1: silently exit (0) if on-chain already matches desired (when updating)
//  - FORCE=1: allow update even if no actual field changes (records tx anyway)
//  - Enhanced usage display & input validation
const { Connection, Keypair, PublicKey, clusterApiUrl, sendAndConfirmTransaction, Transaction } = require('@solana/web3.js');
const tokenMeta = require('@metaplex-foundation/mpl-token-metadata');
// Dynamic resolution of instruction builders to tolerate library export shape changes.
const { Metadata } = tokenMeta;

const TOKEN_METADATA_PROGRAM_ID_FALLBACK = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

function manualCreateMetadataV3Ix({ metadataPda, mint, payer, updateAuthority, dataV2, programId }) {
  // Accounts layout (same order expected by program):
  // 0. [writable] Metadata account
  // 1. [] Mint
  // 2. [signer] Mint Authority
  // 3. [signer] Payer
  // 4. [signer] Update Authority
  // 5. [] System Program
  // 6. [] Rent (deprecated, can be omitted in newer versions but kept for compatibility) -> Use SYSVAR_RENT_PUBKEY
  const { SystemProgram, SYSVAR_RENT_PUBKEY, TransactionInstruction } = require('@solana/web3.js');

  // Data layout reference (simplified) for CreateMetadataAccountV3:
  // Instruction discriminator (1 byte) = 33 (CreateMetadataAccountV3)
  // create_metadata_account_v3 args: data (DataV2), isMutable (1), collectionDetailsOption (1) + details (if any)
  // We'll serialize minimally using Buffer writes matching expected struct.
  const discriminator = 33; // from Token Metadata program spec
  function borshString(str, max) {
    const enc = Buffer.from(str, 'utf8');
    if (enc.length > max) throw new Error(`String too long (>${max}) for field`);
    const len = Buffer.alloc(4); len.writeUInt32LE(enc.length, 0);
    return Buffer.concat([len, enc]);
  }
  // DataV2 Borsh encoding
  const nameBuf = borshString(dataV2.name, 32);
  const symbolBuf = borshString(dataV2.symbol, 10);
  const uriBuf = borshString(dataV2.uri, 200); // typical upper bound (can enlarge if needed)
  const feeBuf = Buffer.alloc(2); feeBuf.writeUInt16LE(dataV2.sellerFeeBasisPoints, 0);
  // Option<Creators> (none)
  const creatorsOpt = Buffer.from([0]);
  // Option<Collection> (none)
  const collectionOpt = Buffer.from([0]);
  // Option<Uses> (none)
  const usesOpt = Buffer.from([0]);
  const dataSection = Buffer.concat([nameBuf, symbolBuf, uriBuf, feeBuf, creatorsOpt, collectionOpt, usesOpt]);
  // CreateMetadataAccountV3 args: dataV2 + is_mutable (bool) + collection_details (Option)
  const isMutable = Buffer.from([1]);
  const collectionDetailsOpt = Buffer.from([0]);
  const fullArgs = Buffer.concat([Buffer.from([discriminator]), dataSection, isMutable, collectionDetailsOpt]);

  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: metadataPda, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: payer.publicKey, isSigner: true, isWritable: false },
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: updateAuthority, isSigner: true, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }
    ],
    data: fullArgs
  });
}

function resolveInstructionFunction(kind) {
  // kind: 'createV3' | 'updateV2'
  const candidatesMap = {
    createV3: [
      'createCreateMetadataAccountV3Instruction',
      'createCreateMetadataAccountV3',
      'createMetadataAccountV3Instruction',
      'createMetadataAccountV3'
    ],
    updateV2: [
      'createUpdateMetadataAccountV2Instruction',
      'createUpdateMetadataAccountV2',
      'updateMetadataAccountV2Instruction',
      'updateMetadataAccountV2'
    ]
  };
  const pools = [tokenMeta];
  if (tokenMeta.instructions) pools.push(tokenMeta.instructions);
  const names = candidatesMap[kind];
  const classicPreference = [];
  for (const pool of pools) {
    for (const n of names) {
      const fn = pool[n];
      if (typeof fn !== 'function') continue;
      const src = fn.toString();
      const isUmi = src.includes('context.programs') || src.includes('getPublicKey');
      if (fn.length >= 2 && !isUmi && /Instruction/.test(n)) {
        // Immediate best match: classic builder exporting an instruction
        return { fn, name: n };
      }
      // Collect other possible matches for fallback ordering
      classicPreference.push({ fn, name: n, score: (fn.length >=2 ? 1:0) + (!isUmi?1:0) + (/Instruction/.test(n)?1:0) });
    }
  }
  if (classicPreference.length) {
    classicPreference.sort((a,b)=> b.score - a.score);
    const top = classicPreference[0];
    if (top) return { fn: top.fn, name: top.name };
  }
  // Attempt deep require as last resort (best-effort, wrapped in try/catch)
  try {
    if (kind === 'createV3') {
      const alt = require('@metaplex-foundation/mpl-token-metadata/dist/src/generated/instructions/createCreateMetadataAccountV3');
      for (const k of Object.keys(alt)) {
        const fn = alt[k];
        if (typeof fn === 'function' && fn.length >= 2) return { fn, name: k };
      }
    } else if (kind === 'updateV2') {
      const alt = require('@metaplex-foundation/mpl-token-metadata/dist/src/generated/instructions/createUpdateMetadataAccountV2');
      for (const k of Object.keys(alt)) {
        const fn = alt[k];
        if (typeof fn === 'function' && fn.length >= 2) return { fn, name: k };
      }
    }
  } catch (_) {}
  throw new Error(`Unable to locate instruction function for ${kind}. Available top-level keys: ${Object.keys(tokenMeta).join(', ')}`);
}
const fs = require('fs');

function resolveMetadataProgramId() {
  const candidates = [ tokenMeta.MPL_TOKEN_METADATA_PROGRAM_ID, tokenMeta.PROGRAM_ID, tokenMeta.MetadataProgram ];
  for (const c of candidates) {
    if (!c) continue;
    try {
      if (c instanceof PublicKey) return c;
      if (typeof c === 'string') return new PublicKey(c);
      if (c.address) return new PublicKey(c.address.toString());
    } catch (_) {}
  }
  return new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
}

function usage() {
  console.log(`\nToken Metadata Manager\n----------------------\nRequired env vars (always):
  KEYPAIR_PATH=~/.config/solana/id.json
  DOP_MINT=<mint_pubkey>
  METADATA_URI=ipfs://<cid>

Creation:
  TOKEN_NAME="Dopelganga" TOKEN_SYMBOL="DOPEL" npm run token:metadata:create

Update:
  UPDATE=1 TOKEN_NAME="New Name" TOKEN_SYMBOL="NEW" npm run token:metadata:update

Safety / Behavior Flags:
  DRY_RUN=1           Show derived PDA, diffs & exit (no tx)
  VERIFY=1            After success, refetch metadata & assert fields match
  SKIP_IF_UNCHANGED=1 On update: exit 0 if no field differs
  FORCE=1             Send update even if unchanged (overrides SKIP_IF_UNCHANGED)

Optional:
  SELLER_FEE_BPS=<bps integer, default 0>
  RPC_URL=<custom endpoint> (overrides NETWORK)
  NETWORK=devnet|mainnet-beta|testnet|localnet (ignored if RPC_URL set)

Examples:
  KEYPAIR_PATH=~/.config/solana/id.json DOP_MINT=<mint> METADATA_URI=ipfs://cid \\
    TOKEN_NAME="Dopelganga" TOKEN_SYMBOL="DOPEL" node program/scripts/createTokenMetadata.js

  UPDATE=1 DRY_RUN=1 VERIFY=1 DOP_MINT=<mint> ... node program/scripts/createTokenMetadata.js
`);
}

const NAME = process.env.TOKEN_NAME || 'Dopelganga';
const SYMBOL = process.env.TOKEN_SYMBOL || 'Dopel';
const SELLER_FEE_BPS = parseInt(process.env.SELLER_FEE_BPS || '0', 10);

function validateNameSymbol(name, symbol) {
  if (name.length === 0 || name.length > 32) { console.error(`TOKEN_NAME length must be 1-32 chars (got ${name.length})`); process.exit(1); }
  if (symbol.length === 0 || symbol.length > 10) { console.error(`TOKEN_SYMBOL length must be 1-10 chars (got ${symbol.length})`); process.exit(1); }
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v) { console.error(`Missing required env var: ${name}`); usage(); process.exit(1); }
  return v;
}

function loadKeypair(path) {
  let raw; try { raw = fs.readFileSync(path, 'utf8'); } catch (e) { console.error('Cannot read keypair', path); throw e; }
  try { return Keypair.fromSecretKey(new Uint8Array(JSON.parse(raw))); } catch (e) { console.error('Invalid keypair JSON'); throw e; }
}

async function accountExists(conn, pubkey) { return !!(await conn.getAccountInfo(pubkey)); }

async function fetchExistingMetadata(conn, metadataPda) {
  const info = await conn.getAccountInfo(metadataPda);
  if (!info) return null;
  try {
    const md = Metadata.deserialize(info.data)[0];
    return md;
  } catch (e) {
    console.error('Failed to deserialize existing metadata:', e);
    return null;
  }
}

function diffPlanned(existingMd, planned) {
  if (!existingMd) return { create: planned };
  const e = existingMd.data;
  const diffs = {};
  if (e.name.trim() !== planned.name) diffs.name = { from: e.name.trim(), to: planned.name };
  if (e.symbol.trim() !== planned.symbol) diffs.symbol = { from: e.symbol.trim(), to: planned.symbol };
  if (e.uri.trim() !== planned.uri) diffs.uri = { from: e.uri.trim(), to: planned.uri };
  if (e.sellerFeeBasisPoints !== planned.sellerFeeBasisPoints) diffs.sellerFeeBasisPoints = { from: e.sellerFeeBasisPoints, to: planned.sellerFeeBasisPoints };
  return diffs;
}

(async () => {
  if (process.argv.includes('--help') || process.argv.includes('-h')) { usage(); return; }
  const KEYPAIR_PATH = requireEnv('KEYPAIR_PATH');
  const DOP_MINT = requireEnv('DOP_MINT');
  const METADATA_URI = requireEnv('METADATA_URI');
  const NETWORK = process.env.NETWORK || 'mainnet-beta';
  const RPC = process.env.RPC_URL || (NETWORK === 'localnet' ? 'http://localhost:8899' : clusterApiUrl(NETWORK));
  const isUpdate = !!process.env.UPDATE || process.argv.includes('--update');
  const DRY_RUN = !!process.env.DRY_RUN;
  const VERIFY = !!process.env.VERIFY;
  const SKIP_IF_UNCHANGED = !!process.env.SKIP_IF_UNCHANGED;
  const FORCE = !!process.env.FORCE;

  const mint = new PublicKey(DOP_MINT);
  const payer = loadKeypair(KEYPAIR_PATH);
  const connection = new Connection(RPC, 'confirmed');

  validateNameSymbol(NAME, SYMBOL);
  const programId = resolveMetadataProgramId();
  const [metadataPda] = PublicKey.findProgramAddressSync([
    Buffer.from('metadata'), programId.toBuffer(), mint.toBuffer()
  ], programId);

  console.log('RPC:', RPC);
  console.log('Mint:', mint.toBase58());
  console.log('Metadata PDA:', metadataPda.toBase58());
  console.log('Planned Name:', NAME, 'Symbol:', SYMBOL, 'SellerFeeBps:', SELLER_FEE_BPS);

  const exists = await accountExists(connection, metadataPda);
  console.log('Exists:', exists);
  console.log('Mode:', isUpdate ? 'UPDATE' : 'CREATE');

  if (exists && !isUpdate) { console.error('Already exists. Set UPDATE=1 to update.'); process.exit(1); }
  if (!exists && isUpdate) { console.error('Does not exist yet. Remove UPDATE to create.'); process.exit(1); }

  let existingMd = null;
  if (exists) {
    existingMd = await fetchExistingMetadata(connection, metadataPda);
  }

  const dataV2 = { name: NAME, symbol: SYMBOL, uri: METADATA_URI, sellerFeeBasisPoints: SELLER_FEE_BPS, creators: null, collection: null, uses: null };
  const diffs = diffPlanned(existingMd, dataV2);
  if (exists) {
    if (Object.keys(diffs).length === 0) {
      console.log('No field differences detected.');
      if (isUpdate) {
        if (SKIP_IF_UNCHANGED && !FORCE) {
          console.log('SKIP_IF_UNCHANGED=1 set and no changes -> exiting 0 without tx.');
          process.exit(0);
        } else if (!FORCE) {
          console.log('Use FORCE=1 to send update anyway or SKIP_IF_UNCHANGED=1 to skip silently.');
        }
      }
    } else {
      console.log('Diffs:', JSON.stringify(diffs, null, 2));
    }
  } else {
    console.log('Preparing CREATE with data:', JSON.stringify(dataV2, null, 2));
  }

  if (DRY_RUN) {
    console.log('DRY_RUN=1 set -> not sending transaction.');
    process.exit(0);
  }
  const tx = new Transaction();

  if (!exists) {
    const accounts = { metadata: metadataPda, mint, mintAuthority: payer.publicKey, payer: payer.publicKey, updateAuthority: payer.publicKey };
    const args = { createMetadataAccountArgsV3: { data: dataV2, isMutable: true, collectionDetails: null } };
    const { fn, name } = resolveInstructionFunction('createV3');
    console.log('Using create instruction function:', name);
    try {
      tx.add(fn(accounts, args));
    } catch (e) {
      console.warn('Primary create function invocation failed, attempting alternative builder signature:', e.message);
      // Some versions might expect (accounts, args, programId)
      try {
        tx.add(fn(accounts, args, resolveMetadataProgramId()));
      } catch (e2) {
        console.warn('Builder variant failed. Falling back to manual instruction serialization. Reason:', e2.message);
        try {
          const manualIx = manualCreateMetadataV3Ix({ metadataPda, mint, payer, updateAuthority: payer.publicKey, dataV2, programId });
          tx.add(manualIx);
          console.log('Manual create metadata instruction added successfully.');
        } catch (e3) {
          console.error('Manual fallback failed:', e3.message);
          throw e3;
        }
      }
    }
  } else {
    const accounts = { metadata: metadataPda, updateAuthority: payer.publicKey };
    const args = { updateMetadataAccountArgsV2: { data: dataV2, updateAuthority: payer.publicKey, primarySaleHappened: null, isMutable: true } };
    const { fn, name } = resolveInstructionFunction('updateV2');
    console.log('Using update instruction function:', name);
    try {
      tx.add(fn(accounts, args));
    } catch (e) {
      console.warn('Primary update function invocation failed, attempting alternative builder signature:', e.message);
      try {
        tx.add(fn(accounts, args, resolveMetadataProgramId()));
      } catch (e2) {
        console.error('All update invocation attempts failed:', e2.message);
        throw e2;
      }
    }
  }

  const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
  console.log('Success. Tx Signature:', sig);

  if (VERIFY) {
    console.log('VERIFY=1 set -> refetching metadata for validation...');
    const refreshed = await fetchExistingMetadata(connection, metadataPda);
    if (!refreshed) { console.error('Refetch failed: metadata missing after tx.'); process.exit(1); }
    const r = refreshed.data;
    const fails = [];
    if (r.name.trim() !== dataV2.name) fails.push(`name mismatch on-chain='${r.name.trim()}' expected='${dataV2.name}'`);
    if (r.symbol.trim() !== dataV2.symbol) fails.push(`symbol mismatch on-chain='${r.symbol.trim()}' expected='${dataV2.symbol}'`);
    if (r.uri.trim() !== dataV2.uri) fails.push(`uri mismatch on-chain='${r.uri.trim()}' expected='${dataV2.uri}'`);
    if (r.sellerFeeBasisPoints !== dataV2.sellerFeeBasisPoints) fails.push(`sellerFeeBasisPoints mismatch on-chain='${r.sellerFeeBasisPoints}' expected='${dataV2.sellerFeeBasisPoints}'`);
    if (fails.length) {
      console.error('Post-transaction verification FAILED:\n - ' + fails.join('\n - '));
      process.exit(1);
    } else {
      console.log('Post-transaction verification PASSED.');
    }
  }
})();
