// Test script for inbound email webhook endpoint
import http from "http";

const testEmail = {
  from: "lead@leadmail.no",
  to: "info@rendetalje.dk",
  subject: "Rengøring.nu - Ny lead fra København",
  text: "Hej,\n\nJeg leder efter fast rengøring til min lejlighed på 80m² i København K. Hvad koster det?\n\nMvh,\nTest Kunde",
  html: "<p>Hej,</p><p>Jeg leder efter fast rengøring til min lejlighed på 80m² i København K. Hvad koster det?</p><p>Mvh,<br>Test Kunde</p>",
  receivedAt: new Date().toISOString(),
  messageId: `test-inbound-${Date.now()}`,
};

const payload = JSON.stringify(testEmail);

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/api/inbound/email",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": payload.length,
  },
};

console.log("🧪 Testing inbound email webhook...");
console.log(`📧 Email: ${testEmail.subject}`);
console.log(`📨 From: ${testEmail.from}`);
console.log(`📬 To: ${testEmail.to}\n`);

const req = http.request(options, res => {
  let data = "";

  console.log(`📊 Status Code: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);

  res.on("data", chunk => {
    data += chunk;
  });

  res.on("end", () => {
    if (res.statusCode === 200) {
      console.log("✅ Webhook responded successfully!");
      try {
        const response = JSON.parse(data);
        console.log("📦 Response:", JSON.stringify(response, null, 2));
      } catch (e) {
        console.log("📦 Response (raw):", data);
      }
    } else {
      console.error(`❌ Webhook returned error status ${res.statusCode}`);
      console.error("📦 Response (raw):", data || "(empty)");
      try {
        if (data) {
          const errorResponse = JSON.parse(data);
          console.error(
            "📦 Response (parsed):",
            JSON.stringify(errorResponse, null, 2)
          );
        }
      } catch (e) {
        console.error("📦 Could not parse error response");
      }
    }
  });
});

req.on("error", e => {
  console.error(`❌ Problem with request: ${e.message}`);
  console.error("\n💡 Make sure the server is running on port 3000:");
  console.error("   pnpm dev");
});

req.write(payload);
req.end();
