import { Chapter } from "@/lib/lessons/types";

// The full ladder: knowing nothing -> MWCC GC/2.0 master.
export const CHAPTERS: Chapter[] = [
  { id: "foundations", order: 1, title: "Foundations",
    blurb: "What decompilation is, PowerPC registers, and reading MWCC output." },
  { id: "workflow", order: 2, title: "The Decomp Loop",
    blurb: "Match %, reading objdump, diffing, and how a real decomper iterates." },
  { id: "arithmetic", order: 3, title: "Integer Arithmetic",
    blurb: "Add, subtract, multiply, divide, immediates and the bit-twiddling idioms." },
  { id: "bitwise", order: 4, title: "Bitwise & Shifts",
    blurb: "AND/OR/XOR, masks, shifts, and the rlwinm family MWCC loves." },
  { id: "control", order: 5, title: "Control Flow",
    blurb: "if/else, ternaries, switch, and the all-important signed-vs-unsigned compare." },
  { id: "loops", order: 6, title: "Loops",
    blurb: "for, while, do-while, induction variables and counted loops." },
  { id: "types", order: 7, title: "Types & Width",
    blurb: "u8/s8/u16/s16 loads, sign vs zero extension, and width-driven matching." },
  { id: "pointers", order: 8, title: "Pointers & Memory",
    blurb: "Loads and stores, addressing modes, pointer arithmetic and arrays." },
  { id: "structs", order: 9, title: "Structs, Unions & Bitfields",
    blurb: "Typed field access, nested structs, unions, and single-bit bitfields." },
  { id: "floats", order: 10, title: "Floating Point",
    blurb: "f32 vs f64, frsp, fused multiply-add, and float comparisons." },
  { id: "abi", order: 11, title: "Functions & the ABI",
    blurb: "Arg registers, saved registers, stack frames and declaration-order coloring." },
  { id: "globals", order: 12, title: "Globals, the SDA & Pools",
    blurb: "r13/r2 small-data addressing, @sda21/@ha/@l relocations, and rodata pools." },
  { id: "optimization", order: 13, title: "Optimization & Scheduling",
    blurb: "-O4,p, peephole, instruction scheduling, and the pragmas that bend them." },
  { id: "advanced", order: 14, title: "Advanced Idioms",
    blurb: "Paired-singles, switch jump tables, enums, and volatile — the master's toolkit." },
  { id: "gauntlet", order: 15, title: "Practice Gauntlet",
    blurb: "Hundreds of generated drills — endless reps across every idiom you've learned." },
  { id: "mastery", order: 16, title: "Real-World Mastery",
    blurb: "Authentic Star Fox Adventures functions, from warm-ups to full capstones." },
];

export const CHAPTER_BY_ID = new Map(CHAPTERS.map((c) => [c.id, c]));
