// api/send.js
import formidable from 'formidable';
import fs from 'fs';
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
      console.error('❌ Form parse error:', err);
      return res.status(500).json({ error: 'Form processing error' });
    }

    const { email } = fields;
    let uploadedFile = files['upload'];
    if (Array.isArray(uploadedFile)) {
      uploadedFile = uploadedFile[0];
    }


    console.log('📨 Email from:', email);
    console.log('📎 Uploaded file:', uploadedFile);

    if (!uploadedFile) {
      console.error('❌ No file uploaded. Files:', files);
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let fileBuffer;
    try {
      fileBuffer = fs.readFileSync(uploadedFile.filepath);
    } catch (readErr) {
      console.error('❌ File read error:', readErr);
      return res.status(500).json({ error: 'Failed to read uploaded file' });
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
          filename: uploadedFile.originalFilename || 'uploaded_file',
          content: fileBuffer
        }
      ]
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully');
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('❌ Send error:', error);
      res.status(500).json({ error: 'Failed to send email' });
    } finally {
      // Optional: clean up temp file
      try {
        fs.unlinkSync(uploadedFile.filepath);
        console.log('🧹 Temp file deleted');
      } catch (unlinkErr) {
        console.warn('⚠️ Failed to delete temp file:', unlinkErr);
      }
    }
  });
}
