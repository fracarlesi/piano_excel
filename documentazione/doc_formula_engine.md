# Documentazione: FormulaEngine - Motore di Calcolo con Vintage Analysis
## STEP 3 - Motore di Inserimento Formule per Modello con Vintage

### 📋 Storico Modifiche
- **11 Agosto 2025**: Implementazione completa Vintage Analysis
  - Matrici vintage 20x20 per prodotto
  - Calcolo ECL Stage 1
  - NBV Performing e Non-Performing
  - Collegamenti CE e SP
- **11 Agosto 2025**: Integrazione formule urgenti (Y30, Y91, Y108, Y126)
- **11 Agosto 2025**: Implementazione 5 modifiche parametriche
- **Data iniziale**: Versione trimestrale con 20 trimestri

### 📋 Descrizione
Il FormulaEngine è la classe che implementa tutte le formule Excel per il modello bancario trimestrale con gestione completa della vintage analysis. Inserisce formule parametriche che collegano i dati di input con i calcoli di appoggio e i report finali. **Versione aggiornata per supportare 20 trimestri (Q1-Q20)** con tracking completo per vintage.

### 🔧 Funzionalità Principali

## Classe FormulaEngine

### Inizializzazione Trimestrale
```python
engine = FormulaEngine("modello_bancario_completo.xlsx")
```
- Carica il workbook Excel esistente
- Accede ai fogli "Input" e "Modello"
- **Configura supporto trimestrale**: 20 trimestri (Q1-Q20)
- **Genera colonne dinamicamente**: C-V per i 20 trimestri
- Inizializza gli stili per formattazione FORMULA
- Mappa i riferimenti chiave nel foglio Input per modello trimestrale

#### Configurazione Trimestrale
```python
# Proprietà della classe per supporto trimestrale
self.num_quarters = 20  # 20 trimestri
self.quarter_columns = [get_column_letter(3 + i) for i in range(20)]  # C-V
self.first_data_col = 'C'  # Q1
self.last_data_col = 'V'   # Q20
```

### 🎨 Sistema di Formattazione FORMULA
Il formula_engine preserva e applica la formattazione visiva per distinguere le celle con formule:

#### Stili FORMULA Applicati
- **Sfondo**: #F5F5F5 (grigio chiaro)
- **Testo**: #000000 (nero)
- **Bordo**: Linea tratteggiata (dashed)
- **Allineamento**: Centrato

#### Funzione `_format_formula_cell()`
```python
def _format_formula_cell(self, cell, number_format=None):
    """Applica la formattazione delle celle con FORMULA"""
    cell.fill = self.formula_fill
    cell.font = self.formula_font
    cell.border = self.formula_border
    cell.alignment = Alignment(horizontal='center')
    if number_format:
        cell.number_format = number_format
```

### 📊 Sezioni di Formule Implementate

#### 1. inserisci_formule_conto_economico() - VERSIONE TRIMESTRALE
Popola le formule del Conto Economico per **tutti i 20 trimestri**:
- **Net Interest Income** = Interest Income - Interest Expenses (per Q1-Q20)
- **Net Commission Income** = Commission Income - Commission Expenses (per Q1-Q20)
- **Total Revenues** = Net Interest Income + Net Commission Income (per Q1-Q20)
- **Total Operating Costs** = Staff Costs + Other Operating Costs (per Q1-Q20)
- **Gross Operating Profit** = Total Revenues - Total Operating Costs (per Q1-Q20)
- **Operating Profit** = Gross Operating Profit - Ammortamenti - LLP (per Q1-Q20)
- **Taxes** = Operating Profit * Aliquota Fiscale (dal foglio Input, per Q1-Q20)
- **Net Profit** = Operating Profit - Taxes (per Q1-Q20)

