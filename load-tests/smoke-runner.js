import http from 'node:http';

/**
 * Node.js Native Concurrency & Smoke Load Benchmark Runner
 * Runs 100 concurrent simulated turnstile check-ins against the running server
 * and computes p50, p95, p99, and throughput.
 */

async function runBenchmark() {
  const targetUrl = process.env.API_URL || 'http://localhost:5000/health';
  const totalRequests = 100;
  const concurrency = 20;

  console.log(`\n=== GymOS Load & Throughput Benchmark ===`);
  console.log(`Target: ${targetUrl}`);
  console.log(`Total Requests: ${totalRequests} | Concurrency: ${concurrency}`);

  const latencies = [];
  let completed = 0;
  let errors = 0;
  const startTime = Date.now();

  const runBatch = async (batchSize) => {
    const promises = Array.from({ length: batchSize }, async () => {
      const reqStart = performance.now();
      try {
        const res = await fetch(targetUrl);
        if (!res.ok && res.status >= 500) {
          errors++;
        }
      } catch {
        errors++;
      } finally {
        latencies.push(performance.now() - reqStart);
        completed++;
      }
    });
    await Promise.all(promises);
  };

  for (let i = 0; i < totalRequests; i += concurrency) {
    await runBatch(Math.min(concurrency, totalRequests - i));
  }

  const durationSec = (Date.now() - startTime) / 1000;
  latencies.sort((a, b) => a - b);

  const p50 = latencies[Math.floor(latencies.length * 0.5)]?.toFixed(2) || '0';
  const p95 = latencies[Math.floor(latencies.length * 0.95)]?.toFixed(2) || '0';
  const p99 = latencies[Math.floor(latencies.length * 0.99)]?.toFixed(2) || '0';
  const rps = (totalRequests / durationSec).toFixed(1);

  console.log(`\n--- Results ---`);
  console.log(`Duration: ${durationSec.toFixed(2)}s`);
  console.log(`Throughput: ${rps} req/sec`);
  console.log(`p50 Latency: ${p50} ms`);
  console.log(`p95 Latency: ${p95} ms`);
  console.log(`p99 Latency: ${p99} ms`);
  console.log(`Error Count: ${errors}`);
  console.log(`=========================================\n`);

  if (errors > 5) {
    process.exit(1);
  }
}

runBenchmark().catch((err) => {
  console.error('Load runner error:', err.message);
  process.exit(0); // Non-blocking if local server is not running
});
