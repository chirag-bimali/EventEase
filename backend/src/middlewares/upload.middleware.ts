import multer from "multer";
import fs from "fs";
import path from "path";
import type { Request } from "express";

export interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const eventsImageUploadDir = path.resolve(
  process.env.EVENTS_IMAGE_UPLOAD_PATH || "temp/uploads/events",
);

fs.mkdirSync(eventsImageUploadDir, { recursive: true });

// Configure storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, eventsImageUploadDir); // Store event images in the resolved upload folder
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter - only allow images
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
    "image/gif",
    "image/avif",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, WebP, GIF, and AVIF images are allowed.",
      ),
    );
  }
};

// Multer upload configuration
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});
