import { beforeEach, describe, expect, it } from "vitest";
import { applyTheme, getInitialTheme } from "./theme";

describe("theme", () => {
  beforeEach(() => { localStorage.clear(); document.documentElement.removeAttribute("data-theme"); });

  it("defaults to dark when nothing is stored and no system preference is available", () => {
    expect(getInitialTheme()).toBe("dark");
  });

  it("applies and persists the chosen theme", () => {
    applyTheme("light", true);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(getInitialTheme()).toBe("light");
  });

  it("ignores invalid stored values", () => {
    localStorage.setItem("finpilot-theme", "purple");
    expect(getInitialTheme()).toBe("dark");
  });
});
