import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="navbar-banana w-full py-3 px-6 flex items-center justify-between shadow-lg font-banana">
      <div className="font-bold text-2xl tracking-tight flex items-center gap-2">
        <span role="img" aria-label="logo">🍌</span> DopelgangaChain
      </div>
      <div className="flex gap-6 text-lg font-medium">
        <Link href="/">
          <span className="hover:underline cursor-pointer">Home</span>
        </Link>
        <Link href="/documents">
          <span className="hover:underline cursor-pointer">Documents</span>
        </Link>
      </div>
    </nav>
  );
}
