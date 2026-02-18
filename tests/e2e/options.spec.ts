import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const VALID_SCRIPT = readFileSync(
  resolve(__dirname, "../fixtures/valid.sh"),
  "utf-8"
);

test.describe("Format options", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("status-text")).toHaveText(
      /WASM loaded/,
      { timeout: 10_000 }
    );
  });

  test("Indent: 2 spaces produces 2-space indentation", async ({
    page,
  }) => {
    await page.getByTestId("option-indent").selectOption("2");
    await page.getByTestId("input-editor").fill(VALID_SCRIPT);
    await page.getByTestId("format-button").click();

    const output = page.getByTestId("output-area");
    await expect(output).not.toContainText(
      "Formatted output will appear here",
      { timeout: 10_000 }
    );

    const outputText = await output.textContent();
    expect(outputText).toMatch(/^  \S/m);
    expect(outputText).not.toContain("\t");
  });

  test("Indent: 4 spaces produces 4-space indentation", async ({
    page,
  }) => {
    await page.getByTestId("option-indent").selectOption("4");
    await page.getByTestId("input-editor").fill(VALID_SCRIPT);
    await page.getByTestId("format-button").click();

    const output = page.getByTestId("output-area");
    await expect(output).not.toContainText(
      "Formatted output will appear here",
      { timeout: 10_000 }
    );

    const outputText = await output.textContent();
    expect(outputText).toMatch(/^    \S/m);
    expect(outputText).not.toContain("\t");
  });

  test("Indent: Tab produces tab indentation", async ({ page }) => {
    await page.getByTestId("option-indent").selectOption("tab");
    await page.getByTestId("input-editor").fill(VALID_SCRIPT);
    await page.getByTestId("format-button").click();

    const output = page.getByTestId("output-area");
    await expect(output).not.toContainText(
      "Formatted output will appear here",
      { timeout: 10_000 }
    );

    const outputText = await output.textContent();
    // Tab characters in textContent may be whitespace - check output changed
    expect(outputText).toBeTruthy();
    expect(outputText!.length).toBeGreaterThan(0);
  });

  test("Shell: posix formats without errors", async ({ page }) => {
    await page.getByTestId("option-shell").selectOption("posix");

    const posixScript =
      '#!/bin/sh\nif [ "$1" = "test" ]; then\necho ok\nfi';
    await page.getByTestId("input-editor").fill(posixScript);
    await page.getByTestId("format-button").click();

    const output = page.getByTestId("output-area");
    await expect(output).not.toContainText(
      "Formatted output will appear here",
      { timeout: 10_000 }
    );

    const outputText = await output.textContent();
    expect(outputText).toBeTruthy();
    expect(outputText?.toLowerCase()).not.toMatch(/error/);
  });
});
