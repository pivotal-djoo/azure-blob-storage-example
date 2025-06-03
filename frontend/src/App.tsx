import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Container,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Stack,
  Paper,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

type UploadProgress = {
  [filename: string]: number;
};

const backendBaseUrl = 'http://localhost:3000'; // should be made configurable

function App() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await axios.get<string[]>(`${backendBaseUrl}/files`);
      setUploadedFiles(res.data);
    } catch (err) {
      console.error('Error fetching files:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const uploadFile = async (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('files', file);

    await axios.post(`${backendBaseUrl}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const percent = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        );
        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: percent,
        }));
      },
    });
  };

  const handleUpload = async () => {
    if (!selectedFiles) return;
    const files = Array.from(selectedFiles);

    for (const file of files) {
      try {
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
        await uploadFile(file);
      } catch (err) {
        console.error(`Upload failed for ${file.name}:`, err);
      }
    }

    setSelectedFiles(null);
    setUploadProgress({});
    await fetchFiles();
  };

  const handleDelete = async (filename: string) => {
    try {
      await axios.delete(
        `${backendBaseUrl}/files/${encodeURIComponent(filename)}`
      );
      await fetchFiles();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Azure Blob Storage Example
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <Button variant="contained" component="label">
            Select Files
            <input type="file" multiple hidden onChange={handleFileChange} />
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={!selectedFiles}
          >
            Upload
          </Button>
        </Stack>

        {selectedFiles && (
          <Box mt={3}>
            <Typography variant="h6">Upload Progress</Typography>
            <List>
              {Array.from(selectedFiles).map((file) => (
                <ListItem
                  key={file.name}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                  }}
                >
                  <ListItemText primary={file.name} />
                  <Box sx={{ width: '100%', mt: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={uploadProgress[file.name] || 0}
                    />
                    <Typography variant="caption">
                      {uploadProgress[file.name] || 0}%
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Box mt={5}>
          <Typography variant="h6">Uploaded Files</Typography>
          <List>
            {uploadedFiles.map((file) => (
              <Paper key={file} sx={{ my: 1, px: 2, py: 1 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography>{file}</Typography>
                  <IconButton
                    edge="end"
                    color="error"
                    onClick={() => handleDelete(file)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </Paper>
            ))}
          </List>
        </Box>
      </Box>
    </Container>
  );
}

export default App;
