import type { Tape, Prev, Next, Incr, Decr, PutC } from './tape.ts';
import type {
  DecrementMap,
  IncrementMap,
  NumToCharMap,
  CharToNumMap,
} from './maps.ts';

type Inst = '+' | '-' | '>' | '<' | '[' | ']' | '.' | ',';

// prettier-ignore
type ZerosN<
  N extends number,
  M extends number[] = [0]
> = N extends 0
  ? M
  : ZerosN<DecrementMap[N], [...M, ...M]>;

// prettier-ignore
type FromString<
  S extends string,
  O extends Inst[] = [],
> = S extends `${infer F}${infer R}`
  ? F extends Inst
    ? FromString<R, [...O, F]>
    : FromString<R, O>
  : O;

type TapeMm = Tape<number[], number, number[]>;
type TapePg = Tape<string[], string, string[]>;

// prettier-ignore
type Skip<P, N extends number = 0> =
  Next<P> extends infer V extends TapePg
    ? V['c'] extends ']'
      ? N extends 0 ? V : Skip<V, DecrementMap[N]>
    : V['c'] extends '['
      ? Skip<V, IncrementMap[N]>
    : Skip<V, N>
  : never;

// prettier-ignore
type Back<P, N extends number = 0> =
  Prev<P> extends infer V extends TapePg
    ? V['c'] extends '['
      ? N extends 0 ? V : Back<V, DecrementMap[N]>
    : V['c'] extends ']'
      ? Back<V, IncrementMap[N]>
    : Back<V, N>
  : never;

type Runner<M, P> = {
  mem: M;
  prg: P;
};

type ActionN<R> = { action: 'N'; runner: R };
type ActionI<R> = { action: 'I'; runner: R };
type ActionO<R, O> = { action: 'O'; runner: R; output: O };
type ActionE = { action: 'E' };

// prettier-ignore
type Read<R, C extends number> =
  R extends Runner<
    infer M extends TapeMm,
    infer R extends TapePg
  >
    ? Runner<PutC<M, C>, R>
    : never;

// prettier-ignore
type Step<R> =
  R extends Runner<
    infer M extends TapeMm,
    infer P extends TapePg
  >
    ? P['c'] extends '+' ? ActionN<Runner<Incr<M>, Next<P>>>
    : P['c'] extends '-' ? ActionN<Runner<Decr<M>, Next<P>>>
    : P['c'] extends '>' ? ActionN<Runner<Next<M>, Next<P>>>
    : P['c'] extends '<' ? ActionN<Runner<Prev<M>, Next<P>>>
    : P['c'] extends '[' ? ActionN<Runner<M, M['c'] extends 0 ? Skip<P> : Next<P>>>
    : P['c'] extends ']' ? ActionN<Runner<M, M['c'] extends 0 ? Next<P> : Back<P>>>
    : P['c'] extends '.' ? ActionO<Runner<M, Next<P>>, M['c']>
    : P['c'] extends ',' ? ActionI<Runner<M, Next<P>>>
    : ActionE
  : never;

// prettier-ignore
type Exec<
  R,
  I extends string,
  O extends string = ''
> =
  Step<R> extends infer WithAction
    ? WithAction extends ActionN<infer Q>
      ? Exec<Q, I, O>
    : WithAction extends ActionI<infer Q>
      ? I extends `${infer F}${infer S}`
        ? Exec<Read<Q, CharToNumMap[F]>, S, O>
        : Exec<Read<Q, 0>, I, O>
    : WithAction extends ActionO<infer Q, infer N extends number>
      ? Exec<Q, I, `${O}${NumToCharMap[N]}`>
    : WithAction extends ActionE
      ? O
    : never
  : never;

// prettier-ignore
type MakeMm<N extends number> =
  Tape<ZerosN<N>, 0, ZerosN<N>>;

// prettier-ignore
type MakePg<P extends string> =
  FromString<P> extends [infer C, ...infer S]
    ? Tape<['#'], C, [...S, '#']>
    : Tape<['#'], '#', ['#']>;

// prettier-ignore
export type BF<
  S extends string,
  I extends string = ''
> =
  Exec<Runner<MakeMm<10>, MakePg<S>>, I>;
