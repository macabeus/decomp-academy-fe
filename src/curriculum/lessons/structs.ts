import { LessonSource } from "@/lib/lessons/types";

export const structs: LessonSource[] = [
  {
    id: "structs-read-field",
    chapter: "structs",
    order: 1,
    title: "Reading a Struct Field",
    difficulty: 1,
    concepts: ["structs", "load", "offsets"],
    brief: `
# A struct is just an offset into memory

A pointer to a struct arrives in \`r3\` like any other pointer. Reading a field is
a single **load at the field's byte offset**. Given:

\`\`\`c
typedef struct { int x; int y; } Point;
\`\`\`

\`x\` lives at offset 0 and \`y\` at offset 4 (each \`int\` is 4 bytes). So
\`p->y\` is a word load four bytes past the base:

\`\`\`asm
lwz  r3, 4(r3)   ; load p->y
blr
\`\`\`

That \`4(r3)\` is the whole story — \`lwz rD, off(rA)\` means "load the word at
\`rA + off\`". When you see a bare \`lwz r3, 4(r3)\`, distrust the temptation to read
it as \`*(int*)((char*)p + 4)\`. The original was almost certainly a **named field**
of a struct; recovering that name and offset is the job.

## Your task

With the \`Point\` struct above, write \`Point_getY\` returning \`p->y\`.
`,
    symbol: "Point_getY",
    context: `typedef struct { int x; int y; } Point;`,
    starter: `int Point_getY(Point* p) {
    return 0;
}
`,
    solution: `int Point_getY(Point* p) {
    return p->y;
}
`,
    hints: [
      "`y` is the second `int`, so it sits at byte offset 4.",
      "`p->y` compiles to `lwz r3, 4(r3)`.",
    ],
  },
  {
    id: "structs-write-field",
    chapter: "structs",
    order: 2,
    title: "Writing a Struct Field",
    difficulty: 1,
    concepts: ["structs", "store", "offsets"],
    brief: `
# Storing into a field

Writing a field mirrors reading it: a **store at the field's offset**. The store
instruction \`stw rS, off(rA)\` writes \`rS\` to \`rA + off\`. With:

\`\`\`c
typedef struct { int x; int y; } Point;
\`\`\`

the value to store arrives in \`r4\` (the second argument) and the struct base in
\`r3\`. Setting \`p->y = v\` is:

\`\`\`asm
stw  r4, 4(r3)   ; p->y = v
blr
\`\`\`

No load is needed — we overwrite the whole field. The order of operands in
\`stw\` is **source first, then address**, the opposite mental model from \`lwz\`.

## Your task

Write \`Point_setY\` that stores \`v\` into \`p->y\`.
`,
    symbol: "Point_setY",
    context: `typedef struct { int x; int y; } Point;`,
    starter: `void Point_setY(Point* p, int v) {
}
`,
    solution: `void Point_setY(Point* p, int v) {
    p->y = v;
}
`,
    hints: [
      "The value `v` arrives in r4; the struct base is in r3.",
      "`p->y = v;` compiles to `stw r4, 4(r3)`.",
    ],
  },
  {
    id: "structs-narrow-read",
    chapter: "structs",
    order: 3,
    title: "Narrow Fields: Byte and Halfword Loads",
    difficulty: 2,
    concepts: ["structs", "load", "narrow-types"],
    brief: `
# The field's type picks the load

A field's C type decides both its **size** and the **load instruction**. A
\`u8\` field is loaded with \`lbz\` (load byte, zero-extend); a \`u16\` with \`lhz\`
(load halfword). Given a packed color:

\`\`\`c
typedef struct { u8 r; u8 g; u8 b; u8 a; } Color;
\`\`\`

each byte is one wide, so \`g\` is at offset 1:

\`\`\`asm
lbz  r3, 1(r3)   ; load c->g
blr
\`\`\`

This is a strong decompilation signal: an \`lbz\`/\`lhz\` at some offset tells you the
field there is a **\`u8\`/\`u16\`**, not an \`int\`. Use \`u8\` (not \`char\`) for a byte
loaded without arithmetic — \`char\` would drag in a spurious \`extsb\` sign-extend.

## Your task

With the \`Color\` struct above, write \`Color_getG\` returning \`c->g\`.
`,
    symbol: "Color_getG",
    context: `typedef struct { u8 r; u8 g; u8 b; u8 a; } Color;`,
    starter: `u8 Color_getG(Color* c) {
    return 0;
}
`,
    solution: `u8 Color_getG(Color* c) {
    return c->g;
}
`,
    hints: [
      "`g` is the second `u8`, so it sits at offset 1.",
      "A `u8` field loads with `lbz r3, 1(r3)`.",
    ],
  },
  {
    id: "structs-narrow-write",
    chapter: "structs",
    order: 4,
    title: "Storing a Byte Field",
    difficulty: 2,
    concepts: ["structs", "store", "narrow-types"],
    brief: `
# Byte stores and field alignment

Just as \`lbz\` reads a byte, **\`stb\`** writes one. The type still controls the
width. Reusing the color struct:

\`\`\`c
typedef struct { u8 r; u8 g; u8 b; u8 a; } Color;
\`\`\`

\`b\` is the third byte, offset 2, so \`c->b = v\` is:

\`\`\`asm
stb  r4, 2(r3)   ; c->b = v
blr
\`\`\`

Watch alignment when fields have mixed widths: a \`u16\` cannot start at an odd
offset, so the compiler inserts padding. In \`{ u8 flags; u16 hp; }\` the \`hp\`
field lands at offset **2**, not 1 — a hidden pad byte sits between them. Getting
those offsets right is what makes the loads and stores line up.

## Your task

With the \`Color\` struct above, write \`Color_setB\` storing \`v\` into \`c->b\`.
`,
    symbol: "Color_setB",
    context: `typedef struct { u8 r; u8 g; u8 b; u8 a; } Color;`,
    starter: `void Color_setB(Color* c, u8 v) {
}
`,
    solution: `void Color_setB(Color* c, u8 v) {
    c->b = v;
}
`,
    hints: [
      "`b` is the third byte, so it sits at offset 2.",
      "A `u8` store is `stb r4, 2(r3)`.",
    ],
  },
  {
    id: "structs-nested",
    chapter: "structs",
    order: 5,
    title: "Nested Structs Flatten to One Offset",
    difficulty: 2,
    concepts: ["structs", "nested", "float-load"],
    brief: `
# Inner offsets add up

When one struct contains another, the inner fields are laid out **inline** — there
is no pointer to chase. The compiler simply **adds the offsets**. Given:

\`\`\`c
typedef struct { f32 x; f32 y; f32 z; } Vec3;
typedef struct { int id; Vec3 pos; } Entity;
\`\`\`

\`id\` is at offset 0, so \`pos\` begins at offset 4, and inside it \`y\` is one
\`f32\` (4 bytes) further along — offset 8 overall. Because it's an \`f32\`, the load
is \`lfs\` (load floating single) into a float register:

\`\`\`asm
lfs  f1, 8(r3)   ; load e->pos.y
blr
\`\`\`

Two field accesses (\`pos\` then \`.y\`) collapse into a **single** \`8(r3)\`. When you
see one load with a "weird" offset, suspect a nested struct rather than a flat one.

## Your task

With the structs above, write \`Entity_getPosY\` returning \`e->pos.y\`.
`,
    symbol: "Entity_getPosY",
    context: `typedef struct { f32 x; f32 y; f32 z; } Vec3;
typedef struct { int id; Vec3 pos; } Entity;`,
    starter: `f32 Entity_getPosY(Entity* e) {
    return 0.0f;
}
`,
    solution: `f32 Entity_getPosY(Entity* e) {
    return e->pos.y;
}
`,
    hints: [
      "`pos` starts at offset 4; `y` is one f32 into it, so 8 overall.",
      "An `f32` field loads with `lfs f1, 8(r3)`.",
    ],
  },
  {
    id: "structs-array-index",
    chapter: "structs",
    order: 6,
    title: "Arrays of Structs: Scaling the Index",
    difficulty: 3,
    concepts: ["structs", "arrays", "address-arithmetic"],
    brief: `
# The signature idiom: index × sizeof

This is one of the most recognizable shapes in all of GameCube decompilation.
To find \`a[i].field\`, the compiler computes the element address as
\`base + i * sizeof(element)\`, then loads the field's offset on top. Given:

\`\`\`c
typedef struct { int x; int y; int z; } Vec3i;   // sizeof == 12
\`\`\`

\`a[i].z\` becomes "multiply the index by 12, add to the base, then load at
offset 8":

\`\`\`asm
mulli r0, r4, 12   ; i * sizeof(Vec3i)
add   r3, r3, r0   ; &a[i]
lwz   r3, 8(r3)    ; .z
blr
\`\`\`

That **\`mulli\` by a non-power-of-two struct size is a dead giveaway** for an array
of structs. (If the struct size were a power of two — say 8 — you'd see \`slwi\`
instead, e.g. \`slwi r0, r4, 3\`.) When you spot a \`mulli\`/\`slwi\` feeding an
\`add\` then a load, reconstruct the element type from the multiplier: the constant
*is* \`sizeof\`.

## Your task

With \`Vec3i\` above, write \`getZ\` returning \`a[i].z\`.
`,
    symbol: "getZ",
    context: `typedef struct { int x; int y; int z; } Vec3i;`,
    starter: `int getZ(Vec3i* a, int i) {
    return 0;
}
`,
    solution: `int getZ(Vec3i* a, int i) {
    return a[i].z;
}
`,
    hints: [
      "The element is 12 bytes, so the index is scaled by `mulli r0, r4, 12`.",
      "After `add r3, r3, r0`, load `.z` at offset 8 with `lwz r3, 8(r3)`.",
    ],
  },
  {
    id: "structs-union",
    chapter: "structs",
    order: 7,
    title: "Unions Overlay the Same Bytes",
    difficulty: 2,
    concepts: ["structs", "unions", "type-punning"],
    brief: `
# Two names, one address

A **union** lets several fields share the *same* storage — they all start at
offset 0. Reading a different member just reinterprets the same bytes with a
different type. Given:

\`\`\`c
typedef union { f32 f; u32 bits; } FloatBits;
\`\`\`

both \`f\` and \`bits\` are at offset 0. Reading \`u->bits\` is an ordinary integer
load of those four bytes:

\`\`\`asm
lwz  r3, 0(r3)   ; reinterpret the float's bytes as u32
blr
\`\`\`

This is the clean way to express **type punning** — pulling the raw bit pattern
out of a float, or viewing a 32-bit word as four bytes. When asm loads a value
one way that was stored another, suspect a union overlay rather than a cast.

## Your task

With \`FloatBits\` above, write \`floatRawBits\` returning \`u->bits\`.
`,
    symbol: "floatRawBits",
    context: `typedef union { f32 f; u32 bits; } FloatBits;`,
    starter: `u32 floatRawBits(FloatBits* u) {
    return 0;
}
`,
    solution: `u32 floatRawBits(FloatBits* u) {
    return u->bits;
}
`,
    hints: [
      "Both union members live at offset 0.",
      "Reading the `u32` member is just `lwz r3, 0(r3)`.",
    ],
  },
  {
    id: "structs-bitfield-set",
    chapter: "structs",
    order: 8,
    title: "A Single-Bit Flag: li; rlwimi",
    difficulty: 3,
    concepts: ["structs", "bitfields", "rlwimi"],
    brief: `
# The bitfield tell that everyone misses

Here is a make-or-break idiom. A **single-bit C bitfield** set to 1 does *not*
compile to a manual OR-mask. Given:

\`\`\`c
typedef struct { u8 active : 1; u8 visible : 1; u8 dead : 1; } Flags;
\`\`\`

\`f->active = 1\` loads the byte, then uses \`rlwimi\` (rotate-left-word-immediate-
then-**mask-insert**) to drop a single bit into place:

\`\`\`asm
lbz     r0, 0(r3)
li      r4, 1
rlwimi  r0, r4, 7, 24, 24   ; insert bit 1 into active's position
stb     r0, 0(r3)
blr
\`\`\`

Contrast the *manual* version \`*p |= 1\`, which instead emits an \`ori\`:

\`\`\`asm
lbz  r0, 0(r3)
ori  r0, r0, 1
stb  r0, 0(r3)
\`\`\`

Same memory effect, **different instructions**. So when you see \`li; rlwimi\`
writing one bit, the original was a \`u8 x:1\` bitfield assignment — never a hand
written \`|= mask\`. Reaching for the mask would leave you mismatched forever.

## Your task

With \`Flags\` above, write \`Flags_setActive\` that sets \`f->active = 1\`.
`,
    symbol: "Flags_setActive",
    context: `typedef struct { u8 active : 1; u8 visible : 1; u8 dead : 1; } Flags;`,
    starter: `void Flags_setActive(Flags* f) {
}
`,
    solution: `void Flags_setActive(Flags* f) {
    f->active = 1;
}
`,
    hints: [
      "Use the bitfield assignment `f->active = 1;`, not a manual `|= mask`.",
      "It compiles to `li r4, 1` then `rlwimi r0, r4, 7, 24, 24` — not `ori`.",
    ],
  },
  {
    id: "structs-bitfield-multi",
    chapter: "structs",
    order: 9,
    title: "Multi-Bit Bitfield Writes",
    difficulty: 3,
    concepts: ["structs", "bitfields", "rlwimi"],
    brief: `
# rlwimi inserts a whole field

The same insert instruction handles **multi-bit** bitfields. Writing a 3-bit
field doesn't need to mask-and-OR by hand — \`rlwimi\` clears the target bits and
drops the new value in, in one shot. Given:

\`\`\`c
typedef struct { u32 mode : 3; u32 level : 5; u32 rest : 24; } Packed;
\`\`\`

\`p->mode = m\` (those 3 bits live at the top of the first byte) compiles to:

\`\`\`asm
lbz     r0, 0(r3)
rlwimi  r0, r4, 5, 24, 26   ; insert m's low 3 bits into mode
stb     r0, 0(r3)
blr
\`\`\`

The mask operands \`24, 26\` mark exactly the three bits the field occupies; the
rotate \`5\` lines up \`m\`'s low bits with them. One \`rlwimi\` replaces a
load / clear-mask / shift / or / store sequence — recognizing it is how you map
the asm back to a clean bitfield assignment instead of a tangle of mask constants.

## Your task

With \`Packed\` above, write \`Packed_setMode\` storing \`m\` into \`p->mode\`.
`,
    symbol: "Packed_setMode",
    context: `typedef struct { u32 mode : 3; u32 level : 5; u32 rest : 24; } Packed;`,
    starter: `void Packed_setMode(Packed* p, u32 m) {
}
`,
    solution: `void Packed_setMode(Packed* p, u32 m) {
    p->mode = m;
}
`,
    hints: [
      "Assign the whole field: `p->mode = m;`.",
      "A multi-bit field write is a single `rlwimi r0, r4, 5, 24, 26`.",
    ],
  },
  {
    id: "structs-bitfield-read",
    chapter: "structs",
    order: 10,
    title: "Reading a Bitfield: rlwinm Extract",
    difficulty: 3,
    concepts: ["structs", "bitfields", "rlwinm"],
    brief: `
# Reading is rotate-then-mask

Reading a bitfield is the mirror of writing it: load the containing word, then
**rotate the field down to bit 0 and mask off everything else** with a single
\`rlwinm\` (rotate-left-immediate-then-AND-mask). Given:

\`\`\`c
typedef struct { u32 r : 5; u32 g : 6; u32 b : 5; u32 a : 16; } Pixel;
\`\`\`

\`g\` occupies bits 5..10. Reading \`p->g\` loads the halfword and extracts it:

\`\`\`asm
lhz     r0, 0(r3)
rlwinm  r3, r0, 27, 26, 31   ; rotate g down, keep 6 bits
blr
\`\`\`

The rotate amount realigns the field, and the \`26, 31\` mask keeps exactly its 6
bits. (For a field already sitting against bit 0, MWCC prints the simpler
extended mnemonic \`clrlwi\` — still a \`rlwinm\` underneath.) A lone \`rlwinm\` after a
load, with a mask narrower than the load width, almost always means **read a
bitfield**.

## Your task

With \`Pixel\` above, write \`Pixel_getG\` returning \`p->g\`.
`,
    symbol: "Pixel_getG",
    context: `typedef struct { u32 r : 5; u32 g : 6; u32 b : 5; u32 a : 16; } Pixel;`,
    starter: `u32 Pixel_getG(Pixel* p) {
    return 0;
}
`,
    solution: `u32 Pixel_getG(Pixel* p) {
    return p->g;
}
`,
    hints: [
      "Read the whole field: `return p->g;`.",
      "Extraction is `lhz` then `rlwinm r3, r0, 27, 26, 31`.",
    ],
  },
  {
    id: "structs-linked-list",
    chapter: "structs",
    order: 11,
    title: "Walking a Linked List",
    difficulty: 3,
    concepts: ["structs", "linked-list", "loops", "pointers"],
    brief: `
# p = p->next

A self-referential struct holds a pointer to its own type. Walking the list is a
loop that **reloads the \`next\` field each iteration** until it's NULL. Given:

\`\`\`c
typedef struct Node { struct Node* next; int value; } Node;
\`\`\`

\`next\` is at offset 0, so following it is \`lwz r0, 0(r3)\`, then a compare against
zero decides whether to continue:

\`\`\`asm
       b       check
loop:  mr      r3, r0       ; n = n->next
check: lwz     r0, 0(r3)    ; load n->next
       cmplwi  r0, 0        ; next != NULL ?
       bne+    loop
       blr                  ; return last node (still in r3)
\`\`\`

The repeated \`lwz\` of the same offset feeding a NULL test and a branch is the
fingerprint of a linked-list traversal. The \`cmplwi\` (unsigned compare) reflects
that \`next\` is a pointer, not a signed integer.

## Your task

With \`Node\` above, write \`List_last\` that follows \`next\` until it is NULL and
returns the final node.
`,
    symbol: "List_last",
    context: `typedef struct Node { struct Node* next; int value; } Node;`,
    starter: `Node* List_last(Node* n) {
    return n;
}
`,
    solution: `Node* List_last(Node* n) {
    while (n->next != NULL) {
        n = n->next;
    }
    return n;
}
`,
    hints: [
      "Loop `while (n->next != NULL) n = n->next;` and return `n`.",
      "Each step reloads `lwz r0, 0(r3)` and tests it with `cmplwi r0, 0`.",
    ],
  },
  {
    id: "structs-function-pointer",
    chapter: "structs",
    order: 12,
    title: "Calling Through a Function Pointer",
    difficulty: 4,
    concepts: ["structs", "function-pointers", "vtable", "ctr"],
    brief: `
# Indirect calls: load, mtctr, bctrl

Storing a function pointer in a struct is how C fakes virtual methods. To call
it, the compiler **loads the pointer, moves it into the count register (CTR),
then branches to CTR**. Given:

\`\`\`c
typedef struct Actor {
    int hp;
    void (*update)(struct Actor*);
} Actor;
\`\`\`

\`update\` is at offset 4. Calling \`a->update(a)\` is:

\`\`\`asm
lwz    r12, 4(r3)   ; load the function pointer
mtctr  r12          ; move it into CTR
bctrl               ; branch to CTR, set link  (the indirect call)
\`\`\`

(The full listing also has the standard \`stwu\`/\`mflr\` prologue and epilogue to
save the return address, since this function makes a call.) The trio
\`lwz r12, off(rX)\` → \`mtctr r12\` → \`bctrl\` is the unmistakable signature of an
**indirect call through a struct field** — a vtable dispatch or callback. The
argument \`a\` is already in \`r3\`, so no extra setup is needed before the call.

## Your task

With \`Actor\` above, write \`Actor_run\` that calls \`a->update(a)\`.
`,
    symbol: "Actor_run",
    context: `typedef struct Actor {
    int hp;
    void (*update)(struct Actor*);
} Actor;`,
    starter: `void Actor_run(Actor* a) {
}
`,
    solution: `void Actor_run(Actor* a) {
    a->update(a);
}
`,
    hints: [
      "Call the stored pointer directly: `a->update(a);`.",
      "Expect `lwz r12, 4(r3)`, `mtctr r12`, then `bctrl`.",
    ],
  },
];
