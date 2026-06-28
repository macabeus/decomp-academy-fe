"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  DiffRowVM,
  Overview,
  OverviewSection,
  OverviewSymbol,
  RowKind,
  Seg,
} from "@/lib/objdiff/client";

// Renders objdiff-wasm's instruction-level diff. objdiff colors each changed
// segment itself (replace / delete / insert), so unlike the old token-LCS differ
// we just paint what the engine tells us — relocations, branch targets and all.

// Distinct hues for objdiff's "rotating" color — used so each branch's pair of
// arrows (source + target) shares a colour you can trace, and adjacent branches
// stay easy to tell apart. The hues themselves (per-theme) live in the palette.
const ROT = [
  "text-rot-0", // yellow / amber
  "text-rot-1", // cyan / teal
  "text-rot-2", // pink
  "text-rot-3", // purple
  "text-rot-4", // green
  "text-rot-5", // orange
  "text-rot-6", // blue
  "text-rot-7", // red
];

function tokClass(tok: string): string {
  switch (tok) {
    case "mnemonic":
      return "text-syntax-mnemonic";
    case "num":
      return "text-syntax-num";
    case "symbol":
      return "text-syntax-str";
    case "branch":
      return "text-syntax-reg";
    case "addr":
      return "text-content-ghost";
    default:
      return "text-content";
  }
}

function segClass(s: Seg): string {
  switch (s.color) {
    // "replace" highlights the specific token that differs within an otherwise
    // matching line — box it so the eye lands on it. In light, gold-on-gold goes
    // muddy, so the token text flips to near-black on a clearer amber box.
    case "replace":
      return "rounded-[3px] bg-warn/20 text-warn ring-1 ring-warn/30 theme-light:bg-warn/[0.15] theme-light:text-content-bright theme-light:ring-warn/50";
    // Whole-line add/remove: solid colour, no box (the row tint + −/+ mark carry it).
    case "delete":
      return "text-bad";
    case "insert":
      return "text-accent";
    case "dim":
      return "text-content-faint";
    case "data-flow":
      return "text-syntax-num/80";
    case "rotating":
      return ROT[(s.rot ?? 0) % ROT.length];
    default:
      return tokClass(s.tok); // normal / bright
  }
}

// ---- Instruction glossary: hover an instruction to see what it does, with the
// {rA}/{rD}/{simm} placeholders filled in from the hovered line's own operands ----

interface InsnDoc {
  name: string;
  descriptiveName: string;
  usage: string;
  description: string;
}
type RawEntry = { Name: string; DescriptiveName: string; Usage: string; Description: string };

let glossaryMap: Map<string, InsnDoc> | null = null;
let glossaryPromise: Promise<Map<string, InsnDoc>> | null = null;

function loadGlossary(): Promise<Map<string, InsnDoc>> {
  if (!glossaryPromise) {
    glossaryPromise = import("@/lib/asm/ppc-instructions.json").then((m) => {
      const map = new Map<string, InsnDoc>();
      for (const e of m.default as RawEntry[]) {
        map.set(e.Name, {
          name: e.Name,
          descriptiveName: e.DescriptiveName,
          usage: e.Usage,
          description: e.Description,
        });
      }
      glossaryMap = map;
      return map;
    });
  }
  return glossaryPromise;
}

/** Warm the instruction glossary ahead of the first hover. */
export function preloadGlossary(): void {
  void loadGlossary();
}

// Resolve a printed mnemonic to a glossary entry, tolerating the suffixes objdiff
// prints: branch-prediction (+/-), record (.), overflow (o), and simplified branch
// forms (bl/bla/ba -> b).
function lookupInsn(map: Map<string, InsnDoc>, mnemonic: string): InsnDoc | null {
  const direct = map.get(mnemonic);
  if (direct) return direct;
  let s = mnemonic.replace(/[+-]$/, "");
  if (s.endsWith(".")) s = s.slice(0, -1);
  if (s.endsWith("o")) s = s.slice(0, -1);
  const stripped = map.get(s);
  if (stripped) return stripped;
  if (mnemonic.startsWith("b")) {
    const b = mnemonic.replace(/(la|l|a)$/, "");
    const branch = map.get(b);
    if (branch) return branch;
  }
  return null;
}

// Operand names from the Usage template, e.g. "add rD, rA, rB" -> ["rD","rA","rB"].
function usagePlaceholders(usage: string): string[] {
  const sp = usage.indexOf(" ");
  if (sp < 0) return [];
  return usage.slice(sp + 1).split(",").map((p) => p.trim()).filter(Boolean);
}

