// quiz-leaderboard: Lambda for GET /leaderboard?quizId=<id>
// Returns top N score entries for a quiz, sorted by score desc then durationMs asc.
// Runtime: nodejs22.x, arm64

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});
const BUCKET = process.env.DATA_BUCKET;
const CORS = process.env.CORS_ORIGIN || "*";
const TOP_N = 50;

const headers = {
  "Access-Control-Allow-Origin": CORS,
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=15",
};

const QUIZID_RE = /^[a-z0-9][a-z0-9\-]{1,40}$/;

export const handler = async (event) => {
  if (event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }
  const quizId = event.queryStringParameters?.quizId;
  if (!QUIZID_RE.test(String(quizId || ""))) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "invalid quizId" }) };
  }
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: `scores/${quizId}.json` }));
    const body = await res.Body.transformToString();
    const all = JSON.parse(body);
    const sorted = all
      .sort((a, b) => b.score - a.score || a.durationMs - b.durationMs)
      .slice(0, TOP_N);
    return { statusCode: 200, headers, body: JSON.stringify(sorted) };
  } catch (e) {
    if (e.name === "NoSuchKey") {
      return { statusCode: 200, headers, body: "[]" };
    }
    console.error(e);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "server" }) };
  }
};
