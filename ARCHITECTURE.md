# Architettura del Progetto

Questa applicazione adotta un'architettura **basata sulle funzionalità** (*feature-based*). L'obiettivo è organizzare il codice in modo che rispecchi fedelmente le sezioni e le viste dell'interfaccia utente, rendendo il progetto più intuitivo, scalabile e facile da manutenere.

## Principi Fondamentali

1.  **Separazione delle Responsabilità (Separation of Concerns)**: La logica di presentazione (UI), la logica di business (i calcoli finanziari) e lo stato dell'applicazione sono nettamente separati.
2.  **Alta Coesione (High Cohesion)**: Tutti i file relativi a una singola funzionalità sono raggruppati nella stessa cartella.
3.  **Basso Accoppiamento (Low Coupling)**: Le funzionalità sono il più possibile indipendenti tra loro.

## Struttura delle Cartelle (`src`)

La struttura della cartella `src/` è organizzata come segue:

```
src/
│
├── components/         # Componenti UI generici e riutilizzabili
│
├── data/               # Dati statici e configurazioni iniziali
│
├── features/           # FUNZIONALITÀ PRINCIPALI (le sezioni dell'app)
│   │
│   ├── layout/         #   (Header, Navigation)
│   ├── assumptions-editor/ #   (Codice per la sezione "Assumptions")
│   └── financial-modeling/ #   (Codice per le schede delle divisioni)
│
├── lib/                # Logica core, utility e servizi esterni
│   │
│   ├── financial-engine/ #   ("Cervello" dei calcoli, organizzato in microservizi)
│   ├── firebase/       #   (Configurazione di Firebase)
│   └── utils/          #   (Funzioni di utilità)
│
└── store/              # Gestione dello stato globale (Zustand)
```

### Descrizione delle Cartelle Principali

* **`src/features`**: Il cuore dell'applicazione. Ogni sottocartella corrisponde a una sezione logica dell'UI.
* **`src/lib`**: Contiene la logica di business pura. `lib/financial-engine` è il motore di calcolo e non deve contenere codice React.
* **`src/components`**: Contiene componenti React "stupidi" e riutilizzabili che non contengono logica di business.
* **`src/store`**: Contiene la definizione dello stato globale dell'applicazione (Zustand).

## Flusso dei Dati

1.  L'utente modifica un valore nella UI (`feature`).
2.  L'azione aggiorna lo stato globale nello `store`.
3.  Quando necessario, l'orchestratore in `lib/financial-engine` viene invocato per eseguire i ricalcoli.
4.  I risultati vengono passati ai componenti `feature` per essere visualizzati.