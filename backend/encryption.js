const crypto = require("crypto");

// A fixed key for this prototype (in a real production system, this would be
// securely managed - e.g. per-patient keys, a key vault, etc. Documented as a
// simplification in Chapter 4, same as the CP-ABE -> RBAC+AES decision).
const ALGORITHM = "aes-256-cbc";
const SECRET_KEY = crypto.createHash("sha256").update("ehr-project-secret-key-2026").digest();

function encryptField(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decryptField(encryptedText) {
  const [ivHex, encrypted] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

module.exports = { encryptField, decryptField };