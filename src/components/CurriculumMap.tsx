"use client";

import Link from "next/link";
import { useState } from "react";
import {
  IconChevronDown,
  IconCircleCheckFilled,
  IconCircleDashed,
  IconBook2,
} from "@tabler/icons-react";
import { useProgress } from "@/lib/progress";

interface LessonLite {
  id: string;
  title: string;
  order: number;
  difficulty: number;
  concepts: string[];
  concept?: boolean;
}
interface ChapterLite {
  id: string;
  title: string;
  blurb: string;
  order: number;
  lessons: LessonLite[];
}

export function CurriculumMap({ chapters }: { chapters: ChapterLite[] }) {
  const { isSolved, bestPercent } = useProgress();
  const [open, setOpen] = useState<Record<string, boolean>>(
    Object.fromEntries(chapters.map((c, i) => [c.id, i < 2])),
  );

  return (
    <div className="space-y-3">
      {chapters.map((chapter, ci) => {
        const solved = chapter.lessons.filter((l) => isSolved(l.id)).length;
        const done = solved === chapter.lessons.length;
        const isOpen = open[chapter.id];
        return (
          <div
            key={chapter.id}
            className="overflow-hidden rounded-xl border border-line bg-bg-soft/60"
          >
            <button
              onClick={() => setOpen((o) => ({ ...o, [chapter.id]: !o[chapter.id] }))}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-bg-softer/50"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                  done
                    ? "bg-good/15 text-good"
                    : "bg-accent/10 text-accent"
                }`}
              >
                {ci + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 font-semibold text-[#e6ebf2]">
                  {chapter.title}
                  {done && <IconCircleCheckFilled size={16} className="text-good" />}
                </div>
                <div className="text-sm text-[#8b97a6]">{chapter.blurb}</div>
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                <span className="text-xs tabular-nums text-[#8b97a6]">
                  {solved}/{chapter.lessons.length}
                </span>
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-bg-inset">
                  <div
                    className="h-full rounded-full bg-good transition-all"
                    style={{
                      width: `${(solved / chapter.lessons.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <IconChevronDown
                size={18}
                className={`text-[#8b97a6] transition ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen && (
              <div className="animate-fade-in border-t border-line">
                {chapter.lessons.map((l) => {
                  const pct = bestPercent(l.id);
                  const ok = pct >= 100;
                  return (
                    <Link
                      key={l.id}
                      href={`/lesson/${l.id}`}
                      className="group flex items-center gap-3 border-b border-line/50 px-5 py-3 last:border-0 hover:bg-bg-softer/40"
                    >
                      {ok ? (
                        <IconCircleCheckFilled size={18} className="shrink-0 text-good" />
                      ) : l.concept ? (
                        <IconBook2 size={18} className="shrink-0 text-[#5b6675]" />
                      ) : pct > 0 ? (
                        <IconCircleDashed size={18} className="shrink-0 text-warn" />
                      ) : (
                        <IconCircleDashed size={18} className="shrink-0 text-[#3a4757]" />
                      )}
                      <span className="flex-1 text-sm text-[#c4cdd9] group-hover:text-[#e6ebf2]">
                        {l.title}
                      </span>
                      {!l.concept && <Difficulty level={l.difficulty} />}
                      {pct > 0 && !ok && (
                        <span className="text-xs tabular-nums text-warn">{pct}%</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Difficulty({ level }: { level: number }) {
  return (
    <span className="flex items-center gap-0.5" title={`Difficulty ${level}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${
            i <= level ? "bg-accent/80" : "bg-[#2b3441]"
          }`}
        />
      ))}
    </span>
  );
}
