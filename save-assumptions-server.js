const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// API endpoint per caricare assumptions (single source of truth)
app.get('/api/load-assumptions', (req, res) => {
  try {
    const projectDir = __dirname;
    const saveDir = path.join(projectDir, 'saved-assumptions');
    const currentFilePath = path.join(saveDir, 'bank-plan-assumptions-current.json');
    
    // Se esiste il file corrente, caricalo
    if (fs.existsSync(currentFilePath)) {
      const data = fs.readFileSync(currentFilePath, 'utf8');
      const assumptions = JSON.parse(data);
      console.log(`✅ Loaded current assumptions from: ${currentFilePath}`);
      res.status(200).json(assumptions);
      return;
    }
    
    // Altrimenti cerca il file più recente nella directory
    if (fs.existsSync(saveDir)) {
      const files = fs.readdirSync(saveDir)
        .filter(file => file.endsWith('.json') && file.startsWith('bank-plan-assumptions'))
        .map(file => ({
          name: file,
          path: path.join(saveDir, file),
          mtime: fs.statSync(path.join(saveDir, file)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime);
      
      if (files.length > 0) {
        const latestFile = files[0];
        const data = fs.readFileSync(latestFile.path, 'utf8');
        const assumptions = JSON.parse(data);
        console.log(`✅ Loaded latest assumptions from: ${latestFile.name}`);
        res.status(200).json(assumptions);
        return;
      }
    }
    
    // Nessun file trovato
    console.log('⚠️  No saved assumptions found, client will use defaults');
    res.status(404).json({ 
      error: 'No saved assumptions found',
      message: 'Client should use default assumptions' 
    });
    
  } catch (error) {
    console.error('❌ Error loading assumptions:', error);
    res.status(500).json({ 
      error: 'Failed to load assumptions',
      details: error.message 
    });
  }
});

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