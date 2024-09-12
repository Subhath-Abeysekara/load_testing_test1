import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Helper to get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up Express app
const app = express();

// Configure Multer to store uploaded videos in a specific folder ('uploads/')
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads'); // Define your upload folder
    // Create the folder if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath); // Upload folder
  },
  filename: (req, file, cb) => {
    // Use the original name of the file for storage or customize it
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Set up the file filter to only accept video files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true); // Accept video files
  } else {
    cb(new Error('Only video files are allowed!'), false); // Reject other files
  }
};

// Initialize Multer with the defined storage and file filter
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // Limit file size to 100MB
});

// POST route to handle video uploads
app.post('/upload', upload.single('video'), (req, res) => {
  console.log(req)
  console.log("api working")
  if (!req.file) {
    console.log("No file")
    return res.status(400).send('No video uploaded or invalid file type.');
  }
  res.send(`Video uploaded successfully: ${req.file.filename}`);
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
