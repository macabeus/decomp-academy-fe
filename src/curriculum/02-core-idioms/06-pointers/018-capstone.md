---
id: pointers-capstone
title: "Capstone: Several Dereferences in One Expression"
difficulty: 3
concepts:
  - loads
  - indexed-addressing
  - arrays
  - multiplication
  - chaining
symbol: capstone
hints:
  - Three reads share one scaled index — a fixed element via `lwz 0(r3)`, the
    indexed element via `lwzx`, and a neighbor via a displacement load off the
    computed base.
  - Trace each loaded register to its combine; the multiply is `mullw` (two
    loaded values) and the final step is `subf`.
---

# Putting the chapter together

This capstone combines every idiom from the chapter: a constant-index load, a
variable-index `lwzx`, a neighbor reached from the computed base, a
register-register multiply of two loaded values, and a final subtract. Nothing
here is new — it is the build-up lessons stacked into one function.

The key efficiency to recognize: the variable index is scaled **once** with
`slwi`, and that single offset serves both the indexed load `lwzx` and the
neighbor (via `add` to form the base, then a displacement load). The fixed
element at index 0 is a plain `lwz 0(r3)`.

Consider `mix(q, j)`, which combines the first element with the product of two
neighbors:

```asm
slwi r0, r4, 2     # j * 4
lwz  r5, 0(r3)     # q[0]
add  r4, r3, r0    # r4 = &q[j]
lwzx r3, r3, r0    # q[j]
lwz  r0, 4(r4)     # q[j+1]  (4 / 4 = 1 element past q[j])
mullw r0, r3, r0   # q[j] * q[j+1]
add  r3, r5, r0    # q[0] + q[j]*q[j+1]
blr
```

Watch how the lone `slwi` feeds both the `lwzx` and the `add`-built base, how
`mullw` multiplies two *loaded* values (so it is `mullw`, not `mulli`), and how
the fixed element folds in last. The target assembly has the same ingredients —
a fixed element, an indexed element, and a neighbor — but a different arrangement
of multiply and subtract. Trace each loaded register from its load to the
instruction that consumes it, recover the indices from the displacements, and
reconstruct the full expression.

## Your task

Write `capstone`, taking an `int*` and an `int`, to reproduce the assembly above.

<!-- starter -->
```c
int capstone(int* p, int i) {
    return 0;
}
```

<!-- solution -->
```c
int capstone(int* p, int i) {
    return p[i] * p[0] - p[i + 2];
}
```
