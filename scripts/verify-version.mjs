import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(rootDir, relativePath), "utf8"));
}

function fail(message) {
  throw new Error(message);
}

const packageJson = await readJson("package.json");
const chromeManifest = await readJson("extension/manifest.chrome.json");
const firefoxManifest = await readJson("extension/manifest.firefox.json");
const version = packageJson.version;

if (!/^\d+\.\d+\.\d+(?:\.\d+)?$/.test(version)) {
  fail(`package.json version must be a valid extension version, got ${version}`);
}

for (const [name, manifest] of [
  ["Chrome", chromeManifest],
  ["Firefox", firefoxManifest]
]) {
  if (manifest.version !== version) {
    fail(`${name} manifest version ${manifest.version} does not match package.json ${version}`);
  }
}

const refName = process.env.GITHUB_REF_NAME || "";
if (refName.startsWith("v") && refName !== `v${version}`) {
  fail(`Git tag ${refName} does not match package.json version v${version}`);
}

console.log(`Version check passed: ${version}`);
