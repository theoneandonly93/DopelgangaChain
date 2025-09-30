
import { ReactNode } from 'react';
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`glass rounded-2xl p-4 md:p-6 shadow-card border border-white/10 ${className} overflow-x-auto`}>
      {children}
    </div>
  );
}
