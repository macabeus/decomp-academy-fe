---
id: structs-copy-whole
title: Copying a Whole Struct
difficulty: 2
concepts:
  - structs
  - copy
  - load
  - store
symbol: Span_copy
hints:
  - A run of `lwz`/`stw` that sweeps every offset of a struct in order is one
    whole-struct assignment, not separate field writes.
  - Loads come from `r4` (source), stores go to `r3` (destination); words move in
    pairs, with any leftover word moved on its own.
---

# One assignment, many loads and stores

Assigning one whole struct to another is not a single instruction on PowerPC.
For a small struct the compiler **unrolls the copy**: it loads each word
from the source and stores it to the destination, marching through the byte
offsets in order. There is no `memcpy` call to spot; the copy is open-coded right
into the function.

Consider a three-word glyph record copied between two pointers:

```c
typedef struct { u32 code; u32 w; u32 h; } Glyph;

void Glyph_copy(Glyph* out, Glyph* in) {
    *out = *in;
}
```

With `out` in `r3` and `in` in `r4`, MWCC emits:

```asm
lwz   r5, 0(r4)    # in->code
lwz   r0, 4(r4)    # in->w
stw   r5, 0(r3)    # out->code
stw   r0, 4(r3)    # out->w
lwz   r0, 8(r4)    # in->h
stw   r0, 8(r3)    # out->h
blr
```

The compiler moves two words at a time — loading into `r5` and `r0`, then storing
both — and finishes any odd leftover word on its own (here the third, `h`).
Nothing in this sequence names a field; the displacements `0, 4, 8` simply sweep
the whole 12-byte struct from one pointer to the other. When you see a block of
`lwz`/`stw` whose offsets cover **every** byte of a struct, source pointer to
destination pointer, that is a single struct assignment — not hand-written field
copies.

The target below copies a wider struct the same way. Read the offsets to confirm
they span the whole struct, then express it as one assignment.

## Your task

With the `Span` struct above, write `Span_copy` to reproduce the target assembly.

<!-- starter -->
```c
void Span_copy(Span* dst, Span* src) {
}
```

<!-- solution -->
```c
void Span_copy(Span* dst, Span* src) {
    *dst = *src;
}
```

<!-- context -->
```c
typedef struct { u32 start; u32 end; u32 color; u32 flags; } Span;
```
