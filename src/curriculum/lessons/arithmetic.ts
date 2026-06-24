import { LessonSource } from "@/lib/lessons/types";

export const arithmetic: LessonSource[] = [
  {
    id: "arithmetic-mul",
    chapter: "arithmetic",
    order: 1,
    title: "Multiplying Two Registers",
    difficulty: 1,
    concepts: ["arithmetic", "multiply"],
    brief: `
# Multiply low

PowerPC multiplies two registers with **\`mullw rD, rA, rB\`** ("multiply low
word"), keeping the low 32 bits of the product:

\`\`\`asm
mullw r3, r3, r4
blr
\`\`\`

There's no immediate form of \`mullw\`; multiplying by a *variable* always lands
here. Multiplying by a *constant* is a different story — that's the next lesson.

## Your task

Write \`mul2\`, returning \`a * b\`.
`,
    symbol: "mul2",
    starter: `int mul2(int a, int b) {
    return 0;
}
`,
    solution: `int mul2(int a, int b) {
    return a * b;
}
`,
    hints: ["Variable multiply uses `mullw`.", "`a * b` → `mullw r3, r3, r4`."],
  },
  {
    id: "arithmetic-mul-const-pow2",
    chapter: "arithmetic",
    order: 2,
    title: "Multiply by a Power of Two",
    difficulty: 2,
    concepts: ["strength-reduction", "shifts"],
    brief: `
# Strength reduction

Compilers replace expensive operations with cheap equivalent ones — **strength
reduction**. Multiplying by a power of two becomes a left shift, which on
PowerPC is the \`rlwinm\` rotate instruction (MWCC prints it via the \`slwi\`
extended mnemonic):

\`\`\`asm
slwi r3, r3, 3    ; x << 3  == x * 8
blr
\`\`\`

If you wrote \`x * 8\` *or* \`x << 3\` you'd get the same instruction — they're
identical to the compiler. Recognizing that \`* 8\` is "really" a shift is a core
decompiler instinct.

## Your task

Write \`times8\`, returning \`x * 8\`.
`,
    symbol: "times8",
    starter: `int times8(int x) {
    return 0;
}
`,
    solution: `int times8(int x) {
    return x * 8;
}
`,
    hints: [
      "8 is a power of two, so this is a shift, not a multiply.",
      "`x * 8` becomes `slwi r3, r3, 3` (shift left by 3).",
    ],
  },
  {
    id: "arithmetic-mul-const",
    chapter: "arithmetic",
    order: 3,
    title: "Multiply by a Small Constant",
    difficulty: 2,
    concepts: ["strength-reduction", "immediates"],
    brief: `
# \`mulli\` for constant multiplies

A multiply by a non-power-of-two constant uses the **immediate** multiply
\`mulli rD, rA, imm\`:

\`\`\`asm
mulli r3, r3, 12
blr
\`\`\`

(For some constants MWCC will instead synthesize the product from shifts and
adds when that's cheaper — but for many small values it just emits \`mulli\`.)

## Your task

Write \`times12\`, returning \`x * 12\`.
`,
    symbol: "times12",
    starter: `int times12(int x) {
    return 0;
}
`,
    solution: `int times12(int x) {
    return x * 12;
}
`,
    hints: ["Constant multiply can use `mulli`.", "`x * 12` → `mulli r3, r3, 12`."],
  },
  {
    id: "arithmetic-div-pow2-unsigned",
    chapter: "arithmetic",
    order: 4,
    title: "Unsigned Divide by a Power of Two",
    difficulty: 2,
    concepts: ["strength-reduction", "shifts", "unsigned"],
    brief: `
# Dividing unsigned is just a shift

For an **unsigned** value, dividing by a power of two is a logical right shift —
\`srwi\`, again an extended form of \`rlwinm\`:

\`\`\`asm
srwi r3, r3, 2    ; x >> 2 == x / 4 (unsigned)
blr
\`\`\`

No rounding correction is needed because unsigned division truncates toward zero
and the high bits are simply discarded. **Signed** division by a power of two is
much trickier (it needs to round toward zero for negatives) — we'll get there.

## Your task

Write \`udiv4\` taking a \`u32 x\` and returning \`x / 4\`.
`,
    symbol: "udiv4",
    starter: `u32 udiv4(u32 x) {
    return 0;
}
`,
    solution: `u32 udiv4(u32 x) {
    return x / 4;
}
`,
    hints: [
      "Unsigned divide by 4 is a logical right shift by 2.",
      "`x / 4` on a u32 becomes `srwi r3, r3, 2`.",
    ],
  },
  {
    id: "arithmetic-div-var",
    chapter: "arithmetic",
    order: 5,
    title: "Real Division",
    difficulty: 2,
    concepts: ["arithmetic", "divide", "signed"],
    brief: `
# When it really is a divide

Dividing by a *variable* can't be reduced to shifts, so the compiler emits the
hardware **\`divw rD, rA, rB\`** (signed divide word):

\`\`\`asm
divw r3, r3, r4
blr
\`\`\`

Unsigned division by a variable uses \`divwu\` instead. The signed/unsigned choice
is driven entirely by the C types — another reminder that *types decide the
instruction*.

## Your task

Write \`div2\`, returning \`a / b\` for signed \`int\`s.
`,
    symbol: "div2",
    starter: `int div2(int a, int b) {
    return 0;
}
`,
    solution: `int div2(int a, int b) {
    return a / b;
}
`,
    hints: ["Variable signed divide uses `divw`.", "`a / b` → `divw r3, r3, r4`."],
  },
  {
    id: "arithmetic-mod",
    chapter: "arithmetic",
    order: 6,
    title: "Modulo Has No Instruction",
    difficulty: 3,
    concepts: ["arithmetic", "modulo"],
    brief: `
# Remainder = divide, multiply back, subtract

PowerPC has no remainder instruction. \`a % b\` is computed as
\`a - (a / b) * b\`, so you'll see a divide, a multiply, and a subtract working
together:

\`\`\`asm
divw  r5, r3, r4   ; q = a / b
mullw r5, r5, r4   ; q * b
subf  r3, r5, r3   ; a - q*b
blr
\`\`\`

Spotting this divide → \`mullw\` → \`subf\` trio in the wild instantly tells you the
original C was a \`%\` operator.

## Your task

Write \`mod2\`, returning \`a % b\` for signed \`int\`s.
`,
    symbol: "mod2",
    starter: `int mod2(int a, int b) {
    return 0;
}
`,
    solution: `int mod2(int a, int b) {
    return a % b;
}
`,
    hints: [
      "There is no modulo instruction; it's built from divide/multiply/subtract.",
      "Just write `a % b` and let the compiler synthesize the sequence.",
    ],
  },
  {
    id: "arithmetic-abs",
    chapter: "arithmetic",
    order: 7,
    title: "Sum of Three",
    difficulty: 2,
    concepts: ["arithmetic", "register-allocation"],
    brief: `
# Chaining adds (and a scheduling surprise)

\`a + b + c\` needs two \`add\`s — but watch *which* registers MWCC picks. At
\`-O4,p\` it doesn't naïvely accumulate into \`r3\`; it stashes \`a\` in a scratch
register, sums \`b + c\` first, then folds \`a\` back in:

\`\`\`asm
mr   r0, r3        ; save a into scratch r0
add  r3, r4, r5    ; b + c first
add  r3, r0, r3    ; + a
blr
\`\`\`

The result is identical, but the instruction order is the optimizer's, not the
source's. Predicting these small reorderings is exactly what matching trains.

## Your task

Write \`add3\`, returning \`a + b + c\`.
`,
    symbol: "add3",
    starter: `int add3(int a, int b, int c) {
    return 0;
}
`,
    solution: `int add3(int a, int b, int c) {
    return a + b + c;
}
`,
    hints: [
      "Three arguments arrive in r3, r4, r5.",
      "Don't expect literal left-to-right accumulation — the compiler sums b+c first.",
      "Write `a + b + c` and observe the register choices.",
    ],
  },
  {
    id: "arithmetic-affine",
    chapter: "arithmetic",
    order: 8,
    title: "An Affine Expression",
    difficulty: 3,
    concepts: ["arithmetic", "strength-reduction", "instruction-selection"],
    brief: `
# Putting the idioms together

Real code combines these tricks. \`x * 4 + 1\` mixes a strength-reduced multiply
with an immediate add. MWCC may even fuse the shift-and-add cleverly:

\`\`\`asm
slwi r3, r3, 2    ; x * 4
addi r3, r3, 1    ; + 1
blr
\`\`\`

When you read disassembly, mentally collapse \`slwi\`/\`addi\` chains back into the
arithmetic expression that produced them. That reverse-mapping is the whole job.

## Your task

Write \`affine\`, returning \`x * 4 + 1\`.
`,
    symbol: "affine",
    starter: `int affine(int x) {
    return 0;
}
`,
    solution: `int affine(int x) {
    return x * 4 + 1;
}
`,
    hints: [
      "Multiply by 4 is a shift; the + 1 is an immediate add.",
      "Expect `slwi r3, r3, 2` then `addi r3, r3, 1`.",
    ],
  },
];
