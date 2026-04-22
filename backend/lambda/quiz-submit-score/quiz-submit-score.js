// quiz-submit-score: Lambda for POST /scores
// Appends a ScoreEntry to s3://$DATA_BUCKET/scores/<quizId>.json
// Runtime: nodejs22.x, arm64
// Env: DATA_BUCKET (e.g. diablo.slvsansend.com-data), CORS_ORIGIN (e.g. https://diablo.slvsansend.com)

import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});
const BUCKET = process.env.DATA_BUCKET;
const CORS = process.env.CORS_ORIGIN || "*";

const headers = {
  "Access-Control-Allow-Origin": CORS,
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const USERNAME_RE = /^[A-Za-z0-9_\-]{1,20}$/;
const QUIZID_RE = /^[a-z0-9][a-z0-9\-]{1,40}$/;

async function readScores(quizId) {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: `scores/${quizId}.json` }));
    const body = await res.Body.transformToString();
    return JSON.parse(body);
  } catch (e) {
    if (e.name === "NoSuchKey") return [];
    throw e;
  }
}

async function writeScores(quizId, entries) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: `scores/${quizId}.json`,
    Body: JSON.stringify(entries),
    ContentType: "application/json",
    CacheControl: "no-store",
  }));
}

export const handler = async (event) => {
  if (event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }
  try {
    const body = JSON.parse(event.body || "{}");
    const { username, score, quizId, durationMs } = body;

    if (!USERNAME_RE.test(String(username || ""))) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "invalid username" }) };
    }
    if (!QUIZID_RE.test(String(quizId || ""))) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "invalid quizId" }) };
    }
    const n = Number(score);
    const d = Number(durationMs);
    if (!Number.isInteger(n) || n < 0 || n > 100) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "invalid score" }) };
    }
    if (!Number.isFinite(d) || d < 1000 || d > 3_600_000) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "invalid durationMs" }) };
    }

    const entry = { username, score: n, quizId, durationMs: Math.round(d), timestamp: Date.now() };
    const all = await readScores(quizId);
    all.push(entry);
    // Keep ledger bounded
    const trimmed = all.slice(-5000);
    await writeScores(quizId, trimmed);

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "server" }) };
  }
};
