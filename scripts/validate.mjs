import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { Script } from "node:vm";

const REQUIRED = ["id", "name", "description", "language", "category", "install", "repo"];
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateCatalog(tools) {
  const errors = [];
  if (!Array.isArray(tools)) return ["Catalog root must be a JSON array."];

  const ids = new Set();
  for (const [index, tool] of tools.entries()) {
    const prefix = `tools.json[${index}]`;
    if (!tool || typeof tool !== "object" || Array.isArray(tool)) {
      errors.push(`${prefix} must be an object.`);
      continue;
    }

    for (const key of REQUIRED) {
      if (typeof tool[key] !== "string" || !tool[key].trim()) {
        errors.push(`${prefix}: "${key}" is required and must be a non-empty string.`);
      }
    }

    if (typeof tool.id === "string" && tool.id) {
      if (!ID_PATTERN.test(tool.id)) errors.push(`${prefix}: id must use lowercase letters, numbers, and single hyphen separators.`);
      if (tool.id === "submit") errors.push(`${prefix}: id "submit" is reserved.`);
      if (ids.has(tool.id)) errors.push(`${prefix}: duplicate id "${tool.id}".`);
      ids.add(tool.id);
    }

    if (typeof tool.repo !== "undefined") {
      try {
        const url = new URL(tool.repo);
        if (url.protocol !== "https:" || !url.hostname || url.username || url.password) {
          errors.push(`${prefix}: repo must be a valid HTTPS URL without embedded credentials.`);
        }
      } catch {
        errors.push(`${prefix}: repo must be a valid HTTPS URL.`);
      }
    }

    if (typeof tool.install === "string" && /[\r\n\0]/.test(tool.install)) {
      errors.push(`${prefix}: install must be a single-line command.`);
    }
  }
  return errors;
}

async function main() {
  const file = resolve(process.cwd(), process.argv[2] ?? "tools.json");
  let tools;
  try {
    tools = JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    console.error(`Unable to read valid JSON from ${file}: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const errors = validateCatalog(tools);
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
    return;
  }
  const htmlPath = resolve(process.cwd(), "index.html");
  let html;
  try {
    html = await readFile(htmlPath, "utf8");
  } catch (error) {
    console.error(`Unable to read ${htmlPath}: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
  if (!inlineScripts.length) {
    console.error("index.html must contain at least one inline script.");
    process.exitCode = 1;
    return;
  }

  try {
    inlineScripts.forEach((match, index) => {
      new Script(match[1], { filename: `index.html:inline-script-${index + 1}` });
    });
  } catch (error) {
    console.error(`Inline JavaScript syntax error: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  console.log(`OK: ${tools.length} catalog entries and ${inlineScripts.length} inline script(s) validated.`);
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
