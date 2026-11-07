import { readFile } from "node:fs/promises";

const file = new URL("../tools.json", import.meta.url);
let tools;

try {
  tools = JSON.parse(await readFile(file, "utf8"));
} catch (error) {
  console.error(`Invalid tools.json: ${error.message}`);
  process.exit(1);
}

const errors = [];
if (!Array.isArray(tools)) {
  console.error("tools.json must contain a JSON array.");
  process.exit(1);
}

const ids = new Set();
const required = ["id", "name", "description", "language", "category", "install"];

for (const [index, tool] of tools.entries()) {
  const prefix = `tools.json[${index}]`;
  if (!tool || typeof tool !== "object" || Array.isArray(tool)) {
    errors.push(`${prefix} must be an object.`);
    continue;
  }

  for (const key of required) {
    if (typeof tool[key] !== "string" || !tool[key].trim()) {
      errors.push(`${prefix}: "${key}" is required and must be a non-empty string.`);
    }
  }

  if (typeof tool.id === "string" && tool.id) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tool.id)) {
      errors.push(`${prefix}: id must use lowercase letters, numbers, and single hyphen separators.`);
    }
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

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`OK: ${tools.length} tools validated.`);
