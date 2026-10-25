import { beforeEach, describe, it, expect, vi } from "vitest";
import { act, render, screen, fireEvent, within } from "@testing-library/react";
import { Toolbar } from "../src/components/Toolbar";
import { Library } from "../src/components/Library";
import { Palette, BlockIcon } from "../src/components/Palette";
import { PropertiesPanel } from "../src/components/PropertiesPanel";
import { ImportExportDialog } from "../src/components/ImportExportDialog";
import { TimerEditor } from "../src/components/TimerEditor";
import { useEditorStore } from "../src/store/editorStore";
import * as repository from "../src/core/repository";
import { cells, level, packs } from "./fixtures";
import { resetUI } from "./uiFixtures";
beforeEach(() => {
  resetUI();
});
const state = () => useEditorStore.getState();
describe("library and paint menus", () => {
  it("loads bundled levels, filters, switches packs, opens drafts, and creates a level", () => {
    const second = { ...level(10, 5, "b"), name: "Another level" };
    act(() =>
      state().set({
        library: {
          ...packs(),
          20: { _type: "levelpack", name: "Next pack", levels: [second] },
        },
      }),
    );
    render(<Library />);
    expect(screen.getByRole("button", { name: /Test level/ })).toBeDefined();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "absent" },
    });
    expect(screen.getByText("No matching levels.")).toBeDefined();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Level pack"), {
      target: { value: "20" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Another level/ }));
    expect(state().levelId).toBe("b");
    fireEvent.click(screen.getByRole("button", { name: /New level/ }));
    expect(state().activePack).toBe("drafts");
    expect(
      screen.getByRole("button", { name: /Untitled level/ }),
    ).toBeDefined();
    act(() => state().set({ activePack: "missing" }));
    expect(
      screen.getByText("Create a level to start this pack."),
    ).toBeDefined();
    act(() => state().set({ libraryReady: false }));
    expect(screen.getByText("Loading game levels…")).toBeDefined();
  });
  it("chooses every tool/material and opens/cancels numbered tool, block and field menus", () => {
    render(<Palette />);
    for (const name of [
      "Brush",
      "Eraser",
      "Line",
      "Rectangle",
      "Fill",
      "Selection",
      "Eyedropper",
    ])
      fireEvent.click(screen.getByLabelText(name));
    expect(state().activeTool).toBe("pick");
    for (const name of [
      "Switch",
      "Metal",
      "Rock",
      "Dirt",
      "Gem",
      "Life",
      "Finish",
      "Star",
      "Diamond",
      "Turbo",
      "Focus",
      "Mesh",
    ]) {
      fireEvent.click(screen.getByLabelText(`Paint ${name}`));
      expect(state().activeTool).toBe("paint");
    }
    act(() => state().set({ menu: "tools" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /1 Brush/ }));
    expect(state().menu).toBeNull();
    act(() => state().set({ menu: "blocks" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /9 Fields/ }));
    expect(state().menu).toBe("fields");
    fireEvent.click(screen.getByRole("menuitem", { name: /Switch/ }));
    expect(state().activeBlockType).toBe("=");
    act(() => state().set({ menu: "blocks" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /1 Metal/ }));
    act(() => state().set({ menu: "tools" }));
    fireEvent.click(screen.getByRole("button", { name: "Esc" }));
    expect(state().menu).toBeNull();
  });
  it("renders empty and goal icons accessibly", () => {
    const { container } = render(
      <>
        <BlockIcon type="0" />
        <BlockIcon type="7" />
      </>,
    );
    expect(container.textContent).toContain("·");
    expect(container.querySelector(".goal-icon")?.textContent).toBe("⁙");
  });
});
describe("toolbar and timing controls", () => {
  it("uses the real Snabbit icon, manages history, views, animation, zoom, export and save", () => {
    const save = vi.spyOn(repository, "saveRepository").mockResolvedValue();
    render(<Toolbar />);
    expect(screen.getByAltText("Snabbit").getAttribute("src")).toBe(
      "/assets/snabbit-icon.png",
    );
    fireEvent.click(screen.getByRole("button", { name: "Open JSON" }));
    expect(state().showDialog).toBe("import");
    fireEvent.click(screen.getByRole("button", { name: "Export…" }));
    expect(state().showDialog).toBe("export");
    fireEvent.click(screen.getByLabelText("Keyboard shortcuts"));
    expect(state().showDialog).toBe("help");
    act(() => state().set({ repoHash: "hash", showDialog: null }));
    fireEvent.click(screen.getByRole("button", { name: /Save to repo/ }));
    expect(save).toHaveBeenCalled();
    act(() => state().set({ saving: true }));
    expect(
      screen.getByRole("button", { name: /Saving…/ }).hasAttribute("disabled"),
    ).toBe(true);
    act(() => state().set({ saving: false }));
    act(() => state().paintStroke([0], "1"));
    fireEvent.click(screen.getByLabelText("Undo"));
    expect(state().grid[0]).toBe("0");
    fireEvent.click(screen.getByLabelText("Redo"));
    expect(state().grid[0]).toBe("1");
    fireEvent.click(screen.getByRole("button", { name: "Layout" }));
    expect(state().timingView).toBe("layout");
    fireEvent.click(screen.getByRole("button", { name: "Live time" }));
    fireEvent.click(screen.getByLabelText("Animate timers"));
    expect(state().isPlaying).toBe(true);
    fireEvent.click(screen.getByLabelText("Pause timers"));
    fireEvent.change(screen.getByLabelText("Timeline"), {
      target: { value: "8" },
    });
    expect(state().playbackTime).toBe(8);
    fireEvent.click(screen.getByRole("button", { name: /At arrival/ }));
    expect(state().timingView).toBe("arrival");
    fireEvent.click(screen.getByLabelText("Toggle grid"));
    expect(state().showGrid).toBe(false);
    const zoom = state().zoom;
    fireEvent.click(screen.getByLabelText("Zoom in"));
    expect(state().zoom).toBeGreaterThan(zoom);
    fireEvent.click(screen.getByLabelText("Zoom out"));
    expect(state().zoom).toBeCloseTo(zoom);
    act(() => state().set({ storageError: "full" }));
    expect(screen.getByText("Draft storage unavailable")).toBeDefined();
    act(() => state().set({ storageError: "", savedRevision: -1 }));
    expect(screen.getByText("Saving draft…")).toBeDefined();
  });
  it("starts, pauses, resumes and exits a playtest with editing tools disabled", () => {
    render(<Toolbar />);
    fireEvent.click(screen.getByRole("button", { name: /Playtest/ }));
    expect(state().test).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(state().testPlaying).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Resume" }));
    expect(state().testPlaying).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /Back to edit/ }));
    expect(state().test).toBeNull();
  });
});
describe("inspector, scoring search controls and batch timers", () => {
  it("edits metadata, validates resizing, restores originals, and shows finish validation", () => {
    render(<PropertiesPanel findRoute={vi.fn()} />);
    const name = screen.getByLabelText("Level name");
    fireEvent.change(name, { target: { value: "New name" } });
    fireEvent.blur(name);
    expect(state().name).toBe("New name");
    fireEvent.change(name, { target: { value: "By enter" } });
    fireEvent.keyDown(name, { key: "Enter" });
    fireEvent.blur(name);
    const credits = screen.getByLabelText("Credits");
    fireEvent.change(credits, { target: { value: "Artist" } });
    fireEvent.blur(credits);
    expect(state().credits).toBe("Artist");
    fireEvent.blur(credits);
    fireEvent.change(screen.getByLabelText("Columns"), {
      target: { value: "6" },
    });
    fireEvent.change(screen.getByLabelText("Rows"), {
      target: { value: "10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Resize" }));
    expect(state().width).toBe(6);
    fireEvent.click(screen.getByRole("button", { name: "＋20 rows" }));
    expect(state().height).toBe(30);
    fireEvent.click(
      screen.getByRole("button", { name: /Restore bundled original/ }),
    );
    expect(state().width).toBe(4);
    act(() => state().paintStroke([0], "7"));
    expect(screen.getByText("✓ Finish line present")).toBeDefined();
  });
  it("copies/deletes selections, applies timers to a group and adds/removes channel links", () => {
    resetUI(cells(level(), { 0: "1", 1: "1", 2: "=" }));
    act(() => state().set({ selectedIndex: 0, selection: [0, 1] }));
    render(<PropertiesPanel findRoute={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Copy/ }));
    expect(state().clipboard).toHaveLength(2);
    fireEvent.change(screen.getByLabelText("Gate channel"), {
      target: { value: "B" },
    });
    expect(state().gates.get(1)).toBe("B");
    fireEvent.change(screen.getByLabelText("First duration"), {
      target: { value: "16" },
    });
    fireEvent.change(screen.getByLabelText("Second duration"), {
      target: { value: "24" },
    });
    fireEvent.change(screen.getByLabelText("Initial state"), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Add timer/ }));
    expect(state().timers.get(1)).toMatchObject({
      startState: 0,
      toggleAfter: 16,
      toggleBackAfter: 24,
    });
    fireEvent.click(screen.getByRole("button", { name: "Remove timer" }));
    expect(state().timers.size).toBe(0);
    fireEvent.change(screen.getByLabelText("Gate channel"), {
      target: { value: "" },
    });
    expect(state().gates.size).toBe(0);
    act(() => state().set({ selectedIndex: 2, selection: [] }));
    fireEvent.change(screen.getByLabelText("Switch channel"), {
      target: { value: "H" },
    });
    expect(state().switches.get(2)).toBe("H");
    fireEvent.click(screen.getByRole("button", { name: /Delete/ }));
    expect(state().grid[2]).toBe("0");
  });
  it("finds/cancels search, changes damage policy, shows progress and all results, replays and hides routes", () => {
    const find = vi.fn();
    render(<PropertiesPanel findRoute={find} />);
    fireEvent.click(screen.getByRole("button", { name: /Find best route/ }));
    expect(find).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(state().allowDamage).toBe(true);
    act(() => state().set({ searchRunning: true, searchExpanded: 10000 }));
    expect(screen.getByRole("status").textContent).toContain("10,000");
    fireEvent.click(screen.getByRole("button", { name: /^Cancel search/ }));
    expect(find).toHaveBeenCalledTimes(2);
    const route = {
      status: "optimal" as const,
      score: 500,
      turns: 2,
      stars: 3,
      crashes: 0,
      expanded: 1,
      path: [{ row: 0, col: 1, direction: 1 as const, time: 0 }],
    };
    act(() => state().set({ searchRunning: false, route }));
    fireEvent.click(screen.getByRole("button", { name: /Watch route/ }));
    expect(state().testAutopilot).toBe(true);
    act(() => state().exitTest());
    fireEvent.click(screen.getByRole("button", { name: "Hide route" }));
    expect(state().route).toBeNull();
    act(() => state().set({ route: { ...route, status: "limited" } }));
    expect(screen.getByText("SEARCH LIMIT REACHED")).toBeDefined();
    act(() =>
      state().set({ route: { ...route, status: "unreachable", path: [] } }),
    );
    expect(screen.getByText("NO ROUTE")).toBeDefined();
  });
  it("timer form follows initial-state semantics and disables malformed durations", () => {
    const save = vi.fn(),
      remove = vi.fn(),
      base = {
        index: 1,
        row: 1,
        col: 1,
        count: 1,
        timer: null,
        onSave: save,
        onRemove: remove,
      };
    const { rerender } = render(<TimerEditor {...base} />);
    fireEvent.change(screen.getByLabelText("First duration"), {
      target: { value: "0" },
    });
    expect(
      screen
        .getByRole("button", { name: "Add timer" })
        .hasAttribute("disabled"),
    ).toBe(true);
    fireEvent.change(screen.getByLabelText("First duration"), {
      target: { value: "8" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add timer" }));
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ toggleAfter: 8 }),
    );
    rerender(
      <TimerEditor
        {...base}
        index={2}
        count={3}
        timer={{
          startState: 0,
          toggleAfter: 8,
          toggleBackAfter: 16,
          rowDelay: 0,
          colDelay: 0,
          ownDelay: 0,
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Apply timer/ }));
    fireEvent.click(screen.getByRole("button", { name: "Remove timer" }));
    expect(remove).toHaveBeenCalled();
  });
});
describe("JSON and help dialogs", () => {
  it("opens a single level, validates bad text without replacing current work, supports cancel/outside close", () => {
    act(() => state().set({ showDialog: "import" }));
    const { container } = render(<ImportExportDialog />);
    const input = screen.getByLabelText("Level JSON");
    fireEvent.change(input, { target: { value: "bad" } });
    expect(screen.getByRole("alert")).toBeDefined();
    expect(state().name).toBe("Test level");
    fireEvent.change(input, {
      target: { value: JSON.stringify({ ...level(), name: "Imported" }) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Open level" }));
    expect(state().name).toBe("Imported");
    expect(state().showDialog).toBeNull();
    fireEvent.pointerDown(container.querySelector(".dialog-overlay")!);
    expect(state().showDialog).toBeNull();
  });
  it("imports a whole collection, browses packs and levels, and restores focus/traps Tab", () => {
    act(() => state().set({ showDialog: "import" }));
    render(<ImportExportDialog />);
    const p = {
      ...packs(),
      20: {
        _type: "levelpack" as const,
        name: "Other",
        levels: [{ ...level(10, 4, "b"), name: "Other level" }],
      },
    };
    fireEvent.change(screen.getByLabelText("Level JSON"), {
      target: { value: JSON.stringify(p) },
    });
    fireEvent.change(screen.getByLabelText("Pack"), {
      target: { value: "20" },
    });
    fireEvent.change(screen.getByLabelText("Level"), {
      target: { value: "b" },
    });
    const dialog = screen.getByRole("dialog"),
      buttons = within(dialog).getAllByRole("button");
    buttons[0].focus();
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(buttons.at(-1));
    fireEvent.keyDown(window, { key: "Tab" });
    expect(document.activeElement).toBe(buttons[0]);
    fireEvent.click(
      screen.getByRole("button", { name: "Open selected level" }),
    );
    expect(state().levelId).toBe("b");
    expect(state().library["20"].name).toBe("Other");
  });
  it("reads selected files, handles malformed files/read errors and empty selection", async () => {
    act(() => state().set({ showDialog: "import" }));
    render(<ImportExportDialog />);
    const file = screen.getByLabelText("JSON file");
    fireEvent.change(file, { target: { files: [] } });
    const f = new File([""], "level.json", { type: "application/json" });
    Object.defineProperty(f, "text", {
      value: async () => JSON.stringify(level()),
    });
    await act(async () => fireEvent.change(file, { target: { files: [f] } }));
    expect(
      (screen.getByLabelText("Level JSON") as HTMLTextAreaElement).value,
    ).toContain("Test level");
    const broken = new File([""], "bad.json");
    Object.defineProperty(broken, "text", {
      value: async () => {
        throw new Error("cannot read");
      },
    });
    await act(async () =>
      fireEvent.change(file, { target: { files: [broken] } }),
    );
    expect(screen.getByRole("alert").textContent).toContain("cannot read");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(state().showDialog).toBeNull();
  });
  it("downloads level/packs, reports clipboard success and failure, and closes with its button", async () => {
    const download = vi
      .spyOn(repository, "downloadJSON")
      .mockImplementation(() => {});
    act(() => state().set({ showDialog: "export" }));
    render(<ImportExportDialog />);
    fireEvent.click(
      screen.getByRole("button", { name: "Download level JSON" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Download all packs" }));
    expect(download).toHaveBeenCalledTimes(2);
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Copy level JSON" })),
    );
    expect(screen.getByRole("button", { name: "Copied ✓" })).toBeDefined();
    writeText.mockRejectedValue(new Error("denied"));
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Copied ✓" })),
    );
    expect(screen.getByText(/Clipboard unavailable/)).toBeDefined();
    fireEvent.click(screen.getByLabelText("Close dialog"));
    expect(state().showDialog).toBeNull();
  });
  it("shows the shortcut guide with every nested-menu and playtest key", () => {
    act(() => state().set({ showDialog: "help" }));
    render(<ImportExportDialog />);
    expect(screen.getByRole("dialog").textContent).toContain("2 → 1–9");
    expect(screen.getByRole("dialog").textContent).toContain(
      "switches start off",
    );
  });
  it("rejects invalid level data and empty pack selections without replacing the document", () => {
    act(() => state().set({ showDialog: "import" }));
    render(<ImportExportDialog />);
    fireEvent.change(screen.getByLabelText("Level JSON"), {
      target: { value: JSON.stringify({ ...level(), width: 0 }) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Open level" }));
    expect(screen.getByRole("alert").textContent).toContain("Width");
    expect(state().width).toBe(4);
    fireEvent.change(screen.getByLabelText("Level JSON"), {
      target: {
        value: JSON.stringify({ "10": { _type: "levelpack", levels: [] } }),
      },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Open selected level" }),
    );
    expect(screen.getByRole("alert").textContent).toContain("Choose a level");
  });
});
