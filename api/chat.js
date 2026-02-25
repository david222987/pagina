// api/chat.js — Función Serverless de Vercel
// La API Key NUNCA llega al cliente, vive solo en el servidor.

export default async function handler(req, res) {
  // Solo permitir método POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  // Leer la API Key desde las variables de entorno del servidor de Vercel
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error:
        "Error de configuración: La variable de entorno GEMINI_API_KEY no está definida en Vercel.",
    });
  }

  const { prompt, systemPrompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "El campo 'prompt' es requerido." });
  }

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

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

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      return res.status(geminiResponse.status).json({
        error: `Error de Gemini API: ${errorData?.error?.message || "Error desconocido"}`,
      });
    }

    const data = await geminiResponse.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No se obtuvo respuesta.";

    return res.status(200).json({ response: text });
  } catch (err) {
    console.error("Error al llamar a Gemini:", err);
    return res.status(500).json({ error: "Error de conexión con Gemini API." });
  }
}