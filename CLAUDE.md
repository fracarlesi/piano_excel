
🛑🛑🛑 ATTENZIONE: STRUTTURA FILE RIGIDA - LEGGERE PRIMA DI TUTTO 🛑🛑🛑

# 🚨🚨🚨 DIVIETO ASSOLUTO DI CREARE NUOVI FILE 🚨🚨🚨
# ⛔⛔⛔ NON CREARE MAI NUOVI FILE NELLA CODEBASE ⛔⛔⛔
# 🔴🔴🔴 SE NON ESPRESSAMENTE RICHIESTO DALL'UTENTE 🔴🔴🔴

⛔️⛔️⛔️ **DIVIETO ASSOLUTO DI CREARE FILE NON AUTORIZZATI** ⛔️⛔️⛔️

📁 **SOLO QUESTI FILE SONO AMMESSI NEL PROGETTO:**
1. ✅ `create_input_sheet.py` - Script STEP 1
2. ✅ `create_model_sheet.py` - Script STEP 2  
3. ✅ `formula_engine.py` - Script STEP 3
4. ✅ `modello_bancario_completo.xlsx` - File Excel output
5. ✅ `CLAUDE.md` - Questo file di istruzioni
6. ✅ `documentazione/doc_create_input_sheet.md` - Documentazione Input
7. ✅ `documentazione/doc_create_model_sheet.md` - Documentazione Modello
8. ✅ `documentazione/doc_formula_engine.md` - Documentazione Formule

🚫 **È SEVERAMENTE VIETATO CREARE:**
- ❌ File Python temporanei (NO fix_*.py, verify_*.py, check_*.py, test_*.py)
- ❌ File Python duplicati (NO *_updated.py, *_v2.py, *_backup.py)
- ❌ File di log o riepilogo nella root (NO RIEPILOGO_*.md, LOG_*.txt)
- ❌ File Excel temporanei o di backup
- ❌ Qualsiasi altro file non nell'elenco sopra

⚡ **REGOLA D'ORO: SE DEVI MODIFICARE QUALCOSA:**
1. MODIFICA SEMPRE I FILE ESISTENTI, MAI CREARNE DI NUOVI
2. INTEGRA LE MODIFICHE NEI 3 SCRIPT PRINCIPALI
3. DOCUMENTA TUTTO NEI FILE DELLA CARTELLA `documentazione/`
4. SE HAI DUBBI, NON CREARE IL FILE

# 🔴🔴🔴 IMPORTANTE 🔴🔴🔴
# MAI CREARE NUOVI FILE SENZA AUTORIZZAZIONE ESPLICITA
# L'UTENTE DEVE ESPRESSAMENTE CHIEDERE DI CREARE UN NUOVO FILE
# ALTRIMENTI MODIFICA SEMPRE I FILE ESISTENTI

# ⚠️⚠️⚠️ PREVENZIONE ERRORI EXCEL - CRITICO ⚠️⚠️⚠️
## PROBLEMA RICORRENTE: Corruzione file Excel con errore "Si è verificato un problema con una parte del contenuto"

### CAUSE PRINCIPALI DA EVITARE:
1. **MAI inserire valori numerici (es. 0) in celle formattate come "formula"**
   - ❌ SBAGLIATO: `ws.cell(row=x, column=y, value=0)` + `format_formula_cell()`
   - ✅ CORRETTO: `ws.cell(row=x, column=y)` + `format_formula_cell()`

2. **SEMPRE verificare che i riferimenti delle formule puntino a celle esistenti**
   - Controllare che le righe riferite nel foglio Input esistano veramente
   - Usare algoritmi di ricerca robusti per trovare le celle (cercare fino a 8 righe indietro)
   - Gestire i casi in cui un riferimento non viene trovato

3. **EVITARE formule Excel troppo complesse o con sintassi non standard**
   - Preferire formule semplici e testate
   - Usare correttamente $ per riferimenti assoluti dove necessario
   - Non mischiare riferimenti relativi e assoluti in modo inconsistente

4. **ATTENZIONE ai parametri che cambiano posizione**
   - Quando si spostano parametri (es. da sezioni 1.12/1.13 a sezioni prodotto 1.6/1.7/1.8)
   - SEMPRE aggiornare TUTTI i riferimenti nel formula_engine.py
   - Verificare che le formule cerchino i parametri nelle nuove posizioni

