/**
 * Test OpenRouter API with Gemma 3 27B (FREE)
 */

import "dotenv/config";

async function testOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "google/gemma-3-27b-it:free";

  if (!apiKey) {
    console.error("❌ OPENROUTER_API_KEY not found in .env");
    process.exit(1);
  }

  console.log("🧪 Testing OpenRouter API...\n");
  console.log(`📦 Model: ${model}`);
  console.log(`🔑 API Key: ${apiKey.substring(0, 20)}...`);
  console.log("");

  try {
    const startTime = Date.now();

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://tekup.dk",
          "X-Title": "Friday AI",
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content:
                "Du er Friday, en dansk AI assistent for Tekup. Svar kort og præcist på dansk.",
            },
            {
              role: "user",
              content: "Hej Friday! Kan du hjælpe mig med at booke et møde?",
            },
          ],
        }),
      }
    );

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${response.status}):`, errorText);
      process.exit(1);
    }

    const data = await response.json();

    console.log("✅ API Response Success!\n");
    console.log("📊 Stats:");
    console.log(`   ⏱️  Latency: ${duration}ms`);
    console.log(`   🎯 Model: ${data.model}`);
    console.log(`   🔢 Tokens: ${data.usage?.total_tokens || "N/A"}`);
    console.log("");
    console.log("💬 Assistant Response:");
    console.log(`   "${data.choices[0]?.message?.content}"`);
    console.log("");
    console.log("🎉 OpenRouter test PASSED! Gemma 3 27B er klar til brug.");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

testOpenRouter();