```python
# Esempio di formula trimestrale
for col in self.quarter_columns:  # C, D, E, ..., V
    cell = self.ws_modello[f'{col}{net_interest_row}']
    cell.value = f"={col}{interest_income_row}-{col}{interest_expense_row}"
    self._format_formula_cell(cell, '#,##0.0')
```

#### 2. inserisci_formule_stato_patrimoniale()
Popola le formule dello Stato Patrimoniale:
- **Loans to Customers (Net)** = Loans Gross - Loan Loss Reserves
- **Total Assets** = SUM di tutti gli asset
- **Total Liabilities** = SUM di tutte le passività
- **Total Equity** = Share Capital + Retained Earnings
- **Total Liabilities & Equity** = Total Liabilities + Total Equity
- **Check di Quadratura** = Total Assets - Total Liabilities & Equity

#### 3. inserisci_formule_capital_requirements()
Popola le formule dei Capital Requirements:
- **Total RWA** = Credit Risk RWA + Market Risk RWA + Operational Risk RWA
- **CET1 Ratio** = CET1 Capital / Total RWA (con controllo divisione per zero)
- **Total Capital Ratio** = Total Capital / Total RWA

#### 4. inserisci_formule_kpi() - VERSIONE TRIMESTRALE CON ANNUALIZZAZIONE
Popola le formule dei Key Performance Indicators **annualizzati dai valori trimestrali**:
- **ROE %** = (Net Profit trimestrale * 4) / Total Equity (annualizzato)
- **ROA %** = (Net Profit trimestrale * 4) / Total Assets (annualizzato)
- **NIM %** = (Net Interest Income trimestrale * 4) / Total Assets (annualizzato)
- **Cost/Income %** = Total Operating Costs / Total Revenues (trimestrale)

```python
# Esempio di KPI annualizzato
for col in self.quarter_columns:
    # ROE annualizzato moltiplicando il trimestrale per 4
    cell = self.ws_modello[f'{col}{roe_row}']
    cell.value = f"=IF({col}{total_equity_sp_row}>0,({col}{net_profit_ce_row}*4)/{col}{total_equity_sp_row},0)"
    self._format_formula_cell(cell, '0.0%')
```

### 🔄 Processo di Inserimento

#### Metodo Principale
```python
def inserisci_tutte_formule(self):
    """Inserisce tutte le formule nel modello"""
    self.inserisci_formule_calcoli_appoggio()
    self.inserisci_formule_conto_economico()
    self.inserisci_formule_stato_patrimoniale()
    self.inserisci_formule_capital_requirements()
    self.inserisci_formule_kpi()
```

#### Pattern di Inserimento Trimestrale
Per ogni formula, **ciclo su tutti i 20 trimestri**:
1. Trova la riga della voce tramite `_trova_riga()`
2. **Cicla su self.quarter_columns (C-V)**
3. Crea la cella e assegna la formula per ogni trimestre
4. Applica la formattazione FORMULA tramite `_format_formula_cell()`
5. Imposta il formato numerico appropriato

Esempio:
```python
for col in self.quarter_columns:  # Da C a V (20 trimestri)
    cell = self.ws_modello[f'{col}{net_interest_row}']
    cell.value = f"={col}{interest_income_row}-{col}{interest_expense_row}"
    self._format_formula_cell(cell, '#,##0.0')
```

### 🛠️ Funzioni Helper - VERSIONE TRIMESTRALE

#### `_get_quarterly_columns_by_year(year_index)` 🆕
Restituisce le 4 colonne trimestrali per un anno specifico:
```python
# Anno 0 (Q1-Q4): ['C', 'D', 'E', 'F']
# Anno 1 (Q5-Q8): ['G', 'H', 'I', 'J']
year_0_cols = engine._get_quarterly_columns_by_year(0)
```

#### `_get_annual_sum_formula(base_row, year_index)` 🆕
Crea una formula per sommare i 4 trimestri di un anno:
```python
# Genera: "=SUM(C10:F10)" per l'anno 0
formula = engine._get_annual_sum_formula(10, 0)
```

