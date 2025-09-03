import express from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();
const app = express();

// ===== Middleware parsing =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Init Gemini API =====
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY belum di-set di .env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// ===== Multer Setup =====
const upload = multer({ dest: 'uploads/' });

// ===== Helper Function =====
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
      mimeType,
    },
  };
}

// ===== ROUTES =====

// Test server
app.get('/', (req, res) => {
  res.send('✅ Gemini API server is running');
});

// === 1. TEXT ===
app.post('/generate-text', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ output: text });
  } catch (error) {
    console.error("❌ Error /generate-text:", error);
    res.status(500).json({ error: error.message });
  }
});

// === 2. IMAGE ===
app.post('/generate-from-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const prompt = req.body?.prompt || 'Describe this image';
    const image = fileToGenerativePart(req.file.path, req.file.mimetype);

    // ✅ Format baru (tanpa role/parts)
    const result = await model.generateContent([
      { text: prompt },
      image
    ]);

    res.json({ output: result.response.text() });
  } catch (error) {
    console.error("❌ Error /generate-from-image:", error);
    res.status(500).json({ error: error.message });
  } finally {
    if (req.file) fs.unlinkSync(req.file.path);
  }
});

// === 3. AUDIO ===
app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    res.json({
      message:
        '⚠️ Gemini belum support audio langsung. Gunakan Google Speech-to-Text lalu kirim hasil teks ke /generate-text.',
      file: req.file.originalname,
    });
  } catch (error) {
    console.error("❌ Error /generate-from-audio:", error);
    res.status(500).json({ error: error.message });
  } finally {
    if (req.file) fs.unlinkSync(req.file.path);
  }
});

// === 4. VIDEO ===
app.post('/generate-from-video', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Video file is required' });
    }

    res.json({
      message:
        '⚠️ Gemini belum bisa analisis video langsung. Ambil frame (gambar) dari video lalu kirim ke /generate-from-image.',
      file: req.file.originalname,
    });
  } catch (error) {
    console.error("❌ Error /generate-from-video:", error);
    res.status(500).json({ error: error.message });
  } finally {
    if (req.file) fs.unlinkSync(req.file.path);
  }
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Gemini API server running at http://localhost:${PORT}`);
});
