---
id: structs-struct-of-structs
title: Combining Fields Across Nested Structs
difficulty: 2
concepts:
  - structs
  - nested
  - offsets
  - chaining
symbol: AABB_spanX
hints:
  - Both loads use the same base; one field lives in the first inner struct, the
    other in the second, so their offsets are a whole inner-struct apart.
  - Add `offsetof(outer, member) + offsetof(inner, field)` for each access, then
    combine the two loads.
---

# Reaching into two inner structs

The nested-struct lesson collapsed one `.a.b` access into a single offset. Now do
it for **two** accesses that live in *different* inner structs of the same outer
struct. Each field still flattens to one absolute offset — you just add the inner
struct's base to the field's offset within it — and then the two loads combine
like any other field pair.

When the same inner type appears twice in a row, the second copy sits one whole
inner-struct further along. Consider a range built from two `Pair`s:

```c
typedef struct { int a; int b; } Pair;
typedef struct { Pair lo; Pair hi; } Range;

int Range_sumB(Range* r) {
    return r->lo.b + r->hi.b;
}
```

`lo` begins at offset 0 and `hi` at offset 8 (past the 8-byte `Pair`). The `b`
field is at +4 inside either `Pair`, so `lo.b` is at 4 and `hi.b` at `8 + 4 = 12`:

```asm
lwz   r4, 4(r3)     # r->lo.b   (0 + 4)
lwz   r0, 12(r3)    # r->hi.b   (8 + 4)
add   r3, r4, r0
blr
```

The two displacements differ by exactly `sizeof(Pair)` because the same field is
read from two adjacent inner structs. To decode such a pair of loads, split each
offset into "which inner struct" plus "which field inside it".

The target reads one field from each of two inner structs and joins them with a
different operation. Decompose each offset into outer + inner, then reproduce the
combine.

## Your task

With the structs above, write `AABB_spanX` to reproduce the assembly above.

<!-- starter -->
```c
int AABB_spanX(AABB* b) {
    return 0;
}
```

<!-- solution -->
```c
int AABB_spanX(AABB* b) {
    return b->max.x - b->min.x;
}
```

<!-- context -->
```c
typedef struct { int x; int y; } Point;
typedef struct { Point min; Point max; } AABB;
```
