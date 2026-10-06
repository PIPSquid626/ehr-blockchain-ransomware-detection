// Evaluation harness: measures Scalability, Transaction Throughput (TPS),
// and Latency (MTTD, MTTR, Alert Latency) at increasing load levels.
// Run this while server.js AND app.py (AI service) are both already running.

const BASE_URL = "http://localhost:4000";
const LOAD_LEVELS = [10, 50, 100, 500];
const MAX_LOAD = Math.max(...LOAD_LEVELS);

async function createRecord(i) {
  const start = Date.now();
  await fetch(`${BASE_URL}/api/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      record_id: `BENCH${i}`,
      patient_name: `Test Patient ${i}`,
      diagnosis: "Benchmark Diagnosis",
      medication: "Benchmark Medication",
      attending_doctor: "DOC101",
    }),
  });
  return Date.now() - start;
}

async function runThroughputTest(load) {
  const startTime = Date.now();
  const promises = [];
  for (let i = 0; i < load; i++) {
    promises.push(createRecord(`${load}_${i}`));
  }
  const latencies = await Promise.all(promises);
  const totalTimeSeconds = (Date.now() - startTime) / 1000;

  const tps = load / totalTimeSeconds;
  const avgLatencyMs = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const scalability = (MAX_LOAD / load) * 100;

  return {
    load,
    total_time_seconds: totalTimeSeconds.toFixed(3),
    throughput_tps: tps.toFixed(2),
    avg_latency_ms: avgLatencyMs.toFixed(2),
    scalability_percent: scalability.toFixed(2),
  };
}

async function runDetectionLatencyTest() {
  const attackStart = Date.now();

  const response = await fetch(`${BASE_URL}/api/simulate/ransomware`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const result = await response.json();
  const attackEnd = Date.now();

  const totalAttackTimeMs = attackEnd - attackStart;
  const detectedAtAction = result.detected_at_action;
  const timePerAction = totalAttackTimeMs / result.total_actions;

  // MTTD: time from attack start to the action where detection first fired
  const mttdMs = typeof detectedAtAction === "number"
    ? detectedAtAction * timePerAction
    : null;

  // Alert Latency: time to confirm the alert is visible in the unified feed
  const alertCheckStart = Date.now();
  const alertsResponse = await fetch(`${BASE_URL}/api/alerts`);
  await alertsResponse.json();
  const alertLatencyMs = Date.now() - alertCheckStart;

  // MTTR (prototype definition): time from detection to system confirming
  // the chain is still valid / response action taken (via /api/validate)
  const mttrStart = Date.now();
  const validateResponse = await fetch(`${BASE_URL}/api/validate`);
  await validateResponse.json();
  const mttrMs = Date.now() - mttrStart;

  return {
    detected_at_action: detectedAtAction,
    total_attack_time_ms: totalAttackTimeMs,
    mttd_ms: mttdMs ? mttdMs.toFixed(2) : "not detected",
    alert_latency_ms: alertLatencyMs,
    mttr_ms: mttrMs,
  };
}

async function main() {
  console.log("=== EVALUATION: Throughput & Scalability ===\n");
  const throughputResults = [];
  for (const load of LOAD_LEVELS) {
    const result = await runThroughputTest(load);
    throughputResults.push(result);
    console.log(`Load: ${result.load} | TPS: ${result.throughput_tps} | Avg Latency: ${result.avg_latency_ms}ms | Scalability: ${result.scalability_percent}%`);
  }

  console.log("\n=== EVALUATION: Detection Latency (MTTD, MTTR, Alert Latency) ===\n");
  const latencyResult = await runDetectionLatencyTest();
  console.log(`Detected at action: ${latencyResult.detected_at_action}`);
  console.log(`MTTD: ${latencyResult.mttd_ms}ms`);
  console.log(`Alert Latency: ${latencyResult.alert_latency_ms}ms`);
  console.log(`MTTR: ${latencyResult.mttr_ms}ms`);

  const fs = require("fs");
  fs.writeFileSync(
    "evaluation_results.json",
    JSON.stringify({ throughput: throughputResults, latency: latencyResult }, null, 2)
  );
  console.log("\nFull results saved to evaluation_results.json — use these numbers in Chapter 4.");
}

main();