# diablo.slvsansend.com (Diablo 2 Quiz): AWS Infrastructure

Mirrors the slvsansend parent app's pattern: manual console setup, S3 + CloudFront
for static hosting, API Gateway + Lambda + S3 JSON for the leaderboard. No IaC.

AWS profile: `kgdevops` (same as parent). Region: `us-east-1`.

## Resources to create

### 1. S3 bucket: static site
- Name: `diablo.slvsansend.com`
- Region: `us-east-1`
- Block **all** public access: ON (CloudFront will read via OAC)
- Static website hosting: not required (OAC serves via CF)

### 2. S3 bucket: score data
- Name: `diablo.slvsansend.com-data`
- Region: `us-east-1`
- Block all public access: ON
- Versioning: ON (cheap insurance against a bad Lambda write)
- Key pattern: `scores/<quizId>.json`

### 3. ACM certificate
- **Reuse** the existing parent cert. It already covers `*.slvsansend.com`.
- No new cert required. Attach the existing ARN to the new CloudFront distribution.

### 4. CloudFront distribution
- Origin: `diablo.slvsansend.com` S3 bucket (REST endpoint, not website endpoint)
- Origin access: **OAC** (create a new OAC, attach S3 bucket policy)
- Viewer protocol policy: Redirect HTTP to HTTPS
- Allowed methods: GET, HEAD
- Cache policy: CachingOptimized (managed)
- Response headers policy: SimpleCORS (managed)
- Alternate domain names: `diablo.slvsansend.com`
- SSL cert: parent's `*.slvsansend.com` ACM cert (us-east-1)
- **Custom error responses** (SPA routing):
  - 403 → `/index.html`, response code 200, TTL 0
  - 404 → `/index.html`, response code 200, TTL 0
- Default root object: `index.html`

### 5. Route 53
- Hosted zone: `slvsansend.com` (existing, `Z08524752CFGP2N2692XE`)
- New A record:
  - Name: `diablo.slvsansend.com`
  - Type: A, alias
  - Target: new CloudFront distribution

### 6. IAM role: Lambda execution
- Name: `quiz-lambda-role`
- Trust: Lambda service
- Attached managed policy: `AWSLambdaBasicExecutionRole`
- Inline policy: read/write to `arn:aws:s3:::diablo.slvsansend.com-data/scores/*`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::diablo.slvsansend.com-data/scores/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::diablo.slvsansend.com-data"
    }
  ]
}
```

Note: `s3:ListBucket` is required so `GetObject` on a missing key returns `NoSuchKey`
instead of `AccessDenied` (which our Lambdas treat as "empty leaderboard").

### 7. Lambda functions
Both: runtime `nodejs22.x`, architecture `arm64`, role `quiz-lambda-role`.
Env vars on both:
- `DATA_BUCKET=diablo.slvsansend.com-data`
- `CORS_ORIGIN=https://diablo.slvsansend.com`

```bash
cd backend/lambda/quiz-submit-score
npm install --omit=dev
zip -r ../quiz-submit-score.zip . -x "*.git*"
aws lambda create-function \
  --function-name quiz-submit-score \
  --runtime nodejs22.x --architectures arm64 \
  --role arn:aws:iam::<ACCT>:role/quiz-lambda-role \
  --handler quiz-submit-score.handler \
  --zip-file fileb://../quiz-submit-score.zip \
  --environment "Variables={DATA_BUCKET=diablo.slvsansend.com-data,CORS_ORIGIN=https://diablo.slvsansend.com}" \
  --profile kgdevops

# Same for quiz-leaderboard
```

### 8. API Gateway (HTTP API, not REST: cheaper, simpler)
- Name: `quiz-api`, stage `prod`
- Routes:
  - `POST /scores`       → Lambda `quiz-submit-score`
  - `GET  /leaderboard`  → Lambda `quiz-leaderboard`
- CORS (in API Gateway console):
  - Allow origins: `https://diablo.slvsansend.com`
  - Allow methods: `GET, POST, OPTIONS`
  - Allow headers: `Content-Type`

Resulting endpoints (capture these for the frontend `.env`):
- `https://<apiId>.execute-api.us-east-1.amazonaws.com/prod/scores`
- `https://<apiId>.execute-api.us-east-1.amazonaws.com/prod/leaderboard`

### Deployed resource IDs (as of this build)
- CloudFront distribution: `E36R2SOLWRH18L` (domain `d1gntorzjqpsn6.cloudfront.net`)
- CloudFront OAC: `E19QTCDM27DBYM`
- API Gateway: `kyzb0teku1` (prod stage)
- Lambda fns: `diablo-submit-score`, `diablo-leaderboard`
- IAM role: `diablo-lambda-role`
- S3 buckets: `diablo.slvsansend.com` (site), `diablo.slvsansend.com-data` (scores)
- Route53 A record: `diablo.slvsansend.com` → CF distribution
- ACM cert (shared with parent): `arn:aws:acm:us-east-1:959398616823:certificate/a6f5f43b-2d81-410a-a28a-c5bffe840fbf`

## Deploy: frontend

```bash
cd frontend
# Set the two VITE_ URLs in .env after API Gateway is created, then:
npm run build

aws s3 sync dist s3://diablo.slvsansend.com --delete --profile kgdevops

aws cloudfront create-invalidation \
  --distribution-id <NEW_CF_DIST_ID> \
  --paths "/*" \
  --profile kgdevops
```

## Deploy: Lambda updates

```bash
cd backend/lambda/quiz-submit-score
npm install --omit=dev
zip -r ../quiz-submit-score.zip .
aws lambda update-function-code \
  --function-name quiz-submit-score \
  --zip-file fileb://../quiz-submit-score.zip \
  --profile kgdevops
```

## Cost estimate
~$2-4/month: S3 pennies, CloudFront a few cents under free-tier traffic, Lambda + API
Gateway essentially free at this volume.

## Adding a new quiz topic (harry-potter, lord-of-the-rings, etc.)
No infra changes required. In `frontend/src/content/<topic>/`:
- Add `quiz-NN.json` files (same shape as `diablo2/quiz-01.json`)
- Optionally add a `theme.ts` for palette/font overrides
- Export from `content/<topic>/index.ts`

Each new `quizId` automatically gets its own `scores/<quizId>.json` in S3 the first
time someone submits.
