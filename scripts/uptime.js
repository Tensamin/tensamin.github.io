"use strict";

const fsp = require("fs/promises");
const path = require("path");
const { performance } = require("perf_hooks");

const ROOT = process.cwd();
const CONFIG = path.join(ROOT, "sites.json");
const DATA_DIR = path.join(ROOT, "data");
const TIMEOUT = 10_000;
const MAX_CHECKS = 2000;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

async function readJsonMaybe(p, def) {
  try {
    const buf = await fsp.readFile(p, "utf8");
    return JSON.parse(buf);
  } catch {
    return def;
  }
}

function pruneChecks(checks, now = Date.now()) {
  const cutoff = now - MAX_AGE_MS;
  return checks.filter((check) => {
    if (!check || !check.t) return false;
    const ts = new Date(check.t).getTime();
    return Number.isFinite(ts) && ts >= cutoff;
  });
}

async function probe(url) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT);
  const start = performance.now();
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      method: "GET",
      redirect: "follow",
      headers: { "user-agent": "uptime-bot/1.0" },
    });
    const ms = Math.round(performance.now() - start);
    clearTimeout(t);
    return { ok: res.ok, status: res.status, responseTime: ms };
  } catch (err) {
    clearTimeout(t);
    return { ok: false, status: null, responseTime: null, error: String(err) };
  }
}

(async () => {
  const endpoints = JSON.parse(await fsp.readFile(CONFIG, "utf8"));
  await ensureDir(DATA_DIR);

  for (const e of endpoints) {
    const id = e.id;
    if (!id) throw new Error('Each site needs an "id" in sites.json');
    const file = path.join(DATA_DIR, `${id}.json`);

    const prev = await readJsonMaybe(file, {
      id,
      name: e.name || id,
      url: e.url,
      checks: [],
    });

    const r = await probe(e.url);
    prev.checks.push({
      t: new Date().toISOString(),
      ok: r.ok,
      code: r.status,
      rt: r.responseTime,
    });
    prev.checks = pruneChecks(prev.checks);
    if (prev.checks.length > MAX_CHECKS) {
      prev.checks = prev.checks.slice(-MAX_CHECKS);
    }

    await fsp.writeFile(file, JSON.stringify(prev, null, 2));
  }
})();