#### `_inserisci_formule_erogazioni(start_row)` 🆕
Inserisce formule specifiche per le erogazioni trimestrali per prodotto.

#### `_inserisci_formule_stock_crediti(start_row)` 🆕
Inserisce formule per stock crediti roll-forward trimestrale.

#### `_trova_riga(ws, testo_ricerca, start_row, end_row)`
Trova la riga che contiene il testo specificato nella colonna B.

#### `_mappa_riferimenti_input()`
Mappa i riferimenti chiave nel foglio Input per collegamenti alle formule:
- ECB Rate
- Euribor 6M  
- Aliquota Fiscale
- Dividend Payout
- Volumi di erogazione per divisione

### 💾 Salvataggio
```python
def salva_modello(self, filename="modello_bancario_completo.xlsx"):
    """Salva il modello con le formule mantenendo il nome file"""
```

### 🚨 Principi Fondamentali
1. **Zero Valori Hardcoded**: Tutte le formule fanno riferimento al foglio Input o ad altre celle di calcolo
2. **Formattazione Preservata**: Ogni formula mantiene la formattazione FORMULA per distinzione visiva
3. **Gestione Errori**: Controlli per divisione per zero e riferimenti mancanti
4. **Parametricità Completa**: Il modello è completamente guidato dalle assumptions

### 📝 Note Tecniche - VERSIONE TRIMESTRALE
- File di input: `modello_bancario_completo.xlsx` (deve esistere da STEP 1-2)
- File di output: Stesso file aggiornato con formule trimestrali
- **Struttura trimestrale**: 20 trimestri (Q1-Q20) nelle colonne C-V
- **KPI annualizzati**: Moltiplicazione per 4 dei valori trimestrali
- Compatibilità: Excel, LibreOffice Calc, Google Sheets
- Formule utilizzate: SUM, IF, riferimenti assoluti e relativi, moltiplicazioni per annualizzazione
- Gestione degli errori: Controlli per celle vuote e divisioni per zero
- **Colonne dinamiche**: Generazione automatica delle lettere C-V tramite get_column_letter

### 🔧 Utilizzo - VERSIONE TRIMESTRALE
```python
# Esecuzione standalone
python formula_engine.py

# Test del formula engine
python test_formula_engine.py

# Integrazione in pipeline
from formula_engine import FormulaEngine
engine = FormulaEngine("modello_bancario_completo.xlsx")
engine.inserisci_tutte_formule()  # Inserisce formule per 20 trimestri
engine.salva_modello()
```

### 🧪 Test e Verifica
Disponibile script di test `test_formula_engine.py` per verificare:
- Configurazione trimestrale corretta
- Generazione colonne C-V
- Funzionamento metodi di utilità
- Inserimento formule senza errori

### 🎯 Risultato Finale
Il formula_engine trasforma il modello bancario statico in un **modello dinamico trimestrale** completamente funzionante:
- **20 trimestri** di calcoli automatici
- **KPI annualizzati** da valori trimestrali
- **Formule parametriche** collegate al foglio Input
- **Roll-forward trimestrali** per bilancio e crediti
- **Distinzione visiva** tra celle INPUT e FORMULA

## 📋 Storico Aggiornamenti e Modifiche

### Conversione da Annuale a Trimestrale (Completata)
Il modello è stato convertito con successo da **modello annuale (5 anni)** a **modello trimestrale (20 trimestri)**.

#### Modifiche Principali Apportate:
1. **Configurazione Trimestrale**
   - `self.num_quarters = 20` (invece di 5 anni)
   - `self.quarter_columns` genera dinamicamente C-V (20 colonne)
   - `self.first_data_col = 'C'` e `self.last_data_col = 'V'`

2. **Range di Colonne Aggiornati**
   - PRIMA: `['C', 'D', 'E', 'F', 'G']` (5 anni)
   - DOPO: `self.quarter_columns` (20 trimestri C-V)
   - Tutti i cicli for ora usano `for col in self.quarter_columns`

