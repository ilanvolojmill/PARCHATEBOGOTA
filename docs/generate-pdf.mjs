import { chromium } from "../apps/web/node_modules/playwright/index.mjs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = join(__dirname, "brief-parchexbogota.html");
const pdf = join(__dirname, "ParchexBogota-Brief-Ejecutivo.pdf");

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`file:///${html.replace(/\\/g, "/")}`, { waitUntil: "networkidle" });
await page.pdf({
  path: pdf,
  format: "A4",
  printBackground: true,
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
});
await browser.close();
console.log(pdf);
