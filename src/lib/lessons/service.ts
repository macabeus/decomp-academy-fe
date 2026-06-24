import { createHash } from "node:crypto";
import { compile } from "@/lib/compile";
import { Instruction, diffAsm, DiffResult } from "@/lib/asm";
import { getLesson } from "./registry";
import { LessonSource } from "./types";

// In-memory cache of compiled reference targets, keyed by a hash of the inputs
// that affect codegen. The reference solution is authoritative, so caching it is
// safe until the lesson definition changes.
const targetCache = new Map<string, Instruction[]>();

function targetKey(l: LessonSource): string {
  const h = createHash("sha1");
  h.update(l.solution);
  h.update("\0");
  h.update(l.context || "");
  h.update("\0");
  h.update(l.symbol);
  h.update("\0");
  h.update((l.extraFlags || []).join(" "));
  return h.digest("hex");
}

export interface TargetResult {
  ok: boolean;
  instructions?: Instruction[];
  error?: string;
}

/** Compile (and cache) the authoritative target asm for a lesson. */
export async function getTarget(l: LessonSource): Promise<TargetResult> {
  // Reading-only lessons have no compile exercise.
  if (l.concept) return { ok: true, instructions: [] };

  const key = targetKey(l);
  const cached = targetCache.get(key);
  if (cached) return { ok: true, instructions: cached };

  const res = await compile({
    code: l.solution,
    context: l.context,
    symbol: l.symbol,
    extraFlags: l.extraFlags,
  });
  if (!res.ok || !res.instructions) {
    return {
      ok: false,
      error:
        `The reference solution for this lesson failed to compile: ` +
        (res.diagnostics || "unknown error"),
    };
  }
  targetCache.set(key, res.instructions);
  return { ok: true, instructions: res.instructions };
}

export interface CheckResult {
  ok: boolean;
  /** Compiler diagnostics if the user's code failed to compile. */
  compileError?: string;
  /** Service-level error (bad lesson id, reference broken, etc.). */
  error?: string;
  diff?: DiffResult;
  target?: Instruction[];
  user?: Instruction[];
}

/** Compile the learner's code and diff it against the lesson target. */
export async function checkLesson(
  lessonId: string,
  code: string,
): Promise<CheckResult> {
  const lesson = getLesson(lessonId);
  if (!lesson) return { ok: false, error: "Unknown lesson." };

  const target = await getTarget(lesson);
  if (!target.ok || !target.instructions) {
    return { ok: false, error: target.error };
  }

  const userRes = await compile({
    code,
    context: lesson.context,
    symbol: lesson.symbol,
    extraFlags: lesson.extraFlags,
  });
  if (!userRes.ok || !userRes.instructions) {
    return { ok: false, compileError: userRes.diagnostics, target: target.instructions };
  }

  const diff = diffAsm(target.instructions, userRes.instructions);
  return {
    ok: true,
    diff,
    target: target.instructions,
    user: userRes.instructions,
  };
}
