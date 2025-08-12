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

#### 1.3 VINTAGE ANALYSIS - MATRICE EROGAZIONI PER VINTAGE (€ mln)
Per ogni prodotto, matrice 20x20 che traccia le erogazioni per vintage:
- **Righe**: Vintage (V1-V20) = trimestre di erogazione
- **Colonne**: Tempo (Q1-Q20) = evoluzione temporale
- **Contenuto**: Volume erogato per vintage che evolve nel tempo

#### 1.4 MATRICE AMMORTAMENTI PER VINTAGE (€ mln)
Tabella dei rimborsi programmati per vintage:
- **Struttura**: Per prodotto, rimborsi aggregati per trimestre
- **Logica**: Basata su tipo ammortamento (bullet/amortizing) e maturity

#### 1.5 MATRICE DEFAULT PER VINTAGE (€ mln)
Stock che va in default per trimestre:
- **Calcolo**: Applica danger rate al timing medio di default
- **Tracking**: Per prodotto e trimestre

#### 1.6 MATRICE RECUPERI SU DEFAULT (€ mln)
Cash flow di recupero attesi divisi per:
- **RECUPERI GARANZIA IMMOBILIARE**: Timing e quote per divisione
- **RECUPERI GARANZIA MCC**: Timing e quote per divisione

#### 1.7 CALCOLO NBV E ECL
Sezione con le seguenti componenti:
- **STOCK PERFORMING**: Crediti in bonis per prodotto
- **ECL STAGE 1**: Expected Credit Loss su performing
- **NBV PERFORMING**: Stock Performing - ECL
- **STOCK NPL**: Crediti deteriorati per prodotto
- **NPV RECUPERI / NBV NON-PERFORMING**: Valore attuale dei recuperi

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

## 📝 Note Tecniche - VERSIONE TRIMESTRALE
- Le celle marcate con [F] conterranno formule nello STEP 3
- Tutte le tabelle sono predisposte per ricevere formule parametriche trimestrali
- Nessun valore hardcoded: tutto farà riferimento al foglio Input
- **Modello trimestrale**: 20 trimestri (Q1-Q20) invece di 5 anni
- **Struttura colonne**: B=Voci, C-V=Q1-Q20, W=Spazio, X=Descrizione
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

## 📋 Storico Modifiche

### 11/08/2025 - Aggiunta Sezioni Vintage Analysis e NBV
**AGGIUNTE**: Nuove sezioni nei Calcoli di Appoggio per gestione vintage
- **Sezione 1.3**: Vintage Analysis - Matrice Erogazioni per Vintage
  - Matrici 20x20 per ogni prodotto
  - Tracking erogazioni per vintage nel tempo
- **Sezione 1.4**: Matrice Ammortamenti per Vintage
  - Rimborsi programmati per vintage
  - Basata su tipo ammortamento e maturity
- **Sezione 1.5**: Matrice Default per Vintage
  - Stock che va in default per trimestre
  - Applica danger rate e timing default
- **Sezione 1.6**: Matrice Recuperi su Default
  - Separata per Garanzia Immobiliare e MCC
  - Cash flow di recupero attesi
- **Sezione 1.7**: Calcolo NBV e ECL
  - Stock Performing, ECL Stage 1
  - NBV Performing e Non-Performing
  - Stock NPL e NPV Recuperi
- **Motivazione**: Implementazione completa del motore di calcolo per vintage analysis

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