3. **KPI Annualizzati**
   - ROE, ROA, NIM moltiplicati per 4 dai valori trimestrali
   - Formula esempio: `({col}{net_profit_ce_row}*4)/{col}{total_equity_sp_row}`

4. **Nuovi Metodi di Utilità Aggiunti**
   - `_get_quarterly_columns_by_year(year_index)`: restituisce 4 colonne per anno
   - `_get_annual_sum_formula(base_row, year_index)`: somma 4 trimestri
   - `_inserisci_formule_erogazioni()` e `_inserisci_formule_stock_crediti()`

5. **Infrastruttura Aggiornata**
   - Nome file corretto: `modello_bancario_completo.xlsx`
   - Commenti e messaggi riflettono logica trimestrale
   - Test di verifica inclusi in `test_formula_engine.py`

#### Status Completamento:
- ✅ Supporto per 20 trimestri (Q1-Q20)
- ✅ Colonne dinamiche C-V  
- ✅ KPI annualizzati (×4 dai trimestrali)
- ✅ Formule parametriche (zero hardcoded)
- ✅ Riferimenti Input aggiornati
- ✅ Metodi di utilità aggiunti
- ✅ Test di verifica funzionanti
- ✅ Documentazione completa aggiornata

Il modello bancario trimestrale è **pronto per l'uso in produzione**.

## 🚀 Formule Urgenti Implementate (11 Agosto 2025)

### Formule Critiche Corrette
Le seguenti formule sono state implementate per sostituire i placeholder testuali nel foglio Input:

#### 1. **Cella Y30** - Target CET1
- **Formula**: `=SUM(Y26:Y29)`
- **Descrizione**: Calcola il Target CET1 come somma di P1 + P2R + CCB + CCyB
- **Componenti**:
  - Y26: Requisito minimo di capitale CET1 (4.5%)
  - Y27: Requisito aggiuntivo specifico (2%)
  - Y28: Buffer di conservazione del capitale (2.5%)
  - Y29: Buffer anticiclico macroprudenziale (0.5%)

#### 2. **Cella Y91** - Calcolo LGD per Real Estate
- **Formula**: `=Y88*(1+Y89)+Y90`
- **Descrizione**: LGD = LTV * (1 + Haircut) + Costi Recupero
- **Componenti**:
  - Y88: Rapporto finanziamento/valore immobile (LTV)
  - Y89: Riduzione valore garanzia in caso default (Haircut)
  - Y90: Costi legali e amministrativi di recupero

#### 3. **Cella Y108** - Costi di Recupero SME
- **Formula**: `=Y107*0.02`
- **Descrizione**: Calcola i costi di recupero come 2% del valore delle garanzie
- **Base**: Y107 contiene il valore delle garanzie

#### 4. **Cella Y126** - Tasso Trimestrale Public Guarantee
- **Formula**: `=(Y124+Y125)/4`
- **Descrizione**: Converte il tasso annuale in trimestrale
- **Calcolo**: Divide per 4 la somma dei tassi annuali

### 5 Modifiche Parametriche Implementate

#### MODIFICA 1: Validazioni 100%
- Controlli somma percentuali con formattazione condizionale
- Applicato a tutte le sezioni prodotti

#### MODIFICA 2: Nomi Prodotti Editabili
- Input editabili per nomi prodotti
- Flag Attivo (SI/NO) per ogni prodotto

#### MODIFICA 3: Tipo Tasso
- Colonna Fisso/Variabile con dropdown
- Applicato a tutti i prodotti creditizi

#### MODIFICA 4: Input Annuali
- Parametri temporali per 2024-2028
- Applicato alle righe 39, 40, 49

#### MODIFICA 5: Formula FTE
- Somma automatica Business + Sales in riga 20
- Formula: `=D18+D19` per ogni anno