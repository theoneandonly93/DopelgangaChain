/*
  Register/add a validator in your on-chain config via governance.
  Usage:
    RPC_URL=... PROGRAM_ID=... ANCHOR_WALLET=/path/to/id.json npx ts-node scripts/registerValidator.ts <VALIDATOR_PUBKEY>
  Note: Update the method call to match your program (e.g., updateConfig/addValidator).
*/
import * as fs from 'fs';
import * as anchor from '@project-serum/anchor';
import { PublicKey, Keypair, Connection } from '@solana/web3.js';

function readKeypair(fp: string): Keypair {
  const raw = fs.readFileSync(fp, 'utf8').trim();
  let arr: number[];
  try { arr = JSON.parse(raw); } catch { arr = raw.split(',').map((n) => Number(n.trim())); }
  return Keypair.fromSecretKey(Uint8Array.from(arr));
}

function loadIdl(): any {
  const envPath = process.env.IDL_PATH;
  const tried: string[] = [];
  const candidates = [envPath, '../target/idl/dopelgangachain.json', '../../program/target/idl/dopelgangachain.json'].filter(Boolean) as string[];
  for (const p of candidates) {
    try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { tried.push(p); }
  }
  throw new Error(`IDL not found. Set IDL_PATH or place idl at one of: ${tried.join(', ')}`);
}

async function main() {
  const RPC_URL = process.env.RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC;
  const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID!);
  const WALLET = process.env.ANCHOR_WALLET!;
  const validatorArg = process.argv[2];
  if (!validatorArg) throw new Error('Pass validator pubkey as the first arg');
  if (!RPC_URL) throw new Error('RPC_URL is required');

  const connection = new Connection(RPC_URL, 'confirmed');
  const kp = readKeypair(WALLET);
  const wallet = new anchor.Wallet(kp);
  const provider = new anchor.AnchorProvider(connection, wallet, { preflightCommitment: 'confirmed' });
  anchor.setProvider(provider);

  const idl = loadIdl();
  const program = new anchor.Program(idl as anchor.Idl, PROGRAM_ID, provider);

  const [cfg] = PublicKey.findProgramAddressSync([Buffer.from('cfg')], PROGRAM_ID);
  const governance = provider.wallet.publicKey;
  const validatorToAdd = new PublicKey(validatorArg);

  // TODO: replace with your method name and args
  // Example: await program.methods.addValidator(validatorToAdd).accounts({ cfg, governance }).rpc();
  await program.methods
    .updateConfig() // placeholder – edit to your method
    .accounts({ cfg, governance })
    .rpc();

  console.log('✅ Submitted validator update for', validatorToAdd.toBase58());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

