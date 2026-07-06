import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Changelog engine for this repo. Parses Conventional Commits since the last
 * release and renders grouped markdown. Used both by `bun changelog` (refresh
 * the [Unreleased] section) and by the release script (promote [Unreleased] to
 * a versioned section).
 */

const ROOT = resolve(import.meta.dirname!, "..");

/** Marker prefix of a release commit, e.g. "release(petit): v1.2.3". */
const RELEASE_PREFIX = "release(petit)";

/** A single parsed commit. */
export interface Commit {
  hash: string;
  type: string;
  scope?: string;
  breaking: boolean;
  subject: string;
}

/** Heading shown for each commit type, in display order. */
const TYPE_HEADINGS: Array<[string, string]> = [
  ["feat", "Features"],
  ["fix", "Fixes"],
  ["perf", "Performance"],
  ["refactor", "Refactoring"],
  ["docs", "Documentation"],
  ["build", "Build"],
  ["ci", "CI"],
  ["test", "Tests"],
  ["style", "Styles"],
  ["revert", "Reverts"],
  ["chore", "Chores"],
  ["other", "Other"],
];

const KNOWN_TYPES = new Set(TYPE_HEADINGS.map(([t]) => t));

const FILE_HEADER = "# Changelog\n\nAll notable changes to this project are documented here.\nThis file is generated from Conventional Commit messages.\n";
const UNRELEASED_HEADING = "## [Unreleased]";
const EMPTY_BODY = "_Nothing yet._";

async function git(...args: string[]): Promise<string> {
  const proc = Bun.spawn(["git", ...args], { cwd: ROOT, stdout: "pipe", stderr: "pipe" });
  const text = await new Response(proc.stdout).text();
  await proc.exited;
  return text.trim();
}

/**
 * Hash of the most recent release commit in HEAD's history, or null if none.
 * Matches the commit SUBJECT only (e.g. "release(petit): v1.2.3"); grepping the
 * full message would false-match commit bodies that mention the marker.
 */
export async function lastReleaseRef(): Promise<string | null> {
  const out = await git("log", "HEAD", "--format=%H\x1f%s", "-n", "500");
  for (const line of out.split("\n")) {
    const [hash, subject = ""] = line.split("\x1f");
    if (/^release\(petit\): v\d/.test(subject)) return hash;
  }
  return null;
}

/** Parse a Conventional Commit subject into its parts. */
function parseSubject(subject: string): Omit<Commit, "hash"> {
  const m = subject.match(/^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/);
  if (!m) return { type: "other", breaking: false, subject };
  const type = m[1].toLowerCase();
  return {
    type: KNOWN_TYPES.has(type) ? type : "other",
    scope: m[2],
    breaking: Boolean(m[3]),
    subject: m[4],
  };
}

/**
 * Commits in `from` (exclusive) .. `to` (inclusive), newest first, optionally
 * limited to a path. `from` = null means "from the start of history".
 */
export async function getCommitsRange(from: string | null, to: string, pathFilter?: string): Promise<Commit[]> {
  const range = from ? `${from}..${to}` : to;
  const args = ["log", range, "--no-merges", "--format=%H\x1f%s"];
  if (pathFilter) args.push("--", pathFilter);
  const out = await git(...args);
  if (!out) return [];
  return out
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [hash, subject = ""] = line.split("\x1f");
      // Skip the release commits themselves.
      if (subject.startsWith(`${RELEASE_PREFIX}:`)) return null;
      return { hash, ...parseSubject(subject) };
    })
    .filter((c): c is Commit => c !== null);
}

/** Commits from `sinceRef` (exclusive) to HEAD. */
export async function getCommits(sinceRef: string | null, pathFilter?: string): Promise<Commit[]> {
  return getCommitsRange(sinceRef, "HEAD", pathFilter);
}

/** All release commits in HEAD's history (newest first), with version + date. */
async function getReleaseCommits(): Promise<Array<{ hash: string; version: string; date: string }>> {
  const out = await git("log", "HEAD", "--format=%H\x1f%s\x1f%cs", "-n", "1000");
  const rels: Array<{ hash: string; version: string; date: string }> = [];
  for (const line of out.split("\n").filter(Boolean)) {
    const [hash, subject = "", date = ""] = line.split("\x1f");
    const m = subject.match(/^release\(petit\): v(\d+\.\d+\.\d+)/);
    if (m) rels.push({ hash, version: m[1], date });
  }
  return rels;
}

/**
 * Reconstruct every past release section from git history, newest first.
 * Each version's changes are the commits between the previous release and it.
 */
async function buildHistory(pathFilter?: string): Promise<string> {
  const rels = await getReleaseCommits();
  const sections: string[] = [];
  for (let i = 0; i < rels.length; i++) {
    const from = rels[i + 1]?.hash ?? null; // previous (older) release, or start of history
    const commits = await getCommitsRange(from, rels[i].hash, pathFilter);
    const body = renderSection(commits).trimEnd();
    sections.push(`## [${rels[i].version}] - ${rels[i].date}\n\n${body}\n`);
  }
  return sections.join("\n");
}

