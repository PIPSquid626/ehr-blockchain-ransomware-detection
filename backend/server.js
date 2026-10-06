const express = require("express");
const cors = require("cors");
const Blockchain = require("./blockchain/blockchain");
const offchain = require("./offchain");
const { encryptField, decryptField } = require("./encryption");
const { sendNotification } = require("./notifier");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

let ehrChain = new Blockchain();

let alerts = [];
let alertIdCounter = 1;

function logAlert(source, flag, details) {
  const alert = {
    id: alertIdCounter++,
    source,
    flag,
    details,
    timestamp: new Date().toISOString(),
  };
  alerts.push(alert);
  sendNotification(alert);
  return alert;
}
async function checkWithAI(logEntry) {
  try {
    const response = await fetch("http://localhost:5000/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logEntry),
    });
    return await response.json();
  } catch (err) {
    console.error("AI service unreachable:", err.message);
    return null;
  }
}

function isAuthorized(recordId, userId, role) {
  if (role === "admin") return true;

  const history = ehrChain.getRecordHistory(recordId);
  if (history.length === 0) return false;

  const latest = history[history.length - 1].data;
  const consentedDoctors = latest.consented_doctors || [];
  return consentedDoctors.includes(userId);
}

// --- Create a new EHR record -> hashed, encrypted, added as a new block ---
app.post("/api/records", (req, res) => {
  const { record_id, patient_name, diagnosis, medication, attending_doctor, consented_doctors } = req.body;

  if (!record_id || !patient_name || !diagnosis) {
    return res.status(400).json({ error: "Missing required EHR fields" });
  }

  const finalConsentedDoctors = consented_doctors && consented_doctors.length
    ? consented_doctors
    : [attending_doctor];

  const newBlock = ehrChain.addBlock([
    {
      record_id,
      patient_name,
      diagnosis: encryptField(diagnosis),
      medication: encryptField(medication),
      attending_doctor,
      consented_doctors: finalConsentedDoctors,
    },
  ]);

  res.json({ message: "Record added to blockchain", block: newBlock });
});

// --- FR8: upload a large file, store off-chain, hash on-chain ---
app.post("/api/records/:recordId/upload", (req, res) => {
  const { filename, content } = req.body;

  if (!filename || !content) {
    return res.status(400).json({ error: "filename and content are required" });
  }

  const saved = offchain.saveFile(filename, content);

  const newBlock = ehrChain.addBlock([
    {
      record_id: req.params.recordId,
      type: "file_reference",
      filename: saved.filename,
      file_hash: saved.hash,
    },
  ]);

  res.json({ message: "File stored off-chain, hash recorded on-chain", block: newBlock });
});

// --- Simulate a user accessing a record -> access control + AI detection ---
app.post("/api/access", async (req, res) => {
  const { user_id, role, record_id, action } = req.body;

  if (!user_id || !role || !record_id || !action) {
    return res.status(400).json({ error: "Missing required access-log fields" });
  }

  const authorized = isAuthorized(record_id, user_id, role);

  if (!authorized) {
    const alert = logAlert("access_control", "Unauthorized Access Attempt", {
      user_id,
      record_id,
      action,
    });
    return res.status(403).json({
      message: "Access denied - user not in consented doctors list",
      alert_triggered: alert,
    });
  }

  const logEntry = {
    user_id,
    role,
    record_id,
    action,
    timestamp: new Date().toISOString(),
  };

  const aiResult = await checkWithAI(logEntry);

  let alert = null;
  if (aiResult && aiResult.is_anomalous) {
    alert = logAlert("ai", aiResult.reason, {
      user_id,
      record_id,
      action,
      anomaly_score: aiResult.anomaly_score,
      recent_activity_count: aiResult.recent_activity_count,
    });
  }

  res.json({
    message: "Access logged",
    ai_result: aiResult,
    alert_triggered: alert,
  });
});

