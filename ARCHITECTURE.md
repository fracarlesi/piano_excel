# Guida all'Architettura di NewBank

Questo documento definisce i principi architetturali fondamentali che devono essere rispettati in ogni modifica o aggiunta di codice.

### 1. Architettura a Funzionalità (Feature-Based)

Il codice è organizzato per funzionalità di business, non per tipo di file.
- **`src/features/`**: Contiene moduli UI auto-contenuti (es. `financial-modeling`, `assumptions-editor`).
- **`src/lib/`**: Contiene la logica core disaccoppiata.
  - **`src/lib/financial-engine/`**: È la sede del motore di calcolo.
  - **`src/lib/firebase/`**: Gestisce la configurazione e l'interazione con Firebase.
- **`src/components/`**: Contiene solo componenti UI generici e riutilizzabili (es. `Button`, `Table`).

### 2. Motore di Calcolo Modulare e Accurato

- **Modularità**: La logica di calcolo in `financial-engine` deve essere suddivisa in "calcolatori" specializzati per ogni area di business (`personnelCalculator.js`, `creditCalculator.js`, etc.). Il file `calculations.js` è solo un **assemblatore** che orchestra le chiamate ai vari moduli.
- **Precisione Assoluta**: Tutti i calcoli che coinvolgono valori monetari devono **obbligatoriamente** utilizzare la libreria **Decimal.js**. L'uso del tipo `Number` nativo di JavaScript per operazioni finanziarie è proibito.

### 3. Gestione dello Stato Globale con Zustand

- Lo stato globale dell'applicazione, in particolare l'oggetto `assumptions`, è gestito tramite uno **store Zustand**.
- I componenti devono accedere allo stato tramite gli hook forniti da Zustand e **non** ricevere dati complessi tramite props ("prop drilling").
- Lo store Zustand è responsabile della sincronizzazione dei dati con Firebase.