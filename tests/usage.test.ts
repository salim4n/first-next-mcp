import { describe, expect, it } from "vitest";
import { toPartition } from "@/lib/usage/types";

describe("toPartition", () => {
  it("formats UTC date to yyyymmdd", () => {
    const d = new Date(Date.UTC(2025, 7, 12, 23, 59, 59)); // Aug is 7 (0-based)
    expect(toPartition(d)).toBe("20250812");
  });
});
