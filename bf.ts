import type { Tape, Prev, Next, Incr, Decr, PutC } from './tape.ts';
import type {
  DecrementMap,
  IncrementMap,
  NumToCharMap,
  CharToNumMap,
} from './maps.ts';

type Inst = '+' | '-' | '>' | '<' | '[' | ']' | '.' | ',';

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

type StateN<R> = { state: 'N'; runner: R };
type StateI<R> = { state: 'I'; runner: R };
type StateO<R, O> = { state: 'O'; runner: R; output: O };
type StateE = { state: 'E' };

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
    ? P['c'] extends '+' ? StateN<Runner<Incr<M>, Next<P>>>
    : P['c'] extends '-' ? StateN<Runner<Decr<M>, Next<P>>>
    : P['c'] extends '>' ? StateN<Runner<Next<M>, Next<P>>>
    : P['c'] extends '<' ? StateN<Runner<Prev<M>, Next<P>>>
    : P['c'] extends '[' ? StateN<Runner<M, M['c'] extends 0 ? Skip<P> : Next<P>>>
    : P['c'] extends ']' ? StateN<Runner<M, M['c'] extends 0 ? Next<P> : Back<P>>>
    : P['c'] extends '.' ? StateO<Runner<M, Next<P>>, M['c']>
    : P['c'] extends ',' ? StateI<Runner<M, Next<P>>>
    : StateE
  : never;

// prettier-ignore
type Exec<
  R,
  I extends string,
  O extends string = ''
> =
  Step<R> extends infer StateR
    ? StateR extends StateN<infer Q>
      ? Exec<Q, I, O>
    : StateR extends StateI<infer Q>
      ? I extends `${infer F}${infer S}`
        ? Exec<Read<Q, CharToNumMap[F]>, S, O>
        : Exec<Read<Q, 0>, I, O>
    : StateR extends StateO<infer Q, infer N extends number>
      ? Exec<Q, I, `${O}${NumToCharMap[N]}`>
    : StateR extends StateE
      ? O
    : never
  : never;

// prettier-ignore
type ZerosN<
  N extends number,
  M extends number[] = [0]
> = N extends 0
  ? M
  : ZerosN<DecrementMap[N], [...M, ...M]>;

// prettier-ignore
type ToCode<
  S extends string,
  O extends Inst[] = [],
> = S extends `${infer F}${infer R}`
  ? F extends Inst
    ? ToCode<R, [...O, F]>
    : ToCode<R, O>
  : O;

// prettier-ignore
type MakeMm<N extends number> =
  Tape<ZerosN<N>, 0, ZerosN<N>>;

// prettier-ignore
type MakePg<P extends string> =
  ToCode<P> extends [infer C, ...infer S]
    ? Tape<['#'], C, [...S, '#']>
    : Tape<['#'], '#', ['#']>;

// prettier-ignore
export type BF<
  S extends string,
  I extends string = ''
> =
  Exec<Runner<MakeMm<10>, MakePg<S>>, I>;
