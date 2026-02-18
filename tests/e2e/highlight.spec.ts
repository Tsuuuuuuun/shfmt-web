import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const VALID_SCRIPT = readFileSync(
  resolve(__dirname, "../fixtures/valid.sh"),
  "utf-8"
);

const INVALID_SCRIPT = readFileSync(
  resolve(__dirname, "../fixtures/invalid.sh"),
  "utf-8"
);

test.describe("シンタックスハイライト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("status-text")).toHaveText(
      /WASM loaded/,
      { timeout: 10_000 }
    );
  });

  test("フォーマット成功時に pre.shiki と span 要素が生成される", async ({
    page,
  }) => {
    const input = page.getByTestId("input-editor");
    const output = page.getByTestId("output-area");

    await input.fill(VALID_SCRIPT);
    await page.getByTestId("format-button").click();

    await expect(output).not.toContainText(
      "Formatted output will appear here",
      { timeout: 10_000 }
    );

    // Shiki generates pre.shiki with span elements for tokens
    const preShiki = output.locator("pre.shiki");
    await expect(preShiki).toBeVisible({ timeout: 5_000 });

    const spans = preShiki.locator("span[style]");
    expect(await spans.count()).toBeGreaterThan(0);

    // Output area should have highlighted class
    await expect(output).toHaveClass(/highlighted/);
  });

  test("Copy ボタンがプレーンテキスト（HTML タグなし）をコピーする", async ({
    page,
    context,
    browserName,
  }) => {
    // Clipboard permissions are only supported in Chromium
    test.skip(browserName !== "chromium", "Clipboard API requires Chromium");

    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.getByTestId("input-editor").fill(VALID_SCRIPT);
    await page.getByTestId("format-button").click();

    const output = page.getByTestId("output-area");
    await expect(output).not.toContainText(
      "Formatted output will appear here",
      { timeout: 10_000 }
    );

    await page.getByTestId("copy-button").click();
    await expect(page.getByTestId("copy-button")).toHaveText("Copied!");

    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );

    // Clipboard content should be plain text without HTML tags
    expect(clipboardText).not.toContain("<span");
    expect(clipboardText).not.toContain("<pre");
    expect(clipboardText).toContain("if [ -f ");
  });

  test("エラー出力にはハイライトが適用されない", async ({ page }) => {
    const input = page.getByTestId("input-editor");
    const output = page.getByTestId("output-area");

    await input.fill(INVALID_SCRIPT);
    await page.getByTestId("format-button").click();

    await expect(output).not.toContainText(
      "Formatted output will appear here",
      { timeout: 10_000 }
    );

    // Error output should not have highlighted class or pre.shiki
    await expect(output).toHaveClass(/error/);
    await expect(output).not.toHaveClass(/highlighted/);
    expect(await output.locator("pre.shiki").count()).toBe(0);
  });

  test("Clear 後にプレースホルダーに戻り Shiki HTML が残らない", async ({
    page,
  }) => {
    const input = page.getByTestId("input-editor");
    const output = page.getByTestId("output-area");

    await input.fill(VALID_SCRIPT);
    await page.getByTestId("format-button").click();

    await expect(output.locator("pre.shiki")).toBeVisible({ timeout: 10_000 });

    await page.getByTestId("clear-button").click();

    await expect(output).toContainText("Formatted output will appear here");
    await expect(output).toHaveClass(/placeholder/);
    await expect(output).not.toHaveClass(/highlighted/);
    expect(await output.locator("pre.shiki").count()).toBe(0);
  });
});
