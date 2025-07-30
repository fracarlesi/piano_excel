// API endpoint per salvare assumptions nella directory del progetto
// Questo file dovrebbe essere spostato in una cartella API del server

const fs = require('fs');
const path = require('path');

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, filename } = req.body;
    
    // Percorso per salvare il file nella directory del progetto
    const projectDir = process.cwd();
    const saveDir = path.join(projectDir, 'saved-assumptions');
    
    // Crea la directory se non esiste
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }
    
    const filepath = path.join(saveDir, filename);
    
    // Salva il file
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    
    res.status(200).json({ 
      success: true, 
      filepath: filepath,
      message: 'File saved successfully' 
    });
    
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ 
      error: 'Failed to save file',
      details: error.message 
    });
  }
}