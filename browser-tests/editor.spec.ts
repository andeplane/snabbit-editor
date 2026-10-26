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
  await page.getByRole("button", { name: /01 First Light/ }).click();
  await expect(page.getByLabel("Level name")).toHaveValue("First Light");
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
test("Earn the Way Through earns its combo heart and replays a three-star damage route", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("./");
  await page.getByLabel("Level pack").selectOption("40");
  await page
    .getByRole("button", { name: /11 Earn the Way Through/ })
    .click();
  await expect(page.getByLabel("Level name")).toHaveValue(
    "Earn the Way Through",
  );
  const damage = page.getByLabel("Allow damage and use hearts");
  await damage.check();
  await expect(damage).toBeChecked();
  await page.getByRole("button", { name: /Find best route/ }).click();

  const result = page.locator(".route-result");
  await expect(result).toContainText("3/3 stars", { timeout: 120000 });
  await expect(result).toContainText("3 crashes");
  await result.getByRole("button", { name: /Watch route/ }).click();

  const hud = page.locator(".test-hud");
  // The actual replay must collect twelve gems and grow before paying the
  // three dirt impacts; checking the final solver summary alone misses this.
  await expect(hud).toContainText("♥♥♥♥", { timeout: 20000 });
  await expect(hud.getByText("LEVEL COMPLETE", { exact: true })).toBeVisible({
    timeout: 20000,
  });
  await expect(hud).toContainText("3/3 stars");
  await expect(hud).toContainText("♥ ·");
  await expect(hud).not.toContainText("♥♥");
  expect(errors).toEqual([]);
});
test("puzzle review loads all ten concepts and scrubs every real replay to completion and reset", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  const missing: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400)
      missing.push(`${response.status()} ${response.url()}`);
  });
  page.on("requestfailed", (request) => missing.push(request.url()));

  await page.goto("./puzzle-review.html");
  const navigation = page.getByRole("navigation", { name: "Choose puzzle" });
  await expect(navigation.getByRole("button")).toHaveCount(10);
  const names = [
    "Three Switches, One Door",
    "Borrowed Passage",
    "Buy One Beat",
    "Reverse the Rhythm",
    "Program the Exit",
    "Earn the Way Through",
    "Leave the Refund",
    "One Lever Only",
    "No Credit",
    "Spend a Heart, Save Turns",
  ];
  const range = page.getByLabel("Step", { exact: true });
  const stats = page.locator("#stats");
  for (const [index, name] of names.entries()) {
    const number = String(index + 1).padStart(2, "0");
    const button = navigation.getByRole("button", { name: number, exact: true });
    await button.click();
    await expect(page.getByRole("heading", { level: 2 })).toHaveText(
      `${number} · ${name}`,
    );
    await expect(button).toHaveAttribute("aria-pressed", "true");
    const concept = page.getByAltText(`ImageGen concept for ${name}`, {
      exact: true,
    });
    await expect(concept).toBeVisible();
    await expect(concept).toHaveAttribute(
      "src",
      new RegExp(`/puzzle-${number}/concept\\.png$`),
    );
    await expect
      .poll(() => concept.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(0);

    // Exercise the range's browser input event, not the review's internal state.
    await range.focus();
    await range.press("End");
    await expect(range).toHaveValue((await range.getAttribute("max"))!);
    await expect(stats).toContainText("Complete");
    await expect(stats).toContainText("★ 3/3");
    await expect(page.locator("#status")).not.toHaveClass("error");

    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(range).toHaveValue("0");
    await expect(stats).toHaveText(/^0\/\d+ · ♥ 3 · ★ 0\/3/);
    await expect(stats).not.toContainText("Complete");
    await expect(page.getByRole("button", { name: "Play solution", exact: true }))
      .toBeVisible();
  }
  expect(errors).toEqual([]);
  expect(missing).toEqual([]);
});
