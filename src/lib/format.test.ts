import { describe, expect, it } from "vitest";
import { cn } from "./format";

describe("cn", () => {
  it("joins truthy classes", () => {
    expect(cn("a", false, "b", null, undefined, "c")).toBe("a b c");
  });
});
