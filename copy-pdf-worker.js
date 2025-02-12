const fs = require('fs');
const path = require('path');

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

const workerPath = path.join(
  __dirname,
  'node_modules',
  'pdfjs-dist',
  'build',
  'pdf.worker.js'  // Note: removed .min
);

const destPath = path.join(__dirname, 'public', 'pdf.worker.min.js');

try {
  if (fs.existsSync(workerPath)) {
    fs.copyFileSync(workerPath, destPath);
    console.log('PDF worker copied successfully!');
  } else {
    console.error('PDF worker file not found at:', workerPath);
    console.error('Please ensure pdfjs-dist is installed correctly.');
  }
} catch (error) {
  console.error('Error copying PDF worker:', error);
} 