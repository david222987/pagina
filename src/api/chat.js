// api/chat.js — Función Serverless de Vercel (CommonJS)

module.exports = async function handler(req, res) {
  // CORS headers por si acaso
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY no está definida en las variables de entorno de Vercel.",
    });
  }

  const { prompt, systemPrompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "El campo 'prompt' es requerido." });
  }

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    ...(systemPrompt && {
      systemInstruction: { parts: [{ text: systemPrompt }] },
    }),
  };

  try {
    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return res.status(geminiResponse.status).json({
        error: `Error de Gemini: ${data?.error?.message || "Error desconocido"}`,
      });
    }

    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No se obtuvo respuesta.";

    return res.status(200).json({ response: text });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Error de conexión con Gemini API." });
  }
};