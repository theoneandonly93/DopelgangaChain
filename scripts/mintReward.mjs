#!/usr/bin/env node
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Connection, PublicKey, Keypair, Transaction, sendAndConfirmTransaction, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import crypto from 'crypto';

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

function sighash(name) {
  const preimage = `global:${name}`;
  const hash = crypto.createHash('sha256').update(preimage).digest();
  return hash.subarray(0, 8);
}

async function main() {
  const args = parseArgs(process.argv);
  const RPC_URL = args.rpc || process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
  const PROGRAM_ID = new PublicKey(args.program || process.env.PROGRAM_ID || '');
  const DOP_MINT = new PublicKey(args.mint || process.env.DOP_MINT || '');
  const KEYPAIR = args.keypair || process.env.KEYPAIR || path.join(process.env.HOME || '', '.config/solana/id.json');

  if (!PROGRAM_ID) throw new Error('PROGRAM_ID is required');
  if (!DOP_MINT) throw new Error('DOP_MINT is required');

  const conn = new Connection(RPC_URL, 'confirmed');

  // Load keypair (validator signer)
  let secret;
  try {
    const raw = fs.readFileSync(KEYPAIR, 'utf8');
    const json = JSON.parse(raw);
    secret = Array.isArray(json) ? new Uint8Array(json) : new Uint8Array(json.secretKey);
  } catch (e) {
    console.error('Failed to read keypair at', KEYPAIR, e?.message || e);
    process.exit(1);
  }
  const kp = Keypair.fromSecretKey(secret);

  // Derive cfg PDA
  const [cfgPda] = await PublicKey.findProgramAddress([Buffer.from('cfg')], PROGRAM_ID);

  // Ensure validator ATA exists
  const ata = await getOrCreateAssociatedTokenAccount(
    conn,
    kp, // payer
    DOP_MINT,
    kp.publicKey
  );

  // Build Anchor-compatible instruction
  const data = Buffer.concat([sighash('mint_validator_reward')]);
  const keys = [
    { pubkey: cfgPda, isSigner: false, isWritable: true },
    { pubkey: DOP_MINT, isSigner: false, isWritable: true },
    { pubkey: ata.address, isSigner: false, isWritable: true },
    { pubkey: kp.publicKey, isSigner: true, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];
  const ix = new (await import('@solana/web3.js')).TransactionInstruction({
    programId: PROGRAM_ID,
    keys,
    data,
  });

  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(conn, tx, [kp]);
  console.log('✅ Minted validator reward. Signature:', sig);
}

main().catch((e) => {
  console.error('mintReward error:', e);
  process.exit(1);
});