// The hovered instruction's actual operands, e.g. segs for "add r3, r3, r4" -> ["r3","r3","r4"].
function instructionOperands(segs: Seg[]): string[] {
  const mi = segs.findIndex((s) => s.tok === "mnemonic");
  if (mi < 0) return [];
  const after = segs
    .slice(mi + 1)
    .map((s) => s.text)
    .join("")
    .replace(/~>/g, "")
    .trim();
  return after ? after.split(",").map((p) => p.trim()).filter(Boolean) : [];
}

// Substitute {placeholder} tokens in the description with this instruction's
// operands (positionally, per the Usage template). Also splits displacement forms
// like "d(rA)" <-> "8(r4)". Unmatched placeholders fall back to their bare name.
function fillDescription(doc: InsnDoc, operands: string[]): string {
  const ph = usagePlaceholders(doc.usage);
  const subs: Record<string, string> = {};
  // Compares (and similar) print a simplified form that omits the leading CR-field
  // operand, which then defaults to cr0 — so shift the mapping by one.
  let offset = 0;
  if (ph.length === operands.length + 1 && /^crf?[DS]/.test(ph[0])) {
    subs[ph[0]] = "cr0";
    offset = 1;
  }
  for (let i = 0; i < operands.length && i + offset < ph.length; i++) {
    const p = ph[i + offset];
    const o = operands[i];
    const pm = p.match(/^(\w+)\((\w+)\)$/);
    const om = o.match(/^(-?[\w@.+-]+)\((\w+)\)$/);
    if (pm && om) {
      subs[pm[1]] = om[1];
      subs[pm[2]] = om[2];
    } else {
      subs[p] = o;
    }
  }
  // Placeholders may carry a subfield, e.g. {crfS[LT]}: substitute the base name
  // and keep the suffix ("crfS" -> "cr0" gives "cr0[LT]").
  return doc.description.replace(/\{([^}]+)\}/g, (_, name) => {
    const br = name.indexOf("[");
    if (br >= 0) return (subs[name.slice(0, br)] ?? name.slice(0, br)) + name.slice(br);
    return subs[name] ?? name;
  });
}

interface InsnTipState {
  x: number;
  y: number;
  doc: InsnDoc;
  description: string;
}
const InsnTipContext = createContext<{
  show: (mnemonic: string, operands: string[], x: number, y: number) => void;
  hide: () => void;
} | null>(null);

