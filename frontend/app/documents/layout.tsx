import '../../styles/globals.css';
import { ReactNode } from 'react';
import Link from 'next/link';
import { docsNav } from '../../docs/nav';
import { DocsMDXProvider } from '../mdx-components';

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="text-white/80 font-semibold">DopelgangaChain Docs</div>
        <div className="flex items-center gap-3">
          <input placeholder="Search docs (coming soon)" className="glass rounded-xl px-3 py-1.5 text-sm border border-white/10 outline-none" />
          <select className="glass rounded-xl px-3 py-1.5 text-sm border border-white/10 outline-none text-white/80">
            <option>v0 (Preview)</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-6">
      <aside className="hidden md:block col-span-3">
        <div className="glass rounded-2xl p-4 sticky top-24 max-h-[calc(100vh-8rem)] overflow-auto border border-white/10">
          <div className="px-2 pb-2 text-xs tracking-widest text-white/60">DOPELGANGACHAIN DOCS</div>
          {docsNav.map((section) => (
            <div key={section.title} className="mb-4">
              <div className="text-white/80 text-sm font-semibold px-2 py-1">{section.title}</div>
              <nav className="mt-1">
                {section.items.map((item) => (
                  <Link key={item.href} href={item.href} className="block px-2 py-1 rounded-md text-white/70 hover:text-white hover:bg-white/5">
                    {item.title}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
      </aside>
      <main className="col-span-12 md:col-span-7">
        <article className="prose prose-invert max-w-none">
          <DocsMDXProvider>
            {children}
          </DocsMDXProvider>
        </article>
      </main>
      <aside className="hidden lg:block col-span-2">
        <div className="glass rounded-2xl p-4 sticky top-24 border border-white/10">
          <div className="text-xs text-white/60">On this page</div>
          <ul className="mt-2 space-y-1 text-sm text-white/70">
            <li><a href="#introduction" className="hover:text-white">Introduction</a></li>
            <li><a href="#quickstart" className="hover:text-white">Quickstart</a></li>
            <li><a href="#network" className="hover:text-white">Network & RPC</a></li>
            <li><a href="#roadmap" className="hover:text-white">Roadmap</a></li>
          </ul>
        </div>
      </aside>
      </div>
    </div>
  );
}
