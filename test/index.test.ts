import { describe, it, expect } from "vitest";
import { Parser } from "../lib/index";

describe("it should pass the tests", () => {
  const parser = new Parser(" <i-html /> <ThisisAComponent /> <Schema /> ");

  it("It should parse `Icon component`, `ThisIsAComponent` and `Schema` correctly and replace them appropriately", async () => {
    const generator = parser.parse();
    generator.next();
    generator.next("Crappy Iconse");
    generator.next("crapp component");
    const lastVal = generator.next();
    if (lastVal.done) {
      expect(lastVal.value).toBe("Crappy Iconse crapp component");
    }
  });
});