// --- Serve the evaluation_results.json produced by benchmark.js ---
app.get("/api/evaluation", (req, res) => {
  try {
    const data = fs.readFileSync("evaluation_results.json", "utf-8");
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(404).json({ error: "No evaluation results found. Run benchmark.js first." });
  }
});

// --- Authorized read: returns the record with sensitive fields decrypted ---
app.post("/api/records/:recordId/read", (req, res) => {
  const { user_id, role } = req.body;
  const recordId = req.params.recordId;

  if (!isAuthorized(recordId, user_id, role)) {
    const alert = logAlert("access_control", "Unauthorized Access Attempt", {
      user_id, record_id: recordId, action: "read",
    });
    return res.status(403).json({ message: "Access denied", alert_triggered: alert });
  }

  const history = ehrChain.getRecordHistory(recordId);
  if (history.length === 0) {
    return res.status(404).json({ error: "Record not found" });
  }

  const latest = history[history.length - 1].data;
  const decrypted = {
    ...latest,
    diagnosis: decryptField(latest.diagnosis),
    medication: decryptField(latest.medication),
  };

  res.json(decrypted);
});

app.get("/api/chain", (req, res) => {
  res.json(ehrChain.chain);
});

app.get("/api/validate", (req, res) => {
  const report = ehrChain.validateChain();

  if (!report.valid) {
    report.issues.forEach((issue) =>
      logAlert("blockchain", issue.flag, { blockIndex: issue.blockIndex })
    );
  }

  res.json(report);
});

// --- IoMT: simulated medical devices generating readings ---
const IOMT_DEVICES = [
  { device_id: "DEV-HR-01", type: "Heart Rate Monitor", patient_record: "EHR7001" },
  { device_id: "DEV-GL-01", type: "Glucose Sensor", patient_record: "EHR7001" },
];

app.get("/api/iomt/devices", (req, res) => {
  res.json(IOMT_DEVICES);
});

app.post("/api/iomt/simulate-reading", async (req, res) => {
  const { device_id, abnormal } = req.body;
  const device = IOMT_DEVICES.find((d) => d.device_id === device_id);
  if (!device) return res.status(404).json({ error: "Device not found" });

  const reading = abnormal
    ? { heart_rate: 220, note: "CRITICAL - abnormal spike detected" }
    : { heart_rate: 75, note: "Normal reading" };

  const logEntry = {
    user_id: device_id,
    role: "device",
    record_id: device.patient_record,
    action: "write",
    timestamp: new Date().toISOString(),
  };

  const aiResult = await checkWithAI(logEntry);

  let alert = null;
  if (abnormal || (aiResult && aiResult.is_anomalous)) {
    alert = logAlert("iomt", abnormal ? "Abnormal Device Reading" : aiResult?.reason || "Device Anomaly", {
      device_id,
      device_type: device.type,
      reading,
    });
  }

  res.json({ device, reading, ai_result: aiResult, alert_triggered: alert });
});
// --- FR1: revoke a doctor's consent on a record ---
app.post("/api/records/:recordId/revoke", (req, res) => {
  const { doctor_id } = req.body;
  const recordId = req.params.recordId;

  const history = ehrChain.getRecordHistory(recordId);
  if (history.length === 0) {
    return res.status(404).json({ error: "Record not found" });
  }

  const latest = history[history.length - 1].data;
  const updatedConsent = (latest.consented_doctors || []).filter((id) => id !== doctor_id);

  const newBlock = ehrChain.addBlock([
    { ...latest, consented_doctors: updatedConsent },
  ]);

  res.json({ message: `Consent revoked for ${doctor_id}`, block: newBlock });
});

