"use client";
import { useMemo } from "react";
import { MDXProvider } from "@mdx-js/react";

type Components = Record<string, React.ComponentType<any>>;

export function DocsMDXProvider({ children }: { children: React.ReactNode }) {
  const components = useMemo<Components>(() => ({
    // Map Markdown elements to styled components if needed
  }), []);
  return <MDXProvider components={components}>{children}</MDXProvider>;
}
