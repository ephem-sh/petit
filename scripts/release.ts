import { parseArgs } from "node:util";
import { resolve } from "node:path";

type BumpType = "patch" | "minor" | "major";

interface PackageConfig {
  dir: string;
  versionFile: string;
  displayName: string;
  commitPrefix: string;
}

const PACKAGES: Record<string, PackageConfig> = {
  petit: {
    dir: "packages/petit",
    versionFile: "packages/petit/package.json",
    displayName: "@ephem-sh/petit",
    commitPrefix: "release(petit)",
  },
};

const ROOT = resolve(import.meta.dirname!, "..");

function bumpVersion(version: string, bump: BumpType): string {
  const [major, minor, patch] = version.split(".").map(Number);
  switch (bump) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
  }
}

async function git(...args: string[]): Promise<string> {
  const proc = Bun.spawn(["git", ...args], {
    cwd: ROOT,
    stdout: "pipe",
    stderr: "pipe",
  });
  const text = await new Response(proc.stdout).text();
  await proc.exited;
  return text.trim();
}

async function getCommitsSince(prefix: string): Promise<string[]> {
  const lastRelease = await git(
    "log",
    "--all",
    "--format=%H",
    `--grep=${prefix}:`,
    "-1",
  );

  const range = lastRelease ? `${lastRelease}..HEAD` : "HEAD";
  const log = await git(
    "log",
    range,
    "--format=%s",
    "--no-merges",
  );

  return log ? log.split("\n").filter(Boolean) : [];
}

function formatDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function prependChangelog(
  pkg: PackageConfig,
  version: string,
  commits: string[],
): Promise<void> {
  const changelogPath = resolve(ROOT, pkg.dir, "CHANGELOG.md");
  const file = Bun.file(changelogPath);

  const existing = (await file.exists()) ? await file.text() : "# Changelog\n";

  const entry = [
    `## ${version} (${formatDate()})`,
    "",
    ...(commits.length > 0
      ? commits.map((c) => `- ${c}`)
      : ["- Version bump"]),
    "",
  ].join("\n");

  const headerEnd = existing.indexOf("\n") + 1;
  const updated =
    existing.slice(0, headerEnd) + "\n" + entry + "\n" + existing.slice(headerEnd);

  await Bun.write(changelogPath, updated);
}

async function confirm(message: string): Promise<boolean> {
  process.stdout.write(`${message} [y/N] `);
  for await (const line of console) {
    return line.trim().toLowerCase() === "y";
  }
  return false;
}

async function releasePackage(
  name: string,
  pkg: PackageConfig,
  bump: BumpType,
  dry: boolean,
): Promise<boolean> {
  const pkgJsonPath = resolve(ROOT, pkg.versionFile);
  const pkgJson = await Bun.file(pkgJsonPath).json();
  const currentVersion: string = pkgJson.version;
  const nextVersion = bumpVersion(currentVersion, bump);
  const commits = await getCommitsSince(pkg.commitPrefix);

  console.log(`\n--- ${pkg.displayName} ---`);
  console.log(`  ${currentVersion} -> ${nextVersion} (${bump})`);
  console.log(`  ${commits.length} commit(s) since last release`);
  if (commits.length > 0) {
    for (const c of commits.slice(0, 20)) {
      console.log(`    - ${c}`);
    }
    if (commits.length > 20) {
      console.log(`    ... and ${commits.length - 20} more`);
    }
  }

  if (dry) {
    console.log("  (dry run, skipping)");
    return false;
  }

  const ok = await confirm(`  Release ${pkg.displayName}@${nextVersion}?`);
  if (!ok) {
    console.log("  Skipped.");
    return false;
  }

  pkgJson.version = nextVersion;
  await Bun.write(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + "\n");

  await prependChangelog(pkg, nextVersion, commits);

  const changelogPath = resolve(ROOT, pkg.dir, "CHANGELOG.md");
  await git("add", pkgJsonPath, changelogPath);
  await git("commit", "-m", `${pkg.commitPrefix}: v${nextVersion}`);

  console.log(`  Released ${pkg.displayName}@${nextVersion}`);
  return true;
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      dry: { type: "boolean", default: false },
    },
    allowPositionals: true,
    strict: true,
  });

  const target = positionals[0];
  const bump: BumpType = (positionals[1] as BumpType) ?? "patch";

  if (!target) {
    console.error("Usage: bun release <package|all> [patch|minor|major] [--dry]");
    process.exit(1);
  }

  if (!["patch", "minor", "major"].includes(bump)) {
    console.error(`Invalid bump type: ${bump}. Use patch, minor, or major.`);
    process.exit(1);
  }

  const dry = values.dry ?? false;

  const targets =
    target === "all"
      ? Object.entries(PACKAGES)
      : [[target, PACKAGES[target]] as const].filter(([, v]) => v);

  if (targets.length === 0) {
    console.error(`Unknown package: ${target}`);
    console.error(`Available: ${Object.keys(PACKAGES).join(", ")}, all`);
    process.exit(1);
  }

  let released = 0;
  for (const [name, pkg] of targets) {
    const did = await releasePackage(name as string, pkg as PackageConfig, bump, dry);
    if (did) released++;
  }

  if (released > 0) {
    console.log(`\nPush when ready: git push`);
  }
}

main();
