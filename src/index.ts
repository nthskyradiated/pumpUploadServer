import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import { join } from "path";
import fs from "fs/promises";


export const app = express();
const port = 3000;

// Use process.cwd() to define the base directory
const baseDir = process.cwd();

// Set up CORS middleware
app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: join(baseDir, "src/uploads"), // Adjust path resolution
  filename: function (_req: Request, file: Express.Multer.File, cb) {
    cb(null, file.originalname);
  },
});

// File filter to check for allowed file types
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedFileTypes = [
    "application/pdf",
    "application/msword",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/bmp",
  ];

  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true); // File is valid
  } else {
    const error = new multer.MulterError(
      "LIMIT_UNEXPECTED_FILE",
      file.fieldname
    ); // Pass a Multer-specific error
    error.message =
      "Invalid file type. Only PDF, Word documents, and image files are allowed.";
    return cb(error as any, false); // Reject the file
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter,
});

// File upload endpoint
app.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }

      const { originalname } = req.file;
      const fileUrl = `http://localhost:${port}/uploads/${originalname}`;

      res.json({
        originalname,
        url: fileUrl,
      });
    } catch (error) {
      next(error); // Forward the error to the global error handler
    }
  }
);

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof multer.MulterError) {
    // Handle multer-specific errors (e.g., file too large)
    if (err.code === "LIMIT_FILE_SIZE") {
      res
        .status(400)
        .json({ error: "File is too large. Maximum allowed size is 10MB." });
      return;
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      res
        .status(400)
        .json({
          error:
            "Invalid file type. Only PDF, Word documents, and image files are allowed.",
        });
      return;
    }
    // Handle other multer errors
    res.status(500).json({ error: `Multer Error: ${err.message}` });
    return;
  }

  // Handle general errors
  if (err.status === 400) {
    res.status(400).json({ error: err.message }); // Invalid file type or other custom 400 errors
  } else {
    res
      .status(500)
      .json({
        error: `Internal Server Error: ${err.message || "Unknown error"}`,
      });
  }
});

// Delete file endpoint
app.delete(
  "/uploads/:filename",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const filename = req.params.filename;
      const filePath = join(baseDir, "src/uploads", filename);

      const fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);

      if (!fileExists) {
        res.status(404).json({ error: "File not found" });
        return;
      }

      await fs.unlink(filePath);

      res.json({ message: "File deleted successfully" });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Serve uploaded files statically
app.use(
  "/uploads",
  express.static(join(baseDir, "src/uploads"), { redirect: false })
);

export const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
