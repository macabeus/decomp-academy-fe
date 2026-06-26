// Acronyms that appear across lesson prose. Any term here is auto-detected by
// the Markdown renderer (first occurrence per brief) and given a hover tooltip,
// so lessons never have to mark them up by hand. Terms are matched whole-word
// and case-sensitively, so add only forms that won't collide with prose words.

export interface GlossaryEntry {
  term: string;
  full: string;
  desc: string;
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    term: "ABI",
    full: "Application Binary Interface",
    desc: "The machine-level contract for how functions pass arguments, return values, and share registers.",
  },
  {
    term: "EABI",
    full: "Embedded Application Binary Interface",
    desc: "The ABI variant the GameCube PowerPC toolchain targets.",
  },
  {
    term: "PPC",
    full: "PowerPC",
    desc: "The RISC CPU architecture the GameCube uses — specifically the Gekko, a customised PowerPC 750.",
  },
  {
    term: "GPR",
    full: "General-Purpose Register",
    desc: "One of the 32 integer registers (r0–r31) used for integer and pointer maths.",
  },
  {
    term: "FPR",
    full: "Floating-Point Register",
    desc: "One of the 32 registers (f0–f31) that hold float and double values.",
  },
  {
    term: "LR",
    full: "Link Register",
    desc: "Holds the return address for the current function call.",
  },
  {
    term: "CTR",
    full: "Count Register",
    desc: "A special register used for loop counts and indirect branches.",
  },
  {
    term: "SDA",
    full: "Small Data Area",
    desc: "Memory addressed relative to r2/r13 so a global can be loaded in a single instruction.",
  },
  {
    term: "LSB",
    full: "Least Significant Bit",
    desc: "The lowest-value bit (or lowest byte) of a value.",
  },
  {
    term: "MSB",
    full: "Most Significant Bit",
    desc: "The highest-value bit of a value — the sign bit for signed types.",
  },
  {
    term: "CSE",
    full: "Common Subexpression Elimination",
    desc: "A compiler optimisation that computes a repeated expression once and reuses the result.",
  },
  {
    term: "DMA",
    full: "Direct Memory Access",
    desc: "Hardware that copies memory without the CPU performing each transfer.",
  },
  {
    term: "DAG",
    full: "Directed Acyclic Graph",
    desc: "The graph form a compiler uses to represent and optimise an expression.",
  },
  {
    term: "MWCC",
    full: "Metrowerks CodeWarrior Compiler",
    desc: "The compiler (mwcceppc.exe) that built the original game; lessons match its exact output.",
  },
  {
    term: "GCC",
    full: "GNU Compiler Collection",
    desc: "The open-source C/C++ compiler, used here for tooling rather than to match game code.",
  },
  {
    term: "SDK",
    full: "Software Development Kit",
    desc: "The libraries and tools a platform ships for building software against it.",
  },
  {
    term: "IDA",
    full: "Interactive Disassembler",
    desc: "A widely used tool for reverse-engineering compiled binaries.",
  },
  {
    term: "AABB",
    full: "Axis-Aligned Bounding Box",
    desc: "A box aligned to the coordinate axes, used for cheap collision tests.",
  },
];
