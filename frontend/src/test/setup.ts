import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom lacks these browser APIs used by charts and downloads.
class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }
const g = globalThis as Record<string, unknown>;
g.ResizeObserver ??= ResizeObserverStub;
if (!URL.createObjectURL) URL.createObjectURL = () => "blob:finpilot-test";
if (!URL.revokeObjectURL) URL.revokeObjectURL = () => {};

afterEach(() => {
  cleanup();
  localStorage.clear();
});
