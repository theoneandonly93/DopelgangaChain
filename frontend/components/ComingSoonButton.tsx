'use client';

import { useToast } from './Toast';

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function ComingSoonButton({ children, className = '' }: Props) {
  const { show } = useToast();
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    show('Network not live yet — coming soon');
  };
  return (
    <button
      onClick={onClick}
      aria-disabled
      className={`px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:border-white/30 cursor-not-allowed inline-flex items-center gap-2 ${className}`}
      title="Coming soon"
    >
      {children}
      <span className="text-xs px-2 py-0.5 rounded-md bg-white/10 border border-white/10">Coming soon</span>
    </button>
  );
}
