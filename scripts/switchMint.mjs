#!/usr/bin/env node
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

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

function upsertKV(content, key, value) {
  if (!key) return content;
  const re = new RegExp(`^${key}=.*$`, 'm');
  if (re.test(content)) return content.replace(re, `${key}=${value}`);
  if (content.length && !content.endsWith('\n')) content += '\n';
  return content + `${key}=${value}\n`;
}

function updateEnv(fp, updates) {
  let content = '';
  try { content = fs.readFileSync(fp, 'utf8'); } catch (_) {}
  for (const [k, v] of Object.entries(updates)) {
    if (v === undefined || v === null) continue;
    content = upsertKV(content, k, v);
  }
  fs.writeFileSync(fp, content, 'utf8');
  console.log('Updated', fp);
}

async function main() {
  const args = parseArgs(process.argv);
  const MINT = (args.mint || args.MINT || '').trim();
  const URI = (args.uri || args.URI || '').trim();
  const NAME = (args.name || '').trim();
  const SYMBOL = (args.symbol || '').trim();
  const bumpVersion = args.bump !== '0';
  if (!MINT) {
    console.error('Usage: node scripts/switchMint.mjs --mint <NEW_MINT> [--uri ipfs://..] [--name ...] [--symbol ...] [--bump 0|1]');
    process.exit(1);
  }

  const repo = process.cwd();
  const nowVer = String(Date.now());
  const envUpdatesRoot = { DOP_MINT: MINT, METADATA_URI: URI || undefined };
  const envUpdatesIndexer = { DOP_MINT: MINT, METADATA_URI: URI || undefined };
  const envUpdatesFrontend = {
    DOP_MINT: MINT,
    NEXT_PUBLIC_METADATA_URI: URI || undefined,
    NEXT_PUBLIC_EXPLORER_VERSION: bumpVersion ? nowVer : undefined,
  };

  updateEnv(path.join(repo, '.env'), envUpdatesRoot);
  updateEnv(path.join(repo, 'indexer', '.env'), envUpdatesIndexer);
  updateEnv(path.join(repo, 'frontend', '.env'), envUpdatesFrontend);

  // Optionally patch local metadata JSON for name/symbol only (non-destructive to image/extensions)
  if (NAME || SYMBOL) {
    const metaPath = path.join(repo, 'metadata', 'dopelganga.json');
    try {
      const json = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      if (NAME) json.name = NAME;
      if (SYMBOL) json.symbol = SYMBOL;
      fs.writeFileSync(metaPath, JSON.stringify(json, null, 2) + '\n', 'utf8');
      console.log('Patched local metadata file:', metaPath);
    } catch (e) {
      console.warn('Could not patch local metadata JSON:', e?.message || e);
    }
  }

  console.log('Mint switched to:', MINT);
  if (URI) console.log('Metadata URI set to:', URI);
  if (bumpVersion) console.log('Bumped NEXT_PUBLIC_EXPLORER_VERSION to:', nowVer);
  console.log('Restart frontend and indexer to apply changes.');
}

main().catch((e) => {
  console.error('switchMint error:', e);
  process.exit(1);
});

