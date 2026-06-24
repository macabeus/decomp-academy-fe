import { LessonSource } from "@/lib/lessons/types";
import { foundations } from "./lessons/foundations";
import { workflow } from "./lessons/workflow";
import { arithmetic } from "./lessons/arithmetic";
import { bitwise } from "./lessons/bitwise";
import { control } from "./lessons/control";
import { loops } from "./lessons/loops";
import { types } from "./lessons/types";
import { pointers } from "./lessons/pointers";
import { structs } from "./lessons/structs";
import { floats } from "./lessons/floats";
import { abi } from "./lessons/abi";
import { globals } from "./lessons/globals";
import { optimization } from "./lessons/optimization";
import { advanced } from "./lessons/advanced";
import { gauntlet } from "./lessons/gauntlet";
import { mastery } from "./lessons/mastery";

// Order matters: this is the canonical lesson order within the curriculum.
export const ALL_LESSON_SOURCES: LessonSource[] = [
  ...foundations,
  ...workflow,
  ...arithmetic,
  ...bitwise,
  ...control,
  ...loops,
  ...types,
  ...pointers,
  ...structs,
  ...floats,
  ...abi,
  ...globals,
  ...optimization,
  ...advanced,
  ...gauntlet,
  ...mastery,
];
