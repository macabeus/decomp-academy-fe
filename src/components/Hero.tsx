"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  IconArrowRight,
  IconBolt,
  IconGitMerge,
  IconCheck,
  IconBrandGithub,
} from "@tabler/icons-react";
import { useProgress } from "@/lib/progress";
import { LESSONS } from "@/lib/lessons/registry.client";
import { ProgressBar } from "@/components/ui";

export function Hero({ total, firstLessonId }: { total: number; firstLessonId?: string }) {
  const { progress } = useProgress();
  const solvedCount = Object.values(progress.solved).filter((p) => p >= 100).length;
  const pct = total ? Math.round((solvedCount / total) * 100) : 0;

  // Resume at the first unsolved lesson if we have progress.
  const resumeId =
    LESSONS.find((l) => (progress.solved[l.id] ?? 0) < 100)?.id || firstLessonId;

  return (
    <header className="relative overflow-hidden border-b border-line">
      <AsmRain />
      <div className="grid-dots absolute inset-0 opacity-40" />
      {/* Periwinkle + GameCube-indigo glows for a richer, less-flat backdrop. */}
      <div className="absolute -top-32 left-1/3 h-72 w-[34rem] -translate-x-1/2 rounded-full bg-accent/20 blur-[120px]" />
      <div className="absolute -top-24 right-0 h-64 w-[28rem] rounded-full bg-[#4f3d8c]/25 blur-[130px]" />
      <div className="relative mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 px-5 pb-16 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pt-20">
        <div>
          <h1 className="max-w-xl text-2xl font-bold leading-snug tracking-tight text-content-bright sm:text-3xl">
            Decompile assembly back into{" "}
            <span className="bg-gradient-to-r from-accent to-accent-grad bg-clip-text font-mono text-transparent">
              byte-matching C.
            </span>
          </h1>
          <p className="mt-4 max-w-xl leading-relaxed text-content-secondary">
            Go from never having read a register to matching real{" "}
            <span className="text-content">Star Fox Adventures</span> functions —
            instruction for instruction. You write C, the{" "}
            <span className="text-content">real 2001 compiler</span> grades it live.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={resumeId ? `/lesson/${resumeId}` : "#"}
              className="group inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 font-semibold text-accent-on shadow-lg shadow-accent/20 transition hover:-translate-y-px hover:bg-accent-hover active:translate-y-0 active:scale-[0.98]"
            >
              {solvedCount > 0 ? "Resume training" : "Start from zero"}
              <IconArrowRight size={18} className="transition group-hover:translate-x-0.5" />
            </Link>
            <div className="flex items-center gap-5 rounded-lg bg-bg-soft/70 px-5 py-3 text-sm backdrop-blur">
              <Stat icon={<IconBolt size={16} className="text-warn" />} label="Lessons" value={`${total}`} />
              <div className="h-8 w-px bg-line" />
              <Stat icon={<IconGitMerge size={16} className="text-good" />} label="Solved" value={`${solvedCount}`} />
              <div className="h-8 w-px bg-line" />
              <div className="min-w-[7rem]">
                <div className="mb-1 flex justify-between text-xs text-content-muted">
                  <span>Mastery</span>
                  <span>{pct}%</span>
                </div>
                <ProgressBar
                  pct={pct}
                  barClassName="bg-gradient-to-r from-good to-accent"
                  className="w-full bg-line/70"
                />
              </div>
            </div>
          </div>

          {/* Trust strip — pull the real credibility out of the footer. */}
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-content-faint">
            <span className="inline-flex items-center gap-1.5">
              <IconCheck size={13} className="text-good" /> Graded by the real
              <span className="font-mono text-content-muted">mwcceppc.exe</span>
            </span>
            <a
              href="https://decomp.dev/zcanann/SFA-Decomp"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 transition hover:text-content-muted"
            >
              <IconBrandGithub size={13} /> Functions from the live SFA-Decomp project
            </a>
          </div>
        </div>

        <MatchPreview />
      </div>
    </header>
  );
}

