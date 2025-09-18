'use client';

import { useState } from 'react';

type Props = {
  value: string;
  className?: string;
  label?: string;
};

export function CopyButton({ value, className = '', label = 'Copy' }: Props) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <button onClick={onCopy} className={className} aria-label={`Copy ${label}`}>
      {copied ? 'Copied!' : label}
    </button>
  );
}
