"use client";

export interface Insn {
  mnemonic: string;
  rawOperands: string;
  norm: string;
  reloc?: string;
}
export interface Row {
  kind: "same" | "diff" | "insert" | "delete";
  target?: Insn;
  user?: Insn;
}

// One lexed token of an instruction, tagged with its syntax class and whether
// it's "significant" (a real token vs. whitespace/punctuation we diff over).
interface Tok {
  text: string;
  cls: string;
  sig: boolean;
}

function classOf(tok: string): string {
  if (/^(r|f)\d+$/.test(tok) || /^cr\d+$/.test(tok)) return "text-syntax-reg";
  if (/^-?(0x[0-9a-fA-F]+|\d+)$/.test(tok)) return "text-syntax-num";
  if (tok.startsWith("@")) return "text-syntax-str"; // relocation symbol
  return "text-content";
}

// Lex an instruction into mnemonic + operand tokens, preserving the separators
// so we can re-render it verbatim while still diffing token-by-token.
function lex(insn: Insn): Tok[] {
  const toks: Tok[] = [{ text: insn.mnemonic, cls: "text-syntax-mnemonic", sig: true }];
  if (insn.rawOperands) {
    toks.push({ text: " ", cls: "", sig: false });
    for (const t of insn.rawOperands.split(/([,\s]+)/)) {
      if (t === "") continue;
      if (/^[,\s]+$/.test(t)) toks.push({ text: t, cls: "", sig: false });
      else toks.push({ text: t, cls: classOf(t), sig: true });
    }
  }
  return toks;
}

