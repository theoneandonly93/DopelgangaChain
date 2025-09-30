export const SITE = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || 'DopelgangaChain',
  token: {
    name: process.env.NEXT_PUBLIC_TOKEN_NAME || 'Dopelganga',
    symbol: process.env.NEXT_PUBLIC_TOKEN_SYMBOL || 'DOPE',
    mint: process.env.NEXT_PUBLIC_DOP_MINT || '',
  },
  rpc: {
    http: process.env.NEXT_PUBLIC_SOLANA_RPC || '/api/rpc',
    ws: process.env.NEXT_PUBLIC_SOLANA_RPC_WS || '',
  },
  explorerUrl: process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://dopelgangachain.xyz/explorer',
  websiteUrl: process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://www.dopelganga.com',
  twitterUrl: process.env.NEXT_PUBLIC_TWITTER_URL || 'https://x.com/dopelgangafi',
  programId: process.env.NEXT_PUBLIC_PROGRAM_ID || 'HAzZhRcVrrFWYU9K4nWCSvpgLLcMSb9GZRfrcs3bYfDP',
};

