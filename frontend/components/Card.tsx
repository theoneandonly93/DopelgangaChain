
import { ReactNode } from 'react';
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`glass rounded-2xl p-6 shadow-card border border-white/10 ${className}`}>
      {children}
    </div>
  );
}