app.post("/api/simulate/tamper", (req, res) => {
  const { blockIndex, fakeData } = req.body;

  try {
    ehrChain.simulateTamper(blockIndex, [fakeData]);
    const report = ehrChain.validateChain();
    report.issues.forEach((issue) =>
      logAlert("blockchain", issue.flag, { blockIndex: issue.blockIndex })
    );
    res.json({ message: "Tamper simulation executed", validation: report });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// --- Simulated auth: in-memory password store, hashed with the same SHA-256 approach as the blockchain ---
const crypto = require("crypto");
function hashPassword(pw) {
  return crypto.createHash("sha256").update(pw).digest("hex");
}

let userPasswords = {
  ADMIN: hashPassword("admin123"),
  DOC101: hashPassword("doctor123"),
  DOC102: hashPassword("doctor123"),
  DOC109: hashPassword("doctor123"),
};

app.post("/api/auth/login", (req, res) => {
  const { user_id, password } = req.body;
  if (!userPasswords[user_id]) return res.status(404).json({ error: "Unknown identity" });

  if (userPasswords[user_id] === hashPassword(password)) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: "Incorrect password" });
  }
});

app.post("/api/auth/set-password", (req, res) => {
  const { user_id, new_password } = req.body;
  if (!userPasswords[user_id]) return res.status(404).json({ error: "Unknown identity" });
  if (!new_password || new_password.length < 4) {
    return res.status(400).json({ error: "Password must be at least 4 characters" });
  }
  userPasswords[user_id] = hashPassword(new_password);
  res.json({ success: true, message: "Password updated" });
});
// --- Reset the whole demo to a clean state ---
app.post("/api/reset", async (req, res) => {
  ehrChain = new Blockchain();
  alerts = [];
  alertIdCounter = 1;

  try {
    await fetch("http://localhost:5000/reset", { method: "POST" });
  } catch (err) {
    console.error("Could not reset AI service memory:", err.message);
  }

  res.json({ message: "System reset to a clean state" });
});
// --- FR12: One-click ransomware burst simulation ---
app.post("/api/simulate/ransomware", async (req, res) => {
  const attackerId = req.body.user_id || "DOC109";
  const targetRecord = req.body.record_id || "EHR1001";

  const results = [];
  for (let i = 0; i < 15; i++) {
    const logEntry = {
      user_id: attackerId,
      role: "doctor",
      record_id: targetRecord,
      action: "write",
      timestamp: new Date().toISOString(),
    };
    const aiResult = await checkWithAI(logEntry);
    results.push(aiResult);

    if (aiResult && aiResult.is_anomalous) {
      logAlert("ai", aiResult.reason, {
        user_id: attackerId,
        record_id: targetRecord,
        anomaly_score: aiResult.anomaly_score,
        recent_activity_count: aiResult.recent_activity_count,
      });
    }
  }

  const detectedAt = results.findIndex((r) => r && r.is_anomalous);

  res.json({
    message: "Ransomware burst simulation complete",
    total_actions: results.length,
    detected_at_action: detectedAt === -1 ? "not detected" : detectedAt + 1,
    results,
  });
});

// --- FR12: MITM simulation - intercepted/altered transaction ---
app.post("/api/simulate/mitm", (req, res) => {
  const { blockIndex } = req.body;
  const targetBlock = blockIndex !== undefined ? blockIndex : ehrChain.chain.length - 1;

  try {
    // Simulate an attacker intercepting and altering data mid-transit,
    // then trying to slip it into the chain with a mismatched previousHash.
    const fakeTransactions = [{
      record_id: "INTERCEPTED",
      patient_name: "MITM Injected Data",
      diagnosis: "FAKE",
      medication: "FAKE",
    }];

    ehrChain.chain[targetBlock].previousHash = "0000000000fakehash0000000000";
    ehrChain.chain[targetBlock].transactions = fakeTransactions;

    const report = ehrChain.validateChain();
    report.issues.forEach((issue) =>
      logAlert("blockchain", issue.flag, { blockIndex: issue.blockIndex, attackType: "MITM" })
    );

    res.json({ message: "MITM simulation executed", validation: report });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/alerts", (req, res) => {
  res.json(alerts.slice().reverse());
});

// --- FR10: Audit trail for a specific EHR record ---
app.get("/api/records/:recordId/history", (req, res) => {
  const history = ehrChain.getRecordHistory(req.params.recordId);
  res.json(history);
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`EHR backend running on port ${PORT}`);
});