---
id: structs-copy-aligned
title: Eight-Byte Alignment Copies Through Float Registers
difficulty: 2
concepts:
  - structs
  - copy
  - alignment
  - floats
symbol: Record_copy
hints:
  - "`lfd`/`stfd` move 8 bytes at a time through the float registers — even when
    the struct holds no floating-point fields at all."
  - A 64-bit member (`u64`/`s64`/`f64`) forces the struct to 8-byte alignment,
    which is what lets the copy use doubleword float loads and stores.
---

# Float registers move integer data

When a struct contains a 64-bit member, the whole struct becomes **8-byte
aligned**. That alignment unlocks a faster copy: instead of moving 4 bytes per
`lwz`/`stw`, MWCC moves **8 bytes at a time** with the floating-point
load/store-doubleword instructions, `lfd` and `stfd` — *even if the struct
contains no floating-point fields*. The float registers are being used purely as
64-bit movers; no arithmetic happens.

Here is a 24-byte record made of three 64-bit integers:

```c
typedef struct { u64 lo; u64 mid; u64 hi; } Wide;

void Wide_copy(Wide* out, Wide* in) {
    *out = *in;
}
```

```asm
lfd   f1, 0(r4)     # in->lo   (8 bytes at once)
lfd   f0, 8(r4)     # in->mid
stfd  f1, 0(r3)     # out->lo
stfd  f0, 8(r3)     # out->mid
lfd   f0, 16(r4)    # in->hi
stfd  f0, 16(r3)    # out->hi
blr
```

Three doublewords, copied in `lfd`/`stfd` pairs with a leftover single — the same
shape as the integer-word copy from the previous lesson, but eight bytes per step
instead of four. The giveaway is `lfd`/`stfd` touching a struct that has no
`f32`/`f64` fields: that is an aligned struct copy, not float math. Reading it
back, do not be tempted to give the struct floating-point members.

The target copies a smaller 8-byte-aligned struct. Notice the doubleword float
moves and reproduce the assignment.

## Your task

With the `Record` struct above, write `Record_copy` to reproduce the target
assembly.

<!-- starter -->
```c
void Record_copy(Record* dst, Record* src) {
}
```

<!-- solution -->
```c
void Record_copy(Record* dst, Record* src) {
    *dst = *src;
}
```

<!-- context -->
```c
typedef struct { s64 key; s64 hash; } Record;
```
