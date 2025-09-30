import { SITE } from '@/utils/site';

export default function Network() {
  return (
    <div className="space-y-6">
      <section className="glass rounded-2xl p-6 border border-white/10">
        <h1 className="text-3xl font-extrabold">Network & RPC</h1>
        <div className="text-white/80 mt-2 space-y-2">
          <div>HTTP RPC: <code>{SITE.rpc.http}</code></div>
          {SITE.rpc.ws ? (<div>WebSocket RPC: <code>{SITE.rpc.ws}</code></div>) : null}
          <div>Genesis Program: <code>{SITE.programId}</code></div>
          <div>Explorer: <code>{SITE.explorerUrl}</code></div>
        </div>
      </section>
    </div>
  );
}
