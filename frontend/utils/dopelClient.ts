import * as anchor from "@project-serum/anchor";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { PublicKey, SystemProgram } from "@solana/web3.js";

// Replace with your deployed Program ID
export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || "HAzZhRcVrrFWYU9K4nWCSvpgLLcMSb9GZRfrcs3bYfDP"
);

// Seeds
const CFG_SEED = Buffer.from("cfg");
const REF_SEED = Buffer.from("ref");

// -------------------------
// Get program client
// -------------------------
export function getProgram(provider: anchor.AnchorProvider) {
  const idl = require("../idl/dopelgangachain.json"); // export your IDL after build
  return new anchor.Program(idl, PROGRAM_ID, provider);
}

// -------------------------
// PDA helpers
// -------------------------
export async function getConfigPDA(): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync([CFG_SEED], PROGRAM_ID);
}

export async function getReferralPDA(user: PublicKey): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync([REF_SEED, user.toBuffer()], PROGRAM_ID);
}

// -------------------------
// Airdrop Dopel
// -------------------------
export async function airdropDopel(
  provider: anchor.AnchorProvider,
  dopelMint: PublicKey,
  recipient: PublicKey,
  amount: number
) {
  const program = getProgram(provider);
  const [cfg, bump] = await getConfigPDA();
  const ata = await getAssociatedTokenAddress(dopelMint, recipient);

  return await program.methods
    .mintDopel(new anchor.BN(amount))
    .accounts({
      admin: provider.wallet.publicKey,
      cfg,
      dopelMint,
      toToken: ata,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}

// -------------------------
// Transfer Dopel with fees
// -------------------------
export async function transferWithFees(
  provider: anchor.AnchorProvider,
  dopelMint: PublicKey,
  from: PublicKey,
  to: PublicKey,
  challengeWallet: PublicKey,
  devWallet: PublicKey,
  liqWallet: PublicKey,
  amount: number
) {
  const program = getProgram(provider);

  const fromATA = await getAssociatedTokenAddress(dopelMint, from);
  const toATA = await getAssociatedTokenAddress(dopelMint, to);
  const chalATA = await getAssociatedTokenAddress(dopelMint, challengeWallet);
  const devATA = await getAssociatedTokenAddress(dopelMint, devWallet);
  const liqATA = await getAssociatedTokenAddress(dopelMint, liqWallet);

  return await program.methods
    .transferWithFees(new anchor.BN(amount))
    .accounts({
      from,
      fromToken: fromATA,
      toToken: toATA,
      challengeToken: chalATA,
      devToken: devATA,
      liqToken: liqATA,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}

// -------------------------
// Bind Referral
// -------------------------
export async function bindReferral(
  provider: anchor.AnchorProvider,
  dopelMint: PublicKey,
  inviter: PublicKey,
  rewardAmount: number
) {
  const program = getProgram(provider);
  const [cfg] = await getConfigPDA();
  const [refRecord] = await getReferralPDA(provider.wallet.publicKey);
  const inviterATA = await getAssociatedTokenAddress(dopelMint, inviter);

  return await program.methods
    .bindReferral(new anchor.BN(rewardAmount))
    .accounts({
      user: provider.wallet.publicKey,
      inviter,
      refRecord,
      cfg,
      dopelMint,
      inviterToken: inviterATA,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

// -------------------------
// Launch a new token
// -------------------------
export async function launchToken(
  provider: anchor.AnchorProvider,
  decimals: number,
  initialMintTo: number,
  newMint: PublicKey,
  recipient: PublicKey,
  recipientToken: PublicKey
) {
  const program = getProgram(provider);
  const [cfg] = await getConfigPDA();

  return await program.methods
    .launchToken(decimals, new anchor.BN(initialMintTo))
    .accounts({
      payer: provider.wallet.publicKey,
      cfg,
      newMint,
      recipient,
      recipientToken,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      associatedTokenProgram: new PublicKey("ATokenGPvtnhS..."), // standard ATA program id
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    })
    .rpc();
}
