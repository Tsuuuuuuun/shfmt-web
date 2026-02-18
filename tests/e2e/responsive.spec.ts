import { test, expect } from "@playwright/test";

test.describe("Responsive design", () => {
  test("editor uses stacked layout at 768px or below", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const editorContainer = page.locator(".editor-container");

    const gridCols = await editorContainer.evaluate((el) =>
      getComputedStyle(el).gridTemplateColumns
    );
    expect(gridCols.split(" ")).toHaveLength(1);
  });

  test("editor uses side-by-side layout at 1024px or above", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");

    const editorContainer = page.locator(".editor-container");

    const gridCols = await editorContainer.evaluate((el) =>
      getComputedStyle(el).gridTemplateColumns
    );
    expect(gridCols.split(" ")).toHaveLength(2);
  });
});
