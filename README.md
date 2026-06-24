# Decomp Academy — Master MWCC GC/2.0

An interactive course that takes you from *never having read a register* to
matching real **Star Fox Adventures** functions, instruction for instruction.
You write C; the **real Metrowerks CodeWarrior GC/2.0 compiler** grades it live.

It's the [decomp.me](https://decomp.me) loop turned into a structured curriculum:
read the target PowerPC assembly, write plausible C, compile, diff, iterate to
a **100% byte match**.

## How it works

- The backend shells out to the authoritative MWCC GC/2.0 toolchain that ships
  with the sibling [`../sfa`](../sfa) decompilation project (the Windows
  `mwcceppc.exe` is run through [`wibo`](https://github.com/decompals/wibo)), then
  disassembles the result with the project's `powerpc-eabi-objdump -M gekko`.
- Your code and the lesson's authoritative reference solution are compiled with
  the exact retail flags (`-O4,p -proc gekko ...`), normalized, and diffed
  instruction-by-instruction. Branch targets and symbol relocations are
  canonicalized so equivalent code matches regardless of address.
- Because the *real* compiler is in the loop, every lesson target is truthful —
  nothing is hand-waved or hard-coded.

## Curriculum

306 lessons across 16 chapters, strictly progressive:

1. **Foundations** — registers, return values, reading MWCC output
2. **The Decomp Loop** — match %, objdump, diffing, diagnosing a near-match
3. **Integer Arithmetic** · 4. **Bitwise & Shifts** · 5. **Control Flow**
   (signed vs unsigned compares) · 6. **Loops** · 7. **Types & Width**
   (the `u8`-not-`char` rule) · 8. **Pointers** · 9. **Structs, Unions & Bitfields**
   · 10. **Floating Point** (frsp, fmadds) · 11. **Functions & the ABI**
   (stack frames, declaration-order register coloring)
12. **Globals, the SDA & Pools** — `@sda21`, `@ha`/`@l`, literal pools
13. **Optimization & Scheduling** — peephole, scheduling, the `#pragma` toggles
14. **Advanced Idioms** — paired-singles, switch jump tables, enums, `volatile`
15. **Practice Gauntlet** — ~160 generated drills for endless reps
16. **Real-World Mastery** — 10 authentic SFA capstones, up to ~80 instructions

## Running it

Requires Node 18+ and the `../sfa` project present (it provides the compiler and
binutils). Point elsewhere with `SFA_ROOT=/path/to/sfa`.

```sh
npm install
npm run dev      # http://localhost:3000
```

### Useful endpoints / scripts

- `POST /api/check` `{ lesson, code }` — compile + diff a submission
- `GET /api/target?lesson=<id>` — the authoritative target disassembly
- `GET /api/admin/verify-all` — compile every lesson's reference solution (QA)
- `node scripts/cc.mjs <file.c|-> [symbol]` — standalone compile + disassemble
- `node scripts/shots.mjs` — capture UI screenshots for design review

## Stack

Next.js (App Router) · Tailwind CSS · Tabler icons · Monaco editor. Lesson
content lives in `src/curriculum/lessons/*.ts`; the compile/diff engine is in
`src/lib/`.
