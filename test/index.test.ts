import { describe, it, expect, UserConsoleLog } from "vitest";
import { Parse } from "../lib/index";

describe("it should pass the tests", () => {
  const html =
    "<Schema/><head> hello \n</head> <i-html /> <ThisisAComponent /> <Schema /> ";

  it("It should parse `Icon component`, `ThisIsAComponent` and `Schema` correctly and replace them appropriately", async () => {
    const generator = Parse(html, /^(Schema|[A-Z]|head)/);
    generator.next();
    generator.next("");
    generator.next("");
    generator.next("");
    generator.next("Crappy Iconse");
    const lastVal = generator.next("crapp component");
    if (lastVal.done) {
      expect(lastVal.value).toBe("Crappy Iconse crapp component");
    }
  });
});
