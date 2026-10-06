const Blockchain = require("./blockchain");

const ehrChain = new Blockchain();

console.log("=== Adding normal EHR records ===");
ehrChain.addBlock([{ record_id: "EHR1001", diagnosis: "Malaria", medication: "Artemether" }]);
ehrChain.addBlock([{ record_id: "EHR1002", diagnosis: "Hypertension", medication: "Amlodipine" }]);

console.log("Chain length:", ehrChain.chain.length);
console.log("Validation before tampering:", ehrChain.validateChain());

console.log("\n=== Simulating a tampering attack on Block 1 ===");
ehrChain.simulateTamper(1, [{ record_id: "EHR1001", diagnosis: "HACKED", medication: "HACKED" }]);

console.log("Validation after tampering:", JSON.stringify(ehrChain.validateChain(), null, 2));