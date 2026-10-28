import { describe, expect, it } from "vitest";
import { buildShareUrl } from "./share";

describe("share", () => {
  it("genera URL con parámetro de parche", () => {
    const url = buildShareUrl("parche", "abc123");
    expect(url).toContain("parche=abc123");
  });

  it("genera URL con parámetro de spot", () => {
    const url = buildShareUrl("spot", "xyz789");
    expect(url).toContain("spot=xyz789");
  });
});
