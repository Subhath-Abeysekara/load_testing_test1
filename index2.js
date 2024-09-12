import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

// Helper to get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up Express app
const app = express();

// Configure Multer to store uploaded files in a specific folder ('uploads/')
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

// Set up the file filter to accept any file type
const fileFilter = (req, file, cb) => {
  // Accept all file types
  cb(null, true);
};

// Initialize Multer with the defined storage and file filter
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // Limit file size to 100MB (optional)
});

const convertVideo = (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .run();
    });
  };

  app.post('/convert', async (req, res) => {
    console.log('api_working')
    console.log(req.body)
    const inputVideoPath = path.join(__dirname, "1726121432412-output_audio.wav"); // Input uploaded file path
    const outputVideoPath = path.join(__dirname, 'uploads', `${Date.now()}-converted.mp4`); // Output converted video path
  
    try {
      const convertedVideo = await convertVideo(inputVideoPath, outputVideoPath);
      res.send(`Video uploaded and converted successfully: ${convertedVideo}`);
    } catch (err) {
      res.status(500).send(`Error converting video: ${err.message}`);
    }
  });

// POST route to handle file uploads
app.post('/upload', upload.single('file'), (req, res) => {
  console.log("API working");
  if (!req.file) {
    return res.status(400).send('No file uploaded or invalid file type.');
  }
  res.send(`File uploaded successfully: ${req.file.filename}`);
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000 2');
});