/** Wraps instruction lines so hovering one shows its meaning. */
function InsnTipLayer({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<Map<string, InsnDoc> | null>(glossaryMap);
  useEffect(() => {
    if (!map) loadGlossary().then(setMap).catch(() => {});
  }, [map]);
  const [tip, setTip] = useState<InsnTipState | null>(null);
  const show = useCallback(
    (mnemonic: string, operands: string[], x: number, y: number) => {
      const doc = map ? lookupInsn(map, mnemonic) : null;
      setTip(doc ? { x, y, doc, description: fillDescription(doc, operands) } : null);
    },
    [map],
  );
  const hide = useCallback(() => setTip(null), []);
  const ctx = useMemo(() => ({ show, hide }), [show, hide]);
  return (
    <InsnTipContext.Provider value={ctx}>
      {children}
      {tip && <InsnDocTooltip tip={tip} />}
    </InsnTipContext.Provider>
  );
}

function InsnDocTooltip({ tip }: { tip: InsnTipState }) {
  return (
    <div
      className="pointer-events-none fixed z-50 max-w-sm rounded-md border border-line bg-bg-inset/95 px-3 py-2 shadow-lg backdrop-blur-sm"
      style={{ left: tip.x + 14, top: tip.y + 16 }}
    >
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-sm font-semibold text-syntax-mnemonic">{tip.doc.name}</span>
        <span className="text-xs text-content-secondary">{tip.doc.descriptiveName}</span>
      </div>
      {tip.doc.usage && (
        <div className="mt-0.5 font-mono text-2xs text-content-faint">{tip.doc.usage}</div>
      )}
      <div className="mt-1 text-xs leading-relaxed text-content-muted">{tip.description}</div>
    </div>
  );
}

function Line({ segs }: { segs: Seg[] | null }) {
  const tip = useContext(InsnTipContext);
  if (!segs) return <span className="select-none text-line-strong">·</span>;
  const mnemonic = segs.find((s) => s.tok === "mnemonic")?.text.trim();
  const hover =
    mnemonic && tip
      ? {
          onMouseEnter: (e: { clientX: number; clientY: number }) =>
            tip.show(mnemonic, instructionOperands(segs), e.clientX, e.clientY),
          onMouseMove: (e: { clientX: number; clientY: number }) =>
            tip.show(mnemonic, instructionOperands(segs), e.clientX, e.clientY),
          onMouseLeave: tip.hide,
        }
      : undefined;

  return (
    <span className={mnemonic ? "cursor-help whitespace-pre" : "whitespace-pre"} {...hover}>
      {segs.map((s, i) => (
        <span key={i} className={segClass(s)}>
          {s.text}
        </span>
      ))}
    </span>
  );
}

// The faint row tints need a touch more alpha in light to read on white.
const ROW_META: Record<RowKind, { bg: string; mark: string; markColor: string; label: string }> = {
  none: { bg: "", mark: "", markColor: "", label: "matches" },
  replace: { bg: "bg-warn/[0.07] theme-light:bg-warn/[0.11]", mark: "≠", markColor: "text-warn", label: "differs" },
  "op-mismatch": { bg: "bg-warn/[0.07] theme-light:bg-amber-50", mark: "≠", markColor: "text-warn", label: "opcode differs" },
  "arg-mismatch": { bg: "bg-warn/[0.07] theme-light:bg-amber-50", mark: "≠", markColor: "text-warn", label: "operand differs" },
  delete: { bg: "bg-bad/[0.07] theme-light:bg-red-50", mark: "−", markColor: "text-bad", label: "missing from your code" },
  insert: { bg: "bg-accent/[0.07] theme-light:bg-emerald-50", mark: "+", markColor: "text-accent", label: "extra in your code" },
};

export function ObjDiff({ rows }: { rows: DiffRowVM[] }) {
  return (
    <InsnTipLayer>
      {/* Side-by-side once there's room; unified single-column on phones. */}
      <div className="hidden sm:block">
        <SideBySideDiff rows={rows} />
      </div>
      <div className="sm:hidden">
        <UnifiedDiff rows={rows} />
      </div>
    </InsnTipLayer>
  );
}

function SideBySideDiff({ rows }: { rows: DiffRowVM[] }) {
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
              aria-label={r.kind === "none" ? undefined : `Line ${i + 1} ${meta.label}`}
            >
              <div
                className={`${meta.bg} flex select-none items-center justify-center gap-1 ${meta.markColor} text-2xs`}
              >
                <span className="tabular-nums text-content-ghost">{i + 1}</span>
                <span aria-hidden="true">{meta.mark}</span>
              </div>
              <div className={`${meta.bg} border-r border-line/50 px-3 py-px`}>
                <Line segs={r.target} />
              </div>
              <div className={`${meta.bg} px-3 py-px`}>
                <Line segs={r.user} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Interleaved single-column diff (objdiff/decomp.me-style) that fits a phone.
function UnifiedDiff({ rows }: { rows: DiffRowVM[] }) {
  return (
    <div className="overflow-x-auto px-1 py-1 font-mono text-asm">
      {rows.map((r, i) => {
        const num = (
          <span className="mr-2 inline-block w-6 select-none text-right tabular-nums text-content-ghost">
            {i + 1}
          </span>
        );
        if (r.kind === "none")
          return (
            <div key={i} className="whitespace-pre px-2 py-px">
              {num}
              <Line segs={r.target ?? r.user} />
            </div>
          );
        if (r.kind === "delete")
          return (
            <div key={i} className="whitespace-pre bg-bad/[0.07] px-2 py-px">
              {num}
              <span className="mr-1 select-none text-bad">−</span>
              <Line segs={r.target} />
            </div>
          );
        if (r.kind === "insert")
          return (
            <div key={i} className="whitespace-pre bg-accent/[0.07] px-2 py-px">
              {num}
              <span className="mr-1 select-none text-accent">+</span>
              <Line segs={r.user} />
            </div>
          );
        // replace / op-mismatch / arg-mismatch: show target, then yours.
        return (
          <div key={i} className="bg-warn/[0.06]">
            <div className="whitespace-pre px-2 py-px">
              {num}
              <span className="mr-1 select-none text-warn">−</span>
              <Line segs={r.target} />
            </div>
            <div className="whitespace-pre px-2 py-px">
              <span className="mr-2 inline-block w-6 select-none" />
              <span className="mr-1 select-none text-warn">+</span>
              <Line segs={r.user} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Object overview: the two-column section/symbol navigator ----

function pctTone(v: number): string {
  return v >= 100 ? "text-good" : v >= 50 ? "text-warn" : "text-bad";
}

function Pct({ v }: { v: number }) {
  return <span className={`tabular-nums ${pctTone(v)}`}>({Math.round(v)}%)</span>;
}

type TipState = { x: number; y: number; sym: OverviewSymbol } | null;

function SymRow({
  sym,
  selected,
  onSelect,
  setTip,
}: {
  sym: OverviewSymbol;
  selected: boolean;
  onSelect: (name: string) => void;
  setTip: (t: TipState) => void;
}) {
  const clickable = !sym.isData;
  return (
    <div
      onMouseEnter={(e) => setTip({ x: e.clientX, y: e.clientY, sym })}
      onMouseMove={(e) => setTip({ x: e.clientX, y: e.clientY, sym })}
      onMouseLeave={() => setTip(null)}
      onClick={clickable ? () => onSelect(sym.name) : undefined}
      className={`flex items-center gap-2 whitespace-nowrap py-px pl-6 pr-2 ${
        clickable ? "cursor-pointer hover:bg-bg-softer/70" : "cursor-default"
      } ${selected ? "bg-accent/10 ring-1 ring-inset ring-accent/30" : ""}`}
    >
      <span className="select-none text-2xs text-content-ghost">[{sym.flags || "?"}]</span>
      {sym.matchPercent != null && <Pct v={sym.matchPercent} />}
      <span className="truncate text-content">{sym.demangled || sym.name}</span>
    </div>
  );
}

function Section({
  sec,
  selected,
  onSelect,
  setTip,
}: {
  sec: OverviewSection;
  selected: string;
  onSelect: (name: string) => void;
  setTip: (t: TipState) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 whitespace-nowrap px-2 py-0.5 text-left hover:bg-bg-softer/40"
      >
        <span className="select-none text-content-faint">{open ? "▾" : "▸"}</span>
        <span className="font-semibold text-content-secondary">{sec.name}</span>
        <span className="text-content-faint">({sec.sizeHex})</span>
        {sec.matchPercent != null && <Pct v={sec.matchPercent} />}
      </button>
      {open &&
        sec.symbols.map((s, i) => (
          <SymRow
            key={i}
            sym={s}
            selected={selected === s.name && !s.isData}
            onSelect={onSelect}
            setTip={setTip}
          />
        ))}
    </div>
  );
}

function ObjColumn({
  title,
  sections,
  selected,
  onSelect,
  setTip,
}: {
  title: string;
  sections: OverviewSection[];
  selected: string;
  onSelect: (name: string) => void;
  setTip: (t: TipState) => void;
}) {
  return (
    <div className="min-w-0 overflow-x-auto bg-bg-inset/40">
      <div className="sticky top-0 z-10 border-b border-line bg-bg-soft px-2 py-1.5 text-2xs font-semibold uppercase tracking-wider text-content-muted">
        {title}
      </div>
      {sections.length ? (
        sections.map((sec, i) => (
          <Section key={i} sec={sec} selected={selected} onSelect={onSelect} setTip={setTip} />
        ))
      ) : (
        <div className="px-3 py-4 text-xs text-content-faint">No object yet.</div>
      )}
    </div>
  );
}

function SymTooltip({ tip }: { tip: NonNullable<TipState> }) {
  return (
    <div
      className="pointer-events-none fixed z-50 max-w-md rounded-md border border-line bg-bg-inset/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm"
      style={{ left: tip.x + 14, top: tip.y + 16 }}
    >
      {tip.sym.hover.map((h, i) => (
        <div key={i} className="flex gap-2 leading-relaxed">
          <span className="shrink-0 text-accent">{h.label}:</span>
          <span className="break-all text-content-secondary">{h.value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * The objdiff object navigator: Target vs Base, each a tree of sections and
 * symbols with match %. Click a code symbol to diff it; hover for metadata.
 */
export function ObjOverview({
  overview,
  selected,
  onSelect,
}: {
  overview: Overview;
  selected: string;
  onSelect: (name: string) => void;
}) {
  const [tip, setTip] = useState<TipState>(null);
  return (
    <div className="h-full font-mono text-asm">
      <div className="grid grid-cols-2 gap-px bg-line/50">
        <ObjColumn title="Target object" sections={overview.target} selected={selected} onSelect={onSelect} setTip={setTip} />
        <ObjColumn title="Base object" sections={overview.base} selected={selected} onSelect={onSelect} setTip={setTip} />
      </div>
      {tip && tip.sym.hover.length > 0 && <SymTooltip tip={tip} />}
    </div>
  );
}

/** Plain single-column listing of one side's instructions (Target / Your asm tabs). */
export function AsmList({ rows }: { rows: Seg[][] }) {
  return (
    <InsnTipLayer>
      <div className="overflow-auto px-3 py-2 font-mono text-asm">
        {rows.map((segs, i) => (
          <div key={i} className="flex">
            <span className="w-8 select-none text-right text-content-ghost">{i}</span>
            <span className="whitespace-pre pl-4">
              <Line segs={segs} />
            </span>
          </div>
        ))}
      </div>
    </InsnTipLayer>
  );
}
