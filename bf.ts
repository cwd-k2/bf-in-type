import type { Tape, Prev, Next, Incr, Decr, PutC } from "./tape.ts";
import type {
  DecrementMap,
  IncrementMap,
  NumToCharMap,
  CharToNumMap,
} from "./maps.ts";

type Inst = "+" | "-" | ">" | "<" | "[" | "]" | "." | ",";

// prettier-ignore
type Make<
  N extends number,
  M extends number[] = [0]
> = N extends 0
  ? M
  : Make<DecrementMap[N], [...M, ...M]>;

// prettier-ignore
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

type TapeMm = Tape<number[], number, number[]>;
type TapePg = Tape<string[], string, string[]>;
// prettier-ignore
type MakeMm<N extends number> =
  Tape<Make<N>, 0, Make<N>>;
// prettier-ignore
type MakePg<P extends string> =
  Code<P> extends [infer C, ...infer S]
    ? Tape<["#"], C, [...S, "#"]>
    : never;

// prettier-ignore
type Init<
  P extends string,
  I extends string
> = Runner<MakeMm<9>, MakePg<P>, I, "">;

// prettier-ignore
type Skip<P extends TapePg, N extends number = 0>
  = P['c'] extends ']'
    ? N extends 0 ? P : Skip<Next<P>, DecrementMap[N]>
  : P['c'] extends '['
    ? Skip<Next<P>, IncrementMap[N]>
  : Skip<Next<P>, N>;

// prettier-ignore
type Back<P extends TapePg, N extends number = 0>
  = P["c"] extends "["
    ? N extends 0 ? P : Back<Prev<P>, DecrementMap[N]>
  : P["c"] extends "]"
    ? Back<Prev<P>, IncrementMap[N]>
  : Back<Prev<P>, N>;

// prettier-ignore
type Step<R> =
  R extends Runner<
    infer M extends TapeMm,
    infer P extends TapePg,
    infer I extends string,
    infer O extends string
  >
    ? P['c'] extends "+" ? Runner<Incr<M>, Next<P>, I, O>
    : P['c'] extends "-" ? Runner<Decr<M>, Next<P>, I, O>
    : P['c'] extends ">" ? Runner<Next<M>, Next<P>, I, O>
    : P['c'] extends "<" ? Runner<Prev<M>, Next<P>, I, O>
    : P['c'] extends "[" ? Runner<M, M['c'] extends 0 ? Skip<Next<P>> : Next<P>, I, O>
    : P['c'] extends "]" ? Runner<M, M['c'] extends 0 ? Next<P> : Back<Prev<P>>, I, O>
    : P['c'] extends "."
      ? Runner<M, Next<P>, I, `${O}${NumToCharMap[M['c']]}`>
    : P['c'] extends ","
      ? I extends `${infer C}${infer S}` ? Runner<PutC<M, CharToNumMap[C]>, Next<P>, S, O> : never
    : O /* end */
  : never;

// prettier-ignore
type Exec<R> =
  R extends Runner<TapeMm, TapePg, string, string>
    ? Exec<Step<R>>
    : R;

// prettier-ignore
export type BF<
  S extends string,
  I extends string = ""
> =
  Exec<Init<S, I>>;
