# 💾 SISTEMA DI SALVATAGGIO ASSUMPTION

## 🎯 Due Modi per Salvare:

### **1. 💾 Save to Project Folder (Raccomandato)**
- Salva il file direttamente nella cartella `saved-assumptions/` del progetto
- Richiede il server di salvataggio attivo

### **2. 📁 Download JSON File (Fallback)**
- Scarica il file nella cartella Downloads del browser
- Funziona sempre, non richiede server aggiuntivo

## 🚀 Come Avviare:

### **Opzione A: Avvio Completo (Raccomandato)**
```bash
# Installa le dipendenze (solo la prima volta)
npm install

# Avvia sia l'app React che il server di salvataggio
npm run dev
```

### **Opzione B: Solo App React**
```bash
# Solo l'applicazione React (porta 3000)
npm start
```

### **Opzione C: Solo Server di Salvataggio**
```bash
# Solo il server per salvare file (porta 3001)
npm run start-save-server
```

## 📂 Dove Trovare i File Salvati:

### **Salvataggio Progetto:**
```
/saved-assumptions/
├── bank-plan-assumptions-2024-01-15-10-30-45.json
├── bank-plan-assumptions-2024-01-15-11-22-10.json
└── ...
```

### **Download Browser:**
```
~/Downloads/
├── bank-plan-assumptions-2024-01-15-10-30-45.json
└── ...
```

## 🔧 Come Funziona:

1. **Modifica le assumption** nell'app
2. **Vai alla pagina Assumptions**
3. **Scorri in basso** fino a "Save & Tools"
4. **Scegli il tipo di salvataggio:**
   - **💾 Save to Project Folder** → Salva in `/saved-assumptions/`
   - **📁 Download JSON File** → Scarica in Downloads

## ⚡ Note Tecniche:

- **Porta React App:** 3000
- **Porta Save Server:** 3001
- **Auto-fallback:** Se il server è offline, usa automaticamente il download
- **Formato:** JSON leggibile e modificabile
- **Import:** Usa il bottone import esistente per ricaricare i file