import express from 'express';
import cors from 'cors'
import bodyParser from "body-parser";
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

// Helper to get __dirname in ES module
const __dirname = "/home/ec2-user/load_testing_ausi";

// Set up Express app
const app = express();
app.use(cors())
app.use(bodyParser.json())
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
    const inputVideoPath = path.join(__dirname,'uploads', "1726121432412-output_audio.wav"); // Input uploaded file path
    const convert_name = `${Date.now()}-converted.mp4`
    const outputVideoPath = path.join(__dirname, 'uploads', convert_name); // Output converted video path
  
    try {
      const convertedVideo = await convertVideo(inputVideoPath, outputVideoPath);
      const videoPath = path.join(__dirname,'uploads', convert_name);
  const videoStat = fs.statSync(videoPath);
  const fileSize = videoStat.size;
  const range = req.headers.range;

  if (range) {
    // Handle range requests for video streaming
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    const chunkSize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    };

    res.writeHead(206, head); // Partial Content
    file.pipe(res);
  } else {
    // If no range header, send the entire video
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };

    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
      // res.send(`Video uploaded and converted successfully: ${convertedVideo}`);
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

app.get('/video', (req, res) => {
  const videoPath = path.join(__dirname,'uploads', '1726148544640-converted.mp4');
  const videoStat = fs.statSync(videoPath);
  const fileSize = videoStat.size;
  const range = req.headers.range;

  if (range) {
    // Handle range requests for video streaming
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    const chunkSize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    };

    res.writeHead(206, head); // Partial Content
    file.pipe(res);
  } else {
    // If no range header, send the entire video
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };

    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// Start the server
app.listen(3001, () => {
  console.log('Server is running on port 3001 2');
});
