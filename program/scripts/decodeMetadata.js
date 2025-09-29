#!/usr/bin/env node
const { Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const tokenMeta = require('@metaplex-foundation/mpl-token-metadata');

function resolveProgramId() {
  const { MPL_TOKEN_METADATA_PROGRAM_ID, PROGRAM_ID, MetadataProgram } = tokenMeta;
  const { PublicKey } = require('@solana/web3.js');
  const candidates = [ MPL_TOKEN_METADATA_PROGRAM_ID, PROGRAM_ID, MetadataProgram ];
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
  console.log('\nUsage: DOP_MINT=<mint> [NETWORK=devnet|mainnet-beta|testnet|localnet] [RPC_URL=https://...] node program/scripts/decodeMetadata.js');
  console.log('RPC_URL overrides NETWORK. Default network: mainnet-beta');
}

const mintStr = process.env.DOP_MINT;
if (!mintStr) { usage(); process.exit(1); }

(async () => {
  const mint = new PublicKey(mintStr);
  const network = process.env.NETWORK || 'mainnet-beta';
  const rpc = process.env.RPC_URL || (network === 'localnet' ? 'http://localhost:8899' : clusterApiUrl(network));
  const connection = new Connection(rpc, 'confirmed');
  const programId = resolveProgramId();
  const [pda] = PublicKey.findProgramAddressSync([
    Buffer.from('metadata'), programId.toBuffer(), mint.toBuffer()
  ], programId);
  const acct = await connection.getAccountInfo(pda);
  if (!acct) { console.error('Metadata account does not exist:', pda.toBase58()); process.exit(1); }
  try {
    const metadata = tokenMeta.Metadata.deserialize(acct.data)[0];
    const data = metadata.data;
    const out = {
      updateAuthority: metadata.updateAuthority.toBase58(),
      mint: mint.toBase58(),
      name: data.name.trim(),
      symbol: data.symbol.trim(),
      uri: data.uri.trim(),
      sellerFeeBasisPoints: data.sellerFeeBasisPoints,
      creators: data.creators ? data.creators.map(c => ({ address: c.address.toBase58(), verified: c.verified, share: c.share })) : null,
      isMutable: metadata.isMutable,
      primarySaleHappened: metadata.primarySaleHappened,
      editionNonce: metadata.editionNonce,
      pda: pda.toBase58(),
      programId: programId.toBase58(),
      rawDataLength: acct.data.length
    };
    console.log(JSON.stringify(out, null, 2));
  } catch (e) {
    console.error('Failed to decode metadata:', e);
    process.exit(1);
  }
})();
