import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary from environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
  });
} else if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

export const isCloudinaryConfigured = (): boolean => {
  return Boolean(
    process.env.CLOUDINARY_URL ||
    (process.env.CLOUDINARY_CLOUD_NAME &&
     process.env.CLOUDINARY_API_KEY &&
     process.env.CLOUDINARY_API_SECRET)
  );
};

export interface UploadedFileResult {
  url: string;
  name: string;
  size: number;
  type: string;
  publicId?: string;
}

/**
 * Upload an in-memory buffer to Cloudinary
 */
export const uploadBufferToCloudinary = (
  buffer: Buffer,
  originalname: string,
  mimetype: string
): Promise<UploadedFileResult> => {
  return new Promise((resolve, reject) => {
    const isImage = mimetype.startsWith('image/');
    const isVideo = mimetype.startsWith('video/');
    const resourceType: 'image' | 'video' | 'raw' = isImage ? 'image' : isVideo ? 'video' : 'raw';

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'infra_chat_uploads',
        resource_type: resourceType,
        filename_override: originalname,
        use_filename: true,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Cloudinary upload returned empty result'));
        }

        resolve({
          url: result.secure_url,
          name: originalname,
          size: result.bytes || buffer.length,
          type: mimetype,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Extract publicId from a Cloudinary URL if publicId wasn't saved in DB
 */
export const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    const uploadIdx = url.indexOf('/upload/');
    if (uploadIdx === -1) return null;

    const afterUpload = url.substring(uploadIdx + '/upload/'.length);
    // Remove version segment like v1740580000/ if present
    const withoutVersion = afterUpload.replace(/^v\d+\//, '');
    // Remove file extension
    const withoutExt = withoutVersion.replace(/\.[^/.]+$/, '');
    return decodeURIComponent(withoutExt);
  } catch {
    return null;
  }
};

/**
 * Delete a file from Cloudinary or local disk
 */
export const deleteFileStorage = async (attachment: {
  url: string;
  publicId?: string;
  type?: string;
}): Promise<void> => {
  try {
    if (!attachment || !attachment.url) return;

    const url = attachment.url;
    const isCloudinary = Boolean(attachment.publicId || url.includes('cloudinary.com') || url.includes('res.cloudinary.com'));

    if (isCloudinary) {
      if (!isCloudinaryConfigured()) {
        console.warn('Cloudinary keys not present in .env; skipping remote delete for:', attachment.publicId || url);
        return;
      }

      const publicId = attachment.publicId || extractPublicIdFromUrl(url);
      if (!publicId) {
        console.warn('Could not extract publicId for Cloudinary deletion:', url);
        return;
      }

      const isImage = attachment.type ? attachment.type.startsWith('image/') : true;
      const isVideo = attachment.type ? attachment.type.startsWith('video/') : false;
      const resourceType: 'image' | 'video' | 'raw' = isImage ? 'image' : isVideo ? 'video' : 'raw';

      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      } catch (err: any) {
        // Fallback for raw files stored without explicit type
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        } catch {
          console.error('Failed to destroy Cloudinary asset:', err.message);
        }
      }
    } else if (url.startsWith('/uploads/')) {
      // Local disk file deletion
      const filename = path.basename(url);
      const filePath = path.resolve(process.cwd(), 'uploads', filename);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    }
  } catch (err: any) {
    console.error('Error in deleteFileStorage:', err.message);
  }
};

export default {
  isCloudinaryConfigured,
  uploadBufferToCloudinary,
  deleteFileStorage,
  extractPublicIdFromUrl,
};
