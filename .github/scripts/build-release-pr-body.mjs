import fs from "node:fs/promises";
import path from "node:path";

const [statusPath, outputPath] = process.argv.slice(2);

if (!statusPath || !outputPath) {
  console.error(
    "Usage: node .github/scripts/build-release-pr-body.mjs <status.json> <body.md>",
  );
  process.exit(1);
}

const rootDir = process.cwd();
const status = JSON.parse(await fs.readFile(statusPath, "utf8"));
const packagesByName = await getPackagesByName(rootDir);
const changesetsById = new Map(
  status.changesets.map((changeset) => [changeset.id, changeset]),
);

const releaseBlocks = await Promise.all(
  status.releases.map(async (release) => {
    const pkg = packagesByName.get(release.name);
    const header = `## ${release.name}@${release.newVersion}`;

    if (pkg) {
      const changelogPath = path.join(pkg.dir, "CHANGELOG.md");
      const changelog = await readOptionalFile(changelogPath);
      if (changelog) {
        const entry = getChangelogEntry(changelog, release.newVersion);
        if (entry) return `${header}\n\n${entry}`;
      }
    }

    return `${header}\n\n${fallbackReleaseNotes(release, changesetsById)}`;
  }),
);

const body = [
  "This PR was opened by the Changesets CLI release workflow. When you're ready to do a release, merge this and publish the Ruby gem manually. If you're not ready to do a release yet, that's fine; whenever you add more changesets to main, this PR will be updated.",
  "",
  "# Releases",
  ...releaseBlocks,
]
  .join("\n")
  .trimEnd();

await fs.writeFile(outputPath, `${body}\n`);

async function getPackagesByName(dir) {
  const packages = new Map();
  for (const packageJsonPath of await findPackageJsonFiles(dir)) {
    const pkg = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
    if (pkg.name) {
      packages.set(pkg.name, {
        dir: path.dirname(packageJsonPath),
        packageJson: pkg,
      });
    }
  }
  return packages;
}

async function findPackageJsonFiles(dir) {
  const ignoredDirs = new Set([
    ".changesets-checkout",
    ".git",
    "node_modules",
    "vendor",
  ]);
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !ignoredDirs.has(entry.name)) {
      files.push(...(await findPackageJsonFiles(entryPath)));
    } else if (entry.isFile() && entry.name === "package.json") {
      files.push(entryPath);
    }
  }

  return files;
}

async function readOptionalFile(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return undefined;
    throw error;
  }
}

function getChangelogEntry(changelog, version) {
  const headingRegex = /^(#{1,6})\s(.*)$/gm;
  let match;
  let start;
  let depth;
  let end;

  while ((match = headingRegex.exec(changelog))) {
    const headingDepth = match[1].length;
    const headingText = match[2].trim();

    if (headingText === version) {
      start = headingRegex.lastIndex;
      depth = headingDepth;
      continue;
    }

    if (start !== undefined && headingDepth === depth) {
      end = match.index;
      break;
    }
  }

  if (start === undefined) return undefined;
  return changelog.slice(start, end).trim();
}

function fallbackReleaseNotes(release, changesetsById) {
  const changesets = release.changesets
    .map((id) => changesetsById.get(id))
    .filter(Boolean);
  const sections = [
    ["major", "Major Changes"],
    ["minor", "Minor Changes"],
    ["patch", "Patch Changes"],
  ];

  return sections
    .map(([type, title]) => {
      const summaries = changesets
        .filter((changeset) =>
          changeset.releases.some(
            (changesetRelease) =>
              changesetRelease.name === release.name &&
              changesetRelease.type === type,
          ),
        )
        .map((changeset) => `- ${changeset.summary}`);

      return summaries.length > 0
        ? [`### ${title}`, "", ...summaries].join("\n")
        : "";
    })
    .filter(Boolean)
    .join("\n\n");
}
