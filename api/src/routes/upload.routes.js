import express from 'express';
import UploadController, { documentUpload } from '../controllers/upload.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';

const router = express.Router();

router.use(authenticate);
router.use(enforceTenantIsolation);

// POST /v1/uploads/document  (multipart/form-data: file, category, label)
router.post('/document', documentUpload, UploadController.uploadDocument);

export default router;
