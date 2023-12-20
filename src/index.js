import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// Set up CORS middleware
app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
}));

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: './src/uploads',
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ['application/pdf', 'application/msword', 'image/jpeg', 'image/png', 'image/webp', 'image/bmp'];
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Word documents, and image files are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// File upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('server receive:', req.file);
    if (!req.file) {
      // Handle the case where no file was uploaded
      return res.status(400).json({ error: 'No file provided' });
    }

    // Access properties of the uploaded file
    const { originalname } = req.file;
    const fileUrl = `http://localhost:${port}/uploads/${originalname}`;

    // Respond with the file information
    res.json({
      originalname,
      url: fileUrl
    });
  } catch (error) {
    // Handle other errors
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static(join(__dirname, 'uploads')));


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});