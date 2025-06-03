import cors from 'cors';
import express from 'express';
import {
  uploadFileToBlob,
  downloadFileFromBlob,
  deleteFileFromBlob,
  getAllFilenamesFromBlob,
} from './azureBlobService';
import multer from 'multer';

const app = express();
const port = 3000;
const upload = multer();

app.disable('x-powered-by');
app.use(
  cors({
    origin: '*',
    methods: ['PUT', 'POST', 'HEAD', 'OPTIONS', 'PATCH', 'DELETE', 'GET'],
  })
);

app.post('/files', upload.any(), async (req, res) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length <= 0) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    req.files.forEach(async (file) => {
      await uploadFileToBlob(file.originalname, file.buffer);
    });
    res.send('File uploaded to Azure Blob Storage.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Upload failed.');
  }
});

app.get('/files', async (_req, res) => {
  try {
    const filenames: string[] = await getAllFilenamesFromBlob();
    res.json(filenames);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to list files' });
  }
});

app.get('/files/:filename', async (req, res) => {
  try {
    const stream = await downloadFileFromBlob(req.params.filename);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${req.params.filename}`
    );
    stream.pipe(res);
  } catch (err) {
    // if (err instanceof RestError && err.statusCode === 404) { // doesn't seem to work
    if ((err as { statusCode?: number })?.statusCode === 404) {
      return res.status(404).send('File not found.');
    }
    console.error(err);
    res.status(500).send('Download failed.');
  }
});

app.delete('/files/:filename', async (req, res) => {
  try {
    const stream = await deleteFileFromBlob(req.params.filename);
    res.send('File deleted from Azure Blob Storage.');
  } catch (err) {
    // if (err instanceof RestError && err.statusCode === 404) { // doesn't seem to work
    if ((err as { statusCode?: number })?.statusCode === 404) {
      return res.status(404).send('File not found.');
    }
    console.error(err);
    res.status(500).send('Delete failed.');
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