/** Render commits as grouped markdown (### Features, ### Fixes, ...). */
export function renderSection(commits: Commit[]): string {
  if (commits.length === 0) return `${EMPTY_BODY}\n`;

  const byType = new Map<string, Commit[]>();
  for (const c of commits) {
    const list = byType.get(c.type) ?? [];
    list.push(c);
    byType.set(c.type, list);
  }

  const lines: string[] = [];
  const breaking = commits.filter((c) => c.breaking);
  if (breaking.length) {
    lines.push("### ⚠ Breaking Changes", "");
    for (const c of breaking) lines.push(`- ${formatCommit(c)}`);
    lines.push("");
  }

  for (const [type, heading] of TYPE_HEADINGS) {
    const list = byType.get(type);
    if (!list?.length) continue;
    lines.push(`### ${heading}`, "");
    for (const c of list) lines.push(`- ${formatCommit(c)}`);
    lines.push("");
  }

  return lines.join("\n");
}

function formatCommit(c: Commit): string {
  const scope = c.scope ? `**${c.scope}:** ` : "";
  return `${scope}${c.subject} (${c.hash.slice(0, 7)})`;
}

/** Split a changelog file into its released-versions tail (everything from the first version heading). */
function releasedTail(raw: string): string {
  const lines = raw.split("\n");
  const idx = lines.findIndex((l) => /^## /.test(l) && !/^## \[?unreleased/i.test(l));
  return idx === -1 ? "" : lines.slice(idx).join("\n").trimEnd() + "\n";
}

function readOrInit(path: string): string {
  return existsSync(path) ? readFileSync(path, "utf-8") : `${FILE_HEADER}`;
}

/** Rewrite the [Unreleased] section of a changelog file with the given commits. */
export function refreshUnreleased(path: string, commits: Commit[]): void {
  const tail = releasedTail(readOrInit(path));
  const body = renderSection(commits).trimEnd();
  const out = `${FILE_HEADER}\n${UNRELEASED_HEADING}\n\n${body}\n${tail ? `\n${tail}` : "\n"}`;
  writeFileSync(path, out, "utf-8");
}

/**
 * Promote [Unreleased] to a versioned section and reset a fresh empty
 * [Unreleased]. Returns the rendered version-section body (for release notes).
 */
export function promoteRelease(path: string, version: string, date: string, commits: Commit[]): string {
  const tail = releasedTail(readOrInit(path));
  const body = renderSection(commits).trimEnd();
  const versionSection = `## [${version}] - ${date}\n\n${body}\n`;
  const out = `${FILE_HEADER}\n${UNRELEASED_HEADING}\n\n${EMPTY_BODY}\n\n${versionSection}${tail ? `\n${tail}` : ""}`;
  writeFileSync(path, out, "utf-8");
  return body;
}

/** Paths of the changelog files this repo maintains. */
export const CHANGELOGS = {
  root: resolve(ROOT, "CHANGELOG.md"),
  petit: resolve(ROOT, "packages/petit/CHANGELOG.md"),
} as const;

/** Path filter that scopes commits to the petit package. */
export const PETIT_PATH = "packages/petit";

/** Write a changelog from scratch: header + [Unreleased] + a prebuilt history body. */
function writeFullChangelog(path: string, commits: Commit[], historyBody: string): void {
  const body = renderSection(commits).trimEnd();
  const history = historyBody.trimEnd();
  const out = `${FILE_HEADER}\n${UNRELEASED_HEADING}\n\n${body}\n${history ? `\n${history}\n` : "\n"}`;
  writeFileSync(path, out, "utf-8");
}

/**
 * `bun changelog` — refresh the [Unreleased] section of both changelogs.
 * `bun changelog --backfill` — additionally rebuild the ROOT changelog with a
 * full reconstructed history of every past release, from git.
 */
async function main(): Promise<void> {
  const backfill = Bun.argv.includes("--backfill");
  const since = await lastReleaseRef();
  const rootCommits = await getCommits(since);
  const petitCommits = await getCommits(since, PETIT_PATH);

  if (backfill) {
    const history = await buildHistory();
    writeFullChangelog(CHANGELOGS.root, rootCommits, history);
    refreshUnreleased(CHANGELOGS.petit, petitCommits);
    console.log(`Backfilled root CHANGELOG with full history + [Unreleased] (${rootCommits.length} unreleased commit(s))`);
    return;
  }

  refreshUnreleased(CHANGELOGS.root, rootCommits);
  refreshUnreleased(CHANGELOGS.petit, petitCommits);

  const rel = since ? `${since.slice(0, 7)}..HEAD` : "all history";
  console.log(`Refreshed [Unreleased] from ${rel}`);
  console.log(`  root:  ${rootCommits.length} commit(s)`);
  console.log(`  petit: ${petitCommits.length} commit(s)`);
}

if (import.meta.main) {
  await main();
}
