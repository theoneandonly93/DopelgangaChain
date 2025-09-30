/*
  Mint one validator reward to the validator's $DOPE ATA.
  Usage:
    RPC_URL=... PROGRAM_ID=... DOP_MINT=... ANCHOR_WALLET=/path/to/id.json npx ts-node scripts/mintReward.ts
*/
import * as fs from 'fs';
import * as anchor from '@project-serum/anchor';
import { PublicKey, Keypair, Connection } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

function readKeypair(fp: string): Keypair {
  const raw = fs.readFileSync(fp, 'utf8').trim();
  let arr: number[];
  try {
    arr = JSON.parse(raw);
  } catch {
    arr = raw.split(',').map((n) => Number(n.trim()));
  }
  return Keypair.fromSecretKey(Uint8Array.from(arr));
}

function loadIdl(): any {
  const envPath = process.env.IDL_PATH;
  const tried: string[] = [];
  const candidates = [
    envPath,
    '../target/idl/dopelgangachain.json',
    '../../program/target/idl/dopelgangachain.json',
  ].filter(Boolean) as string[];
  for (const p of candidates) {
    try {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) {
      tried.push(p);
    }
  }
  throw new Error(`IDL not found. Set IDL_PATH or place idl at one of: ${tried.join(', ')}`);
}

async function main() {
  const RPC_URL = process.env.RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC;
  const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID!);
  const DOP_MINT = new PublicKey(process.env.DOP_MINT!);
  const WALLET = process.env.ANCHOR_WALLET!;
  if (!RPC_URL) throw new Error('RPC_URL is required');

  const connection = new Connection(RPC_URL, 'confirmed');
  const kp = readKeypair(WALLET);
  const wallet = new anchor.Wallet(kp);
  const provider = new anchor.AnchorProvider(connection, wallet, { preflightCommitment: 'confirmed' });
  anchor.setProvider(provider);

  const idl = loadIdl();
  const program = new anchor.Program(idl as anchor.Idl, PROGRAM_ID, provider);

  const [cfg] = PublicKey.findProgramAddressSync([Buffer.from('cfg')], PROGRAM_ID);
  const validator = provider.wallet.publicKey;
  const validatorATA = await getAssociatedTokenAddress(DOP_MINT, validator);

  console.log('Requesting mint to', validatorATA.toBase58());
  await program.methods
    // Update this method name to match your IDL exactly
    .mintValidatorReward()
    .accounts({
      cfg,
      dopelMint: DOP_MINT,
      validatorTokenAccount: validatorATA,
      validator,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  console.log('✅ Minted validator reward to', validatorATA.toBase58());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

