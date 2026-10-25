import { test, expect } from "@playwright/test";
test("published subpath loads original assets, solves and replays a level", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const missing: string[] = [];
  page.on("response", (response) => {
    if (response.status() >= 400) missing.push(response.url());
  });
  await page.goto("./");
  await expect(
    page.getByText("Easy lab", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByAltText("Snabbit")).toHaveJSProperty(
    "naturalWidth",
    512,
  );
  await expect(
    page.getByRole("button", { name: /Save to repo/ }),
  ).toBeDisabled();
  await page.getByRole("button", { name: /Find best route/ }).click();
  await expect(page.getByText("OPTIMAL ROUTE")).toBeVisible();
  await page.getByRole("button", { name: /Watch route/ }).click();
  await expect(page.getByText("LEVEL COMPLETE", { exact: true })).toBeVisible({
    timeout: 15000,
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /Playtest/ })).toBeVisible();
  expect(errors).toEqual([]);
  expect(missing).toEqual([]);
});
test("number menus, pack4 library and JSON downloads work in the standalone build", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.getByLabel("Level pack")).toBeVisible();
  await page.getByLabel("Level pack").selectOption("40");
  await page.getByRole("button", { name: /01 One Small Push/ }).click();
  await expect(page.getByLabel("Level name")).toHaveValue("A Little Push");
  await page.keyboard.press("2");
  await page.keyboard.press("9");
  await page.keyboard.press("4");
  await expect(
    page.getByRole("button", { name: "Paint Switch", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Export…" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download level JSON" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^4002-.*\.json$/);
  expect(await download.failure()).toBeNull();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
