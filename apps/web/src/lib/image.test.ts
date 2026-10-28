import { describe, expect, it } from "vitest";
import { compressImage } from "./image";

describe("compressImage", () => {
  it("devuelve data URLs no-imagen sin cambios", async () => {
    const raw = "https://example.com/a.jpg";
    expect(await compressImage(raw)).toBe(raw);
  });
});
