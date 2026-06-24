"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  IconChevronDown,
  IconCircleCheckFilled,
  IconCircleDashed,
  IconBook2,
  IconClock,
  IconPlayerPlayFilled,
} from "@tabler/icons-react";
import { useProgress } from "@/lib/progress";
import { ProgressBar } from "@/components/ui";

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

// Four ascending acts turn a flat 306-lesson wall into a journey with a shape.
const TIERS = [
  { id: "I", label: "Warm-up", desc: "Learn to read the machine", min: 1, max: 2 },
  { id: "II", label: "Core idioms", desc: "Every shape C compiles into", min: 3, max: 10 },
  { id: "III", label: "The real ABI", desc: "Frames, globals, the optimizer", min: 11, max: 14 },
  { id: "IV", label: "Proving ground", desc: "Endless reps, then real functions", min: 15, max: 16 },
] as const;

// Rough time-to-complete so a chapter reads as a commitment, not a void.
function estMinutes(l: LessonLite) {
  return l.concept ? 3 : 3 + l.difficulty * 2;
}
function chapterMinutes(c: ChapterLite) {
  return c.lessons.reduce((s, l) => s + estMinutes(l), 0);
}

export function CurriculumMap({ chapters }: { chapters: ChapterLite[] }) {
  const { isSolved, bestPercent } = useProgress();

  // The single lesson the learner should do next: first not-yet-solved, in order.
  const ordered = useMemo(
    () => chapters.flatMap((c) => c.lessons.map((l) => ({ chapterId: c.id, lessonId: l.id }))),
    [chapters],
  );
  const resume = ordered.find((x) => bestPercent(x.lessonId) < 100) ?? ordered[0];

  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      chapters.map((c) => [c.id, c.id === resume?.chapterId || c.order === 1]),
    ),
  );

  return (
    <div className="space-y-8">
      <Legend />
      {TIERS.map((tier) => {
        const tierChapters = chapters.filter((c) => c.order >= tier.min && c.order <= tier.max);
        if (!tierChapters.length) return null;
        const tierLessons = tierChapters.flatMap((c) => c.lessons);
        const tierSolved = tierLessons.filter((l) => isSolved(l.id)).length;
        const tierDone = tierLessons.length > 0 && tierSolved === tierLessons.length;
        return (
          <section key={tier.id}>
            <div className="mb-3 flex items-center gap-3">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-md font-mono text-xs font-bold ${
                  tierDone ? "bg-good/15 text-good" : "bg-accent/10 text-accent"
                }`}
              >
                {tier.id}
              </span>
              <div className="flex-1">
                <div className="text-sm font-semibold uppercase tracking-wide text-content-secondary">
                  {tier.label}
                </div>
                <div className="text-xs text-content-muted">{tier.desc}</div>
              </div>
              <span className="text-xs tabular-nums text-content-muted">
                {tierSolved}/{tierLessons.length}
              </span>
            </div>
            <div className="space-y-3 border-l border-line/60 pl-4">
              {tierChapters.map((chapter, ci) => {
                const globalIdx = chapters.indexOf(chapter);
                const solved = chapter.lessons.filter((l) => isSolved(l.id)).length;
                const done = solved === chapter.lessons.length;
                const isOpen = open[chapter.id];
                const hasResume = chapter.id === resume?.chapterId;
                return (
                  <div
                    key={chapter.id}
                    className={`overflow-hidden rounded-xl transition-colors ${
                      hasResume ? "bg-accent/[0.07]" : "bg-bg-soft/60"
                    }`}
                  >
                    <button
                      onClick={() => setOpen((o) => ({ ...o, [chapter.id]: !o[chapter.id] }))}
                      aria-expanded={isOpen}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-bg-softer/50"
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                          done ? "bg-good/15 text-good" : "bg-accent/10 text-accent"
                        }`}
                      >
                        {done ? <IconCircleCheckFilled size={18} /> : globalIdx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 font-semibold text-content-primary">
                          {chapter.title}
                          {hasResume && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-2xs font-semibold text-accent">
                              <IconPlayerPlayFilled size={9} /> Continue here
                            </span>
                          )}
                        </div>
                        <div className="truncate text-sm text-content-muted">{chapter.blurb}</div>
                      </div>
                      <div className="hidden items-center gap-3 sm:flex">
                        <span className="inline-flex items-center gap-1 text-2xs text-content-faint">
                          <IconClock size={12} /> ~{chapterMinutes(chapter)}m
                        </span>
                        <span className="text-xs tabular-nums text-content-muted">
                          {solved}/{chapter.lessons.length}
                        </span>
                        <ProgressBar
                          pct={(solved / chapter.lessons.length) * 100}
                          className="w-20"
                        />
                      </div>
                      <IconChevronDown
                        size={18}
                        className={`shrink-0 text-content-muted transition duration-200 ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {/* grid-rows trick gives a real animated height collapse. */}
                    <div
                      className={`grid transition-[grid-template-rows] duration-300 ease-out-quint ${
                        isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="border-t border-line">
                          {chapter.lessons.map((l) => {
                            const pct = bestPercent(l.id);
                            const ok = pct >= 100;
                            const isResume = l.id === resume?.lessonId;
                            return (
                              <Link
                                key={l.id}
                                href={`/lesson/${l.id}`}
                                className={`group flex items-center gap-3 border-b border-line/50 px-5 py-3 last:border-0 transition hover:bg-bg-softer/40 ${
                                  isResume ? "bg-accent/[0.06]" : ""
                                }`}
                              >
                                {ok ? (
                                  <IconCircleCheckFilled size={18} className="shrink-0 text-good" />
                                ) : l.concept ? (
                                  <IconBook2 size={18} className="shrink-0 text-content-faint" />
                                ) : pct > 0 ? (
                                  <IconCircleDashed size={18} className="shrink-0 text-warn" />
                                ) : (
                                  <IconCircleDashed size={18} className="shrink-0 text-content-ghost" />
                                )}
                                <span className="flex-1 text-sm text-content transition group-hover:translate-x-0.5 group-hover:text-content-primary">
                                  {l.title}
                                </span>
                                {isResume && (
                                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-2xs font-semibold text-accent">
                                    Resume
                                  </span>
                                )}
                                {l.concept ? (
                                  <span className="text-2xs uppercase tracking-wide text-content-faint">
                                    Concept
                                  </span>
                                ) : (
                                  <Difficulty level={l.difficulty} />
                                )}
                                {pct > 0 && !ok && (
                                  <span className="text-xs tabular-nums text-warn">{pct}%</span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg bg-bg-soft/50 px-4 py-2.5 text-2xs text-content-muted">
      <span className="inline-flex items-center gap-1.5">
        <IconCircleCheckFilled size={14} className="text-good" /> Solved
      </span>
      <span className="inline-flex items-center gap-1.5">
        <IconCircleDashed size={14} className="text-warn" /> Attempted
      </span>
      <span className="inline-flex items-center gap-1.5">
        <IconCircleDashed size={14} className="text-content-ghost" /> Not started
      </span>
      <span className="inline-flex items-center gap-1.5">
        <IconBook2 size={14} className="text-content-faint" /> Concept (reading)
      </span>
      <span className="ml-auto inline-flex items-center gap-1.5">
        <Difficulty level={3} /> Difficulty 1–5
      </span>
    </div>
  );
}

export function Difficulty({ level }: { level: number }) {
  return (
    <span
      className="flex items-center gap-0.5"
      title={`Difficulty ${level}/5`}
      role="img"
      aria-label={`Difficulty ${level} of 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${i <= level ? "bg-accent/80" : "bg-line-strong"}`}
        />
      ))}
    </span>
  );
}
