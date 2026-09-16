import { listResults } from "@/lib/domain";
import { Stat } from "@/components/ui";
import { ResultsList } from "@/components/results-list";
import { coins } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Results() {
  const results = listResults(120);
  const settled = results.filter((r) => r.result !== "void").length;
  const cancelled = results.filter((r) => r.result === "void").length;
  const totalBets = results.reduce((s, r) => s + r.bets, 0);
  const volume = results.reduce((s, r) => s + r.volume, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold">Match Results</h1>
        <p className="text-sm text-muted">Final toss outcomes &amp; settled markets.</p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Stat label="Settled" value={settled} accent="text-brand" />
        <Stat label="Cancelled" value={cancelled} accent={cancelled ? "text-lay" : ""} />
        <Stat label="Bets" value={totalBets} />
        <Stat label="Volume" value={coins(volume)} accent="text-gold" />
      </div>

      <ResultsList results={results} />
    </div>
  );
}
