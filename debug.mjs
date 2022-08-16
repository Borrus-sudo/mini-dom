import { Parse } from "./out/index.mjs";

const html =
    "<Schema/><head> hello \n</head> <i-html /> <ThisisAComponent /> <Schema /> ";

const generator = Parse(html, /^(Schema|[A-Z]|head)/);
console.log(generator.next(""));
console.log(generator.next(""));
console.log(generator.next(""));
console.log(generator.next(""));
console.log(generator.next(""));
console.log(generator.next("Crappy Iconse"));