"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBulb,
  IconCheck,
  IconPlayerPlayFilled,
  IconRefresh,
  IconLoader2,
  IconAlertTriangle,
  IconEye,
  IconList,
  IconGitCompare,
  IconTerminal2,
  IconConfetti,
  IconBook2,
} from "@tabler/icons-react";
import { AsmDiff, AsmList, Insn, Row } from "./AsmDiff";
import { Difficulty } from "./CurriculumMap";
import { loadCode, recordResult, saveCode } from "@/lib/progress";

const CodeEditor = dynamic(() => import("./CodeEditor").then((m) => m.CodeEditor), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-[#5b6675]">
      <IconLoader2 className="mr-2 animate-spin" size={16} /> Loading editor…
    </div>
  ),
});

export interface LessonDTO {
  id: string;
  title: string;
  chapterId: string;
  chapterTitle: string;
  difficulty: number;
  concepts: string[];
  briefHtml: string;
  concept: boolean;
  symbol: string;
  starter: string;
  solution: string;
  hints: string[];
  prev: { id: string; title: string } | null;
  next: { id: string; title: string } | null;
}

type Status = "idle" | "running" | "match" | "close" | "compileError" | "error";

interface CheckState {
  status: Status;
  matchPercent?: number;
  rows?: Row[];
  message?: string;
}

type Tab = "diff" | "target" | "console";

