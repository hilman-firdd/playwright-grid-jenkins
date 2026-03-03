# playwright-grid-jenkins

End-to-end tests powered by [Playwright](https://playwright.dev/), designed to run in a **parallel grid** across multiple browsers and shards within a **Jenkins CI** pipeline.

---

## Contents

| Path | Description |
|------|-------------|
| `playwright.config.ts` | Playwright configuration (browsers, reporters, grid hook) |
| `tests/` | Test files (`*.spec.ts`) |
| `Jenkinsfile` | Declarative Jenkins pipeline with parallel browser × shard stages |

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| Jenkins | ≥ 2.387 (LTS) |
| Jenkins plugins | Pipeline, NodeJS, HTML Publisher, JUnit, Docker Pipeline |

---

## Local setup

```bash
# 1. Install dependencies
npm ci

# 2. Install Playwright browsers
npx playwright install --with-deps

# 3. Run all tests (all browsers)
npm test

# 4. Run a single browser
npm run test:chromium   # or test:firefox / test:webkit

# 5. Open the HTML report
npm run test:report
```

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `https://playwright.dev` | Application under test |
| `GRID_URL` | *(empty)* | WebSocket endpoint of a remote grid (`ws://grid-hub:4444`) |
| `SHARD` | *(empty)* | Current shard index (1-based) |
| `TOTAL_SHARDS` | *(empty)* | Total number of shards |
| `CI` | *(empty)* | Set to `true` in CI environments to enable retries and strict mode |

---

## Running shards locally

```bash
# Split tests into 3 shards and run shard 1
SHARD=1 TOTAL_SHARDS=3 npm run test:shard

# Run against a remote Playwright Grid
GRID_URL=ws://my-grid:4444 npm test
```

---

## Jenkins pipeline

The `Jenkinsfile` defines a declarative pipeline with three stages:

```
Checkout → Install → Run tests (parallel) → Merge & publish report
```

The **Run tests** stage fans out into a matrix of `browser × shard` parallel stages:

```
chromium – shard 1/3 ─┐
chromium – shard 2/3  ├─ parallel
chromium – shard 3/3  │
firefox  – shard 1/3  │
...                   ┘
```

### Pipeline parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `BROWSER` | `all` | Browser(s) to run (`all`, `chromium`, `firefox`, `webkit`) |
| `BASE_URL` | `https://playwright.dev` | Application URL |
| `GRID_URL` | *(empty)* | Remote grid WebSocket URL |
| `SHARD_COUNT` | `3` | Number of shards per browser |

### Jenkins setup

1. Create a new **Pipeline** job.
2. Point *Pipeline → Definition* to **Pipeline script from SCM** and configure this repository.
3. In **Manage Jenkins → Tools**, add a **NodeJS** installation named `NodeJS-LTS`.
4. Trigger a build – the first run will install browsers automatically.

---

## Reports & artifacts

* **JUnit XML** – `test-results/results.xml` (published to Jenkins test trend graph).
* **HTML Report** – `playwright-report/index.html` (published via HTML Publisher plugin).
* **Traces & screenshots** – archived under `test-results/` for failed tests.

---

## Remote grid integration

Point `GRID_URL` to any Playwright-compatible grid endpoint:

```bash
# Playwright Grid (self-hosted)
GRID_URL=ws://playwright-grid:3000 npm test

# Microsoft Playwright Service
GRID_URL=wss://eastus.api.playwright.microsoft.com/... npm test
```

See the [Playwright documentation](https://playwright.dev/docs/test-sharding) for more on sharding and grid setups.
