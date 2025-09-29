/// <reference types="node" />
// Global augmentations or shims (kept minimal).

// Provide a very loose process typing fallback if editor fails to load @types/node
// (runtime still relies on actual Node polyfills provided by Next.js only for NEXT_PUBLIC_*).
declare var process: {
	env: { [key: string]: string | undefined }
};

// JSON module default import support (older TS editors sometimes complain even with resolveJsonModule)
declare module '*.json' {
	const value: any;
	export default value;
}

// Ambient module declarations for packages that may lack bundled types or fail resolution in editor.
// These prevent TS "Cannot find module" errors if node_modules not yet indexed.
// NOTE: Do NOT declare ambient modules for packages that ship their own
// type definitions (anchor, spl-token, web3.js). Doing so erases their
// real typings and produces "no exported member" errors. If the editor
// shows module not found, ensure `npm install` ran inside `frontend/`.
