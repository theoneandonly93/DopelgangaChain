export default function TokenomicsDraft() {
  return (
    <div className="space-y-6">
      <section className="glass rounded-2xl p-6 border border-white/10">
        <h1 className="text-3xl font-extrabold">DOPE Token Strategy (Draft)</h1>
        <p className="text-white/75 mt-2 text-sm">Work‑in‑progress outline to align supply, incentives, and utility before distribution.</p>
      </section>

      <section className="glass rounded-2xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold">Supply & Emissions</h2>
        <ul className="list-disc pl-5 text-white/80 mt-2 space-y-1 text-sm">
          <li>Total supply: TBD</li>
          <li>Inflation pool per epoch: TBD (validator rewards)</li>
          <li>Vesting schedules and cliffs: TBD</li>
        </ul>
      </section>

      <section className="glass rounded-2xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold">Allocations</h2>
        <ul className="list-disc pl-5 text-white/80 mt-2 space-y-1 text-sm">
          <li>Community & Ecosystem: TBD</li>
          <li>Validators & Incentives: TBD</li>
          <li>Core Contributors: TBD</li>
          <li>Treasury/Reserves: TBD</li>
        </ul>
      </section>

      <section className="glass rounded-2xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold">Utility</h2>
        <ul className="list-disc pl-5 text-white/80 mt-2 space-y-1 text-sm">
          <li>Gas token for DopelgangaChain apps</li>
          <li>Staking for validator eligibility and weighting</li>
          <li>Governance (parameter changes, treasury usage)</li>
        </ul>
      </section>

      <section className="glass rounded-2xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold">Next Steps</h2>
        <ul className="list-disc pl-5 text-white/80 mt-2 space-y-1 text-sm">
          <li>Decide final supply and emission curve</li>
          <li>Publish allocation chart and vesting</li>
          <li>Publish public IDL and CLI for reward claims</li>
        </ul>
      </section>
    </div>
  );
}

