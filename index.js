import 'dotenv/config';
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(express.json());

// ✅ cek apakah API key terbaca
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY tidak ditemukan di .env");
  process.exit(1); // hentikan server
}

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ pakai model yang stabil
const GEMINI_MODEL = "gemini-1.5-flash";

// Route utama
app.get("/", (req, res) => {
  res.send("🚀 Gemini API Server is running...");
});

// Generate Text
app.post("/generate-text", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const model = ai.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);

    // ✅ ambil teks hasil generate
    const text = result?.response?.text?.() || "(no response)";
    res.json({ result: text });
  } catch (err) {
    console.error("❌ ERROR:", err);

    // tangani jika error dari Google API
    if (err.response) {
      const { status, statusText, data } = err.response;
      return res.status(status).json({
        error: statusText,
        details: data,
      });
    }

    res.status(500).json({ error: err.message || "Unknown error" });
  }
});

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server ready on http://localhost:${PORT}`);
});
