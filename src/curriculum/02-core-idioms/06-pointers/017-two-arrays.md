---
id: pointers-two-arrays
title: Combining Two Arrays at the Same Index
difficulty: 3
concepts:
  - loads
  - indexed-addressing
  - arrays
  - chaining
symbol: dot1
hints:
  - The same variable index scales once, then drives an indexed load from each of
    the two base pointers.
  - One `slwi`, then two `lwzx` sharing the scaled offset register, then a combine.
---

# One offset, two bases

When two arrays are indexed by the *same* variable, the scaled byte offset is
computed a single time and reused. The index `i*size` lands in one register, and
each `lwzx` pairs it with a different base pointer — the two arrays arrive in `r3`
and `r4`. This is the cleanest illustration that the indexed load takes *two*
register operands: hold the offset constant and swap the base to walk a second
array.

Consider `add_arrays(x, y, j)`, which reads `x[j]` and `y[j]` and adds them:

```asm
slwi r0, r5, 2    # j * 4   (j is the third arg, in r5)
lwzx r3, r3, r0   # x[j]    (base x in r3 + offset)
lwzx r0, r4, r0   # y[j]    (base y in r4 + same offset)
add  r3, r3, r0   # x[j] + y[j]
blr
```

One `slwi` scales `j`; the offset in `r0` feeds both `lwzx` instructions, only
the base register changing between them. The target combines two arrays at the
shared index with a different operation — read the instruction after the two
`lwzx` to see which.

## Your task

Write `dot1`, taking two `int*` and an `int`, to reproduce the assembly above.

<!-- starter -->
```c
int dot1(int* a, int* b, int i) {
    return 0;
}
```

<!-- solution -->
```c
int dot1(int* a, int* b, int i) {
    return a[i] * b[i];
}
```
