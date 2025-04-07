import type { IncrementMap, DecrementMap } from "./maps.ts";

export type Tape<Hs extends unknown[], C, Ts extends unknown[]> = {
  h: Hs;
  c: C;
  t: Ts;
};

export type Prev<M> =
  M extends Tape<[infer H, ...infer Hs], infer C, infer Ts>
    ? Tape<Hs, H, [C, ...Ts]>
    : never;

export type Next<M> =
  M extends Tape<infer Hs, infer C, [infer T, ...infer Ts]>
    ? Tape<[C, ...Hs], T, Ts>
    : never;

export type Incr<M> =
  M extends Tape<infer Hs, infer C extends number, infer Ts>
    ? Tape<Hs, IncrementMap[C], Ts>
    : never;

export type Decr<M> =
  M extends Tape<infer Hs, infer C extends number, infer Ts>
    ? Tape<Hs, DecrementMap[C], Ts>
    : never;

// prettier-ignore
export type PutC<M, C> =
  M extends Tape<infer Hs, unknown, infer Ts>
    ? Tape<Hs, C, Ts>
    : never;
