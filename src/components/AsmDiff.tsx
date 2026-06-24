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

function Cell({ insn }: { insn?: Insn }) {
  if (!insn) return <span className="select-none text-[#2b3441]">·</span>;
  return (
    <span>
      <span className="text-[#ff9b85]">{insn.mnemonic}</span>
      {insn.rawOperands && <span> {colorOperands(insn.rawOperands)}</span>}
    </span>
  );
}

// Light syntax coloring for operands: registers green, numbers blue, rest grey.
function colorOperands(ops: string) {
  const tokens = ops.split(/([,\s]+)/);
  return tokens.map((tok, i) => {
    if (/^(r|f)\d+$/.test(tok) || /^cr\d+$/.test(tok)) {
      return (
        <span key={i} className="text-[#7ee787]">
          {tok}
        </span>
      );
    }
    if (/^-?(0x[0-9a-fA-F]+|\d+)$/.test(tok)) {
      return (
        <span key={i} className="text-[#79c0ff]">
          {tok}
        </span>
      );
    }
    return (
      <span key={i} className="text-[#c9d1d9]">
        {tok}
      </span>
    );
  });
}

export function AsmDiff({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-auto font-mono text-[12.5px] leading-[1.7]">
      <div className="grid grid-cols-[1.25rem_1fr_1fr]">
        <div className="sticky top-0 z-10 border-b border-line bg-bg-soft" />
        <div className="sticky top-0 z-10 border-b border-r border-line bg-bg-soft px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#7c8a9a]">
          Target
        </div>
        <div className="sticky top-0 z-10 border-b border-line bg-bg-soft px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#7c8a9a]">
          Your code
        </div>
        {rows.map((r, i) => {
          const bg =
            r.kind === "same"
              ? ""
              : r.kind === "diff"
                ? "bg-warn/10"
                : r.kind === "delete"
                  ? "bg-bad/10"
                  : "bg-good/10";
          const mark =
            r.kind === "same"
              ? ""
              : r.kind === "diff"
                ? "≠"
                : r.kind === "delete"
                  ? "−"
                  : "+";
          const markColor =
            r.kind === "diff"
              ? "text-warn"
              : r.kind === "delete"
                ? "text-bad"
                : "text-good";
          return (
            <div key={i} className={`contents`}>
              <div className={`${bg} flex items-center justify-center ${markColor} text-[11px]`}>
                {mark}
              </div>
              <div className={`${bg} border-r border-line/50 px-3 py-px`}>
                <Cell insn={r.target} />
              </div>
              <div className={`${bg} px-3 py-px`}>
                <Cell insn={r.user} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AsmList({ rows }: { rows: Insn[] }) {
  return (
    <div className="overflow-auto px-3 py-2 font-mono text-[12.5px] leading-[1.7]">
      {rows.map((insn, i) => (
        <div key={i} className="flex">
          <span className="w-8 select-none text-right text-[#3a4757]">{i}</span>
          <span className="pl-4">
            <Cell insn={insn} />
          </span>
        </div>
      ))}
    </div>
  );
}
