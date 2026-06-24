import { Instruction } from "../asm";

export interface Chapter {
  id: string;
  title: string;
  /** One-line summary shown on the curriculum map. */
  blurb: string;
  /** Display order. */
  order: number;
}

export interface LessonSource {
  id: string;
  chapter: string;
  order: number;
  title: string;
  /** 1 (intro) .. 5 (master). */
  difficulty: number;
  /** Short concept tags, e.g. ["registers", "arithmetic"]. */
  concepts: string[];
  /** Markdown lesson body shown in the left panel. */
  brief: string;
  /**
   * A reading-only lesson with no compile exercise (concepts, workflow, mindset).
   * For these, symbol/starter/solution may be empty and the editor is hidden.
   */
  concept?: boolean;
  /** Name of the function the learner must reproduce. */
  symbol: string;
  /** Extra preamble injected before the user code at compile time. */
  context?: string;
  /** Code the editor starts with. */
  starter: string;
  /** Authoritative reference C — compiled to produce the target asm. */
  solution: string;
  /** Progressive hints. */
  hints: string[];
  /** MWCC flag overrides appended after the base set (e.g. pragmas/opt). */
  extraFlags?: string[];
}

export interface Lesson extends LessonSource {
  /** Precomputed, normalized target instructions (filled by the generator). */
  target: Instruction[];
}