### PROCEDURA DI VERIFICA PRIMA DI GENERARE EXCEL:
1. Controllare che create_model_sheet.py non inserisca valori in celle destinate a formule
2. Verificare che formula_engine.py mappi correttamente tutti i riferimenti
3. Testare che i riferimenti alle celle Input siano validi
4. Assicurarsi che le formule abbiano sintassi Excel standard

🎯 OBIETTIVO
Creare uno script Python che generi un modello Excel consolidato per piano industriale bancario utilizzando le librerie pandas, openpyxl e xlsxwriter. Lo script dovrà costruire un file con due fogli di lavoro distinti ("Input" e "Modello"), inserire tutte le tabelle e le formule necessarie, e applicare una formattazione professionale.

⚠️ IMPORTANTE - GESTIONE DEL FILE EXCEL E CONTINUITÀ DEL LAVORO
Il file Excel generato si chiamerà sempre **"modello_bancario_completo.xlsx"** e sarà l'UNICO file su cui lavorare durante tutto il processo:
- **STEP 1**: Crea/sovrascrive il file con il foglio "Input" 
- **STEP 2**: Aggiunge al MEDESIMO file il foglio "Modello" con le tabelle che conterranno nello step successivo le formule
- **STEP 3**: Aggiorna il MEDESIMO file inserendo tutte le formule

Non creare mai file separati per ogni step. Ogni fase deve aprire, modificare e salvare sempre lo stesso file "modello_bancario_completo.xlsx".

🔄 **REGOLA DI CONTINUITÀ**: 
Ogni volta che viene apportata una modifica al codice, la cartella documentazione deve essere aggiornato per preservare le modifiche fatte evitando di tornare indietro.


📚 **DOCUMENTAZIONE DETTAGLIATA**:
Ogni modifica ai contenuti dei fogli Excel tramite gli script Python deve essere documentata nei file nella cartella `documentazione/`:
- `doc_create_input_sheet.md` - Dettagli completi del foglio Input e assumptions
- `doc_create_model_sheet.md` - Struttura del foglio Modello e tabelle create
- `doc_formula_engine.md` - Documentazione della classe FormulaEngine

# 🔥🔥🔥 OBBLIGO ASSOLUTO DOCUMENTAZIONE 🔥🔥🔥
# ⚠️⚠️⚠️ LA DOCUMENTAZIONE DEVE SEMPRE ESSERE AGGIORNATA ⚠️⚠️⚠️
# 📝📝📝 ALLINEATA AL 100% CON IL CODICE PYTHON 📝📝📝
# ❌❌❌ MAI DISALLINEAMENTO TRA CODICE E DOCUMENTAZIONE ❌❌❌

**REGOLA FERREA**: 
1. OGNI modifica al codice Python → IMMEDIATO aggiornamento documentazione
2. La documentazione DEVE riflettere ESATTAMENTE cosa produce il codice
3. Se il codice genera 5 colonne, la documentazione deve dire 5 colonne
4. Se il codice usa valori assoluti, la documentazione NON può parlare di percentuali
5. VERIFICARE SEMPRE l'allineamento codice-documentazione

⚠️ **IMPORTANTE**: Quando si modificano i contenuti o la struttura dei fogli Excel, aggiornare SEMPRE i rispettivi file di documentazione per mantenere la coerenza del progetto.

🚫 **REGOLA ANTI-DUPLICAZIONE DOCUMENTAZIONE**:
- **NON CREARE** file di log o documentazione nella directory root del progetto
- **TUTTI** gli aggiornamenti, modifiche e storici devono essere integrati direttamente nei file della cartella `documentazione/`
- Se esistono file come `AGGIORNAMENTI_*.md` o `CONVERSIONE_*.md` nella root, il loro contenuto deve essere:
  1. Integrato nei file appropriati in `documentazione/`
  2. Eliminato dalla root per evitare duplicazioni
- Ogni file di documentazione deve includere una sezione "📋 Storico Modifiche" per tracciare l'evoluzione del componente

