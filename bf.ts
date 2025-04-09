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
type Skip<P extends TapePg, N extends number = 0>
  = P['c'] extends ']'
    ? N extends 0 ? P : Skip<Next<P>, DecrementMap[N]>
  : P['c'] extends '['
    ? Skip<Next<P>, IncrementMap[N]>
  : Skip<Next<P>, N>;

// prettier-ignore
type Back<P extends TapePg, N extends number = 0>
  = P['c'] extends '['
    ? N extends 0 ? P : Back<Prev<P>, DecrementMap[N]>
  : P['c'] extends ']'
    ? Back<Prev<P>, IncrementMap[N]>
  : Back<Prev<P>, N>;

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
    : P['c'] extends '[' ? StateN<Runner<M, M['c'] extends 0 ? Skip<Next<P>> : Next<P>>>
    : P['c'] extends ']' ? StateN<Runner<M, M['c'] extends 0 ? Next<P> : Back<Prev<P>>>>
    : P['c'] extends '.' ? StateO<Runner<M, Next<P>>, M['c']>
    : P['c'] extends ',' ? StateI<Runner<M, Next<P>>>
    : StateE
  : StateE;

// prettier-ignore
type Exec<
  R,
  I extends string,
  O extends string = ''
> =
  Step<R> extends infer StateR
    ? StateR extends StateN<infer RR>
      ? Exec<RR, I, O>
    : StateR extends StateI<infer RR>
      ? I extends `${infer F}${infer S}`
        ? Exec<Read<RR, CharToNumMap[F]>, S, O>
        : Exec<Read<RR, 0>, I, O>
    : StateR extends StateO<infer RR, infer RO extends number>
      ? Exec<RR, I, `${O}${NumToCharMap[RO]}`>
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
