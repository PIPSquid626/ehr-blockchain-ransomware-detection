const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const STORAGE_DIR = path.join(__dirname, "offchain_storage");

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR);
}

function saveFile(filename, content) {
  const filePath = path.join(STORAGE_DIR, filename);
  fs.writeFileSync(filePath, content);

  const hash = crypto.createHash("sha256").update(content).digest("hex");
  return { filename, hash, path: filePath };
}

function readFile(filename) {
  const filePath = path.join(STORAGE_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}

module.exports = { saveFile, readFile };