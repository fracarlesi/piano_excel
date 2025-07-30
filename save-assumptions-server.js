const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// API endpoint per salvare assumptions
app.post('/api/save-assumptions', (req, res) => {
  try {
    const { data, filename } = req.body;
    
    // Percorso per salvare il file nella directory del progetto
    const projectDir = __dirname;
    const saveDir = path.join(projectDir, 'saved-assumptions');
    
    // Crea la directory se non esiste
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }
    
    const filepath = path.join(saveDir, filename);
    
    // Salva il file
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    
    console.log(`✅ File saved: ${filepath}`);
    
    res.status(200).json({ 
      success: true, 
      filepath: path.relative(projectDir, filepath),
      message: 'File saved successfully' 
    });
    
  } catch (error) {
    console.error('❌ Error saving file:', error);
    res.status(500).json({ 
      error: 'Failed to save file',
      details: error.message 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Save server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Save server running on http://localhost:${PORT}`);
  console.log(`💾 Files will be saved to: ${path.join(__dirname, 'saved-assumptions')}`);
});