# Piano Industriale NewBank - Divisione Real Estate

Applicazione React per la modellazione finanziaria e il calcolo del piano industriale per la divisione Real Estate di una banca.

## Descrizione

Questo strumento permette di:
- Modellare prodotti finanziari immobiliari (con e senza garanzia)
- Calcolare automaticamente P&L, stato patrimoniale e requisiti di capitale
- Analizzare KPI bancari (CET1 ratio, Cost/Income, ROE per prodotto)
- Gestire scenari di rischio (NPL, LGD, provisioning)

## Funzionalità Principali

### 1. Gestione Prodotti
- **Prodotti senza garanzia**: prestiti bullet a 3 anni
- **Prodotti con garanzia**: ammortamento francese a 5 anni
- Parametri configurabili: volumi, tassi, commissioni, rischio

### 2. Calcoli Automatici
- **Conto Economico**: margine interesse, commissioni, costi operativi, LLP
- **Stato Patrimoniale**: crediti performing/NPL, funding mix, patrimonio
- **Capitale**: RWA per rischio, CET1 ratio, allocazione per prodotto
- **KPI**: Cost/Income, ROE per prodotto, evoluzione FTE

### 3. Interfaccia Utente
- Design tipo Excel con schede navigabili
- Modalità edit on/off per proteggere i dati
- Formattazione numeri in formato italiano
- Tabelle finanziarie con drill-down per prodotto

## Struttura Tecnica

### Componenti
- `ExcelLikeBankPlan`: componente principale
- `EditableNumberField`: input numerico con formattazione
- `FinancialTable`: visualizzazione tabelle finanziarie

### Stato e Calcoli
- State centralizzato per tutte le assunzioni
- Motore di calcolo (`calculateResults`) che genera:
  - Evoluzione stock crediti e NPL
  - P&L completo con allocazione per prodotto
  - Requisiti patrimoniali e ROE

## Come Utilizzare

1. **Tab Assumptions**: 
   - Configura parametri generali (equity iniziale, tax rate, costo funding)
   - Imposta volumi e caratteristiche per prodotto
   - Definisci parametri di rischio (danger rate, LTV, recovery)

2. **Tab Dettaglio Divisione RE**:
   - Visualizza risultati su 5 anni
   - Analizza P&L, balance sheet, capitale e KPI
   - Monitora performance per prodotto

3. **Modalità Edit**:
   - Clicca "Abilita Modifiche" per editare
   - "Blocca Modifiche" per proteggere i dati

## Installazione e Setup

```bash
# Clona il repository
git clone https://github.com/fracarlesi/newbank.git
cd newbank

# Installa dipendenze (assumendo un progetto React esistente)
npm install

# Importa il componente nel tuo progetto React
import ExcelLikeBankPlan from './BankPlan.jsx';

# Usa il componente
function App() {
  return <ExcelLikeBankPlan />;
}
```

## Dipendenze

- React 18+
- Lucide React (per le icone)
- Tailwind CSS (per lo styling)

## Prossimi Sviluppi

- [ ] Export dati in Excel/CSV
- [ ] Grafici interattivi dei trend
- [ ] Scenario analysis (base/best/worst)
- [ ] Validazione input avanzata
- [ ] Multi-divisione oltre Real Estate
- [ ] Cash flow statement
- [ ] Sensitivity analysis

## Autore

Francesco Carlesi

## Licenza

Questo progetto è proprietario e riservato.