import { LessonSource } from "@/lib/lessons/types";

export const workflow: LessonSource[] = [
  {
    id: "workflow-what-matching-means",
    chapter: "workflow",
    order: 1,
    title: "What \"Matching\" Really Means",
    difficulty: 1,
    concepts: ["matching", "workflow", "philosophy"],
    concept: true,
    brief: `
# What "matching" really means

Decompiling isn't translation — it's **reconstruction under proof**. The retail
game shipped as PowerPC machine code. Your job is to write C that, when fed to
the *exact* compiler the original developers used (Metrowerks CodeWarrior
**GC/2.0**), produces **byte-identical** machine code. Not similar. Identical.

That's a much stronger claim than "behaves the same." Two functions can compute
the same answer with completely different instructions. A match means your C and
the original C compiled to the **same bytes** — which is the closest thing to a
proof that you recovered what the developers actually wrote.

## The compiler is the authority

There is no opinion here. You don't argue about whether \`x * 4\` "should" become
a shift — you compile it and look. If MWCC emits \`slwi r3,r3,2\` and the target
is \`slwi r3,r3,2\`, that line matches. If it doesn't, *your C is wrong*, no matter
how clean it reads. The compiler is the ground truth, every single time.

## Match % is a real number, not a vibe

In the SFA project, the truth of how well a function matches is one field:

\`\`\`text
report.json  ->  fuzzy_match_percent
\`\`\`

That percentage is computed by comparing your compiled object against the retail
object, instruction by instruction. Diff tools (you'll meet them soon) help you
*locate* where you diverge, but they don't certify the score — \`report.json\`
does. When someone says "that function is at 100%," they mean
\`fuzzy_match_percent == 100\` in the report.

## 100% vs. the value of a clean near-match

The goal is **100%**: every byte accounted for. But a function sitting at 95% or
98% is not a failure — it's a near-match, and near-matches are *informative*. The
remaining few percent are a concentrated clue about one wrong type, one wrong
idiom, or one mis-modeled struct. A clean 95% that reads like plausible C is
often a better starting point than a contorted 100% nobody can maintain.

You'll spend most of your time in that last stretch — from "close" to "exact" —
and learning to read what the gap is *telling you* is the real skill this chapter
teaches.
`,
    symbol: "",
    starter: "",
    solution: "",
    hints: [],
  },
  {
    id: "workflow-reading-objdump",
    chapter: "workflow",
    order: 2,
    title: "Reading objdump",
    difficulty: 1,
    concepts: ["objdump", "disassembly", "relocations"],
    concept: true,
    brief: `
# Reading objdump

Before you can match an asm function you have to *read* it. The target asm comes
from disassembling an object file with GNU objdump, with Gekko (the GameCube CPU)
extensions enabled:

\`\`\`text
powerpc-eabi-objdump -M gekko -drz  some.o
\`\`\`

The flags matter: \`-d\` disassembles, \`-r\` shows **relocations** inline, \`-z\` keeps
zero-bytes from being collapsed, and \`-M gekko\` makes objdump decode the
GameCube's paired-single instructions correctly instead of mistaking them for
something else.

## Anatomy of a line

Here is a real function that adds 1 to a register and returns:

\`\`\`asm
<increment>:
   0:	38 63 00 01 	addi    r3,r3,1
   4:	4e 80 00 20 	blr
\`\`\`

Each instruction line has four parts:

| Column        | Example       | Meaning                                   |
|---------------|---------------|-------------------------------------------|
| **Address**   | \`0:\`          | byte offset of this instruction in the fn |
| **Raw bytes** | \`38 63 00 01\` | the 4-byte encoded instruction            |
| **Mnemonic**  | \`addi\`        | the operation                             |
| **Operands**  | \`r3,r3,1\`     | destination first, then sources           |

Every PowerPC instruction is exactly 4 bytes, so addresses climb by 4.

## Symbol annotations: \`<sym+0x..>\`

When an instruction refers to a known address, objdump annotates it with the
nearest symbol and an offset. A local branch looks like this:

\`\`\`asm
  10:	40 80 00 08 	bge-    18 <si+0x18>
\`\`\`

\`<si+0x18>\` just means "address 0x18, which is 0x18 bytes into the function
\`si\`." It's a human label for the branch target — don't read it as data.

## Relocation lines

Calls to *other* functions and reads of *global* data can't be resolved until
link time, so the compiler emits a placeholder instruction plus a **relocation**
telling the linker what to patch in. objdump prints relocations on their own
indented line, right under the instruction they fix up:

\`\`\`asm
   c:	48 00 00 01 	bl      c <f+0xc>
			c: R_PPC_REL24	g
\`\`\`

\`\`\`asm
   0:	80 60 00 00 	lwz     r3,0(0)
			0: R_PPC_EMB_SDA21	gv
\`\`\`

Two relocation types you'll see constantly:

- **\`R_PPC_REL24\`** — a relative call. The \`bl\` above will branch to the function
  \`g\` once linked; right now its offset field is a stand-in \`0x000001\`.
- **\`R_PPC_EMB_SDA21\`** — a *small data area* access. Frequently-used globals live
  in a region pointed to by a base register, so \`lwz r3,0(0)\` + an \`SDA21\` reloc
  for \`gv\` is just "load the global \`gv\`."

The placeholder bytes (the \`0\`s in the offset) are *expected* — when you match,
your relocations must name the same symbols, but you don't hand-encode offsets.
Read the reloc line as "this instruction touches *that* symbol."
`,
    symbol: "",
    starter: "",
    solution: "",
    hints: [],
  },
  {
    id: "workflow-iterate-loop",
    chapter: "workflow",
    order: 3,
    title: "The Iterate Loop",
    difficulty: 1,
    concepts: ["workflow", "objdiff", "tooling"],
    concept: true,
    brief: `
# The iterate loop

Matching a function is a tight cycle you'll run dozens of times an hour. It looks
like this:

1. **Pick a function.** Usually one that's at 0% or a low partial match.
2. **Read the target asm.** Pull the retail disassembly and understand what the
   function *does* — the loads, the arithmetic, the calls, the control flow.
3. **Write plausible C.** Your best guess at the original source (more on the
   "plausible 2002 C" mindset later).
4. **Rebuild one .o.** Compile *just* your unit, not the whole game. Fast loops
   win.
5. **Diff.** Compare your object against the retail object.
6. **Find the FIRST diverging instruction.** Not all of them — the first one.
   Everything after the first divergence is often just downstream noise.
7. **Hypothesize and repeat.** Form one theory about *why* that instruction is
   wrong ("wrong signedness," "wrong struct field," "declaration order"), change
   the C, and go back to step 4.

The discipline that separates fast matchers from slow ones is step 6: **fix the
first divergence, then re-diff.** Chasing the tenth difference when the first one
is shifting everything below it is wasted effort.

## The tools that drive the loop

- **objdiff** — the interactive diff viewer. You point it at the project; it
  watches your source files and **rebuilds automatically** when you save, showing
  your asm next to the target side by side with mismatches highlighted. This is
  where you live while matching.
- **\`function_objdump.py <unit> <symbol>\`** — prints the full target asm for one
  function straight from the retail object. Your starting point: "what am I trying
  to reproduce?"
- **\`ndiff.py <unit> <symbol>\`** — a *normalized* instruction diff between the
  target object and your built object. It masks out branch-target addresses and
  label noise so you only see real codegen differences, and it groups them into
  regions. It locates divergence; it does **not** prescribe the fix — that's your
  job.

## Build one unit, not the world

A typical inner loop in SFA rebuilds a single object and refreshes the report:

\`\`\`text
rm   build/GSAE01/src/main/<path>.o
ninja build/GSAE01/src/main/<path>.o
ninja build/GSAE01/report.json
\`\`\`

Then read \`fuzzy_match_percent\`, or just watch objdiff update. Tight loop, real
feedback, repeat.
`,
    symbol: "",
    starter: "",
    solution: "",
    hints: [],
  },
  {
    id: "workflow-first-guided-match",
    chapter: "workflow",
    order: 4,
    title: "Your First Guided Match",
    difficulty: 1,
    concepts: ["workflow", "arithmetic", "idioms"],
    brief: `
# Your first guided match

Let's run the loop for real on a tiny function. Here's the target asm:

\`\`\`asm
<scale>:
   0:	54 63 10 3a 	slwi    r3,r3,2
   4:	4e 80 00 20 	blr
\`\`\`

## Reasoning it out, the way a decomper would

**Read the asm.** Two instructions. \`slwi r3,r3,2\` is *shift left word
immediate* — it shifts \`r3\` left by 2 bits. Then \`blr\` returns. One argument
arrives in \`r3\`, and the result leaves in \`r3\`.

**What does shifting left by 2 do?** Shifting an integer left by 2 bits multiplies
it by 4 (each left shift doubles). So this function takes its argument and
returns it times 4.

**Now the key move — write plausible C, not asm.** A 2002 developer would *not*
write \`x << 2\` to mean "times four"; they'd write what they meant:

\`\`\`c
return x * 4;
\`\`\`

Won't that emit a multiply? No — and this is the whole point of letting the
compiler be the authority. MWCC knows that multiplying by a power of two is a
shift, so \`x * 4\` compiles to exactly \`slwi r3,r3,2\`. The clean, readable C
*is* the matching C. You don't have to obfuscate to match; you have to write what
the original author wrote and trust the compiler to lower it.

**Compile and diff.** If your two instructions are \`slwi r3,r3,2\` then \`blr\`,
you're at 100%. If not, the first diverging line tells you what to reconsider.

## Your task

Write \`scale\`, which takes an \`int x\` and returns \`x\` multiplied by 4. Write the
*meaning* (\`x * 4\`), compile, and confirm it lowers to \`slwi\`.
`,
    symbol: "scale",
    starter: `int scale(int x) {
    // return x times four -- write the meaning, let MWCC pick the idiom
    return 0;
}
`,
    solution: `int scale(int x) {
    return x * 4;
}
`,
    hints: [
      "`slwi r3,r3,2` shifts left by 2 bits, which multiplies by 4.",
      "Write the intent — `x * 4` — not the shift. MWCC turns multiply-by-power-of-two into `slwi`.",
    ],
  },
  {
    id: "workflow-diagnosing-near-match",
    chapter: "workflow",
    order: 5,
    title: "Diagnosing a Near-Match",
    difficulty: 2,
    concepts: ["near-match", "diagnosis", "diff"],
    concept: true,
    brief: `
# Diagnosing a near-match

You're at 95%. The function is *almost* right, and the diff shows one or two
stubborn instructions. This is the most valuable moment in decompiling, because a
near-match is a **diagnostic**: the shape of the gap names the bug. Here's how to
read the common ones.

## Symptom → likely cause

| What you see in the diff                         | Likely cause                                                   |
|--------------------------------------------------|----------------------------------------------------------------|
| A stray **\`extsb\`** (or \`extsh\`) you don't want   | Used \`char\`/\`short\` where the value is unsigned — try \`u8\`/\`u16\` |
| **\`cmpw\`** where target has **\`cmplw\`** (or \`cmpwi\`/\`cmplwi\`) | Wrong signedness on the compared value — flip signed/unsigned |
| **Swapped registers** (right ops, wrong homes)   | Local **declaration order** differs — reorder your decls       |
| One **extra or missing** instruction             | Wrong idiom — e.g. \`& 0xff7f\` vs \`& ~0x80\`, or a manual mask vs a bitfield |
| Same instructions, **reordered**                 | Instruction **scheduling** — a decl/expression order or pragma issue |
| Wrong **offset** in a load/store (\`8(r3)\` vs \`c(r3)\`) | Wrong struct layout — a field is the wrong size or missing     |

## Signedness shows up as a *single opcode*

This is the cleanest near-match there is. Compare two unsigned values that feed a
branch and you get \`cmplw\`; compare them as signed \`int\` and you get \`cmpw\`:

\`\`\`asm
; target (unsigned)        ; your build (int)
cmplw   r3,r4              cmpw    r3,r4
\`\`\`

Identical everywhere else — one letter in one mnemonic. The fix is one letter in
your C too: type the operand \`unsigned\`/\`u32\` instead of \`int\`. The diff is
*telling you the type*.

## A stray \`extsb\` is a type leak

If your build inserts \`extsb r3,r3\` (sign-extend byte) that the target doesn't
have, you declared a byte-sized value as signed \`char\` when the original was
\`u8\`. The compiler is dutifully sign-extending a value the original code treated
as unsigned. Change the type, the \`extsb\` evaporates.

## The method

1. Find the **first** diverging instruction (everything below it may be fallout).
2. Name the *category* from the table — is this a type, an order, or an idiom?
3. Form **one** hypothesis and make **one** change.
4. Re-diff. Did the first divergence move *down*? Then you fixed something real.

A near-match is not "stuck." It's a function handing you a labeled clue.
`,
    symbol: "",
    starter: "",
    solution: "",
    hints: [],
  },
  {
    id: "workflow-2002-c-mindset",
    chapter: "workflow",
    order: 6,
    title: "The 2002 C Mindset",
    difficulty: 2,
    concepts: ["philosophy", "mindset", "types"],
    concept: true,
    brief: `
# The 2002 C mindset

Matching is a means, not the end. The end is recovering the **plausible original
C** — the source a real developer plausibly wrote in 2002 against this codebase,
with this compiler. Keeping that goal in view changes how you write code, and it
turns out to make matching *easier*, not harder.

## A clean-C 90% beats an inline-asm 100%

You could force almost any function to 100% by pasting assembly into an
\`asm { }\` block. **Don't.** Inline asm is **banned** in this project. The one
exception is paired-single load/store (\`psq_l\` / \`psq_st\`), because MWCC GC/2.0
has no intrinsic for them — there is literally no C that emits those, so a tiny
asm escape hatch is permitted there and only there.

For everything else: a clean, typed, readable 90% that looks like real source is
worth more than a contorted 100% that no human would have written. The original
developers wrote C, not assembly, and your reconstruction should read like
theirs.

## Prefer types over raw casts

The single highest-leverage habit: **distrust raw dereferences and casts.** When
you find yourself writing \`*(int*)(p + 0x10)\`, stop. The original almost
certainly had a **struct, union, or typed array**, and the \`0x10\` was a named
field:

\`\`\`c
// you wrote this to make an offset match:
return *(u32*)((char*)obj + 0x10);

// the original was almost certainly this:
return obj->flags;
\`\`\`

Recovering the type isn't just prettier — it frequently *fixes the codegen*. The
right struct gives the compiler the right field widths and the right addressing
mode, which fixes offsets and register coloring you were fighting by hand. Typed
access often closes a near-match that raw pointer math couldn't.

## Type to the data, not to convenience

The compiler's output is sensitive to types in ways that map directly onto the
near-match symptoms from the last lesson:

- A byte field loaded and stored without arithmetic wants \`u8\`, not \`char\` — the
  \`char\` drags in a spurious \`extsb\`.
- A value compared as unsigned wants \`u16\`/\`u32\`, so the compare becomes
  \`cmplwi\`/\`cmplw\` instead of \`cmpwi\`/\`cmpw\`.
- A single-bit clear is \`x &= ~0x80\` (one \`rlwinm\`), not \`x &= 0xff7f\` (an
  \`andi.\`).
- A single-precision helper is \`f32 fn(f32)\`, not \`double fn(double)\`, to avoid a
  stray \`fmul\`/\`frsp\`.

None of these are tricks. They're you choosing the type the original author chose
— and the matching codegen comes along for free. Write the C a 2002 developer
would have written, with honest types, and the bytes tend to fall into place.
`,
    symbol: "",
    starter: "",
    solution: "",
    hints: [],
  },
  {
    id: "workflow-fix-the-near-match",
    chapter: "workflow",
    order: 7,
    title: "Fix the Near-Match",
    difficulty: 2,
    concepts: ["near-match", "idioms", "bit-manipulation"],
    brief: `
# Fix the near-match (capstone)

Time to put the whole loop together. You inherited a function that's *almost*
matching — someone wrote plausible-looking C, but the diff shows a single
divergent instruction. Your job is to read the symptom and close the gap to 100%.

## The target

\`\`\`asm
<clear_flag>:
   0:	54 63 06 6e 	rlwinm  r3,r3,0,25,23
   4:	4e 80 00 20 	blr
\`\`\`

\`rlwinm r3,r3,0,25,23\` is a *rotate-left-immediate-then-mask*. With a rotate of
0, it just **masks** \`r3\` with a bit pattern — here, a mask that keeps every bit
**except bit 7** (the \`0x80\` bit). In other words: clear one specific bit.

## The starter's symptom

The starter clears the same bit, but it spells the mask the "obvious" way —
\`x & 0xff7f\` — and that's the bug. Compile the starter and you get:

\`\`\`asm
<clear_flag>:
   0:	70 63 ff 7f 	andi.   r3,r3,65407
   4:	4e 80 00 20 	blr
\`\`\`

First (and only) diverging instruction: \`andi.\` where the target has \`rlwinm\`.
Same *result* numerically, different *instruction*. This is the "wrong idiom" row
from the diagnosis table: a literal AND-immediate mask compiles to \`andi.\`, but
the original developer expressed it as **clearing a single bit**, which MWCC
lowers to \`rlwinm\`.

## The fix

Write the operation the way it was *meant*: not "AND with this magic number," but
"clear the \`0x80\` bit." In C that's:

\`\`\`c
x & ~0x80
\`\`\`

\`~0x80\` is "all bits set except bit 7" — the same mask, but written as a
single-bit clear. MWCC emits \`rlwinm\` for it, matching the target exactly.

## Your task

Edit \`clear_flag\` so it compiles to \`rlwinm r3,r3,0,25,23\` and \`blr\` — a 100%
match. Change the mask idiom from \`& 0xff7f\` to a single-bit clear.
`,
    symbol: "clear_flag",
    starter: `int clear_flag(int x) {
    // Near-match: this clears bit 7, but the literal mask
    // 0xff7f compiles to andi. -- the target uses rlwinm.
    return x & 0xff7f;
}
`,
    solution: `int clear_flag(int x) {
    return x & ~0x80;
}
`,
    hints: [
      "The diff shows `andi.` where the target has `rlwinm` — a wrong-idiom symptom.",
      "Express it as clearing one bit, not as a literal mask: `~0x80` is the 0x80 bit inverted.",
      "`x & ~0x80` compiles to `rlwinm r3,r3,0,25,23`.",
    ],
  },
];
