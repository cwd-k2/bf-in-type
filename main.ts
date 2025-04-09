import type { BF } from './bf.ts';

type HelloWorldBF =
  '++++++++++[>+++++++>++++++++++>+++++++++++>+++>+++++++++>+<<<<<<-]>++.>+.>--..+++.>++.>---.<<.+++.------.<-.>>+.>>.';
type Echo = ',[.,]';

let helloworld: BF<HelloWorldBF>;
let echo: BF<Echo, 'foobar'>;
