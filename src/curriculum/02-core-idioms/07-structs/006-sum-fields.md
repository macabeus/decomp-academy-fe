---
id: structs-sum-fields
title: Combining Two Fields
difficulty: 1
concepts:
  - structs
  - load
  - offsets
  - chaining
symbol: Point_sum
hints:
  - Two loads from the same base register, at two different offsets, then one
    combining instruction.
  - Each field is read with its own `lwz off(r3)`; the offsets tell you which
    two fields, the arithmetic tells you how they're joined.
---

# Two loads, then combine

So far each function has touched a single field. Real code reads *several* fields
of the same struct and combines them. The shape is exactly what you'd expect:
**one load per field, all from the same base pointer, then arithmetic to join
them**. The struct base stays in `r3` the whole time, so you'll see the same
register reused as the address for every `lwz`, only the displacement changing.

Consider a health struct and a function that returns how much health is missing:

```c
typedef struct { int hp; int maxHp; } Health;

int Health_missing(Health* h) {
    return h->maxHp - h->hp;
}
```

```asm
lwz   r4, 0(r3)    # r4 = h->hp     (offset 0)
lwz   r0, 4(r3)    # r0 = h->maxHp  (offset 4)
subf  r3, r4, r0   # r3 = r0 - r4  =  maxHp - hp
blr
```

Two `lwz`s pull the two fields into scratch registers, then `subf` combines them
(`subf rD, rA, rB` is `rB − rA`). Read each load's offset to name the field it
fetches; read the combining instruction to see how they're joined. The order the
fields are *loaded* follows the order they appear in the source expression, not
their offsets.

The target assembly reads two fields of a different struct and joins them with a
different operation. Match each `lwz` displacement to a field, then reproduce the
arithmetic.

## Your task

With the `Point` struct above, write `Point_sum` to reproduce the assembly above.

<!-- starter -->
```c
int Point_sum(Point* p) {
    return 0;
}
```

<!-- solution -->
```c
int Point_sum(Point* p) {
    return p->x + p->y;
}
```

<!-- context -->
```c
typedef struct { int x; int y; } Point;
```
