# BF in type

[As you can see!](./main.ts)

```ts
import type { BF } from "./bf.ts";

type HelloWorldBF =
  "++++++++++[>+++++++>++++++++++>+++++++++++>+++>+++++++++>+<<<<<<-]>++.>+.>--..+++.>++.>---.<<.+++.------.<-.>>+.>>.";

// typeof helloworld is "Hello World!\n"
let helloworld: BF<HelloWorldBF>;
```
