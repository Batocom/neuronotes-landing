// api/send.js
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
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
    if (err) {
      console.error('Form parse error:', err);
      return res.status(500).json({ error: 'Form processing error' });
    }

    const { email } = fields;
    const uploadedFile = files['upload'];
    
    console.log('Fields:', fields);
    console.log('Files:', files);


    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: process.env.MAIL_USER,
      subject: '📥 New NeuroNotes Submission',
      text: `Email: ${email}`,
      html: `<p><strong>Email:</strong> ${email}</p>`,
      attachments: [
        {
          filename: uploadedFile.originalFilename,
          path: uploadedFile.filepath
        }
      ]
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Send error:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  });
}
