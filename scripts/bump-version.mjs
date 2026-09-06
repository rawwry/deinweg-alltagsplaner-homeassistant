#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const newVersion = args[0];

if (!newVersion) {
  console.error('Fehler: Bitte eine Versionsnummer angeben (z. B. node scripts/bump-version.mjs 0.1.0-beta.2)');
  process.exit(1);
}

// Validate semver roughly (e.g. 0.1.0 or 0.1.0-beta.1)
const semverRegex = /^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$/;
if (!semverRegex.test(newVersion)) {
  console.error(`Fehler: "${newVersion}" entspricht nicht dem Format Semantic Versioning (z. B. 0.1.0-beta.2)`);
  process.exit(1);
}

console.log(`\nAktualisiere Projektversion auf v${newVersion}...`);

// 1. Update package.json
const packageJsonPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const oldVersion = pkg.version;
pkg.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`✓ package.json: ${oldVersion} -> ${newVersion}`);

// 2. Update config.yaml
const configYamlPath = path.join(rootDir, 'config.yaml');
if (fs.existsSync(configYamlPath)) {
  let configYaml = fs.readFileSync(configYamlPath, 'utf8');
  configYaml = configYaml.replace(/version:\s*"[^"]+"/, `version: "${newVersion}"`);
  fs.writeFileSync(configYamlPath, configYaml);
  console.log(`✓ config.yaml aktualisiert`);
}

// 3. Update shared/version.ts
const sharedVersionPath = path.join(rootDir, 'shared', 'version.ts');
if (fs.existsSync(sharedVersionPath)) {
  const content = `export const APP_VERSION = '${newVersion}';\nexport const APP_NAME = 'Dein Weg Alltagsplaner';\n`;
  fs.writeFileSync(sharedVersionPath, content);
  console.log(`✓ shared/version.ts aktualisiert`);
}

console.log(`\nErfolgreich synchronisiert! Vergiss nicht zu committen und zu taggen:\n`);
console.log(`  git add package.json config.yaml shared/version.ts CHANGELOG.md`);
console.log(`  git commit -m "chore(release): v${newVersion}"`);
console.log(`  git tag -a v${newVersion} -m "Release v${newVersion}"`);
console.log(`  git push origin main --tags\n`);
