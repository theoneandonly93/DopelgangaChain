export type DocsItem = { title: string; href: string };
export type DocsSection = { title: string; items: DocsItem[] };

export const docsNav: DocsSection[] = [
  {
    title: 'Getting Started',
    items: [
      { title: 'Introduction', href: '/documents/introduction' },
      { title: 'Quickstart', href: '/documents/quickstart' },
      { title: 'Network & RPC', href: '/documents/network' },
      { title: 'Roadmap', href: '/documents/roadmap' },
    ],
  },
  {
    title: 'Develop',
    items: [
      { title: 'Programs', href: '/documents/programs' },
      { title: 'Tokens (DOPE)', href: '/documents/tokens' },
      { title: 'Launch a Token', href: '/documents/launch-token' },
      { title: 'Indexer & Blocks', href: '/documents/indexer' },
    ],
  },
  {
    title: 'Operate',
    items: [
      { title: 'Explorer', href: '/documents/explorer' },
      { title: 'Faucet', href: '/documents/faucet' },
      { title: 'FAQ', href: '/documents/faq' },
    ],
  },
];
