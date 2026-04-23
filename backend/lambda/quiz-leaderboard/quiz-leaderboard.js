// quiz-leaderboard: Lambda for GET /leaderboard
// Two modes:
//   - ?quizId=<id>   -> single-day array (backwards compatible)
//   - no quizId      -> aggregated { days: [{date, entries}], overall: [entries] }
//
// Runtime: nodejs22.x, arm64

import { S3Client, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3 = new S3Client({});
const BUCKET = process.env.DATA_BUCKET;
const CORS = process.env.CORS_ORIGIN || "*";
const PER_DAY = 20;
const OVERALL_TOP = 25;

const headers = {
  "Access-Control-Allow-Origin": CORS,
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=15",
};

const QUIZID_RE = /^[a-z0-9][a-z0-9\-]{1,40}$/;
const DATE_PREFIX_RE = /^diablo2-(\d{4}-\d{2}-\d{2})$/;

async function readFile(key) {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const body = await res.Body.transformToString();
    return JSON.parse(body);
  } catch (e) {
    if (e.name === "NoSuchKey") return [];
    throw e;
  }
}

async function listDailyFiles() {
  const out = [];
  let token;
  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: "scores/diablo2-",
      ContinuationToken: token,
    }));
    for (const o of res.Contents || []) {
      const name = o.Key.replace(/^scores\//, "").replace(/\.json$/, "");
      const m = DATE_PREFIX_RE.exec(name);
      if (m) out.push({ key: o.Key, date: m[1] });
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return out;
}

function sortEntries(entries) {
  return entries
    .slice()
    .sort((a, b) => b.score - a.score || a.durationMs - b.durationMs);
}

function bestPerUser(entries) {
  const byUser = new Map();
  for (const e of entries) {
    const prev = byUser.get(e.username);
    if (!prev) { byUser.set(e.username, e); continue; }
    if (e.score > prev.score || (e.score === prev.score && e.durationMs < prev.durationMs)) {
      byUser.set(e.username, e);
    }
  }
  return [...byUser.values()];
}

async function aggregated() {
  const files = await listDailyFiles();
  // Read all files in parallel
  const perDay = await Promise.all(
    files.map(async (f) => ({ date: f.date, entries: sortEntries(await readFile(f.key)) }))
  );
  // Skip empty days entirely
  const nonEmpty = perDay.filter((d) => d.entries.length > 0);
  nonEmpty.sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first

  // Trim each day's list
  const days = nonEmpty.map((d) => ({ date: d.date, entries: d.entries.slice(0, PER_DAY) }));

  // Overall: each user's best single run across all days
  const allEntries = nonEmpty.flatMap((d) => d.entries);
  const overall = sortEntries(bestPerUser(allEntries)).slice(0, OVERALL_TOP);

  return { days, overall };
}

export const handler = async (event) => {
  if (event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }
  const quizId = event.queryStringParameters?.quizId;

  try {
    if (quizId) {
      if (!QUIZID_RE.test(String(quizId))) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "invalid quizId" }) };
      }
      const entries = sortEntries(await readFile(`scores/${quizId}.json`));
      return { statusCode: 200, headers, body: JSON.stringify(entries.slice(0, PER_DAY)) };
    }
    const agg = await aggregated();
    return { statusCode: 200, headers, body: JSON.stringify(agg) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "server" }) };
  }
};
