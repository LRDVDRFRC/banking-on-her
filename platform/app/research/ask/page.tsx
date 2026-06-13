import Link from "next/link";
import AskLibrary from "@/components/AskLibrary";

export const dynamic = "force-dynamic";

export default function AskPage() {
  const enabled = Boolean(process.env.ANTHROPIC_API_KEY);

  return (
    <>
      <div className="page-label">Facilitator · Ask the library</div>
      <h1 style={{ fontSize: "2.4rem", fontWeight: 700, marginBottom: 16 }}>
        Ask the library
      </h1>
      <p className="intro-note" style={{ marginBottom: 12 }}>
        Question in, evidence-grounded answer out — every claim cited to a
        stored report. Use it to prep a client conversation, sanity-check a
        number, or draft the factual core of a proposal.
      </p>
      <p style={{ marginBottom: 32 }}>
        <Link href="/research">← Back to the library</Link>
      </p>
      <AskLibrary enabled={enabled} />
    </>
  );
}
