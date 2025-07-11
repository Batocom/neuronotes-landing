import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import axios from 'axios';
import nodemailer from 'nodemailer';

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const form = formidable({ multiples: false, uploadDir: '/tmp', keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Form parsing error' });

    const { email } = fields;
    const uploadedFile = files.upload;

    if (!uploadedFile || !uploadedFile.filepath) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      // ✅ Extract PDF content
      const pdfBuffer = fs.readFileSync(uploadedFile.filepath);
      const parsed = await pdfParse(pdfBuffer);
      const extractedText = parsed.text;

      // ✅ Send to DeepSeek API
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `You are a smart study assistant. Based on the user's notes, generate:
1. A bullet point summary
2. 3 engaging quiz questions
3. A visual diagram suggestion or metaphor
Keep it short, clean, and structured for ADHD learners.`
            },
            {
              role: 'user',
              content: extractedText.slice(0, 5000) // limit to prevent token overload
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = response.data.choices[0].message.content;

      // ✅ Email it to the user
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS
        }
      });

      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: email,
        subject: '📘 Your NeuroNotes Kit is Ready',
        html: `<p>Here’s your transformed study material:</p><pre style="white-space: pre-wrap;">${result}</pre>`
      });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Processing error:', error);
      res.status(500).json({ error: 'Failed to process notes' });
    }
  });
}
