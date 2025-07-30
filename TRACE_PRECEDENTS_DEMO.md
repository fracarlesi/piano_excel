# 📊 Enhanced Calculation Tooltip - Trace Precedents Demo

Il CalculationTooltip è stato trasformato da un semplice visualizzatore di formule a un vero strumento di "trace precedents", simile a quello di Excel.

## 🔧 Nuove Funzionalità

### 1. **Trace Precedents (Dipendenze)**
- Ogni cella mostra le dipendenze che contribuiscono al calcolo
- Valori numerici in tempo reale per ogni precedente
- Possibilità di espandere i precedenti per vedere i loro calcoli

### 2. **Live Calculation**
- Formule matematiche con valori numerici attuali
- Calcoli step-by-step per massima trasparenza
- Aggiornamento automatico quando cambiano le assumption

### 3. **Interfaccia Migliorata**
- Sezioni organizzate con icone distintive:
  - 📊 **FORMULA**: Formula simbolica
  - 📈 **LIVE CALCULATION**: Calcolo con valori numerici
  - 🗄️ **PRECEDENTS**: Dipendenze tracciabili
  - ℹ️ **DETAILS**: Informazioni aggiuntive

## 🎯 Come Testare

1. **Apri una qualsiasi pagina divisionale** (es. Real Estate)
2. **Clicca su un valore nelle tabelle P&L**
3. **Osserva il nuovo tooltip**:

### Esempio: Interest Income di un prodotto
```
📊 FORMULA
Average Performing Assets × Interest Rate

📈 LIVE CALCULATION  
250.50 × 6.30% = 15.78 €M

🗄️ PRECEDENTS (DEPENDENCIES)
┌─ Average Performing Assets: 250.50 €M
│  └─ Weighted average of performing loan stock
├─ Interest Rate: 6.30%
│  └─ EURIBOR (3.5%) + Spread (2.8%)
└─ Product Type: amortizing
   └─ Grace period: 2 years
```

### Esempio: Net Interest Income
```
📊 FORMULA
Interest Income - Interest Expenses

📈 LIVE CALCULATION
45.67 - (12.34) = 33.33 €M

🗄️ PRECEDENTS (DEPENDENCIES)
┌─ Interest Income: 45.67 €M
│  └─ Sum of all product interest income
└─ Interest Expenses: -12.34 €M
   └─ Sum of all product funding costs
```

### Esempio: Commission Income aggregato
```
📊 FORMULA
Commission Income = Sum of all products

📈 LIVE CALCULATION
Finanziamenti alle Cartolarizzazioni: 4.50
+ Finanziamenti Ipotecari: 16.00
+ Finanziamenti Bridge: 2.00
= 22.50 €M

🗄️ PRECEDENTS (DEPENDENCIES)
┌─ Finanziamenti alle Cartolarizzazioni: 4.50 €M
│  └─ 150.00 × 0.30%
├─ Finanziamenti Ipotecari: 16.00 €M
│  └─ 200.00 × 0.80%
└─ Finanziamenti Bridge: 2.00 €M
   └─ 80.00 × 2.50%
```

## 🔄 Vantaggi Rispetto al Sistema Precedente

### Prima:
- Solo formula statica
- Nessuna tracciabilità delle dipendenze
- Valori numerici limitati

### Ora:
- ✅ **Trace precedents completo**
- ✅ **Valori numerici in tempo reale**
- ✅ **Calcoli step-by-step**
- ✅ **Interfaccia organizzata per sezioni**
- ✅ **Dipendenze espandibili**
- ✅ **Indicazione anno specifico**

## 🚀 Implementazione Tecnica

### Nuovi Helper Utilities
- `createFormula()`: Formula base con precedents
- `createProductFormula()`: Formule specifiche per prodotti
- `createAggregateFormula()`: Formule per aggregazioni
- `createRatioFormula()`: Formule per rapporti/ratios

### Componenti Aggiornati
- `CalculationTooltip.jsx`: Interfaccia migliorata
- `StandardPnL.jsx`: Utilizza le nuove formule
- `FinancialTable.jsx`: Passa parametri aggiuntivi
- `formulaHelpers.js`: Nuove utilities

## 🎨 Design Pattern

Il sistema segue il pattern di **separazione delle responsabilità**:

1. **formulaHelpers.js**: Logica di creazione formule
2. **CalculationTooltip.jsx**: UI e visualizzazione
3. **StandardPnL.jsx**: Configurazione formule specifiche
4. **FinancialTable.jsx**: Integrazione nel rendering

Questo permette:
- 🔧 **Manutenibilità**: Ogni componente ha un ruolo specifico
- 🔄 **Riusabilità**: Le formule possono essere usate ovunque
- 📊 **Estensibilità**: Facile aggiungere nuovi tipi di formule
- 🎯 **Testabilità**: Ogni parte può essere testata isolatamente

## 🔍 Come Estendere

Per aggiungere nuove formule con trace precedents:

```javascript
// In StandardPnL.jsx o altri componenti
formula: dataArray.map((val, i) => createProductFormula(
  i,                    // Year index
  product,              // Product object
  'formulaType',        // Formula type
  {                     // Values object
    input1: value1,
    input2: value2,
    result: val
  }
))
```

Il sistema è ora completamente scalabile e pronto per supportare qualsiasi tipo di calcolo finanziario complesso! 🚀