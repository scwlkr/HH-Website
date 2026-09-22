import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Runs inside the existing authenticated, isolated Firebase smoke scenario.
export async function verifyHHQInterface({ page, baseUrl, axePath }) {
  const output = path.join(process.cwd(), "output/playwright/hhq-redesign");
  await mkdir(output, { recursive: true });
  const evidence = { routes: [], viewports: [], checks: [] };
  const failures = [];
  async function inspect(name) {
    await page.evaluate(() => document.fonts.ready);
    await page.addScriptTag({ path: axePath });
    const result = await page.evaluate(async () => {
      const audit = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag22aa"] } });
      return { overflow: document.documentElement.scrollWidth > innerWidth + 1, violations: audit.violations.filter((item) => ["serious", "critical"].includes(item.impact)).map((item) => ({ id: item.id, nodes: item.nodes.map((node) => node.target) })) };
    });
    await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true, animations: "disabled" });
    if (result.overflow || result.violations.length) failures.push(`HHQ ${name}: ${JSON.stringify(result)}`);
    evidence.routes.push({ name, ...result });
  }
  for (const route of ["", "/search?q=private", "/activity", "/tasks", "/people", "/systems", "/reports", "/integrations", "/settings", "/help"]) {
    const response = await fetch(`${baseUrl}/admin${route}`, { redirect: "manual" });
    if (![303, 307, 308].includes(response.status) || !response.headers.get("location")?.includes("/admin/login")) throw new Error(`Anonymous access was not denied for /admin${route}`);
  }
  evidence.checks.push("All new routes deny anonymous access");
  await page.setViewportSize({ width: 1672, height: 940 });
  await page.goto(`${baseUrl}/admin`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /Good (morning|afternoon|evening), team/ }).waitFor();
  await page.getByRole("combobox", { name: "Dashboard date range" }).selectOption("0");
  await page.getByRole("link", { name: "Published Project Smoke", exact: true }).first().waitFor();
  const allTimeCount = Number(await page.locator(".hhq-stat").first().locator("strong").innerText());
  await page.getByRole("combobox", { name: "Dashboard date range" }).selectOption("7");
  const recentCount = Number(await page.locator(".hhq-stat").first().locator("strong").innerText());
  if (!(allTimeCount > recentCount)) throw new Error("Dashboard date filter did not exclude historical inquiry fixtures.");
  await page.getByRole("combobox", { name: "Dashboard date range" }).selectOption("0");
  await inspect("dashboard-desktop");
  await page.getByRole("combobox", { name: "Task chart interval" }).selectOption("daily");
  await page.getByRole("img", { name: /Illustrative daily task activity/ }).waitFor();
  await page.getByRole("combobox", { name: "Task chart interval" }).selectOption("weekly");
  evidence.checks.push("Dashboard real records, date range and chart interval");
  await page.keyboard.press("Control+k");
  await page.getByRole("dialog", { name: "Search your workspace" }).waitFor();
  await page.getByRole("textbox", { name: "Search projects and inquiries" }).fill("Published Project Smoke");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.waitForURL(/\/admin\/search\?q=/);
  await page.getByRole("link", { name: /Published Project Smoke/ }).waitFor();
  await inspect("search-desktop");
  evidence.checks.push("Keyboard search and authenticated record results");
  for (const section of ["projects", "inquiries", "tasks", "people", "systems", "reports", "integrations", "settings", "settings/pricing", "activity", "help"]) {
    await page.goto(`${baseUrl}/admin/${section}`, { waitUntil: "networkidle" });
    await inspect(section.replaceAll("/", "-") + "-desktop");
  }
  await page.goto(`${baseUrl}/admin/tasks`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Completed", exact: true }).click();
  if (await page.getByRole("heading", { name: "Review the new project brief" }).count()) throw new Error("Task filter did not hide the other sample tasks.");
  await page.getByRole("button", { name: /Publish a completed home/ }).click();
  await page.getByRole("dialog").getByText("This is a sample task. Task changes and assignments are not saved yet.").waitFor();
  await page.keyboard.press("Escape");
  evidence.checks.push("Sample task filtering, details and Escape dismissal");
  for (const width of [820, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`${baseUrl}/admin`, { waitUntil: "networkidle" });
    await page.getByRole("combobox", { name: "Dashboard date range" }).selectOption("0");
    await inspect(`dashboard-${width}`);
    evidence.viewports.push(width);
    if (width < 760) {
      await page.getByRole("button", { name: "Open navigation" }).click();
      await page.getByRole("dialog", { name: "Workspace navigation" }).getByRole("link", { name: "Tasks", exact: true }).click();
      await page.waitForURL(`${baseUrl}/admin/tasks`);
      await inspect(`tasks-${width}`);
      await page.getByRole("button", { name: "Your account" }).click();
      await page.getByRole("button", { name: "Sign Out" }).waitFor();
      await page.keyboard.press("Escape");
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseUrl}/admin/inquiries`, { waitUntil: "networkidle" });
  await writeFile(path.join(output, "summary.json"), JSON.stringify(evidence, null, 2) + "\n");
  if (failures.length) throw new Error(failures.join("\n"));
}