// Faint real PowerPC disassembly washing the backdrop — the clearest possible
// signal that this site is about reading machine code, not generic dark SaaS.
const RAIN_ASM = `stwu     r1, -0x20(r1)
mflr     r0
stw      r0, 0x24(r1)
stw      r31, 0x1c(r1)
mr       r31, r3
lwz      r3, 0x8(r31)
lfs      f1, 0x40(r3)
lfs      f0, 0x44(r3)
fmuls    f1, f1, f1
fmadds   f1, f0, f0, f1
frsqrte  f0, f1
fmuls    f2, f0, f0
fnmsubs  f2, f2, f1, f13
fmadds   f0, f0, f2, f0
cmplwi   r4, 0
beq-     .L_0x4c
rlwinm   r0, r5, 2, 0, 29
lwzx     r6, r3, r0
add      r6, r6, r0
stwx     r6, r3, r0
bl       Vec_Normalize
li       r3, 1
lwz      r0, 0x24(r1)
mtlr     r0
blr`;

function AsmRain() {
  return (
    <div
      aria-hidden="true"
      className="asm-rain pointer-events-none absolute inset-0 select-none overflow-hidden"
      style={{
        maskImage: "radial-gradient(130% 120% at 80% -10%, #000 25%, transparent 70%)",
        WebkitMaskImage: "radial-gradient(130% 120% at 80% -10%, #000 25%, transparent 70%)",
      }}
    >
      <pre className="absolute right-2 top-4 hidden text-[11px] leading-[1.45] text-white/[0.06] md:block">
        {RAIN_ASM}
        {"\n"}
        {RAIN_ASM}
      </pre>
      <pre className="absolute left-2 top-32 hidden text-[11px] leading-[1.45] text-white/[0.04] lg:block">
        {RAIN_ASM}
      </pre>
    </div>
  );
}

// A self-contained mock of the core loop: target asm vs. your output, animating
// from "almost" to a clean byte-match. This is the product in one glance.
function MatchPreview() {
  const [matched, setMatched] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; // show the resolved end-state statically
    setMatched(false);
    const t = setTimeout(() => setMatched(true), 1400);
    return () => clearTimeout(t);
  }, []);

  // [target, your-output, matchesWhenResolved]
  const rows: [string, string, boolean][] = [
    ["lwz       r0, 0x0(r3)", "lwz       r0, 0x0(r3)", true],
    ["lfs       f1, 0x4(r3)", "lfs       f1, 0x4(r3)", true],
    ["fmuls     f0, f0, f1", "fmadds    f0, f0, f1, f2", false],
    ["fadds     f0, f0, f2", "fadds     f0, f0, f2", false],
    ["stfs      f0, 0x0(r4)", "stfs      f0, 0x0(r4)", true],
    ["blr", "blr", true],
  ];

  return (
    <div className="animate-slide-up-fade overflow-hidden rounded-xl bg-bg-inset/90 shadow-2xl shadow-black/50 ring-1 ring-white/5 backdrop-blur lg:translate-y-0">
      <div className="flex items-center gap-2 border-b border-line bg-bg-soft/80 px-3.5 py-2">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-bad/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-good/70" />
        </span>
        <span className="ml-1 font-mono text-2xs text-content-muted">match Vec_Normalize</span>
        <span
          className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold transition-colors duration-500 ${
            matched ? "bg-good/15 text-good" : "bg-warn/15 text-warn"
          }`}
        >
          {matched ? (
            <>
              <IconCheck size={11} /> 100% byte-match
            </>
          ) : (
            <>87.5% — 2 instrs left</>
          )}
        </span>
      </div>
      <div className="grid grid-cols-2 font-mono text-[11px] leading-none">
        <div className="border-r border-line/60 px-3 py-1.5 text-2xs uppercase tracking-wider text-content-faint">
          Target
        </div>
        <div className="px-3 py-1.5 text-2xs uppercase tracking-wider text-content-faint">
          Your output
        </div>
        {rows.map(([t, y, ok], i) => {
          const isMatch = ok || matched;
          return (
            <div key={i} className="contents">
              <div
                className={`border-t border-line/40 px-3 py-1.5 transition-colors duration-500 ${
                  isMatch ? "" : "bg-warn/[0.07]"
                } text-content-secondary`}
              >
                {t}
              </div>
              <div
                className={`border-t border-line/40 px-3 py-1.5 transition-colors duration-500 ${
                  isMatch ? "text-good" : "bg-bad/10 text-bad"
                }`}
              >
                {matched ? t : y}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <div className="font-bold leading-none text-content-primary">{value}</div>
        <div className="text-xs text-content-muted">{label}</div>
      </div>
    </div>
  );
}