export function LessonWorkspace({ lesson }: { lesson: LessonDTO }) {
  const [code, setCode] = useState(lesson.starter);
  const [check, setCheck] = useState<CheckState>({ status: "idle" });
  const [target, setTarget] = useState<Insn[] | null>(null);
  const [tab, setTab] = useState<Tab>("target");
  const [hintsShown, setHintsShown] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const codeRef = useRef(code);
  codeRef.current = code;

  // Restore saved code per lesson.
  useEffect(() => {
    const saved = loadCode(lesson.id);
    setCode(saved ?? lesson.starter);
    setCheck({ status: "idle" });
    setTarget(null);
    setHintsShown(0);
    setShowSolution(false);
    setTab("target");
  }, [lesson.id, lesson.starter]);

  // Fetch the authoritative target asm so the learner can see what to match.
  useEffect(() => {
    let active = true;
    fetch(`/api/target?lesson=${lesson.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (active && d.ok) setTarget(d.instructions);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [lesson.id]);

  const run = useCallback(async () => {
    setCheck({ status: "running" });
    saveCode(lesson.id, codeRef.current);
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson: lesson.id, code: codeRef.current }),
      });
      const d = await res.json();
      if (!d.ok) {
        if (d.compileError) {
          setCheck({ status: "compileError", message: d.compileError });
          setTab("console");
        } else {
          setCheck({ status: "error", message: d.error || "Something went wrong." });
          setTab("console");
        }
        return;
      }
      const pct = d.diff.matchPercent as number;
      const exact = d.diff.exact as boolean;
      setCheck({
        status: exact ? "match" : "close",
        matchPercent: pct,
        rows: d.diff.rows,
      });
      setTab("diff");
      recordResult(lesson.id, exact ? 100 : pct);
    } catch {
      setCheck({ status: "error", message: "Network error talking to the compiler." });
      setTab("console");
    }
  }, [lesson.id]);

  const reset = () => {
    setCode(lesson.starter);
    saveCode(lesson.id, lesson.starter);
    setCheck({ status: "idle" });
  };

  if (lesson.concept) return <ConceptView lesson={lesson} />;

  return (
    <div className="flex min-h-screen flex-col bg-bg lg:h-screen">
      <TopBar lesson={lesson} />
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,440px)_1fr]">
        {/* Brief column */}
        <aside className="flex min-h-0 flex-col border-r border-line bg-bg-soft/40">
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
            <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
              {lesson.chapterTitle}
            </span>
            <Difficulty level={lesson.difficulty} />
            <div className="ml-auto flex gap-1.5">
              {lesson.concepts.slice(0, 3).map((c) => (
                <span
                  key={c}
                  className="rounded bg-bg-softer px-1.5 py-0.5 text-[10px] text-[#8b97a6]"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div className="flex-1 px-5 py-5 lg:min-h-0 lg:overflow-y-auto">
            <div
              className="prose-lesson"
              dangerouslySetInnerHTML={{ __html: lesson.briefHtml }}
            />
            <Hints
              hints={lesson.hints}
              shown={hintsShown}
              onReveal={() => setHintsShown((n) => n + 1)}
            />
            <SolutionBox
              solution={lesson.solution}
              symbol={lesson.symbol}
              shown={showSolution}
              onToggle={() => setShowSolution((s) => !s)}
              onUse={() => {
                setCode(lesson.solution);
                saveCode(lesson.id, lesson.solution);
              }}
            />
          </div>
        </aside>

        {/* Editor + console column */}
        <section className="flex min-h-[70vh] flex-col lg:min-h-0">
          <div className="flex items-center gap-2 border-b border-line bg-bg-soft/60 px-4 py-2">
            <span className="font-mono text-xs text-[#7c8a9a]">
              match <span className="text-accent">{lesson.symbol}</span>
            </span>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs text-[#aab4c2] transition hover:bg-bg-softer"
              >
                <IconRefresh size={14} /> Reset
              </button>
              <button
                onClick={run}
                disabled={check.status === "running"}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3.5 py-1.5 text-xs font-semibold text-[#0d1117] transition hover:bg-[#9ab0ff] disabled:opacity-60"
              >
                {check.status === "running" ? (
                  <IconLoader2 size={14} className="animate-spin" />
                ) : (
                  <IconPlayerPlayFilled size={13} />
                )}
                Compile &amp; Check
                <kbd className="ml-1 rounded bg-black/20 px-1 text-[10px]">⌘↵</kbd>
              </button>
            </div>
          </div>

          <div className="min-h-[340px] flex-[1.2] border-b border-line lg:min-h-0">
            <CodeEditor value={code} onChange={setCode} onRun={run} />
          </div>

          <ResultPanel
            tab={tab}
            setTab={setTab}
            check={check}
            target={target}
          />
        </section>
      </div>
    </div>
  );
}

function ConceptView({ lesson }: { lesson: LessonDTO }) {
  return (
    <div className="flex h-screen flex-col bg-bg">
      <TopBar lesson={lesson} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-14">
          <div className="mb-6 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
              <IconBook2 size={14} /> {lesson.chapterTitle}
            </span>
            <span className="text-xs text-[#8b97a6]">Concept · no code to write</span>
          </div>
          <article
            className="prose-lesson rounded-2xl border border-line bg-bg-soft/40 px-6 py-7 sm:px-9 sm:py-9"
            dangerouslySetInnerHTML={{ __html: lesson.briefHtml }}
          />
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
            <span className="text-sm text-[#8b97a6]">Got it? Lock it in and move on.</span>
            {lesson.next ? (
              <Link
                href={`/lesson/${lesson.next.id}`}
                onClick={() => recordResult(lesson.id, 100)}
                className="group inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-semibold text-[#0d1117] transition hover:bg-[#9ab0ff]"
              >
                <IconCheck size={17} /> Mark read &amp; continue
                <IconArrowRight size={16} className="transition group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <Link
                href="/"
                onClick={() => recordResult(lesson.id, 100)}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-semibold text-[#0d1117] transition hover:bg-[#9ab0ff]"
              >
                <IconCheck size={17} /> Finish
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TopBar({ lesson }: { lesson: LessonDTO }) {
  return (
    <header className="flex items-center gap-3 border-b border-line bg-bg-soft px-4 py-2.5">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-[#aab4c2] transition hover:bg-bg-softer hover:text-[#e6ebf2]"
      >
        <IconArrowLeft size={16} /> Curriculum
      </Link>
      <div className="mx-1 h-5 w-px bg-line" />
      <h1 className="truncate text-sm font-semibold text-[#e6ebf2]">{lesson.title}</h1>
      <div className="ml-auto flex items-center gap-1.5">
        {lesson.prev ? (
          <Link
            href={`/lesson/${lesson.prev.id}`}
            className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-xs text-[#aab4c2] transition hover:bg-bg-softer"
            title={lesson.prev.title}
          >
            <IconArrowLeft size={14} /> Prev
          </Link>
        ) : null}
        {lesson.next ? (
          <Link
            href={`/lesson/${lesson.next.id}`}
            className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-xs text-[#aab4c2] transition hover:bg-bg-softer"
            title={lesson.next.title}
          >
            Next <IconArrowRight size={14} />
          </Link>
        ) : null}
      </div>
    </header>
  );
}

function Hints({
  hints,
  shown,
  onReveal,
}: {
  hints: string[];
  shown: number;
  onReveal: () => void;
}) {
  if (!hints.length) return null;
  return (
    <div className="mt-6 border-t border-line pt-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7c8a9a]">
        <IconBulb size={14} className="text-warn" /> Hints
      </div>
      <div className="space-y-2">
        {hints.slice(0, shown).map((h, i) => (
          <div
            key={i}
            className="animate-fade-in rounded-lg border border-line bg-bg-softer/50 px-3 py-2 text-sm text-[#b3bdca]"
          >
            <span className="mr-1.5 font-semibold text-warn">{i + 1}.</span>
            {h}
          </div>
        ))}
      </div>
      {shown < hints.length && (
        <button
          onClick={onReveal}
          className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-dashed border-line px-3 py-1.5 text-xs text-[#8b97a6] transition hover:border-warn/40 hover:text-warn"
        >
          <IconBulb size={13} /> Reveal hint {shown + 1} of {hints.length}
        </button>
      )}
    </div>
  );
}

function SolutionBox({
  solution,
  symbol,
  shown,
  onToggle,
  onUse,
}: {
  solution: string;
  symbol: string;
  shown: boolean;
  onToggle: () => void;
  onUse: () => void;
}) {
  void symbol;
  return (
    <div className="mt-4">
      <button
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-line px-3 py-1.5 text-xs text-[#8b97a6] transition hover:text-[#c4cdd9]"
      >
        <IconEye size={13} /> {shown ? "Hide" : "Show"} reference solution
      </button>
      {shown && (
        <div className="animate-fade-in mt-2">
          <pre className="overflow-x-auto rounded-lg border border-line bg-bg-inset px-3 py-2.5 font-mono text-xs leading-relaxed text-[#c9d1d9]">
            {solution.trim()}
          </pre>
          <button
            onClick={onUse}
            className="mt-2 text-xs text-accent hover:underline"
          >
            Load into editor →
          </button>
        </div>
      )}
    </div>
  );
}

function ResultPanel({
  tab,
  setTab,
  check,
  target,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  check: CheckState;
  target: Insn[] | null;
}) {
  const isErr = check.status === "compileError" || check.status === "error";
  return (
    <div className="flex min-h-[260px] flex-[1] flex-col bg-bg-inset/60 lg:min-h-0">
      <div className="flex items-center gap-1 border-b border-line bg-bg-soft/50 px-2">
        <TabButton active={tab === "diff"} onClick={() => setTab("diff")} icon={<IconGitCompare size={14} />}>
          Diff
        </TabButton>
        <TabButton active={tab === "target"} onClick={() => setTab("target")} icon={<IconList size={14} />}>
          Target asm
        </TabButton>
        <TabButton active={tab === "console"} onClick={() => setTab("console")} icon={<IconTerminal2 size={14} />}>
          Output
        </TabButton>
        <div className="ml-auto pr-2">
          <StatusBadge check={check} />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {tab === "diff" &&
          (check.rows ? (
            check.status === "match" ? (
              <MatchBanner percent={100} rows={check.rows} />
            ) : (
              <AsmDiff rows={check.rows} />
            )
          ) : (
            <Empty>Hit “Compile &amp; Check” to diff your code against the target.</Empty>
          ))}
        {tab === "target" &&
          (target ? (
            <AsmList rows={target} />
          ) : (
            <Empty>Loading target disassembly…</Empty>
          ))}
        {tab === "console" && (
          <pre
            className={`whitespace-pre-wrap px-4 py-3 font-mono text-xs leading-relaxed ${
              isErr ? "text-[#d6938c]" : "text-[#8b97a6]"
            }`}
          >
            {check.message ||
              (check.status === "match"
                ? "Compiled cleanly — perfect match."
                : "No compiler output yet.")}
          </pre>
        )}
      </div>
    </div>
  );
}

function MatchBanner({ percent, rows }: { percent: number; rows: Row[] }) {
  void rows;
  return (
    <div className="animate-fade-in flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="animate-pulse-good flex h-14 w-14 items-center justify-center rounded-full bg-good/15">
        <IconConfetti size={28} className="text-good" />
      </div>
      <div className="text-lg font-bold text-good">Perfect match — {percent}%</div>
      <p className="max-w-sm text-sm text-[#8b97a6]">
        Every instruction lines up with the compiler's output. This is exactly
        how a real decomp function gets checked in. Move on to the next lesson.
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition ${
        active
          ? "border-accent text-[#e6ebf2]"
          : "border-transparent text-[#7c8a9a] hover:text-[#b3bdca]"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function StatusBadge({ check }: { check: CheckState }) {
  if (check.status === "match")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-good/15 px-2.5 py-1 text-xs font-semibold text-good">
        <IconCheck size={13} /> 100% match
      </span>
    );
  if (check.status === "close" && check.matchPercent !== undefined)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-warn/15 px-2.5 py-1 text-xs font-semibold text-warn">
        {check.matchPercent}% — keep going
      </span>
    );
  if (check.status === "compileError")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-bad/15 px-2.5 py-1 text-xs font-semibold text-bad">
        <IconAlertTriangle size={13} /> compile error
      </span>
    );
  if (check.status === "error")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-bad/15 px-2.5 py-1 text-xs font-semibold text-bad">
        <IconAlertTriangle size={13} /> error
      </span>
    );
  return null;
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center text-sm text-[#5b6675]">
      {children}
    </div>
  );
}
