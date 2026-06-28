---
id: foundations-welcome
title: Your First Match
difficulty: 1
concepts:
  - registers
  - return-value
  - workflow
symbol: answer
hints:
  - The function should return the literal value 42.
  - A one-line `return` of that value is all it takes — the `li`/`blr` is the
    compiler's job.
---

# Welcome to decompilation

Decompiling is working backwards. You take a compiled binary and recover the C
that produced it. The good part is that you never have to wonder whether you got
it right: you write C, hand it to the genuine Metrowerks CodeWarrior GC/2.0
compiler, and let it emit PowerPC assembly. We diff that against the target, line
by line. Match all of it and you score 100%. Be off by one instruction and the
match fails outright. That strictness is the whole game, and it's why something
as innocent as a variable's type can sink you.

## The first piece of PowerPC to know

Return values live in register `r3`. The GameCube CPU insists on it. So a
function that just hands back an integer constant has hardly any work to do:

```asm
li   r3, 7       # load immediate 7 into r3
blr              # branch to link register = "return"
```

Two lines. `li` is load immediate, which drops a literal straight into a
register. `blr` (branch to link register) does the actual returning, and that one
turns up at the bottom of nearly everything you'll decompile.

Your target wears the same `li` then `blr` shape. Only the constant heading into
`r3` is different. Crack open the target asm and the value you need is sitting
right there.

## Your task

Write `answer` to match the target assembly. Hit **Compile & Check** (or
⌘/Ctrl + Enter).

<!-- starter -->
```c
int answer(void) {
    // return the right number
    return 0;
}
```

<!-- solution -->
```c
int answer(void) {
    return 42;
}
```
