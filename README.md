# DopelgangaChain

Live LayerChain built on Solana Devnet using Dopel as the native token.

This build is production-ready.

## Environment Variables

Core variables used across services:

```
PROGRAM_ID=HAzZhRcVrrFWYU9K4nWCSvpgLLcMSb9GZRfrcs3bYfDP
DOP_MINT=GUjuzb8oyERPQdLWB29ijB1iHjwY7AFNErXHUkW8U6SD
METADATA_URI=ipfs://QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH
```

Frontend / Next.js public flags (optional):
```
NEXT_PUBLIC_PROGRAM_ID=<same as PROGRAM_ID>
NEXT_PUBLIC_METADATA_URI=<gateway https URL or ipfs URI>
```

Feature flags:
```
CLAUDE_SONNET4=1   # enables Claude Sonnet 4 related UI/logic if present
```

## Token Metadata Workflow

1. Author JSON at `metadata/dopelganga.json`.
2. Pin / upload to IPFS -> obtain CID.
3. Set `METADATA_URI=ipfs://<cid>` in environment.
4. Create on-chain metadata for existing mint:
	```bash
	export KEYPAIR_PATH=~/.config/solana/id.json
	export DOP_MINT=GUjuzb8oyERPQdLWB29ijB1iHjwY7AFNErXHUkW8U6SD
	export METADATA_URI=ipfs://QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH
	npm run token:metadata:create
	```
5. If updating later (new CID):
	```bash
	export METADATA_URI=ipfs://<newCID>
	npm run token:metadata:update
	```

Verification:
```
npm run hash:metadata        # Local file integrity
solana account <metadata_pda> # On-chain presence
```

Derive Metadata PDA manually:
```js
const {PublicKey}=require('@solana/web3.js');
const pid=new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const mint=new PublicKey('GUjuzb8oyERPQdLWB29ijB1iHjwY7AFNErXHUkW8U6SD');
const [pda]=PublicKey.findProgramAddressSync([Buffer.from('metadata'),pid.toBuffer(),mint.toBuffer()],pid);
console.log(pda.toBase58());
```

## Scripts

```
npm run token:metadata:create   # Create metadata account (fails if exists)
npm run token:metadata:update   # Update existing metadata (requires UPDATE=1 internally)
npm run hash:metadata           # SHA256 hash of metadata/dopelganga.json
```

## IPFS Hosting

Original JSON is mirrored to `frontend/public/metadata/dopelganga.json` (serve via https domain if desired). For immutability the on-chain URI uses the IPFS CID.

## Security Notes

- Keep `KEYPAIR_PATH` private; never commit it.
- Changing `METADATA_URI` post-listing can affect trust—avoid unless necessary.

## Next Enhancements (Optional)

- Add gateway availability checker.
- Add automated integrity CI job comparing on-chain URI content hash vs repo.
- Add Arweave mirror for redundancy.

## Run a DopelgangaChain Validator

1) Install Solana CLI

```
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

2) Point CLI to the Dopel RPC

```
solana config set --url https://dopel-rpc.dopelganga.workers.dev
```

3) Create identity and $DOPE account

```
solana-keygen new -o ~/validator-keypair.json
solana address -k ~/validator-keypair.json
export DOP_MINT=$NEXT_PUBLIC_DOP_MINT
export VALIDATOR_PUBKEY=$(solana address -k ~/validator-keypair.json)
spl-token create-account $DOP_MINT --owner $VALIDATOR_PUBKEY
```

4) Start a validator

```
solana-validator \
  --identity ~/validator-keypair.json \
  --ledger ~/dopel-ledger \
  --rpc-port 8899 \
  --entrypoint entrypoint.mainnet-beta.solana.com:8001 \
  --dynamic-port-range 8000-8010 \
  --full-rpc-api \
  --limit-ledger-size
```

5) Claim a block reward (from `frontend/`)

```
RPC_URL=https://dopel-rpc.dopelganga.workers.dev \
PROGRAM_ID=$NEXT_PUBLIC_PROGRAM_ID \
DOP_MINT=$NEXT_PUBLIC_DOP_MINT \
ANCHOR_WALLET=/path/to/id.json \
npx ts-node scripts/mintReward.ts
```

Note: Request to be added to the validator set via governance before claiming rewards.
