import { cp, mkdir, readdir, rm, stat, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extensionDir = path.join(rootDir, "extension");
const distDir = path.join(rootDir, "dist");

const manifestByTarget = {
  chrome: "manifest.chrome.json",
  firefox: "manifest.firefox.json"
};

async function copyExtensionSource(sourceDir, targetDir) {
  await mkdir(targetDir, { recursive: true });
  const entries = await readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (/^manifest\.(chrome|firefox)\.json$/.test(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      await copyExtensionSource(sourcePath, targetPath);
      continue;
    }

    if (entry.isFile()) {
      await cp(sourcePath, targetPath);
    }
  }
}

async function buildTarget(target, manifestFile) {
  const targetDir = path.join(distDir, target);
  await rm(targetDir, { recursive: true, force: true });
  await copyExtensionSource(extensionDir, targetDir);
  await copyFile(path.join(extensionDir, manifestFile), path.join(targetDir, "manifest.json"));

  const manifestStat = await stat(path.join(targetDir, "manifest.json"));
  if (!manifestStat.isFile()) {
    throw new Error(`Missing generated manifest for ${target}`);
  }
}

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

for (const [target, manifestFile] of Object.entries(manifestByTarget)) {
  await buildTarget(target, manifestFile);
}

console.log("Built extension targets: dist/chrome, dist/firefox");
