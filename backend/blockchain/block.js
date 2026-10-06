const crypto = require("crypto");

/**
 * A single block in the chain.
 * Mirrors Algorithm 3.2.4: index, timestamp, EHR transactions,
 * previous block's hash, and this block's own hash.
 */
class Block {
  constructor(index, timestamp, transactions, previousHash = "") {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions; // array of EHR record objects
    this.previousHash = previousHash;
    this.hash = this.computeHash();
  }

  // SHA-256 fingerprint of everything in this block.
  // If ANY field changes later (tampering), this hash will no longer match -> FR2/FR5.
  computeHash() {
    const raw =
      this.index +
      this.timestamp +
      JSON.stringify(this.transactions) +
      this.previousHash;
    return crypto.createHash("sha256").update(raw).digest("hex");
  }
}

module.exports = Block;