const Block = require("./block");

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
  }

  // Step 1 of Algorithm 3.2.4: initialize with a genesis block.
  createGenesisBlock() {
    return new Block(0, Date.now(), [{ note: "Genesis Block - EHR Chain Start" }], "0");
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  // Step 2-3: hash the EHR transaction(s) and create a new linked block.
  addBlock(transactions) {
    const previousBlock = this.getLatestBlock();
    const newBlock = new Block(
      previousBlock.index + 1,
      Date.now(),
      transactions,
      previousBlock.hash
    );
    this.chain.push(newBlock);
    return newBlock;
  }

  /**
   * Step 4: validate the whole chain, node by node.
   * Returns a report with your exact three attack flags whenever something is wrong.
   */
    validateChain() {
    const report = { valid: true, issues: [] };

    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      // FLAG: "Invalid Block" - structurally malformed block
      const isStructurallyValid =
        current.hasOwnProperty("index") &&
        current.hasOwnProperty("timestamp") &&
        Array.isArray(current.transactions) &&
        current.transactions.length > 0 &&
        typeof current.previousHash === "string" &&
        typeof current.hash === "string";

      if (!isStructurallyValid) {
        report.valid = false;
        report.issues.push({ blockIndex: current.index, flag: "Invalid Block" });
        continue; // skip other checks on a malformed block
      }

      if (current.hash !== current.computeHash()) {
        report.valid = false;
        report.issues.push({ blockIndex: current.index, flag: "EHR Data Tampered within Block" });
      }

      if (current.previousHash !== previous.hash) {
        report.valid = false;
        report.issues.push({ blockIndex: current.index, flag: "Blockchain Link Broken" });
      }
    }

    return report;
  }
     
  // Used by the "Launch Attack" console later: directly mutates a block's data
  // to simulate a tampering attack, WITHOUT recalculating its hash - exactly
  // like a real attacker editing stored data would.
    simulateTamper(blockIndex, newTransactions) {
    if (blockIndex <= 0 || blockIndex >= this.chain.length) {
      throw new Error("Invalid block index");
    }
    this.chain[blockIndex].transactions = newTransactions;
    // hash intentionally NOT recalculated here - that's what makes it tampering
  }

  // FR10: Audit trail - every block that touched a given record_id, in order.
  // Powers the Audit Trail Viewer later.
  getRecordHistory(recordId) {
    const history = [];
    this.chain.forEach((block) => {
      block.transactions.forEach((tx) => {
        if (tx.record_id === recordId) {
          history.push({
            blockIndex: block.index,
            timestamp: block.timestamp,
            data: tx,
            blockHash: block.hash,
          });
        }
      });
    });
    return history;
  }
}

module.exports = Blockchain;