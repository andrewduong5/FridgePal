export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(455).json({ error: "Method not allowed" });
  }

  // Server-side environment variable (no VITE_ prefix required)
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server" });
  }

  const { prompt, file_urls = [], response_json_schema } = req.body || {};

  try {
    const parts = [{ text: prompt }];

    if (file_urls.length > 0 && file_urls[0]?.includes("base64,")) {
      const [header, base64Data] = file_urls[0].split("base64,");
      const mimeType = header.replace("data:", "").replace(";", "").trim() || "image/jpeg";

      parts.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
    }

    const generationConfig = {
      responseMimeType: "application/json",
    };

    if (response_json_schema) {
      generationConfig.responseSchema = response_json_schema;
    }

    // Call the verified working model
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig,
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      return res.status(response.status).json({ error: errBody });
    }

    const data = await response.json();
    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (rawText) {
      rawText = rawText.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
      return res.status(200).json(JSON.parse(rawText));
    }

    return res.status(500).json({ error: "Empty model response" });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}