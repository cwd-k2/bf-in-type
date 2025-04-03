import type { Tape, Prev, Next, Incr, Decr, PutC } from "./tape.ts";
import type { NumberToChar, CharToNumber } from "./maps.ts";

type Inst = "+" | "-" | ">" | "<" | "[" | "]" | "." | "," | "#";

type Make<
  S extends string,
  M extends number[],
> = S extends `${string}${infer R}` ? Make<R, [...M, ...M]> : M;

type Mem0 = Make<"............", [0, 0]>;

type Code<
  S extends string,
  O extends Inst[] = [],
> = S extends `${infer F}${infer R}`
  ? F extends Inst
    ? Code<R, [...O, F]>
    : Code<R, O>
  : O;

type Runner<M, P, I, O> = {
  mem: M;
  prg: P;
  ipt: I;
  out: O;
};

type Init<Program extends string, Input extends string> = Runner<
  Next<Tape<[], 0, Mem0>>,
  Next<Tape<[], "#", Code<`${Program}#`>>>,
  Input,
  ""
>;

type Skip<R> =
  R extends Runner<
    infer M extends Tape<unknown[], number, unknown[]>,
    infer P extends Tape<unknown[], string, unknown[]>,
    infer I extends string,
    infer O extends string
  >
    ? P["curr"] extends "]"
      ? R
      : Skip<Runner<M, Next<P>, I, O>>
    : never;

type Back<R> =
  R extends Runner<
    infer M extends Tape<unknown[], number, unknown[]>,
    infer P extends Tape<unknown[], string, unknown[]>,
    infer I extends string,
    infer O extends string
  >
    ? P["curr"] extends "["
      ? R
      : Back<Runner<M, Prev<P>, I, O>>
    : never;

// prettier-ignore
type Step<R> =
  R extends Runner<
    infer M extends Tape<unknown[], number, unknown[]>,
    infer P extends Tape<unknown[], string, unknown[]>,
    infer I extends string,
    infer O extends string
  >
    ? P['curr'] extends "+" ? Runner<Incr<M>, Next<P>, I, O>
    : P['curr'] extends "-" ? Runner<Decr<M>, Next<P>, I, O>
    : P['curr'] extends ">" ? Runner<Next<M>, Next<P>, I, O>
    : P['curr'] extends "<" ? Runner<Prev<M>, Next<P>, I, O>
    : P['curr'] extends "["
      ? M['curr'] extends 0
        ? Skip<R>
        : Runner<M, Next<P>, I, O>
    : P['curr'] extends "]"
      ? M['curr'] extends 0
        ? Runner<M, Next<P>, I, O>
        : Back<R>
    : P['curr'] extends "." ? Runner<M, Next<P>, I, `${O}${NumberToChar[M['curr']]}`>
    : P['curr'] extends ","
      ? I extends `${infer F}${infer R}`
        ? Runner<PutC<M, CharToNumber[F]>, Next<P>, R, O>
        : never
    : P['curr'] extends "#" ? O
    : /* else */ never
  : never;

type Exec<R> = R extends string ? R : Exec<Step<R>>;

export type BF<S extends string, I extends string = ""> = Exec<Init<S, I>>;
