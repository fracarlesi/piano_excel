# Documentazione: create_model_sheet.py
## STEP 2 - Foglio Modello - VERSIONE TRIMESTRALE

### 📋 Descrizione
Script che aggiunge il foglio "Modello" al file `modello_bancario_completo.xlsx` esistente, creando tutte le tabelle che conterranno i calcoli e le formule nel successivo STEP 3.

**IMPORTANTE**: Versione aggiornata per modello trimestrale con **20 trimestri (Q1-Q20)** invece di 5 anni.

### 🎨 FORMATTAZIONE CELLE FORMULA
Le celle destinate a contenere formule hanno una formattazione distintiva per distinguerle dalle celle di input:

#### Celle con Formule (calcolate automaticamente):
- **Sfondo**: Grigio chiaro (#F5F5F5)
- **Font**: Calibri 11pt, normale, colore nero (#000000)
- **Bordi**: Tratteggiati
- **Allineamento**: Centrato

Questa formattazione viene applicata a tutte le celle nelle tabelle di calcolo del foglio Modello che conterranno formule, incluse:
- Calcoli di appoggio (erogazioni, stock crediti)
- Conto Economico (tutti i valori calcolati)
- Stato Patrimoniale (tutti i valori calcolati)
- Capital Requirements (RWA, ratios)
- KPI (tutti gli indicatori calcolati)

### 📊 Struttura del Foglio Modello - VERSIONE TRIMESTRALE

Il foglio Modello contiene le seguenti sezioni con struttura trimestrale:

## 2. CALCOLI DI APPOGGIO - MOTORE DI CALCOLO

### 2.1 Tabelle di Calcolo Create

#### 1.1 EROGAZIONI PER PRODOTTO (€ mln)
Tabella che conterrà le erogazioni trimestrali per ogni prodotto di credito:
- **Prodotti Real Estate**: CBL, MLA, MLAM, MLPA, MLPAM, NRE
- **Prodotti SME**: BL, REFI, SS, NF, RES
- **Prodotti Public Guarantee**: ACFP, FGA, FGPA
- **Colonne**: Q1, Q2, Q3, Q4, Q5, ..., Q20 (20 trimestri)

#### 1.2 STOCK CREDITI PER PRODOTTO (€ mln)
Tabella che conterrà lo stock di crediti a fine trimestre per ogni prodotto:
- Stessa struttura della tabella erogazioni
- Roll-forward: Stock Iniziale + Erogazioni - Rimborsi - Default

### 1.3 MATRICI VINTAGE - BLOCCO A: EROGAZIONI E VOLUMI (€ mln)

**Struttura completa di matrici vintage 20x20 per OGNI prodotto creditizio (14 totali)**

#### A.1 - MATRICE EROGAZIONI PER VINTAGE
Per ogni prodotto, matrice 20x20 che traccia le erogazioni per vintage:
- **Righe**: Vintage V1(Q1) - V20(Q20) = trimestre di erogazione iniziale
- **Colonne**: Tempo Q1-Q20 = evoluzione temporale
- **Totali**: Colonna totale per ogni vintage + riga totali per trimestre
- **Contenuto**: Volume erogato per vintage che evolve nel tempo
- **Formattazione**: Sfondo azzurro chiaro (#E6F3FF)

#### A.2 - MATRICE RIMBORSI PER VINTAGE
Per ogni prodotto, matrice 20x20 dei rimborsi programmati:
- **Struttura**: Stessa logica delle erogazioni
- **Logica**: Basata su tipo ammortamento (bullet/amortizing) e maturity
- **Calcolo**: Piano ammortamento applicato a ciascun vintage
- **Formattazione**: Sfondo arancione chiaro (#FFE6CC)

#### A.3 - MATRICE STOCK LORDO (GBV) PER VINTAGE
Per ogni prodotto, stock lordo (Gross Book Value) per vintage:
- **Formula**: Stock Iniziale + Erogazioni - Rimborsi - Default
- **Roll-forward**: Calcolo cumulativo per ogni trimestre
- **Formattazione**: Sfondo verde chiaro (#E6FFE6)

### 1.4 MATRICI VINTAGE - BLOCCO B: RISCHIO CREDITO (€ mln)

#### B.1 - MATRICE DEFAULT PER VINTAGE (CON TIMING DISTRIBUTION)
Stock che va in default per trimestre con timing distribution:
- **Calcolo**: Applica danger rate con distribuzione temporale del default
- **Timing**: Modellazione della concentrazione del default nei primi anni
- **Formula**: Stock × Danger Rate × Timing Distribution
- **Formattazione**: Sfondo rosso chiaro (#FFE6E6)

#### B.2 - MATRICE STOCK PERFORMING
Crediti in bonis per vintage:
- **Formula**: Stock GBV - Passaggi a Default cumulati
- **Evoluzione**: Diminuisce nel tempo per default e rimborsi
- **Formattazione**: Sfondo azzurro chiaro (#E6F3FF)

#### B.3 - MATRICE STOCK NPL
Crediti deteriorati (Non-Performing Loans) per vintage:
- **Accumulo**: Default cumulati per vintage
- **Evoluzione**: Aumenta con i passaggi a default, diminuisce per recuperi
- **Formattazione**: Sfondo rosa (#FFCCCC)

### 1.5 MATRICI VINTAGE - BLOCCO C: ECL E VALUTAZIONI (€ mln)

#### C.1 - MATRICE ECL STAGE 1 (Stock × Danger Rate × LGD)
Expected Credit Loss su crediti performing:
- **Formula**: Stock Performing × Danger Rate × LGD
- **Applicazione**: IFRS 9 Stage 1 per crediti in bonis
- **Evoluzione**: Proporzionale allo stock performing
- **Formattazione**: Sfondo arancione chiaro (#FFE6CC)

#### C.2 - MATRICE NBV PERFORMING (Stock - ECL)
Net Book Value dei crediti performing:
- **Formula**: Stock Performing - ECL Stage 1
- **Significato**: Valore contabile netto dei crediti in bonis
- **Formattazione**: Sfondo blu chiaro (#CCE6FF)

#### C.3 - MATRICE NPV RECUPERI (Attualizzati con Euribor + Spread)
Net Present Value dei recuperi attesi:
- **Attualizzazione**: Euribor + Credit Spread
- **Cash Flow**: Flussi di recupero su garanzie immobiliari e MCC
- **Timing**: Distribuzione temporale dei recuperi
- **Formattazione**: Sfondo verde chiaro (#E6FFE6)

#### C.4 - MATRICE NBV NON-PERFORMING
Net Book Value dei crediti deteriorati:
- **Formula**: Stock NPL vs NPV Recuperi (il maggiore)
- **Logica**: Valore recuperabile dei crediti deteriorati
- **Formattazione**: Sfondo rosa (#FFCCCC)

### 1.6 MATRICI VINTAGE - BLOCCO D: RICAVI (€ mln)

#### D.1 - MATRICE INTERESSI ATTIVI SU PERFORMING
Interessi attivi generati da crediti performing per vintage:
- **Formula**: Stock Performing × Tasso Attivo
- **Tasso**: Dall'input sheet per prodotto
- **Base**: Stock medio trimestrale per calcolo pro-rata
- **Formattazione**: Sfondo azzurro chiaro (#E6F3FF)

#### D.2 - MATRICE INTERESSI DI MORA SU NPL
Interessi di mora su crediti deteriorati:
- **Formula**: Stock NPL × Tasso di Mora
- **Applicazione**: Solo su NPL con tasso maggiorato
- **Incasso**: Considerare % di incasso effettivo
- **Formattazione**: Sfondo rosso chiaro (#FFE6E6)

#### D.3 - MATRICE COMMISSIONI UP-FRONT
Commissioni upfront su nuove erogazioni:
- **Formula**: Erogazioni × Commissione Up-front %
- **Timing**: Riconosciute al momento dell'erogazione
- **Base**: Solo su nuove erogazioni per vintage
- **Formattazione**: Sfondo verde chiaro (#E6FFE6)

### 2.2 Logica dei Calcoli (da implementare in STEP 3)

#### CALCOLI PER CONTO ECONOMICO
1. **Interessi Attivi (per Prodotto)**
   - Piano di ammortamento per ogni vintage di erogazione
   - Interessi generati ogni anno da ciascun vintage attivo
   - Per nuovi vintage: considerare erogazione media a metà anno (Erogazioni_Yn / 2 * Tasso)
   - Somma interessi di tutti i vintage per prodotto

2. **Interessi Passivi**
   - Stock medio di Funding e Depositi Vincolati
   - Moltiplicare stock medi per tassi passivi da Assumptions

3. **Commissioni Attive (per Prodotto)**
   - Erogazioni annuali per prodotto (Nuove_Erogazioni_Divisone * Mix_%_Prodotto)
   - Moltiplicare erogazioni per Up-front_Fee_% da Assumptions

4. **Costi del Personale (per Divisione)**
   - CAGR = (FTE_Y5_Target / FTE_Y0)^(1/5) - 1
   - FTE_Anno_n = FTE_Anno_n-1 * (1 + (CAGR * Crescita_Relativa_Divisione))
   - Costo totale = FTE_Anno_n * RAL_Media_Divisione_Anno_n * Moltiplicatore_Costo_Azienda

5. **Altri Costi Operativi**
   - Costi IT, affitti, etc. basati su driver da assumptions

6. **Ammortamenti**
   - Roll-forward Immobilizzazioni: Stock Iniziale + Capex - Ammortamento
   - Ammortamento su stock esistente e pro-rata su nuovi investimenti

7. **Accantonamenti per Perdite su Crediti (LLP)**
   - Stock medio crediti in bonis per prodotto
   - LLP = Stock medio * Danger_Rate * LGD

#### CALCOLI PER STATO PATRIMONIALE
1. **Crediti verso Clientela (Lordo, per Prodotto)**
   - Roll-forward: Stock Iniziale + Erogazioni - Rimborsi - Passaggi a Default
   - Rimborsi: tramite piani ammortamento per vintage
   - Passaggi a Default: Stock Medio Bonis * Danger_Rate

2. **Fondo Rettifiche Crediti (LLR)**
   - Roll-forward: Stock Iniziale + Accantonamenti (LLP) - Utilizzi/Write-Offs

3. **Depositi da Clientela**
   - Numero clienti e depositi medi per prodotto
   - Applicazione tassi crescita da Assumptions

#### CALCOLI PER CAPITAL REQUIREMENTS
1. **RWA per Rischio di Credito**
   - Stock fine anno prodotto * RWA % da Assumptions

2. **RWA per Rischio di Mercato**
   - Stock portafoglio titoli * RWA Mercato %

3. **RWA per Rischio Operativo**
   - Ricavi Totali (Y-1) * RWA Operativi %

#### CALCOLI PER KPI DIVISIONALI
1. **Utile Netto per Divisione**
   - Ricavi per divisione (somma ricavi prodotto)
   - Allocazione costi diretti e quota costi centrali
   - Applicazione aliquota fiscale

2. **Patrimonio Allocato per Divisione**
   - RWA per divisione
   - Allocazione patrimonio: Total Equity * (RWA_Divisione / Total_RWA)

## 3. CONTO ECONOMICO CONSOLIDATO (€ mln) - VERSIONE TRIMESTRALE

### Struttura della Tabella
| Voce | Q1 | Q2 | ... | Q19 | Q20 | Descrizione |
|------|-----|-----|-----|-----|-----|-------------|
| **1. MARGINE DI INTERESSE** | | | | | | |
| 1.1. Interest Income | [F] | [F] | [F] | [F] | [F] | Totale interessi attivi |
| - da Real Estate Division | [F] | [F] | [F] | [F] | [F] | |
| - da SME Division | [F] | [F] | [F] | [F] | [F] | |
| - da Public Guarantee Division | [F] | [F] | [F] | [F] | [F] | |
| - da Digital Banking Division | [F] | [F] | [F] | [F] | [F] | |
| - da Treasury Division | [F] | [F] | [F] | [F] | [F] | |
| 1.2. Interest Expenses | [F] | [F] | [F] | [F] | [F] | Totale interessi passivi |
| **1.3. NET INTEREST INCOME** | [F] | [F] | [F] | [F] | [F] | **Margine di Interesse** |
| **2. COMMISSIONI** | | | | | | |
| 2.1. Commission Income | [F] | [F] | [F] | [F] | [F] | Totale commissioni attive |
| 2.2. Commission Expenses | [F] | [F] | [F] | [F] | [F] | Commissioni passive |
| **2.3. NET COMMISSION INCOME** | [F] | [F] | [F] | [F] | [F] | **Margine da Commissioni** |
| **3. TOTAL REVENUES** | [F] | [F] | [F] | [F] | [F] | **Ricavi Totali** |
| **4. COSTI OPERATIVI** | | | | | | |
| 4.1. Staff Costs | [F] | [F] | [F] | [F] | [F] | Costo del personale |
| 4.2. Other Operating Costs | [F] | [F] | [F] | [F] | [F] | Altri costi operativi |
| **4.3. TOTAL OPERATING COSTS** | [F] | [F] | [F] | [F] | [F] | **Costi Operativi Totali** |
| **5. GROSS OPERATING PROFIT** | [F] | [F] | [F] | [F] | [F] | **Risultato di gestione** |
| 6. Ammortamenti | [F] | [F] | [F] | [F] | [F] | |
| 7. Loan Loss Provisions | [F] | [F] | [F] | [F] | [F] | Accantonamenti crediti |
| **8. OPERATING PROFIT** | [F] | [F] | [F] | [F] | [F] | **Utile Operativo** |
| 9. Taxes | [F] | [F] | [F] | [F] | [F] | Imposte |
| **10. NET PROFIT** | [F] | [F] | [F] | [F] | [F] | **Utile Netto** |

## 4. STATO PATRIMONIALE CONSOLIDATO (€ mln) - VERSIONE TRIMESTRALE

### Struttura della Tabella
| Voce | Q1 | Q2 | ... | Q19 | Q20 | Descrizione |
|------|-----|-----|-----|-----|-----|-------------|
| **1. ATTIVO** | | | | | | |
| 1.1. Loans to Customers (Gross) | [F] | [F] | [F] | [F] | [F] | Crediti lordi |
| 1.2. Loan Loss Reserves | [F] | [F] | [F] | [F] | [F] | Fondo rettifiche |
| **1.3. Loans to Customers (Net)** | [F] | [F] | [F] | [F] | [F] | **Crediti netti** |
| 1.4. Securities Portfolio | [F] | [F] | [F] | [F] | [F] | Portafoglio titoli |
| 1.5. Immobilizzazioni Immateriali | [F] | [F] | [F] | [F] | [F] | |
| 1.6. Cash & Central Banks | [F] | [F] | [F] | [F] | [F] | Liquidità |
| 1.7. Other Assets | [F] | [F] | [F] | [F] | [F] | |
| **1.8. TOTAL ASSETS** | [F] | [F] | [F] | [F] | [F] | **Totale Attivo** |
| **2. PASSIVO E PATRIMONIO** | | | | | | |
| 2.1. Customer Deposits | [F] | [F] | [F] | [F] | [F] | Depositi clientela |
| 2.2. Debt Securities & Funding | [F] | [F] | [F] | [F] | [F] | Raccolta ingrosso |
| 2.3. Other Liabilities | [F] | [F] | [F] | [F] | [F] | |
| **2.4. TOTAL LIABILITIES** | [F] | [F] | [F] | [F] | [F] | **Totale Passività** |
| 2.5. Share Capital & Reserves | [F] | [F] | [F] | [F] | [F] | Capitale e riserve |
| 2.6. Retained Earnings | [F] | [F] | [F] | [F] | [F] | Utili non distribuiti |
| **2.7. TOTAL EQUITY** | [F] | [F] | [F] | [F] | [F] | **Patrimonio Netto** |
| **2.8. TOTAL LIABILITIES & EQUITY** | [F] | [F] | [F] | [F] | [F] | **Totale Passivo e PN** |
| **2.9. CHECK DI QUADRATURA** | [F] | [F] | [F] | [F] | [F] | **Deve essere zero** |

## 5. CAPITAL REQUIREMENTS (€ mln) - VERSIONE TRIMESTRALE

### Struttura della Tabella
| Voce | Q1 | Q2 | ... | Q19 | Q20 | Descrizione |
|------|-----|-----|-----|-----|-----|-------------|
| **1. RISK WEIGHTED ASSETS (RWA)** | | | | | | |
| 1.1. Credit Risk RWA | [F] | [F] | [F] | [F] | [F] | RWA credito |
| 1.2. Market Risk RWA | [F] | [F] | [F] | [F] | [F] | RWA mercato |
| 1.3. Operational Risk RWA | [F] | [F] | [F] | [F] | [F] | RWA operativo |
| **1.4. TOTAL RWA** | [F] | [F] | [F] | [F] | [F] | **Totale RWA** |
| **2. CAPITAL** | | | | | | |
| 2.1. CET1 Capital | [F] | [F] | [F] | [F] | [F] | |
| 2.2. AT1 Capital | [F] | [F] | [F] | [F] | [F] | |
| 2.3. Tier 2 Capital | [F] | [F] | [F] | [F] | [F] | |
| **2.4. TOTAL CAPITAL** | [F] | [F] | [F] | [F] | [F] | **Capitale Totale** |
| **3. REQUIREMENTS & RATIOS** | | | | | | |
| 3.1. CET1 Ratio | [F] | [F] | [F] | [F] | [F] | CET1 / RWA |
| 3.2. Total Capital Ratio | [F] | [F] | [F] | [F] | [F] | Total Capital / RWA |
| 3.3. Total Requirement % | [F] | [F] | [F] | [F] | [F] | Requisito minimo |
| 3.4. Excess Capital (vs CET1) | [F] | [F] | [F] | [F] | [F] | Eccesso capitale |

## 6. KEY PERFORMANCE INDICATORS (KPI) - VERSIONE TRIMESTRALE

### Struttura della Tabella
| Voce | Q1 | Q2 | ... | Q19 | Q20 | Descrizione |
|------|-----|-----|-----|-----|-----|-------------|
| **1. PROFITABILITY - CONSOLIDATO** | | | | | | |
| 1.1. ROE % | [F] | [F] | [F] | [F] | [F] | Return on Equity |
| 1.2. ROA % | [F] | [F] | [F] | [F] | [F] | Return on Assets |
| 1.3. NIM % | [F] | [F] | [F] | [F] | [F] | Net Interest Margin |
| 1.4. Cost/Income % | [F] | [F] | [F] | [F] | [F] | Efficienza operativa |
| **2. PROFITABILITY - PER DIVISIONE** | | | | | | |
| 2.1. ROE % - Real Estate | [F] | [F] | [F] | [F] | [F] | |
| 2.2. ROE % - SME | [F] | [F] | [F] | [F] | [F] | |
| 2.3. ROE % - Public Guarantee | [F] | [F] | [F] | [F] | [F] | |
| **3. ASSET QUALITY** | | | | | | |
| 3.1. NPL Ratio (Net) % | [F] | [F] | [F] | [F] | [F] | Crediti deteriorati |
| 3.2. Coverage Ratio % | [F] | [F] | [F] | [F] | [F] | Copertura NPL |
| 3.3. Cost of Risk (bps) | [F] | [F] | [F] | [F] | [F] | Costo del rischio |
| **4. LIQUIDITY & LEVERAGE** | | | | | | |
| 4.1. LCR % | [F] | [F] | [F] | [F] | [F] | Liquidity Coverage |
| 4.2. NSFR % | [F] | [F] | [F] | [F] | [F] | Net Stable Funding |
| 4.3. Loan/Deposit % | [F] | [F] | [F] | [F] | [F] | Impieghi/Raccolta |
| 4.4. Leverage Ratio % | [F] | [F] | [F] | [F] | [F] | Leva finanziaria |

## 🔧 Formattazione Applicata
- **Colori**: 
  - Header principale: blu scuro (#002060)
  - Sottosezioni: blu (#4472C4) 
  - Righe totali: azzurro chiaro (#D9E2F3)
  - **Celle FORMULA**: sfondo grigio chiaro (#F5F5F5), testo nero
- **Font**: 
  - Dati: Calibri 11pt
  - Totali e voci principali: Bold
  - Titoli sezioni: 14pt Bold
- **Formati numerici**: 
  - Valori monetari: formato numero con separatore migliaia (#,##0.0)
  - Percentuali: formato percentuale con 2 decimali (0.00%)
  - Basis points: formato numero intero
- **Larghezza colonne (versione trimestrale)**: 
  - Colonna A (Spaziatura): 2
  - Colonna B (Voci): 45
  - Colonne C-V (Q1-Q20): 12 (ridotte per accomodare 20 colonne)
  - Colonna W (Spaziatura): 2
  - Colonna X (Descrizione): 50
- **Bordi**: 
  - Headers e totali: Thin border continuo
  - **Celle con formule: Dashed border per distinzione visiva**

## 🎨 Sistema di Distinzione Visiva
Il foglio Modello implementa un sistema di codifica a colori per distinguere i tipi di celle:

### Celle FORMULA (Grigio Chiaro)
- **Sfondo**: #F5F5F5 (grigio chiaro)
- **Testo**: #000000 (nero)
- **Bordo**: Linea tratteggiata (dashed)
- **Utilizzo**: Celle con formule calcolate automaticamente dal sistema
- **Posizione**: Tutte le celle dati nelle tabelle del foglio Modello

### Integrazione con Formula Engine
Le celle formattate come FORMULA sono predisposte per ricevere le formule nel STEP 3, mantenendo la distinzione visiva anche dopo l'inserimento delle formule tramite il `formula_engine.py`.

## 🎯 Specificità Matrici Vintage

### Prodotti Creditizi Coperti (14 totali)

**Real Estate Division (6 prodotti)**:
1. CBL - Construction & Bridge Loans
2. MLA - Mortgage Loans Amortizing
3. MLAM - Mortgage Loans Amortizing Medium-term
4. MLPA - Mortgage Loans Partially Amortizing
5. MLPAM - Mortgage Loans Partially Amortizing Medium-term
6. NRE - Non-Residential Real Estate

**SME Division (5 prodotti)**:
1. BL - Business Loans
2. REFI - Refinancing
3. SS - Short-term Solutions
4. NF - New Financing
5. RES - Restructured Loans

**Public Guarantee Division (3 prodotti)**:
1. ACFP - Anti-Crisis Fund Programs
2. FGA - Fund for Guarantee Activities
3. FGPA - Fund for Guarantee Programs Activities

### Struttura Matrici Vintage
- **Dimensione**: 20×20 + totali (21×22 effettive)
- **Righe**: V1(Q1), V2(Q2), ..., V20(Q20) + TOTAL
- **Colonne**: Q1, Q2, ..., Q20 + Total
- **Etichettatura**: Vintage indica trimestre di erogazione iniziale
- **Celle**: Tutte formattate come FORMULA (grigio #F5F5F5)

### Sistema di Codifica Colori
- **Azzurro (#E6F3FF)**: Erogazioni, Stock Performing, Interessi Attivi
- **Arancione (#FFE6CC)**: Rimborsi, ECL Stage 1
- **Verde (#E6FFE6)**: Stock GBV, NPV Recuperi, Commissioni
- **Rosa/Rosso (#FFE6E6, #FFCCCC)**: Default, NPL, Interessi Mora
- **Blu (#CCE6FF)**: NBV Performing

## 📝 Note Tecniche - VERSIONE TRIMESTRALE CON MATRICI VINTAGE
- Le celle marcate con [F] conterranno formule nello STEP 3
- **168 matrici vintage totali**: 14 prodotti × 12 tipi matrice
- Tutte le tabelle sono predisposte per ricevere formule parametriche trimestrali
- Nessun valore hardcoded: tutto farà riferimento al foglio Input
- **Modello trimestrale**: 20 trimestri (Q1-Q20) invece di 5 anni
- **Struttura colonne**: B=Voci, C-V=Q1-Q20, W=Spazio, X=Descrizione
- **Matrici vintage**: Colonne aggiuntive fino alla W (totali)
- Il file aggiornato mantiene il nome `modello_bancario_completo.xlsx`
- Questo è lo STEP 2 del processo di creazione del modello bancario completo

## 🔄 Modifiche Implementate per Versione Trimestrale
1. **Headers temporali**: Cambiati da Y1-Y5 a Q1-Q20
2. **Colonne dati**: Espanse da 5 a 20 colonne (C-V)
3. **Colonna descrizione**: Spostata dalla I alla X
4. **Larghezza colonne**: Ridotte da 15 a 12 per accomodare 20 trimestri
5. **Merge cells**: Aggiornati per includere tutte le 20 colonne
6. **Formattazione**: Mantenuta per tutte le 20 colonne di dati

## 🚨 Regola Fondamentale
**ZERO VALORI HARDCODED**: Il modello deve essere completamente parametrico. Ogni formula nelle sezioni di calcolo e nei report finali deve fare riferimento esclusivamente alle celle delle Assumptions o ad altre celle di calcolo.

### 1.7 MATRICI VINTAGE - BLOCCO E: COSTI E ACCANTONAMENTI (€ mln)

#### E.1 - TABELLA LLP (LOAN LOSS PROVISIONS) PER TRIMESTRE
Tabella che traccia gli accantonamenti per perdite su crediti per trimestre:
- **Righe**: Ogni prodotto creditizio (14 totali)
- **Colonne**: Q1-Q20 (evoluzione trimestrale)
- **Formula**: Stock Crediti × Danger Rate × LGD
- **Aggregazione**: Totale LLP per trimestre per tutte le divisioni
- **Formattazione**: Sfondo arancione chiaro (#FFE6CC)

#### E.2 - TABELLA WRITE-OFF PER TRIMESTRE
Tabella delle cancellazioni definitive di crediti deteriorati:
- **Righe**: Ogni prodotto creditizio (14 totali)
- **Colonne**: Q1-Q20 (evoluzione trimestrale)
- **Logica**: Write-off di crediti NPL non recuperabili
- **Timing**: Applicazione dopo periodo di workout
- **Aggregazione**: Totale Write-off per trimestre
- **Formattazione**: Sfondo rosa (#FFCCCC)

### 1.8 MATRICI VINTAGE - BLOCCO F: AGGREGAZIONI DIVISIONALI (€ mln)

#### F.1 - RIEPILOGO REAL ESTATE DIVISION (SOMMA 6 PRODOTTI)
Aggregazione di tutti i valori per Real Estate Division:
- **Prodotti inclusi**: CBL, MLA, MLAM, MLPA, MLPAM, NRE (6 prodotti)
- **Voci aggregate**:
  - RE - TOTALE EROGAZIONI
  - RE - TOTALE STOCK CREDITI  
  - RE - TOTALE INTERESSI ATTIVI
  - RE - TOTALE COMMISSIONI
  - RE - TOTALE LLP
  - RE - TOTALE WRITE-OFF
- **Formattazione**: Sfondo azzurro chiaro (#E6F3FF)

#### F.2 - RIEPILOGO SME DIVISION (SOMMA 5 PRODOTTI)
Aggregazione di tutti i valori per SME Division:
- **Prodotti inclusi**: BL, REFI, SS, NF, RES (5 prodotti)
- **Voci aggregate**: Stessa struttura Real Estate
- **Formattazione**: Sfondo verde chiaro (#E6FFE6)

#### F.3 - RIEPILOGO PUBLIC GUARANTEE DIVISION (SOMMA 3 PRODOTTI)
Aggregazione di tutti i valori per Public Guarantee Division:
- **Prodotti inclusi**: ACFP, FGA, FGPA (3 prodotti)
- **Voci aggregate**: Stessa struttura Real Estate
- **Formattazione**: Sfondo arancione chiaro (#FFE6CC)

### 1.9 MATRICI VINTAGE - BLOCCO G: FUNDING E LIQUIDITÀ (€ mln)

#### G.1 - TABELLA DEPOSITI CLIENTELA (EVOLUZIONE TRIMESTRALE)
Evoluzione depositi clientela per segmento:
- **Digital Banking - Depositi a Vista**: Conti correnti e depositi liberi
- **Digital Banking - Depositi Vincolati**: CD e depositi a termine
- **Wealth Management - Depositi Gestiti**: Depositi connessi a servizi gestione
- **Corporate - Depositi Operativi**: Conti aziendali operativi
- **Corporate - Depositi Vincolati**: Depositi corporate a termine
- **TOTALE DEPOSITI CLIENTELA**: Somma di tutti i segmenti
- **Formattazione**: Sfondo blu chiaro (#CCE6FF)

#### G.2 - TABELLA FUNDING WHOLESALE
Fonti di raccolta ingrosso:
- **Funding BCE - TLTRO**: Targeted Long-Term Refinancing Operations
- **Funding BCE - Operazioni Principali**: Main Refinancing Operations
- **Senior Debt Securities**: Obbligazioni senior emesse
- **Subordinated Debt**: Debito subordinato
- **Interbank Funding**: Finanziamenti interbancari
- **TOTALE FUNDING WHOLESALE**: Somma tutte le fonti wholesale
- **Formattazione**: Sfondo azzurro chiaro (#E6F3FF)

#### G.3 - TABELLA LIQUIDITÀ E RISERVE BCE
Posizioni di liquidità e riserve regolamentari:
- **Cassa e Disponibilità Liquide**: Cash positions
- **Riserva Obbligatoria BCE**: Required reserves at ECB
- **Depositi presso BCE**: Deposits at central bank
- **Titoli Eligible per Operazioni BCE**: ECB-eligible securities
- **LCR Buffer**: Liquidity Coverage Ratio buffer
- **TOTALE LIQUIDITÀ DISPONIBILE**: Total available liquidity
- **Formattazione**: Sfondo verde chiaro (#E6FFE6)

### 1.10 MATRICI VINTAGE - BLOCCO H: ALTRI PATRIMONIALI (€ mln)

#### H.1 - ROLL-FORWARD IMMOBILIZZAZIONI
Evoluzione immobilizzazioni materiali e immateriali:
- **Stock Iniziale Immobilizzazioni**: Valore netto iniziale periodo
- **Nuovi Investimenti IT/Software**: CAPEX tecnologici
- **Nuovi Investimenti Immobili**: CAPEX immobiliari
- **Ammortamenti Periodo**: Ammortamenti trimestrali
- **Dismissioni/Vendite**: Realizzi da vendite asset
- **Stock Finale Immobilizzazioni Nette**: Valore netto finale
- **Formattazione**: Sfondo arancione chiaro (#FFE6CC)

#### H.2 - PORTAFOGLIO TITOLI
Composizione portafoglio titoli per categoria:
- **Titoli di Stato Italiani**: Government bonds Italy
- **Titoli di Stato Esteri**: Foreign government bonds
- **Titoli Corporate Investment Grade**: IG corporate bonds
- **Titoli Corporate High Yield**: HY corporate bonds
- **Altri Strumenti Finanziari**: Other financial instruments
- **TOTALE PORTAFOGLIO TITOLI**: Total securities portfolio
- **Formattazione**: Sfondo blu chiaro (#CCE6FF)

#### H.3 - EVOLUZIONE PATRIMONIO NETTO
Roll-forward del patrimonio netto consolidato:
- **Patrimonio Netto Iniziale**: Opening equity balance
- **Utile/Perdita Netto Periodo**: Net income/loss for period
- **Aumenti di Capitale**: Capital increases
- **Distribuzione Dividendi**: Dividend distributions
- **Altri Movimenti**: Other comprehensive income
- **Patrimonio Netto Finale**: Closing equity balance
- **Formattazione**: Sfondo verde chiaro (#E6FFE6)

## 🎯 Logica di Aggregazione Blocchi E-H

### BLOCCO E - COSTI E ACCANTONAMENTI
- **LLP**: Somma di tutti i prodotti per divisione = input per Conto Economico
- **Write-off**: Somma per divisione = utilizzo fondi rettifiche crediti

### BLOCCO F - AGGREGAZIONI DIVISIONALI  
- **RE Division**: Somma 6 prodotti Real Estate → input per CE divisionale
- **SME Division**: Somma 5 prodotti SME → input per CE divisionale
- **PG Division**: Somma 3 prodotti Public Guarantee → input per CE divisionale

### BLOCCO G - FUNDING E LIQUIDITÀ
- **Depositi**: Base per calcolo interessi passivi e LCR
- **Funding Wholesale**: Costo funding e struttura passività
- **Liquidità**: Buffer regolamentari e cash management

### BLOCCO H - ALTRI PATRIMONIALI
- **Immobilizzazioni**: Base per ammortamenti e asset allocation
- **Portafoglio Titoli**: Trading income e ALM
- **Patrimonio Netto**: Base per calcolo ROE e capital ratios

## 📋 Storico Modifiche

### 12/08/2025 - Implementazione Blocchi E-H: Costi, Aggregazioni, Funding, Altri Patrimoniali
**AGGIUNTA COMPLETA BLOCCHI E, F, G, H**: Implementazione tabelle aggregate per completare il motore di calcolo
- **BLOCCO E - COSTI E ACCANTONAMENTI**:
  - E.1: Tabella LLP (Loan Loss Provisions) per trimestre per tutti i 14 prodotti
  - E.2: Tabella Write-off per trimestre per tutti i 14 prodotti
  - Totali aggregati per divisione
- **BLOCCO F - AGGREGAZIONI DIVISIONALI**:
  - F.1: Riepilogo Real Estate Division (somma 6 prodotti)
  - F.2: Riepilogo SME Division (somma 5 prodotti)  
  - F.3: Riepilogo Public Guarantee Division (somma 3 prodotti)
  - Voci aggregate: Erogazioni, Stock, Interessi, Commissioni, LLP, Write-off
- **BLOCCO G - FUNDING E LIQUIDITÀ**:
  - G.1: Tabella Depositi Clientela per segmento (evoluzione trimestrale)
  - G.2: Tabella Funding Wholesale (BCE, debt securities, interbank)
  - G.3: Tabella Liquidità e Riserve BCE (cash, reserves, LCR buffer)
- **BLOCCO H - ALTRI PATRIMONIALI**:
  - H.1: Roll-forward Immobilizzazioni (CAPEX, ammortamenti, dismissioni)
  - H.2: Portafoglio Titoli per categoria (governativi, corporate, altri)
  - H.3: Evoluzione Patrimonio Netto (utili, dividendi, aumenti capitale)
- **STRUTTURA TABELLE**: Tutte con evoluzione trimestrale Q1-Q20
- **FORMATTAZIONE**: Codifica colore per tipo (depositi=blu, funding=azzurro, etc.)
- **AGGREGAZIONI**: Totali per ogni sezione con formattazione grassetto
- **PREPARAZIONE**: Tabelle predisposte per ricevere formule nel STEP 3
- **MOTIVAZIONE**: Completamento sistema di calcolo per CE, SP, Capital Requirements e KPI

### 12/08/2025 - Implementazione Completa Matrici Vintage (BLOCCHI A-D)
**REWORK COMPLETO**: Trasformazione delle sezioni vintage in struttura completa a blocchi
- **BLOCCO A - EROGAZIONI E VOLUMI**: 
  - A.1: Matrice Erogazioni per Vintage (20x20 per 14 prodotti)
  - A.2: Matrice Rimborsi per Vintage (20x20 per 14 prodotti)  
  - A.3: Matrice Stock Lordo GBV (20x20 per 14 prodotti)
- **BLOCCO B - RISCHIO CREDITO**:
  - B.1: Matrice Default per Vintage con Timing Distribution (20x20 per 14 prodotti)
  - B.2: Matrice Stock Performing (20x20 per 14 prodotti)
  - B.3: Matrice Stock NPL (20x20 per 14 prodotti)
- **BLOCCO C - ECL E VALUTAZIONI**:
  - C.1: Matrice ECL Stage 1 con formula Stock × Danger Rate × LGD (20x20 per 14 prodotti)
  - C.2: Matrice NBV Performing (Stock - ECL) (20x20 per 14 prodotti)
  - C.3: Matrice NPV Recuperi attualizzati con Euribor + Spread (20x20 per 14 prodotti)
  - C.4: Matrice NBV Non-Performing (20x20 per 14 prodotti)
- **BLOCCO D - RICAVI**:
  - D.1: Matrice Interessi Attivi su Performing (20x20 per 14 prodotti)
  - D.2: Matrice Interessi di Mora su NPL (20x20 per 14 prodotti)
  - D.3: Matrice Commissioni Up-front (20x20 per 14 prodotti)
- **STRUTTURA MATRICI**: Ogni matrice 20x20 con righe V1(Q1)-V20(Q20), colonne Q1-Q20, totali
- **FORMATTAZIONE**: Codifica colore per tipo (erogazioni=azzurro, rimborsi=arancione, etc.)
- **COPERTURA**: 14 prodotti totali × 12 matrici = 168 matrici vintage complete
- **MOTIVAZIONE**: Sistema completo di vintage analysis per risk management e pricing

### 11/08/2025 - Aggiunta Sezioni Vintage Analysis e NBV
**SOSTITUITA** dalla implementazione completa del 12/08/2025

### Conversione da Modello Annuale a Trimestrale (Completata)
Il foglio Modello è stato convertito con successo da **modello annuale (5 anni)** a **modello trimestrale (20 trimestri)**.

#### Riepilogo Modifiche Implementate:
1. **Struttura Temporale**
   - PRIMA: 5 colonne per anni (Y1-Y5)
   - DOPO: 20 colonne per trimestri (Q1-Q20)
   - Headers con indicazione Anno (Q1-Q4 Anno 1, etc.)

2. **Layout Excel**
   - Colonne dati: C-V (20 colonne)
   - Colonna descrizione: spostata in X
   - Larghezza colonne: ottimizzata a 12 per accomodare 20 colonne

3. **Tabelle Aggiornate**
   - Calcoli di Appoggio: 20 trimestri + vintage analysis
   - Conto Economico: 20 trimestri
   - Stato Patrimoniale: 20 trimestri
   - Capital Requirements: 20 trimestri
   - KPI: 20 trimestri con annualizzazione

#### Status: ✅ COMPLETATO
- Script aggiornato per struttura trimestrale e vintage
- Tutte le tabelle predisposte per 20 trimestri
- Formattazione applicata correttamente
- File Excel aggiornato con successo