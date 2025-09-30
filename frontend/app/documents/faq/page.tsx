export default function FAQ() {
  return (
    <div className="space-y-6">
      <section className="glass rounded-2xl p-6 border border-white/10">
        <h1 className="text-3xl font-extrabold">FAQ</h1>
        <div className="prose prose-invert mt-4">
          <h2>What is DopelgangaChain?</h2>
          <p>A Solana-compatible chain focused on speed and developer UX. Native token: DOPE.</p>
          <h2>Is it compatible with Solana programs?</h2>
          <p>Yes, the intent is high compatibility with Solana tooling and Anchor.</p>
          <h2>How do I get test DOPE?</h2>
          <p>A faucet will be provided during Devnet. See the Roadmap.</p>
          <h2>Where can I follow progress?</h2>
          <p>This docs site and the repository issues/project board.</p>
        </div>
      </section>
    </div>
  );
}
