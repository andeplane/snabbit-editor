import { it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { App } from "../src/App";
import { resetUI } from "./uiFixtures";
import { useEditorStore } from "../src/store/editorStore";
import { packs } from "./fixtures";
vi.mock("../src/components/Canvas", () => ({
  Canvas: () => <div data-testid="canvas-host" />,
}));
it("boots from repository JSON, preserves work on unload, reports notices and opens/closes help", async () => {
  resetUI();
  vi.stubGlobal(
    "fetch",
    vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ packs: packs(), hash: "initial" }), {
        headers: { "content-type": "application/json" },
      }),
    ),
  );
  const view = render(<App />);
  await vi.waitFor(() =>
    expect(useEditorStore.getState().repoHash).toBe("initial"),
  );
  expect(screen.getByTestId("canvas-host")).toBeDefined();
  act(() => useEditorStore.getState().set({ notice: "Hello", hoverIndex: 0 }));
  fireEvent.click(screen.getByLabelText("Dismiss notification"));
  expect(useEditorStore.getState().notice).toBe("");
  fireEvent.click(screen.getByRole("button", { name: "? Shortcuts" }));
  expect(screen.getByRole("dialog")).toBeDefined();
  fireEvent.keyDown(window, { key: "Escape" });
  expect(useEditorStore.getState().showDialog).toBeNull();
  for (const timingView of ["live", "layout", "arrival"] as const) {
    act(() => useEditorStore.getState().set({ timingView }));
  }
  act(() => useEditorStore.getState().startTest());
  expect(screen.getByText("PLAYTEST")).toBeDefined();
  act(() => useEditorStore.getState().exitTest());
  act(() => useEditorStore.getState().set({ notice: "Save failed: changed" }));
  expect(screen.getByRole("status").textContent).toContain("Save failed");
  act(() => useEditorStore.getState().metadata({ name: "Saved on unload" }));
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  expect(localStorage.getItem("snabbit-workshop-v1")).toContain(
    "Saved on unload",
  );
  act(() => useEditorStore.getState().set({ storageError: "Unavailable" }));
  const blocked = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(blocked);
  expect(blocked.defaultPrevented).toBe(true);
  act(() =>
    useEditorStore
      .getState()
      .set({ storageError: "", libraryError: "offline" }),
  );
  expect(screen.getByRole("status").textContent).toContain(
    "Couldn’t load levels",
  );
  fireEvent.click(screen.getByRole("button", { name: "Retry loading levels" }));
  await vi.waitFor(() =>
    expect(useEditorStore.getState().libraryError).toBe(""),
  );
  view.unmount();
});
