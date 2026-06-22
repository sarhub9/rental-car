import multer from 'multer';
import PhotoStorageService from '../services/photo-storage.service.js';

// In-memory upload (max 10MB), single image file
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

class UploadController {
  /**
   * Generic document/image upload.
   * Stores the file via PhotoStorageService and returns its public URL.
   * Used for customer/driver document photos and vehicle photos.
   */
  async uploadDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded (field name must be "file")' });
      }

      const category = (req.body.category || 'general').toString().replace(/[^a-zA-Z0-9_-]/g, '');
      const label = (req.body.label || 'DOC').toString().replace(/[^a-zA-Z0-9_-]/g, '');

      const result = await PhotoStorageService.uploadPhoto(req.file.buffer, {
        tenantId: req.tenantId,
        agreementId: 'documents',
        evidenceType: category,
        photoAngle: label,
      });

      return res.status(201).json({
        success: true,
        data: {
          url: result.photoUrl,
          thumbnail_url: result.thumbnailUrl,
          file_size: result.fileSize,
        },
      });
    } catch (error) {
      console.error('Document upload error:', error);
      return res.status(500).json({ error: 'Failed to upload file' });
    }
  }
}

export const documentUpload = upload.single('file');
export default new UploadController();
