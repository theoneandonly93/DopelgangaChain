#!/usr/bin/env node
const { PublicKey } = require('@solana/web3.js');
const tokenMeta = require('@metaplex-foundation/mpl-token-metadata');

function resolveProgramId() {
  const candidates = [ tokenMeta.MPL_TOKEN_METADATA_PROGRAM_ID, tokenMeta.PROGRAM_ID, tokenMeta.MetadataProgram ];
  for (const c of candidates) {
    try {
      if (!c) continue;
      if (c instanceof PublicKey) return c;
      if (typeof c === 'string') return new PublicKey(c);
      if (c.address) return new PublicKey(c.address.toString());
    } catch (_) {}
  }
  return new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
}

function usage() {
  console.log('\nUsage: DOP_MINT=<mint> node program/scripts/printMetadataPda.js');
}

const mintStr = process.env.DOP_MINT;
if (!mintStr) { usage(); process.exit(1); }

(async () => {
  const mint = new PublicKey(mintStr);
  const programId = resolveProgramId();
  const [pda] = PublicKey.findProgramAddressSync([
    Buffer.from('metadata'), programId.toBuffer(), mint.toBuffer()
  ], programId);
  console.log('Token Metadata Program:', programId.toBase58());
  console.log('Mint:', mint.toBase58());
  console.log('Metadata PDA:', pda.toBase58());
})();
