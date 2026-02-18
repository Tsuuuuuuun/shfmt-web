import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const VALID_SCRIPT = readFileSync(
  resolve(__dirname, "../fixtures/valid.sh"),
  "utf-8"
);

test.describe("フォーマット機能", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("status-text")).toHaveText(
      /WASM loaded/,
      { timeout: 10_000 }
    );
  });

  test("正常なスクリプトをフォーマットできる", async ({ page }) => {
    const input = page.getByTestId("input-editor");
    const output = page.getByTestId("output-area");
    const formatBtn = page.getByTestId("format-button");

    await input.fill(VALID_SCRIPT);
    await formatBtn.click();

    // Wait for formatting to complete
    await expect(output).not.toContainText(
      "Formatted output will appear here",
      { timeout: 10_000 }
    );

    const outputText = await output.textContent();
    expect(outputText).toBeTruthy();
    expect(outputText).toContain("if [ -f ");
  });

  test("空の入力では出力が初期状態のまま", async ({ page }) => {
    const input = page.getByTestId("input-editor");
    const output = page.getByTestId("output-area");
    const formatBtn = page.getByTestId("format-button");

    await input.fill("");
    await formatBtn.click();

    await expect(output).toContainText("Formatted output will appear here");
  });

  test("構文エラーのあるスクリプトでエラーが表示される", async ({
    page,
  }) => {
    const invalidScript = readFileSync(
      resolve(__dirname, "../fixtures/invalid.sh"),
      "utf-8"
    );

    const input = page.getByTestId("input-editor");
    const output = page.getByTestId("output-area");
    const formatBtn = page.getByTestId("format-button");

    await input.fill(invalidScript);
    await formatBtn.click();

    // Wait for output to change from placeholder
    await expect(output).not.toContainText(
      "Formatted output will appear here",
      { timeout: 10_000 }
    );

    const outputText = await output.textContent();
    expect(outputText).toBeTruthy();
    // shfmt error messages contain "must" (e.g., "must end with `fi`")
    // or standard error indicators
    expect(outputText?.toLowerCase()).toMatch(/must|error|unexpected|expected/);
  });

  test("Ctrl/Meta+Enter でフォーマットが実行される", async ({ page }) => {
    const input = page.getByTestId("input-editor");
    const output = page.getByTestId("output-area");

    await input.fill(VALID_SCRIPT);

    // Use Meta+Enter on Mac (WebKit/Safari), Control+Enter otherwise
    const isMac = process.platform === "darwin";
    await page.keyboard.press(isMac ? "Meta+Enter" : "Control+Enter");

    await expect(output).not.toContainText(
      "Formatted output will appear here",
      { timeout: 10_000 }
    );

    const outputText = await output.textContent();
    expect(outputText).toBeTruthy();
  });
});
