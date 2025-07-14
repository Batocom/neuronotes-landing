// @ts-ignore
import formidable from 'formidable';
import fs from 'fs';
import pdfParse from '@francisneuronotes/pdf-parse';
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
    let uploadedFile = files.upload;
    if (Array.isArray(uploadedFile)) uploadedFile = uploadedFile[0];
    if (!uploadedFile || !uploadedFile.filepath) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      // ✅ Extract text with pdf-parse
      const buffer = fs.readFileSync(uploadedFile.filepath);
      const parsed = await pdfParse(new Uint8Array(buffer));
      const extractedText = parsed.text || '';

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
              content: extractedText.slice(0, 5000)
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

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS
        }
      });

      // Send summary to user
      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: email,
        subject: '📘 Your NeuroNotes Kit is Ready',
        html: `<p>Here’s your transformed study material:</p><pre style="white-space: pre-wrap;">${result}</pre>`
      });

      // Send copy to admin (with file)
      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: process.env.MAIL_USER,
        subject: '📥 New NeuroNotes Submission',
        html: `<p>New notes submitted by: <strong>${email}</strong></p>`,
        attachments: [
          {
            filename: uploadedFile.originalFilename || 'upload.pdf',
            content: buffer
          }
        ]
      });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Processing error:', error);
      res.status(500).json({ error: 'Failed to process notes' });
    }
  });
}
