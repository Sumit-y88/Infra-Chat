import { Router, Request, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import auth from '../middleware/auth';
import upload from '../middleware/upload';
import { isCloudinaryConfigured, uploadBufferToCloudinary } from '../config/cloudinary';

const router = Router();

// POST /api/upload - Upload a file (Cloudinary with local disk fallback)
router.post('/', auth, (req: Request, res: Response) => {
  upload.single('file')(req, res, async (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size exceeds 10MB limit.' });
      }
      return res.status(400).json({ message: err.message || 'File upload failed.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided.' });
    }

    try {
      if (isCloudinaryConfigured()) {
        const cloudinaryResult = await uploadBufferToCloudinary(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        return res.json({ file: cloudinaryResult });
      }

      // Fallback: save buffer to local uploads directory
      const uploadDir = path.resolve(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const uniqueSuffix = crypto.randomBytes(8).toString('hex');
      const ext = path.extname(req.file.originalname);
      const filename = `${Date.now()}-${uniqueSuffix}${ext}`;
      const filePath = path.join(uploadDir, filename);

      await fs.promises.writeFile(filePath, req.file.buffer);

      const file = {
        url: `/uploads/${filename}`,
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
      };

      return res.json({ file });
    } catch (uploadErr: any) {
      console.error('File Upload Processing Error:', uploadErr.message);
      return res.status(500).json({ message: 'Failed to process and store file upload.' });
    }
  });
});

export default router;
