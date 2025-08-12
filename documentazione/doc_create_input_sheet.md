# Documentazione: create_input_sheet.py - MODELLO TRIMESTRALE
## STEP 1 - Foglio Input per Modello Trimestrale

### 📋 Descrizione
Script che crea il file `modello_bancario_completo.xlsx` con il foglio "Input" contenente tutte le assumptions del **modello bancario trimestrale (20 trimestri)**. 

**IMPORTANTE**: Versione aggiornata per supportare **20 trimestri (Q1-Q20)** invece di 5 anni annuali.

### 🎨 FORMATTAZIONE CELLE INPUT
Le celle destinate all'input utente hanno una formattazione distintiva per distinguerle dalle celle con formule:

#### Celle di Input (dove l'utente inserisce i dati):
- **Sfondo**: Verde chiaro (#E8F5E9)
- **Font**: Calibri 11pt, grassetto, colore verde scuro (#1B5E20)
- **Bordi**: Medi, colore verde (#4CAF50)
- **Allineamento**: Centrato

Questa formattazione viene applicata a tutti i valori parametrici nel foglio Input, inclusi:
- Tassi di mercato (ECB Rate, Euribor)
- Parametri di bilancio iniziale
- Parametri di rischio e capitale
- Costi generali e spese
- Volumi di erogazioni
- Parametri prodotti (RWA, LGD, tassi, etc.)

### 📊 Struttura del Foglio Input - MODELLO TRIMESTRALE

Il foglio Input contiene le seguenti sezioni di parametri organizzate per **modello trimestrale (20 trimestri)**:

## 1. ASSUMPTIONS - PARAMETRI DI INPUT PER MODELLO TRIMESTRALE

### 1.1 Parametri Macro e Tassi di Mercato - STRUTTURA TRIMESTRALE
| Parametro | Valore | Descrizione |
|-----------|---------|-------------|
| ECB Rate Q1-Q4 | 2,50% | Tasso di riferimento BCE per i primi 4 trimestri (Anno 1), influenza il costo del funding |
| ECB Rate Q5-Q8 | 2,75% | Tasso di riferimento BCE per trimestri 5-8 (Anno 2) |
| ECB Rate Q9-Q12 | 3,00% | Tasso di riferimento BCE per trimestri 9-12 (Anno 3) |
| ECB Rate Q13-Q16 | 3,00% | Tasso di riferimento BCE per trimestri 13-16 (Anno 4) |
| ECB Rate Q17-Q20 | 3,00% | Tasso di riferimento BCE per trimestri 17-20 (Anno 5) |
| Euribor 6M Q1-Q4 | 3,25% | Tasso interbancario per i primi 4 trimestri, base per il pricing di molti prodotti di credito |
| Euribor 6M Q5-Q8 | 3,50% | Tasso interbancario per trimestri 5-8 |
| Euribor 6M Q9-Q12 | 3,75% | Tasso interbancario per trimestri 9-12 |
| Euribor 6M Q13-Q16 | 3,75% | Tasso interbancario per trimestri 13-16 |
| Euribor 6M Q17-Q20 | 3,75% | Tasso interbancario per trimestri 17-20 |

**CONVERSIONE TRIMESTRALE**: I tassi annuali sono applicati identicamente su tutti i trimestri dell'anno di riferimento.

### 1.2 Bilancio di Partenza (Anno 0) - BANCA NUOVA
| Parametro | Valore | Descrizione |
|-----------|---------|-------------|
| Cash (Anno 0) | 200 | La liquidità iniziale corrisponde all'Equity versato |
| Stock Crediti RE (Anno 0) | 0 | Banca nuova, non ci sono crediti pre-esistenti |
| Stock Crediti SME (Anno 0) | 0 | Banca nuova, non ci sono crediti pre-esistenti |
| Stock Crediti PG (Anno 0) | 0 | Banca nuova, non ci sono crediti pre-esistenti |
| Stock Titoli (Anno 0) | 0 | Banca nuova, non c'è portafoglio titoli |
| Stock Depositi (Anno 0) | 0 | Banca nuova, non ci sono depositi |
| Patrimonio Netto (Anno 0) | 200 | Capitale iniziale versato |
| Ricavi Totali (Anno 0) | 0 | Banca nuova, ricavi anno precedente nulli per calcolo RWA operativi Y1 |

### 1.3 Parametri di Rischio e Capitale
| Parametro | Valore | Descrizione |
|-----------|---------|-------------|
| Pillar 1 Requirement (CET1) | 4,5% | Requisito minimo di capitale CET1 secondo la normativa |
| Pillar 2 Requirement (P2R) | 2,0% | Requisito aggiuntivo specifico per la banca (SREP) |
| Capital Conservation Buffer | 2,5% | Buffer di conservazione del capitale |
| Counter-cyclical Buffer | 0,5% | Buffer anticiclico macroprudenziale |
| RWA Operativi (% Ricavi Y-1) | 15,0% | Moltiplicatore sui ricavi dell'anno precedente per calcolare il rischio operativo |
| RWA Mercato (% Portafoglio) | 10,0% | Ponderazione media del rischio di mercato applicata al portafoglio titoli |
| Deducations da CET1 (% Equity) | 1,0% | Percentuale di deduzioni dal CET1 (es. intangibles, perdite attese) |

### 1.4 Costi Generali, Dividendi e Tasse - STRUTTURA TRIMESTRALE
| Parametro | Valore | Descrizione |
|-----------|---------|-------------|
| Spese di Marketing Q1-Q20 | 0,5-0,75 | Costo trimestrale per marketing (annuale/4): Q1-Q4: 0,5; Q5-Q20: 0,6-0,75 |
| Consulenze e Spese Legali Q1-Q20 | 0,5-0,55 | Costi trimestrali per consulenti esterni (annuale/4) |
| Costi Immobiliari Q1-Q20 | 0,75-0,8 | Costi trimestrali per affitti, utenze e manutenzione (annuale/4) |
| Spese Generali Amministrative Q1-Q20 | 0,375-0,425 | Altre spese di funzionamento trimestrali (annuale/4) |
| Contributo FITD (% Depositi) | 0,15% | Contributo obbligatorio al Fondo Interbancario (applicato trimestralmente) |
| Aliquota Fiscale | 28,0% | Aliquota fiscale media applicabile sull'utile ante imposte trimestrale |
| Dividend Payout Q1-Q8 | 30,0% | Percentuale di utile netto trimestrale distribuita come dividendi (primi 8 trim) |
| Dividend Payout Q9-Q16 | 35,0% | Percentuale di utile netto trimestrale distribuita come dividendi (trim 9-16) |
| Dividend Payout Q17-Q20 | 40,0% | Percentuale di utile netto trimestrale distribuita come dividendi (ultimi 4 trim) |

**CONVERSIONE TRIMESTRALE**: I costi annuali sono convertiti in costi trimestrali dividendo per 4. I dividendi sono calcolati su utile netto trimestrale.

### 1.5 Erogazioni per Divisione - VALORI ASSOLUTI ANNUALI ⚠️ AGGIORNATO
| Divisione | Y1 (€ mln) | Y2 (€ mln) | Y3 (€ mln) | Y4 (€ mln) | Y5 (€ mln) | Descrizione |
|-----------|------------|------------|------------|------------|------------|-------------|
| **Real Estate** | 200 | 210 | 220 | 227 | 234 | Volumi di nuovi finanziamenti divisione Real Estate |
| **SME** | 250 | 270 | 292 | 306 | 321 | Volumi di nuovi finanziamenti divisione SME |
| **Public Guarantee** | 50 | 55 | 61 | 66 | 69 | Volumi di nuovi finanziamenti divisione Public Guarantee |

**⚠️ MODIFICA IMPORTANTE (11/08/2025)**: 
- La sezione ora contiene **valori assoluti in milioni di euro** per ogni anno invece di tassi di crescita
- Ogni cella contiene direttamente il volume di nuove erogazioni previsto per quell'anno
- Non è più necessario calcolare i volumi partendo da un valore base e applicando tassi di crescita

### 1.6 Parametri Specifici per Prodotto di Credito

#### Real Estate Division
| Parametro | Construction Bridge Loan | Mezzanine Loan Amortizing | Mezzanine Loan Asset Management | Mezzanine Loan Pre-Amortizing | Mezzanine Loan Pre-Amortizing Asset Management | Non-Recourse Estate |
|-----------|-------------------------|---------------------------|--------------------------------|------------------------------|-----------------------------------------------|-------------------|
| Mix Prodotti | 20% | 50% | 0% | 25% | 0% | 5% |
| Amortizing Type | bullet | amortizing | amortizing | amortizing | amortizing | bullet |
| Loan Maturity (Anni) | 2 | 7 | 7 | 7 | 7 | 4 |
| Pre-amortizing Period | 0 | 0 | 0 | 1 | 1 | 0 |
| RWA (Bonis) | 75% | 60% | 80% | 75% | 75% | 75% |
| Danger Rate | 5% | 5% | 5% | 5% | 5% | 5% |
| LGD | 50% | 40% | 30% | 40% | 30% | 0.6% |
| Interest Rate | 8,0% | 8,0% | 6,0% | 8,0% | 6,0% | 6,0% |
| Up-front Fees | 1,0% | 1,0% | 1,0% | 1,0% | 1,0% | 1,0% |

#### SME Division
| Parametro | Business Loan | Refinancing | State Support | New Finance | Restructuring |
|-----------|--------------|-------------|---------------|-------------|---------------|
| Mix Prodotti | 15% | 30% | 10% | 40% | 5% |
| Amortizing Type | bullet | amortizing | amortizing | amortizing | amortizing |
| Loan Maturity (Anni) | 2 | 5 | 4 | 4 | 5 |
| Pre-amortizing Period | 0 | 2 | 0 | 0 | 0 |
| RWA (Bonis) | 80% | 80% | 100% | 135% | 100% |
| Danger Rate | 10% | 10% | 10% | 10% | 10% |
| LGD | 50% | 40% | 30% | 40% | 60% |
| Interest Rate | 8,0% | 8,0% | 8,0% | 8,0% | 8,0% |
| Up-front Fees | 1,0% | 1,0% | 1,0% | 1,0% | 1,0% |

#### Public Guarantee Division
| Parametro | Anticipo Contratti PA | Fondo Garanzia Amortizing | Fondo Garanzia Pre-Amortizing |
|-----------|----------------------|--------------------------|------------------------------|
| Mix Prodotti | 40% | 30% | 30% |
| Amortizing Type | bullet | amortizing | amortizing |
| Loan Maturity (Anni) | 1 | 5 | 7 |
| Pre-amortizing Period | 0 | 0 | 2 |
| RWA (Bonis) | 40% | 0% | 0% |
| Danger Rate | 5% | 5% | 5% |
| LGD | 50% | 50% | 50% |
| Interest Rate | 5,0% | 5,0% | 5,0% |
| Up-front Fees | 2,0% | 2,0% | 2,0% |

### 1.7 Parametri Altre Divisioni

#### Digital Banking - STRUTTURA TRIMESTRALE
| Parametro | Valore | Descrizione |
|-----------|---------|-------------|
| Clienti Base (Q0) | 50000 | Numero di clienti con conto base all'inizio del piano |
| Clienti Premium (Q0) | 5000 | Numero di clienti con conto premium all'inizio del piano |
| Crescita Clienti Base Q1-Q4 | 4,66% | Crescita trimestrale clienti base: (1+20%)^(1/4)-1 ≈ 4,66% |
| Crescita Clienti Base Q5-Q20 | 2,41% | Crescita trimestrale clienti base: (1+10%)^(1/4)-1 ≈ 2,41% |
| Crescita Clienti Premium Q1-Q4 | 6,78% | Crescita trimestrale clienti premium: (1+30%)^(1/4)-1 ≈ 6,78% |
| Crescita Clienti Premium Q5-Q20 | 5,74% | Crescita trimestrale clienti premium: (1+25%)^(1/4)-1 ≈ 5,74% |
| Crescita Depositi Vincolati Q1-Q20 | 3,56% | Crescita trimestrale depositi: (1+15%)^(1/4)-1 ≈ 3,56% |
| Deposito Medio Cliente Base (€) | 2000 | Giacenza media per cliente con conto base (invariato) |
| Deposito Medio Cliente Premium (€) | 15000 | Giacenza media per cliente con conto premium (invariato) |
| Canone Trimestrale Base (€) | 9 | Canone trimestrale per il conto corrente base (mensile * 3) |
| Canone Trimestrale Premium (€) | 24 | Canone trimestrale per il conto corrente premium (mensile * 3) |
| Tasso Passivo Vincolato Q1-Q20 | 2,50%-3,00% | Tasso di interesse trimestrale corrisposto sui depositi vincolati |
| Spread Depositi Vista Q1-Q20 | 1,00%-1,50% | Margine trimestrale dall'impiego della liquidità dei conti correnti |

**CONVERSIONE TRIMESTRALE**: 
- **Crescite**: Da annuali a trimestrali: (1+crescita_annuale)^(1/4)-1
- **Canoni**: Da mensili a trimestrali: canone_mensile * 3

#### Wealth Management - STRUTTURA TRIMESTRALE
| Parametro | Valore | Descrizione |
|-----------|---------|-------------|
| AUM Growth Q1-Q8 | 3,56% | Crescita trimestrale AUM: (1+15%)^(1/4)-1 ≈ 3,56% per Q1-Q8 |
| AUM Growth Q9-Q16 | 2,87% | Crescita trimestrale AUM: (1+12%)^(1/4)-1 ≈ 2,87% per Q9-Q16 |
| AUM Growth Q17-Q20 | 2,41% | Crescita trimestrale AUM: (1+10%)^(1/4)-1 ≈ 2,41% per Q17-Q20 |
| Management Fee (% AUM trimestrale) | 0,20% | Commissione di gestione trimestrale: 0,80%/4 = 0,20% per trimestre |
| Performance Fee (% AUM Perf) | 15,0% | Commissione di performance applicata trimestralmente alla quota di AUM con rendimenti positivi |
| AUM Performance (% AUM Totali) | 30,0% | Percentuale di AUM che si stima generi commissioni di performance |

#### Treasury - STRUTTURA TRIMESTRALE
| Parametro | Valore | Descrizione |
|-----------|---------|-------------|
| Rendimento Titoli Q1-Q20 | 0,75%-0,875% | Rendimento trimestrale dal portafoglio titoli: annuale/4 |
| Costo Funding Q1-Q20 | 0,875%-1,00% | Costo trimestrale della raccolta all'ingrosso: annuale/4 |

**CONVERSIONE TRIMESTRALE**: 
- **Crescite AUM**: Da annuali a trimestrali: (1+crescita_annuale)^(1/4)-1
- **Management Fee**: Divisa per 4 (annuale/4)
- **Rendimenti e Costi**: Tassi annuali divisi per 4

### 1.8 Parametri Personale Dettagliati - STRUTTURA TRIMESTRALE

#### 1.8.1 FTE per Divisione Business - VALORI TRIMESTRALI INTERPOLATI
| Divisione | Q1 | Q4 | Q8 | Q12 | Q16 | Q20 | Descrizione |
|-----------|-----|-----|-----|-----|-----|-----|-------------|
| Real Estate | 15 | 17 | 20 | 23 | 26 | 28 | Team dedicato al settore immobiliare (crescita trimestrale interpolata) |
| SME | 15 | 18 | 22 | 27 | 32 | 35 | Team dedicato alle piccole e medie imprese |
| Public Guarantee | 15 | 15 | 17 | 19 | 21 | 22 | Team per finanziamenti con garanzia pubblica |
| Digital Banking | 16 | 18 | 22 | 26 | 29 | 30 | Team per servizi bancari digitali |
| Wealth Management | 13 | 14 | 16 | 19 | 21 | 22 | Team gestione patrimoniale |
| Tech Platform | 25 | 27 | 32 | 37 | 42 | 45 | Team sviluppo e gestione piattaforma tecnologica |

#### 1.8.2 FTE per Funzioni Centrali - VALORI TRIMESTRALI INTERPOLATI
| Funzione | Q1 | Q4 | Q8 | Q12 | Q16 | Q20 | Descrizione |
|----------|-----|-----|-----|-----|-----|-----|-------------|
| CEO Office | 3 | 3 | 3 | 3 | 4 | 4 | Ufficio del CEO e supporto strategico |
| CFO & Finance | 8 | 8 | 9 | 10 | 11 | 12 | Controllo di gestione e reporting finanziario |
| Risk Management | 10 | 10 | 11 | 12 | 13 | 14 | Gestione del rischio e compliance |
| Legal & Compliance | 6 | 6 | 7 | 8 | 9 | 10 | Affari legali e conformità normativa |
| HR & Organization | 5 | 5 | 6 | 7 | 8 | 9 | Risorse umane e sviluppo organizzativo |
| Operations | 8 | 8 | 9 | 10 | 11 | 12 | Operazioni bancarie e back-office |
| Marketing & Communication | 4 | 4 | 5 | 5 | 6 | 6 | Marketing e comunicazione istituzionale |
| Internal Audit | 4 | 4 | 4 | 5 | 5 | 6 | Revisione interna |
| Treasury | 3 | 3 | 3 | 4 | 4 | 4 | Tesoreria e gestione liquidità |
| **TOTALE FTE BANCA** | **150** | **163** | **187** | **213** | **233** | **240** | Totale organico della banca |

**CONVERSIONE TRIMESTRALE**: I valori degli FTE sono interpolati linearmente tra i valori annuali di riferimento, con crescita graduale ogni trimestre.

#### 1.8.3 RAL Media per Seniority
| Seniority | RAL Base (€) | Bonus Target % | RAL Total (€) | Descrizione |
|-----------|--------------|----------------|---------------|-------------|
| Junior (0-3 anni) | 35,000 | 10% | 38,500 | Profili junior in ingresso |
| Professional (3-7 anni) | 50,000 | 15% | 57,500 | Professionisti con esperienza |
| Senior (7-12 anni) | 70,000 | 20% | 84,000 | Senior professional e specialist |
| Manager | 95,000 | 30% | 123,500 | Responsabili di team e funzioni |
| Senior Manager | 130,000 | 40% | 182,000 | Responsabili di divisione |
| Director | 180,000 | 50% | 270,000 | Direttori e C-level |

#### 1.8.4 Mix Seniority per Divisione (%)
| Divisione | Junior | Professional | Senior | Manager | Sr Manager | Director |
|-----------|--------|--------------|--------|---------|------------|----------|
| Real Estate | 20% | 30% | 25% | 15% | 8% | 2% |
| SME | 25% | 35% | 20% | 12% | 6% | 2% |
| Public Guarantee | 30% | 35% | 20% | 10% | 4% | 1% |
| Digital Banking | 35% | 30% | 20% | 10% | 4% | 1% |
| Wealth Management | 15% | 25% | 30% | 20% | 8% | 2% |
| Tech Platform | 40% | 30% | 15% | 10% | 4% | 1% |
| Funzioni Centrali | 25% | 30% | 25% | 12% | 6% | 2% |

#### 1.8.5 Altri Costi del Personale
| Parametro | Valore | Descrizione |
|-----------|---------|-------------|
| Contributi Previdenziali (%RAL) | 30% | Contributi INPS e previdenza complementare |
| TFR (%RAL) | 7% | Accantonamento TFR annuale |
| Welfare Aziendale (€/FTE) | 2,000 | Benefit e welfare per dipendente |
| Formazione (€/FTE) | 1,500 | Budget formazione per dipendente |
| Trasferte e Rimborsi (€/FTE) | 3,000 | Rimborsi spese e trasferte medie |
| Turnover Rate Annuo | 10% | Tasso di turnover del personale |
| Costo Recruiting (€/nuovo FTE) | 5,000 | Costo medio per nuova assunzione |

#### 1.8.6 Incrementi RAL Trimestrali
| Parametro | Q1-Q4 | Q5-Q8 | Q9-Q12 | Q13-Q16 | Q17-Q20 | Descrizione |
|-----------|-------|-------|--------|---------|---------|-------------|
| Incremento RAL Base Trimestrale | 0.5% | 0.6% | 0.6% | 0.7% | 0.7% | Incremento trimestrale: annuale/4 |
| Inflazione Attesa Trimestrale | 0.5% | 0.5% | 0.5% | 0.5% | 0.5% | Tasso di inflazione trimestrale: 2%/4 |

**CONVERSIONE TRIMESTRALE**: Gli incrementi annuali sono divisi per 4 per ottenere gli incrementi trimestrali.

### 1.9 IT, Telefonia e CAPEX - STRUTTURA TRIMESTRALE
| Parametro | Q1-Q20 | Descrizione |
|-----------|--------|-------------|
| Licenza Temenos (Trimestrale) | 0,5-0,6 | Costo trimestrale per la licenza del sistema di core banking (annuale/4) |
| Costi Cloud (Trimestrale) | 0,375-0,75 | Costo trimestrale per i servizi di infrastruttura cloud (annuale/4) |
| Costi Infoprovider (Trimestrale) | 0,125-0,175 | Costo trimestrale per dati e servizi informativi esterni (annuale/4) |
| Canone Internet (Trimestrale) | 0,05-0,075 | Costo trimestrale per la connettività internet aziendale (annuale/4) |
| Licenze Software (Trimestrale) | 0,075-0,125 | Costo trimestrale per licenze software (annuale/4) |
| Noleggio Dispositivi per Dipendente (€) | 200 | Costo trimestrale per noleggio PC, laptop, etc. per ogni dipendente (annuale/4) |
| Telefonia per Dipendente (€) | 100 | Costo trimestrale per i piani di telefonia mobile aziendale (annuale/4) |
| Sviluppo Software (Trimestrale) | 1,25-0,25 | Investimenti trimestrali in sviluppo software capitalizzati (CAPEX, annuale/4) |
| Vita Utile Software (Trimestri) | 20 | Periodo di ammortamento per i costi di sviluppo software (5 anni = 20 trimestri) |

**CONVERSIONE TRIMESTRALE**: Tutti i costi annuali IT sono divisi per 4. I periodi di ammortamento sono convertiti da anni a trimestri (x4).

## 🔧 Formattazione Applicata - MODELLO TRIMESTRALE
- **Headers**: Header principale blu scuro (#002060), sottosezioni blu chiaro (#D9E2F3), intestazioni grigio chiaro (#F0F0F0)
- **Celle INPUT**: Sfondo azzurro chiaro (#E6F3FF), testo blu scuro (#1F4E79), bordo normale thin
- **Font**: Calibri 11pt per dati, 12pt bold per sottotitoli, 16pt bold per titolo principale
- **Formati numerici**: Percentuali con simbolo %, valori monetari in milioni di euro
- **Struttura colonne trimestrale**: 
  - Colonna A (Spaziatura): 2
  - Colonna B (Voci): 45
  - **Colonne C-V (Q1-Q20)**: 12 (ridotte per accomodare 20 colonne trimestrali)
  - Colonna W (Spaziatura): 2
  - Colonna X (Descrizione): 50
- **Bordi**: Thin border per tutte le celle con dati
- **Header trimestrale**: Q1, Q2, Q3, ..., Q20 nelle colonne C-V

## 🎨 Sistema di Distinzione Visiva
Il foglio Input implementa un sistema di codifica a colori per distinguere i tipi di celle:

### Celle INPUT (Azzurro Chiaro)
- **Sfondo**: #E6F3FF (azzurro chiaro)
- **Testo**: #1F4E79 (blu scuro)
- **Bordo**: Linea continua sottile
- **Utilizzo**: Celle dove l'utente inserisce parametri e assumptions
- **Posizione**: Tutte le celle dati nel foglio Input

### Legenda Visiva
Il foglio include una sezione di legenda che spiega la distinzione tra:
- **CELLE INPUT**: Utilizzate nel foglio Input per parametri modificabili dall'utente
- **CELLE FORMULA**: Utilizzate nel foglio Modello per calcoli automatici (mostrate come esempio)

## 📝 Note Tecniche - MODELLO TRIMESTRALE
- Tutti i valori monetari sono in milioni di euro, salvo diversa indicazione
- Le percentuali sono espresse in formato decimale (es. 2,50% = 0.025)
- **Struttura trimestrale**: 20 trimestri (Q1-Q20) invece di 5 anni annuali
- **Colonne Excel**: Q1-Q20 mappate nelle colonne C-V (20 colonne)
- **Conversioni applicate**:
  - Costi annuali → trimestrali: divisione per 4
  - Crescite annuali → trimestrali: (1+crescita_annuale)^(1/4)-1
  - Canoni mensili → trimestrali: moltiplicazione per 3
  - Periodi di ammortamento: anni × 4 = trimestri
- Il file generato è `modello_bancario_completo.xlsx`
- Questo è lo STEP 1 del processo di creazione del **modello bancario trimestrale completo**

## 🔄 Impatto del Modello Trimestrale

### Vantaggi della Granularità Trimestrale
- **Analisi più dettagliata**: Visibilità trimestrale su crescita e performance
- **Controllo gestionale**: Monitoring trimestrale vs target annuali
- **Seasonalità**: Capacità di modellare effetti stagionali
- **Cash flow planning**: Pianificazione finanziaria più accurata

### Adattamenti Necessari nel Formula Engine
- **KPI annualizzati**: ROE, ROA, NIM moltiplicati per 4 per confrontabilità
- **Roll-forward trimestrali**: Stock crediti, depositi, patrimonio
- **Interpolazione lineare**: Per parametri che crescono gradualmente (FTE)
- **Gestione seasonalità**: Possibilità di inserire pattern stagionali nei volumi

## 📋 Storico Conversione Trimestrale

### Conversione da Modello Annuale a Trimestrale (Completata)
Il foglio Input è stato convertito con successo da **modello annuale (5 anni)** a **modello trimestrale (20 trimestri)**.

#### Principali Modifiche Implementate:
1. **Struttura Temporale**
   - PRIMA: 5 colonne per 5 anni (Y1-Y5)
   - DOPO: 20 colonne per 20 trimestri (Q1-Q20)
   - Colonne Excel: C-V (20 colonne dati)

2. **Conversione Parametri**
   - Tassi: identici per tutti i trimestri dell'anno
   - Erogazioni: Volume Q1 + crescite trimestrali
   - Costi operativi: valori annuali/4
   - Crescite: formula (1+r_annual)^(1/4)-1

3. **Esempi di Conversione**
   | Parametro | Valore Annuale | Valore Trimestrale |
   |-----------|----------------|-------------------|
   | Marketing | €2,0M | €0,50M |
   | Crescita SME | 8% | 1,943% |
   | Crescita RE | 5% | 1,227% |

#### Status: ✅ COMPLETATO
- Script aggiornato per 20 trimestri
- Headers Q1-Q20 con indicazione anno
- Formule di conversione implementate

## 📋 Storico Modifiche

### 11/08/2025 - Aggiunta Sezioni 1.12 e 1.13 per Calcoli di Appoggio
**AGGIUNTE**: Nuove sezioni per parametri Default, Recupero e ECL
- **Sezione 1.12**: Parametri Default e Recupero
  - Timing Default per divisione (trimestre medio dopo erogazione)
  - Timing Recupero Garanzie (trimestri dopo default)
  - Quote Recupero Garanzie per divisione (% del credito)
- **Sezione 1.13**: Parametri ECL (Expected Credit Loss)
  - Orizzonte ECL in trimestri
  - Moltiplicatore PD Stage 1
  - Coverage Ratio Stage 3
- **Sezione 1.14**: IT, Telefonia e CAPEX (rinumerata da 1.12)
- **Motivazione**: Parametri necessari per i calcoli di vintage analysis e NBV

### 11/08/2025 - Sezione 1.5 Erogazioni per Divisione
**MODIFICA**: Cambiato da tassi di crescita a valori assoluti
- **PRIMA**: Anno 1 con valore base + tassi di crescita per anni successivi
- **DOPO**: Valori assoluti in € mln per tutti e 5 gli anni
- **Motivazione**: Maggiore chiarezza e controllo diretto sui volumi di erogazione pianificati
- **Impatto**: Le formule nel foglio Modello dovranno riferirsi direttamente ai valori invece di calcolare la crescita
- File Excel generato correttamente