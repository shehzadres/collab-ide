const baseUrl = (process.env.PERF_BASE_URL || "http://127.0.0.1:4000").replace(/\/$/, "");
const samples = Number.parseInt(process.env.PERF_SAMPLES || "30", 10);
const path = process.env.PERF_PATH || "/health";

if (!Number.isInteger(samples) || samples < 5 || samples > 500) {
  throw new Error("PERF_SAMPLES must be an integer between 5 and 500");
}
if (!path.startsWith("/") || path.startsWith("//")) {
  throw new Error("PERF_PATH must be a same-origin absolute path");
}

const timings = [];
let statusFailures = 0;
let lastStatus = 0;

for (let index = 0; index < samples; index += 1) {
  const started = performance.now();
  const response = await fetch(baseUrl + path, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });
  const elapsed = performance.now() - started;
  await response.arrayBuffer();
  timings.push(elapsed);
  lastStatus = response.status;
  if (!response.ok) statusFailures += 1;
}

timings.sort((a, b) => a - b);
const percentile = (p) => timings[Math.min(timings.length - 1, Math.ceil(p * timings.length) - 1)];
const mean = timings.reduce((sum, value) => sum + value, 0) / timings.length;

console.log(JSON.stringify({
  target: baseUrl + path,
  samples,
  status: lastStatus,
  statusFailures,
  latencyMs: {
    min: Number(timings[0].toFixed(2)),
    mean: Number(mean.toFixed(2)),
    p50: Number(percentile(0.5).toFixed(2)),
    p95: Number(percentile(0.95).toFixed(2)),
    max: Number(timings.at(-1).toFixed(2)),
  },
  note: "Sequential, low-volume HTTP timing only. Not a load test or a measure of WebSocket/editor collaboration performance.",
}, null, 2));
if (statusFailures > 0) process.exitCode = 1;
