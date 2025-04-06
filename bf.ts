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
  M extends unknown[] = [0]
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
> = Runner<
  MakeMm<9>, // too small but for the limitations
  MakePg<P>,
  I,
  ""
>;

// prettier-ignore
type Skip<R, N extends number> =
  R extends Runner<
    infer M extends TapeMm,
    infer P extends TapePg,
    infer I extends string,
    infer O extends string
  >
    ? P["curr"] extends "]"
      ? N extends 0
        ? R
        : Skip<Runner<M, Next<P>, I, O>, DecrementMap[N]>
    : P["curr"] extends "["
      ? Skip<Runner<M, Next<P>, I, O>, IncrementMap[N]>
    : /* else */ Skip<Runner<M, Next<P>, I, O>, N>
  : never;

// prettier-ignore
type Back<R, N extends number> =
  R extends Runner<
    infer M extends TapeMm,
    infer P extends TapePg,
    infer I extends string,
    infer O extends string
  >
    ? P["curr"] extends "["
      ? N extends 0
        ? R
        : Back<Runner<M, Prev<P>, I, O>, DecrementMap[N]>
    : P["curr"] extends "]"
      ? Back<Runner<M, Prev<P>, I, O>, IncrementMap[N]>
    : /* else */ Back<Runner<M, Prev<P>, I, O>, N>
  : never;

// prettier-ignore
type Step<R> =
  R extends Runner<
    infer M extends TapeMm,
    infer P extends TapePg,
    infer I extends string,
    infer O extends string
  >
    ? P['curr'] extends "+" ? Runner<Incr<M>, Next<P>, I, O>
    : P['curr'] extends "-" ? Runner<Decr<M>, Next<P>, I, O>
    : P['curr'] extends ">" ? Runner<Next<M>, Next<P>, I, O>
    : P['curr'] extends "<" ? Runner<Prev<M>, Next<P>, I, O>
    : P['curr'] extends "["
      ? M['curr'] extends 0
        ? Skip<Runner<M, Next<P>, I, O>, 0>
        : Runner<M, Next<P>, I, O>
    : P['curr'] extends "]"
      ? M['curr'] extends 0
        ? Runner<M, Next<P>, I, O>
        : Back<Runner<M, Prev<P>, I, O>, 0>
    : P['curr'] extends "."
      ? Runner<M, Next<P>, I, `${O}${NumToCharMap[M['curr']]}`>
    : P['curr'] extends ","
      ? I extends `${infer C}${infer S}`
        ? Runner<PutC<M, CharToNumMap[C]>, Next<P>, S, O>
        : never
    : /* else */ O
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
