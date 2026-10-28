import { describe, expect, it } from "vitest";
import { sanitizeHandle, getVerifyStepLabel } from "./verify";

describe("verify", () => {
  it("sanitiza handles", () => {
    expect(sanitizeHandle("Juan Pérez!")).toBe("juanperez");
    expect(sanitizeHandle("maria..bog")).toBe("maria.bog");
  });

  it("devuelve etiquetas de pasos de verificación", () => {
    expect(getVerifyStepLabel(0)).toContain("selfie");
    expect(getVerifyStepLabel(99)).toBeTruthy();
  });
});
