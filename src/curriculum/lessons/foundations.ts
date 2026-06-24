import { LessonSource } from "@/lib/lessons/types";

export const foundations: LessonSource[] = [
  {
    id: "foundations-welcome",
    chapter: "foundations",
    order: 1,
    title: "Your First Match",
    difficulty: 1,
    concepts: ["registers", "return-value", "workflow"],
    brief: `
# Welcome to decompilation

**Decompiling** is the art of recovering the original C source from a compiled
binary. Here you don't guess — you *prove* it. You write C, the real
**Metrowerks CodeWarrior GC/2.0** compiler turns it into PowerPC assembly, and
we compare it, instruction for instruction, against the target. When every
instruction lines up, you have a **100% match**.

## The one rule of PowerPC you need right now

The GameCube's CPU returns a function's result in register **\`r3\`**. A function
that returns an integer constant therefore does just two things:

\`\`\`asm
li   r3, 42      ; load immediate 42 into r3
blr              ; branch to link register = "return"
\`\`\`

\`li\` means *load immediate* and \`blr\` (*branch to link register*) is how every
function returns. You'll see \`blr\` at the end of almost everything.

## Your task

The target on the right is exactly those two instructions. Write the C function
\`answer\` that returns **42**. Hit **Compile & Check** (or ⌘/Ctrl + Enter).
`,
    symbol: "answer",
    starter: `int answer(void) {
    // return the right number
    return 0;
}
`,
    solution: `int answer(void) {
    return 42;
}
`,
    hints: [
      "The function should return the literal value 42.",
      "`return 42;` compiles to `li r3, 42` followed by `blr`.",
    ],
  },
  {
    id: "foundations-identity",
    chapter: "foundations",
    order: 2,
    title: "Arguments Live in Registers Too",
    difficulty: 1,
    concepts: ["registers", "calling-convention"],
    brief: `
# Where do arguments come from?

The GC ABI passes the first integer argument in **\`r3\`** — the *same* register
used for the return value. So a function that just returns its argument has
nothing to do: the value is already sitting in \`r3\`.

\`\`\`asm
blr              ; r3 already holds x — just return
\`\`\`

That single \`blr\` is a perfect, if anticlimactic, match. Later arguments go in
\`r4\`, \`r5\`, \`r6\` … up to \`r10\`.

## Your task

Write \`identity\`, which takes an \`int x\` and returns it unchanged.
`,
    symbol: "identity",
    starter: `int identity(int x) {
    return 0;
}
`,
    solution: `int identity(int x) {
    return x;
}
`,
    hints: [
      "The argument `x` arrives in r3, which is also the return register.",
      "`return x;` needs no work at all — the compiler emits just `blr`.",
    ],
  },
  {
    id: "foundations-add",
    chapter: "foundations",
    order: 3,
    title: "Adding Two Registers",
    difficulty: 1,
    concepts: ["registers", "arithmetic"],
    brief: `
# Reading a three-operand instruction

PowerPC arithmetic is **three-operand**: \`add rD, rA, rB\` computes
\`rD = rA + rB\`. With the first two arguments in \`r3\` and \`r4\`, and the result
expected in \`r3\`:

\`\`\`asm
add  r3, r3, r4
blr
\`\`\`

The destination comes **first**, then the two sources. Keep that order in mind —
it trips up everyone at the start.

## Your task

Write \`add2\`, returning the sum of two \`int\`s.
`,
    symbol: "add2",
    starter: `int add2(int a, int b) {
    return 0;
}
`,
    solution: `int add2(int a, int b) {
    return a + b;
}
`,
    hints: [
      "Two arguments arrive in r3 (a) and r4 (b).",
      "`a + b` becomes `add r3, r3, r4`.",
    ],
  },
  {
    id: "foundations-subtract",
    chapter: "foundations",
    order: 4,
    title: "Subtraction Reverses Its Operands",
    difficulty: 1,
    concepts: ["arithmetic", "operand-order"],
    brief: `
# The quirk of \`subf\`

PowerPC has no plain \`sub\`. To compute \`a - b\` it uses **\`subf\`** — *subtract
from* — which computes \`rD = rB - rA\`. The operands are **reversed**:

\`\`\`asm
subf r3, r4, r3   ; r3 = r3 - r4  =  a - b
blr
\`\`\`

So \`subf r3, r4, r3\` reads as "subtract r4 *from* r3". Once you internalize that
\`subf rD, rA, rB\` is \`rB - rA\`, the disassembly stops looking backwards.

## Your task

Write \`sub2\`, returning \`a - b\`.
`,
    symbol: "sub2",
    starter: `int sub2(int a, int b) {
    return 0;
}
`,
    solution: `int sub2(int a, int b) {
    return a - b;
}
`,
    hints: [
      "`a - b` uses `subf`, the subtract-from instruction.",
      "`subf r3, r4, r3` computes r3 - r4, i.e. a - b.",
    ],
  },
  {
    id: "foundations-immediate",
    chapter: "foundations",
    order: 5,
    title: "Immediates: Math With Constants",
    difficulty: 1,
    concepts: ["arithmetic", "immediates"],
    brief: `
# Folding a constant into the instruction

When you add a small constant, the compiler doesn't load it into a register
first — it uses the **immediate** form \`addi rD, rA, imm\`:

\`\`\`asm
addi r3, r3, 1    ; r3 = r3 + 1
blr
\`\`\`

Immediates are signed 16-bit, so the same \`addi\` handles subtraction of a
constant too (\`x - 5\` → \`addi r3, r3, -5\`). No separate instruction needed.

## Your task

Write \`increment\`, returning \`x + 1\`.
`,
    symbol: "increment",
    starter: `int increment(int x) {
    return 0;
}
`,
    solution: `int increment(int x) {
    return x + 1;
}
`,
    hints: [
      "Adding a constant uses the immediate form `addi`.",
      "`x + 1` compiles to `addi r3, r3, 1`.",
    ],
  },
  {
    id: "foundations-objdump",
    chapter: "foundations",
    order: 6,
    title: "Negation and the Zero Register",
    difficulty: 1,
    concepts: ["arithmetic", "registers"],
    brief: `
# One instruction, no zero needed

To negate a value PowerPC has a dedicated **\`neg rD, rA\`** (\`rD = -rA\`). It does
*not* subtract from a zero register the way some architectures would:

\`\`\`asm
neg  r3, r3
blr
\`\`\`

This is your first taste of a recurring theme: MWCC almost always reaches for the
**single dedicated instruction** when one exists, rather than composing the
operation from smaller pieces. Recognizing those idioms is most of the game.

## Your task

Write \`negate\`, returning \`-x\`.
`,
    symbol: "negate",
    starter: `int negate(int x) {
    return 0;
}
`,
    solution: `int negate(int x) {
    return -x;
}
`,
    hints: [
      "There is a dedicated negate instruction.",
      "`-x` compiles to `neg r3, r3`.",
    ],
  },
];