🤖 USO DEGLI AGENTI SPECIALIZZATI
Per ogni tipo di richiesta dell'utente, utilizzare SEMPRE gli agenti specializzati presenti nella cartella `.claude/agents/`:
- **python-pro.md**: Per sviluppo Python e librerie pandas/openpyxl/xlsxwriter
- **data-engineer.md**: Per strutturazione dati e pipeline ETL
- **database-admin.md**: Per ottimizzazione query e strutture dati
- **architect-review.md**: Per revisione architettura del modello
- **debugger.md**: Per debug di formule Excel e calcoli
- **docs-architect.md**: Per aggiornamento documentazione
- **performance-engineer.md**: Per ottimizzazione performance del modello Excel

⚠️ **REGOLA FONDAMENTALE**: Prima di iniziare qualsiasi lavoro, identificare e utilizzare l'agente più appropriato per il tipo di richiesta.

🔧 APPROCCIO TECNICO
Il codice Python utilizzerà:
- **pandas**: per la gestione e manipolazione dei dati tabellari
- **openpyxl**: per la scrittura avanzata di formule Excel e formattazione
- **xlsxwriter**: per formattazione professionale alternativa (se necessario)
- **numpy**: per calcoli finanziari complessi

📝 ESECUZIONE STEP-BY-STEP
Lo script sarà strutturato per essere eseguito in 3 fasi distinte:

**STEP 1 - Creazione Foglio Input e Formattazione** ✅ COMPLETATO
- Script: `create_input_sheet.py`
- Creazione del foglio "Input" con tutte le tabelle delle Assumptions
- Applicazione della formattazione professionale (colori, bordi, formati numerici)
- Output: file `modello_bancario_completo.xlsx` con foglio "Input"

**STEP 2 - Creazione Foglio Modello e Tabelle di Calcolo** ✅ COMPLETATO
- Script: `create_model_sheet.py`
- Creazione del foglio "Modello" 
- Costruzione delle tabelle di destinazione per i calcoli di appoggio
- Impostazione della struttura e formattazione delle tabelle finali (CE, SP, Capital Requirements, KPI)
- Preparazione delle aree per l'inserimento delle formule
- Output: file `modello_bancario_completo.xlsx` aggiornato con foglio "Modello"

**STEP 3 - Inserimento Formule**
- Inserimento di tutte le formule Excel nei calcoli di appoggio
- Popolamento delle formule nei report finali (CE, SP, etc.)
- Creazione dei collegamenti tra celle e fogli
- Validazione della coerenza delle formule

🚨 REGOLA FONDAMENTALE: ZERO VALORI HARDCODED
Il modello deve essere completamente parametrico. OGNI formula nelle sezioni di calcolo e nei report finali deve fare riferimento esclusivamente alle celle delle Assumptions o ad altre celle di calcolo. NON inserire MAI valori numerici diretti nelle formule.

💶 VALUTA
Utilizzare sempre il simbolo € (euro). Tutti i valori monetari sono da intendersi in milioni di euro, salvo diversa indicazione.

🎨 FORMATTAZIONE DISTINTIVA CELLE
Il modello Excel deve utilizzare una formattazione visivamente distintiva per differenziare le celle di input dalle celle con formule:

**Celle di INPUT (modificabili dall'utente):**
- Sfondo: Verde chiaro (#E8F5E9)
- Font: Calibri 11pt, grassetto, verde scuro (#1B5E20)
- Bordi: Medi, colore verde (#4CAF50)
- Allineamento: Centrato
- Applicate nel foglio "Input" per tutti i parametri

**Celle con FORMULE (calcolate automaticamente):**
- Sfondo: Grigio chiaro (#F5F5F5)
- Font: Calibri 11pt, normale, nero (#000000)
- Bordi: Tratteggiati
- Allineamento: Centrato
- Applicate nel foglio "Modello" per tutti i calcoli

📊 STRUTTURA DEL FILE EXCEL
Il modello generato avrà la seguente struttura:

**Foglio Input**: Conterrà la sezione 1. Assumptions.

**Foglio Modello**: Conterrà, in ordine: 2. Calcoli di Appoggio, 3. Conto Economico Consolidato, 4. Stato Patrimoniale Consolidato, 5. Capital Requirements, 6. Key Performance Indicators (KPI).

## CONTENUTO DEI FOGLI EXCEL

📖 **Il dettaglio completo del contenuto dei fogli è documentato nei file dedicati:**
- **Foglio Input**: vedere `documentazione/doc_create_input_sheet.md`
- **Foglio Modello**: vedere `documentazione/doc_create_model_sheet.md`e `documentazione/doc_formula_engine.md`
