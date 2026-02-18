import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const VALID_SCRIPT = readFileSync(
  resolve(__dirname, "../fixtures/valid.sh"),
  "utf-8"
);

test.describe("UI interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("status-text")).toHaveText(
      /WASM loaded/,
      { timeout: 10_000 }
    );
  });

  test("Clear button resets input and output", async ({ page }) => {
    const input = page.getByTestId("input-editor");
    const output = page.getByTestId("output-area");

    await input.fill(VALID_SCRIPT);
    await page.getByTestId("format-button").click();
    await expect(output).not.toContainText(
      "Formatted output will appear here",
      { timeout: 10_000 }
    );

    await page.getByTestId("clear-button").click();

    await expect(input).toHaveValue("");
    await expect(output).toContainText("Formatted output will appear here");
  });

  test("Copy button copies output to clipboard", async ({
    page,
    context,
    browserName,
  }) => {
    // Clipboard permissions are only supported in Chromium
    if (browserName === "chromium") {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    }

    await page.getByTestId("input-editor").fill(VALID_SCRIPT);
    await page.getByTestId("format-button").click();

    const output = page.getByTestId("output-area");
    await expect(output).not.toContainText(
      "Formatted output will appear here",
      { timeout: 10_000 }
    );

    await page.getByTestId("copy-button").click();

    await expect(page.getByTestId("copy-button")).toHaveText("Copied!");

    await expect(page.getByTestId("copy-button")).toHaveText("Copy", {
      timeout: 3_000,
    });
  });

  test("Format button is enabled after WASM loads", async ({
    page,
  }) => {
    const formatBtn = page.getByTestId("format-button");

    await expect(page.getByTestId("status-text")).toHaveText(
      /WASM loaded/,
      { timeout: 10_000 }
    );
    await expect(formatBtn).toBeEnabled();
  });

  test("Status dot turns green after WASM loads", async ({
    page,
  }) => {
    await expect(page.getByTestId("status-text")).toHaveText(
      /WASM loaded/,
      { timeout: 10_000 }
    );

    const statusDot = page.getByTestId("status-dot");
    await expect(statusDot).toHaveCSS(
      "background-color",
      "rgb(161, 232, 154)"
    );
  });
});
