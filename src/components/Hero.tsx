"use client";

import Link from "next/link";
import { IconCpu, IconArrowRight, IconBolt, IconGitMerge } from "@tabler/icons-react";
import { useProgress } from "@/lib/progress";
import { LESSONS } from "@/lib/lessons/registry.client";

export function Hero({ total, firstLessonId }: { total: number; firstLessonId?: string }) {
  const { progress } = useProgress();
  const solvedCount = Object.values(progress.solved).filter((p) => p >= 100).length;
  const pct = total ? Math.round((solvedCount / total) * 100) : 0;

  // Resume at the first unsolved lesson if we have progress.
  const resumeId =
    LESSONS.find((l) => (progress.solved[l.id] ?? 0) < 100)?.id || firstLessonId;

  return (
    <header className="relative overflow-hidden border-b border-line">
      <div className="grid-dots absolute inset-0 opacity-60" />
      <div className="absolute -top-32 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-accent/20 blur-[120px]" />
      <div className="relative mx-auto max-w-5xl px-5 pb-16 pt-20">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-bg-soft/70 px-3 py-1 text-xs text-[#9aa7b6] backdrop-blur">
          <IconCpu size={14} className="text-accent" />
          Metrowerks CodeWarrior GC/2.0 · GameCube PowerPC
        </div>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-[#f4f7fb] sm:text-5xl">
          Decompile assembly back into{" "}
          <span className="bg-gradient-to-r from-accent to-[#9ecbff] bg-clip-text text-transparent">
            byte-matching C.
          </span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#aab4c2]">
          Go from never having read a register to matching real{" "}
          <span className="text-[#d6deea]">Star Fox Adventures</span> functions —
          instruction for instruction. You write C, the{" "}
          <span className="text-[#d6deea]">real compiler</span> grades it live.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={resumeId ? `/lesson/${resumeId}` : "#"}
            className="group inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 font-semibold text-[#0d1117] transition hover:bg-[#9ab0ff]"
          >
            {solvedCount > 0 ? "Resume training" : "Start from zero"}
            <IconArrowRight size={18} className="transition group-hover:translate-x-0.5" />
          </Link>
          <div className="flex items-center gap-5 rounded-lg border border-line bg-bg-soft/60 px-5 py-3 text-sm backdrop-blur">
            <Stat icon={<IconBolt size={16} className="text-warn" />} label="Lessons" value={`${total}`} />
            <div className="h-8 w-px bg-line" />
            <Stat icon={<IconGitMerge size={16} className="text-good" />} label="Solved" value={`${solvedCount}`} />
            <div className="h-8 w-px bg-line" />
            <div className="min-w-[7rem]">
              <div className="mb-1 flex justify-between text-xs text-[#8b97a6]">
                <span>Mastery</span>
                <span>{pct}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-good to-accent transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <div className="font-bold leading-none text-[#e6ebf2]">{value}</div>
        <div className="text-xs text-[#8b97a6]">{label}</div>
      </div>
    </div>
  );
}