// Mark which significant tokens of `a` are absent (in order) from `b`, via LCS.
// Those are the tokens that actually changed and should draw the eye.
function changedMask(a: Tok[], b: Tok[]): boolean[] {
  const sa = a.filter((t) => t.sig).map((t) => t.text);
  const sb = b.filter((t) => t.sig).map((t) => t.text);
  const n = sa.length;
  const m = sb.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = sa[i] === sb[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const keep: boolean[] = new Array(n).fill(false);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (sa[i] === sb[j]) { keep[i] = true; i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return keep.map((k) => !k);
}

function Cell({
  insn,
  against,
  side,
}: {
  insn?: Insn;
  against?: Insn;
  side?: "target" | "user";
}) {
  if (!insn) return <span className="select-none text-line-strong">·</span>;
  const toks = lex(insn);
  // Highlight only the operands that differ from the other side.
  const changed = against ? changedMask(toks, lex(against)) : [];
  // Map "significant token index" -> position in the changed array.
  let sigIdx = -1;
  const hl =
    side === "user"
      ? "rounded-[3px] bg-bad/20 text-bad ring-1 ring-bad/30"
      : "rounded-[3px] bg-good/15 text-good ring-1 ring-good/25";
  return (
    <span>
      {toks.map((t, k) => {
        if (!t.sig) return <span key={k}>{t.text}</span>;
        sigIdx++;
        const isChanged = changed[sigIdx];
        return (
          <span key={k} className={isChanged ? hl : t.cls}>
            {t.text}
          </span>
        );
      })}
    </span>
  );
}

const ROW_META = {
  same: { bg: "", mark: "", markColor: "", label: "matches" },
  diff: { bg: "bg-warn/[0.07]", mark: "≠", markColor: "text-warn", label: "differs" },
  delete: { bg: "bg-bad/[0.07]", mark: "−", markColor: "text-bad", label: "missing from your code" },
  insert: { bg: "bg-accent/[0.07]", mark: "+", markColor: "text-accent", label: "extra in your code" },
} as const;

export function AsmDiff({ rows }: { rows: Row[] }) {
  return (
    <>
      {/* Side-by-side once there's room; unified single-column on phones. */}
      <div className="hidden sm:block">
        <SideBySideDiff rows={rows} />
      </div>
      <div className="sm:hidden">
        <UnifiedDiff rows={rows} />
      </div>
    </>
  );
}

function SideBySideDiff({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-auto font-mono text-asm">
      <div className="grid min-w-[620px] grid-cols-[2.6rem_1fr_1fr]">
        <div className="sticky top-0 z-10 border-b border-line bg-bg-soft px-2 py-1.5 text-2xs font-semibold uppercase tracking-wider text-content-faint">
          #
        </div>
        <div className="sticky top-0 z-10 border-b border-r border-line bg-bg-soft px-3 py-1.5 text-2xs font-semibold uppercase tracking-wider text-content-muted">
          Target
        </div>
        <div className="sticky top-0 z-10 border-b border-line bg-bg-soft px-3 py-1.5 text-2xs font-semibold uppercase tracking-wider text-content-muted">
          Your output
        </div>
        {rows.map((r, i) => {
          const meta = ROW_META[r.kind];
          const stagger = i < 16 ? { animationDelay: `${i * 16}ms` } : undefined;
          return (
            <div
              key={i}
              className="contents motion-safe:animate-row-settle"
              style={stagger}
              role="row"
              aria-label={
                r.kind === "same"
                  ? undefined
                  : `Line ${i + 1} ${meta.label}: target ${r.target?.mnemonic ?? "none"}, yours ${r.user?.mnemonic ?? "none"}`
              }
            >
              <div
                className={`${meta.bg} flex select-none items-center justify-center gap-1 ${meta.markColor} text-2xs`}
              >
                <span className="tabular-nums text-content-ghost">{i + 1}</span>
                <span aria-hidden="true">{meta.mark}</span>
              </div>
              <div className={`${meta.bg} border-r border-line/50 px-3 py-px`}>
                <Cell insn={r.target} against={r.kind === "diff" ? r.user : undefined} side="target" />
              </div>
              <div className={`${meta.bg} px-3 py-px`}>
                <Cell insn={r.user} against={r.kind === "diff" ? r.target : undefined} side="user" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Interleaved single-column diff (decomp.me-style) that actually fits a phone.
// A "diff" row becomes a stacked − target / + yours pair.
function UnifiedDiff({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto px-1 py-1 font-mono text-asm">
      {rows.map((r, i) => {
        const num = (
          <span className="mr-2 inline-block w-6 select-none text-right tabular-nums text-content-ghost">
            {i + 1}
          </span>
        );
        if (r.kind === "same")
          return (
            <div key={i} className="whitespace-pre px-2 py-px">
              {num}
              <Cell insn={r.target} />
            </div>
          );
        if (r.kind === "delete")
          return (
            <div key={i} className="whitespace-pre bg-bad/[0.07] px-2 py-px">
              {num}
              <span className="mr-1 select-none text-bad">−</span>
              <Cell insn={r.target} />
            </div>
          );
        if (r.kind === "insert")
          return (
            <div key={i} className="whitespace-pre bg-accent/[0.07] px-2 py-px">
              {num}
              <span className="mr-1 select-none text-accent">+</span>
              <Cell insn={r.user} />
            </div>
          );
        // diff: show what to match, then what you produced.
        return (
          <div key={i} className="bg-warn/[0.06]">
            <div className="whitespace-pre px-2 py-px">
              {num}
              <span className="mr-1 select-none text-warn">−</span>
              <Cell insn={r.target} against={r.user} side="target" />
            </div>
            <div className="whitespace-pre px-2 py-px">
              <span className="mr-2 inline-block w-6 select-none" />
              <span className="mr-1 select-none text-warn">+</span>
              <Cell insn={r.user} against={r.target} side="user" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AsmList({ rows }: { rows: Insn[] }) {
  return (
    <div className="overflow-auto px-3 py-2 font-mono text-asm">
      {rows.map((insn, i) => (
        <div key={i} className="flex">
          <span className="w-8 select-none text-right text-content-ghost">{i}</span>
          <span className="pl-4">
            <Cell insn={insn} />
          </span>
        </div>
      ))}
    </div>
  );
}
