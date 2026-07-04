const fs = require("fs");
const path = require("path");

const changelogPath = path.join(__dirname, "../CHANGELOG.md");
const packageJsonPath = path.join(__dirname, "../package.json");
const outputPath = path.join(__dirname, "../release-note.md");

let packageVersion = "0.0.1";
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  packageVersion = packageJson.version;
} catch (e) {
  console.warn("Failed to read package.json version:", e.message);
}

let content = "";

if (fs.existsSync(changelogPath)) {
  const changelog = fs.readFileSync(changelogPath, "utf8");

  // Match the first ## [Version] entry down to the next ## [Version] entry or end of file
  const regex = /(##\s+\d+\.\d+\.\d+[^]*?)(?=\n##\s+\d+\.\d+\.\d+|$)/;
  const match = changelog.match(regex);

  if (match) {
    content = match[1].trim();
  }
}

if (!content) {
  console.warn("CHANGELOG.md is empty or does not match version pattern. Generating fallback release-note.md.");
  content = `## ${packageVersion}\n\n- Build release for version ${packageVersion}`;
}

fs.writeFileSync(outputPath, content + "\n", "utf8");
console.log(`Successfully generated release-note.md for version.`);
