import { compileToObject, preloadAgbcc } from "agbcc";
import type { AsmDialect } from "@/lib/asm";
import type { GraderKind } from "./types";

/** The normalized result of compiling a learner's (or reference) C source. Both
 *  graders return this shape so the workspace stays grader-agnostic. */
export interface CompileResult {
  ok: boolean;
  /** base64 of the produced object file, present when `ok`. */
  objBase64?: string;
  /** Compiler diagnostics (the source didn't compile). */
  compileError?: string;
  /** Infrastructure failure (couldn't reach/load the compiler). */
  error?: string;
}

export interface CompileArgs {
  course: string;
  lesson: string;
  code: string;
  /** Compile preamble injected before the learner's code (no #include). */
  context?: string;
}

export interface TargetArgs {
  course: string;
  lesson: string;
  /** Reference C the target object is built from (in-browser graders). */
  solution: string;
  context?: string;
}

/** Everything that differs between platforms, gathered in one place so the React
 *  workspace never branches on the grader kind itself. */
export interface GraderProfile {
  /** Instruction set the diff/glossary should render. */
  dialect: AsmDialect;
  /** Compiler + flags shown in the workspace header. */
  compilerLabel: string;
  /** Warm up heavy assets (the WASM compiler) ahead of the first compile. */
  preload(): void;
  /** Compile the learner's code. */
  compile(args: CompileArgs): Promise<CompileResult>;
  /** Load the target object (base64) the learner must match, or null on failure. */
  loadTarget(args: TargetArgs): Promise<string | null>;
}

/** base64-encode raw object bytes for objdiff (which takes base64 strings). */
function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

const remote: GraderProfile = {
  dialect: "ppc",
  compilerLabel: "mwcceppc.exe -O4,p",
  preload() {},
  async compile({ course, lesson, code }) {
    return fetch("/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course, lesson, code }),
    }).then((r) => r.json());
  },
  loadTarget({ course, lesson }) {
    return fetch(`/api/target?course=${course}&lesson=${lesson}`)
      .then((r) => r.json())
      .then((d) => (d?.ok && d.objBase64 ? (d.objBase64 as string) : null))
      .catch(() => null);
  },
};

const wasmAgbcc: GraderProfile = {
  dialect: "arm:thumb",
  compilerLabel: "agbcc -O2",
  preload() {
    preloadAgbcc();
  },
  async compile({ code, context }) {
    try {
      const r = await compileToObject(code, { context });
      if (!r.ok) return { ok: false, compileError: r.stderr };
      return { ok: true, objBase64: bytesToBase64(r.obj) };
    } catch (e) {
      console.error("in-browser agbcc failed", e);
      return { ok: false, error: "Couldn't load the in-browser compiler." };
    }
  },
  loadTarget({ solution, context }) {
    // The target is the reference solution compiled with the same in-browser
    // compiler, so target and learner objects are consistent by construction.
    return compileToObject(solution, { context })
      .then((r) => (r.ok ? bytesToBase64(r.obj) : null))
      .catch(() => null);
  },
};

export const GRADERS: Record<GraderKind, GraderProfile> = {
  remote,
  "wasm-agbcc": wasmAgbcc,
};
