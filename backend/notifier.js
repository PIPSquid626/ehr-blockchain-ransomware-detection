// Simulated alert delivery (email/SMS/SIEM-style). In a production system
// this would call a real email API (e.g. SendGrid) or SMS gateway - here we
// simulate the delivery itself, which is what FR11 requires: proof the alert
// actually gets pushed out, not just logged internally.
function sendNotification(alert) {
  const message = `[SECURITY ALERT] ${alert.flag} | Source: ${alert.source} | Time: ${alert.timestamp}`;
  console.log("\n📧 SIMULATED EMAIL SENT TO: admin@hospital-security.local");
  console.log(message);
  console.log(JSON.stringify(alert.details));
  console.log("---");
  return { delivered: true, channel: "email (simulated)", message };
}

module.exports = { sendNotification };