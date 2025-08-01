# Report Refactoring LLP e Riformattazione P&L

## Modifiche Implementate (v10.63)

### 1. Creazione Calcolatore LLP Dedicato (`llpCalculator.js`)

**Caratteristiche principali**:
- Implementazione completa del modello IFRS 9 con calcolo DCF
- Calcolo trimestrale basato su:
  - Stock performing all'inizio del trimestre
  - Danger rate annuale convertito in trimestrale (÷4)
  - NPV del recupero atteso considerando:
    - Garanzie statali (MCC/SACE) se presenti
    - Valore del collaterale con haircut
    - Costi di recupero
    - Time value of money (sconto al tasso del prodotto)

**Formula LLP**:
```
LLP = Default Amount - NPV(Expected Recovery)
NPV = Expected Recovery / (1 + annual_rate)^time_to_recover
```

**Test Results**:
- Default trimestrale su €100M con 10% danger rate: €2.5M
- LLP standard: €0.357M (coverage ~14%)
- LLP con garanzia statale 80%: €0.167M (coverage ~7%)

### 2. Integrazione nel Motore di Calcolo

**Modifiche in `creditCalculatorQuarterly.js`**:
- Rimossa logica LLP embedded
- Integrato nuovo calcolatore modulare
- Calcolo LLP basato su portafoglio totale inizio trimestre
- Gestione recovery cohorts per tracking NPL

### 3. Riformattazione P&L Bancario

**Nuova struttura in `StandardPnL.jsx`**:

```
Interest Income
FTP
Net Interest Income (NII)
Commission Income  
Commission Expenses
Net Commission Income (NCI)
Total Revenues
Loan Loss Provisions  ← SPOSTATO QUI (prima era sotto "Other Costs")
Net Revenues (Risk-Adjusted)  ← NUOVO SUBTOTALE
Personnel Costs
Other OPEX
Total OPEX
Other Costs
Pre-tax Profit
```

**Vantaggi della nuova struttura**:
1. **Visibilità immediata del costo del rischio**: LLP mostrato subito dopo i ricavi
2. **Ricavi risk-adjusted**: Nuovo KPI che mostra la redditività al netto del rischio
3. **Allineamento agli standard bancari**: Struttura P&L conforme alle best practice di reporting

**Formula Pre-tax Profit aggiornata**:
```
Prima: Total Revenues - Total OPEX - LLP
Dopo:  Net Revenues (Risk-Adjusted) + Total OPEX
```

### 4. Risoluzione Anomalie Numeriche

Il nuovo calcolatore risolve il problema dei valori LLP che si esaurivano rapidamente:
- Calcolo continuo trimestre per trimestre
- Non dipende da stock iniziale fisso ma da performing stock dinamico
- Considera correttamente il time value of money
- Supporta garanzie statali per riduzione LLP

### 5. Benefici dell'Architettura Modulare

1. **Manutenibilità**: Logica LLP isolata e testabile
2. **Trasparenza**: Calcoli tracciabili con report dettagliati
3. **Flessibilità**: Facile aggiungere nuovi modelli di impairment
4. **Conformità**: Allineato a IFRS 9 e prassi bancarie

### Test di Verifica

Tutti i test passano con successo:
- ✅ Calcolo LLP trimestrale
- ✅ Gestione garanzie statali
- ✅ Aggregazione annuale
- ✅ Report generation

Il modello ora produce valori LLP coerenti e sostenibili nel tempo, risolvendo le anomalie precedenti.