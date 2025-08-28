# 🎯 INVESTOR PRESENTATION CREATOR

## 📚 DOCUMENTAZIONE MODULARE - UNICI DOCUMENTI DA CONSULTARE

### ⚠️ IMPORTANTE: QUESTI SONO GLI UNICI 2 DOCUMENTI PER LE PRESENTAZIONI

### 📖 1. STORYTELLING E NARRATIVA
usa indicazioni utente senza prendere iniziative

### 🎨 2. LAYOUT E DESIGN 
**FILE**: `standard template/slide_template.html`



### 🚫 NON USARE ALTRI DOCUMENTI


## 🎯 OUTPUT FINALE - SOLO QUESTI FILE HTML

### ⚠️ REGOLA CRITICA: SOLO FILE HTML IN CARTELLA OUTPUT - ZERO BACKUP
**L'utente vuole SOLO questi file come output finale nella cartella `output/`:**
1. **output/slide_00.html** = File master con navigazione tra le slide
2. **output/slide_01.html** a **output/slide_xx.html** = Le slide della presentazione

**🚫 DIVIETO ASSOLUTO DI BACKUP:**
- ❌ MAI creare file `slide_XX_backup.html`
- ❌ MAI creare file `slide_XX_v2.html` o versioni numerate
- ❌ MAI duplicare slide con nomi diversi
- ✅ SEMPRE una sola versione per slide
- ✅ Se serve backup, usare Git, NON file duplicati

### 📁 STRUTTURA CARTELLE ORGANIZZATA
```
piano industriale excel/
├── output/                    # 📌 CARTELLA PRINCIPALE OUTPUT
│   ├── slide_00.html          # Master con navigazione
│   ├── slide_01.html          # Slide 1
│   ├── slide_02.html          # Slide 2
│   └── ... fino a slide_23.html
├── screenshots/               # 📌 UNICA cartella per screenshot MCP (temporanei)
└── CLAUDE.md                  # Questo file

Non creare altri file

**⚠️ NOTA IMPORTANTE SU SCREENSHOTS:**
- **SOLO UNA CARTELLA**: Usare SOLO `screenshots/` per tutti gli screenshot
- **NO DUPLICAZIONI**: MAI creare cartella `analysis/` o simili
- **PULIZIA AUTOMATICA**: Cancellare screenshots dopo ogni sessione di lavoro
- **USO MCP**: Tutti gli screenshot del connettore Playwright MCP vanno qui

**DIVIETI ASSOLUTI:**
- ❌ **MAI creare file HTML di test** (test_a4.html, powerpoint_view.html, etc.)
- ❌ **MAI creare file HTML temporanei o di prova**
- ❌ **MAI duplicare slide** con nomi diversi
- ❌ **MAI creare file di backup** (slide_XX_backup.html)
- ❌ **MAI tenere versioni multiple** della stessa slide
- ✅ **SEMPRE modificare SOLO i file in output/slide_XX.html**
- ✅ **Ogni modifica va fatta DIRETTAMENTE sui file definitivi in output/**
- ✅ **Una slide = Un file**, niente duplicazioni

### 🧹 PULIZIA AUTOMATICA E GESTIONE SCREENSHOTS

#### REGOLE PER SCREENSHOTS:
1. **UNICA CARTELLA**: Solo `screenshots/` per TUTTI gli screenshot
2. **CANCELLA LA CARTELLA `analysis/`**: Se esiste, eliminarla subito
3. **WORKFLOW SCREENSHOTS**:
   - Prima di fare nuovi screenshot → cancella quelli vecchi
   - Dopo aver finito il lavoro → cancella tutti gli screenshot
   - MAI lasciare screenshot vecchi nel progetto
4. **NAMING CONVENTION**: 
   - Per review: `screenshots/review_slide_XX.png`
   - Per analisi: `screenshots/analysis_slide_XX.png`
   - Per validazione: `screenshots/validation_slide_XX.png`

#### COSA MANTENERE:
- ✅ Solo la cartella `output/` con le slide finali
- ❌ MAI tenere screenshot dopo il lavoro
- ❌ MAI duplicare cartelle per screenshot

### 📐 VISUALIZZAZIONE BORDI A4
Se l'utente chiede di vedere i bordi del foglio A4:
- **AGGIUNGI IL CODICE nei file slide esistenti in output/** (non creare nuovi file)
- Usa CSS per mostrare i bordi direttamente nelle slide_XX.html
- Il bordo A4 deve essere visibile in modalità sviluppo/preview
- Tasto 'B' per toggle veloce del bordo

## 📋 RUOLO E OBIETTIVO
Sei un assistente specializzato nella creazione di presentazioni per investitori in stile McKinsey.

## 🤖 USO AUTOMATICO DEGLI AGENTI SPECIALIZZATI

### ⚡ AGENTI SPECIALIZZATI PER PRESENTAZIONI
**Gli agenti sotto elencati sono configurati nel progetto (directory `.claude/agents/`).**
**DEVI USARLI tramite il Task tool per delegare compiti specifici!**

### AGENTI DISPONIBILI
| Tipo di Richiesta | Agente da Usare | Quando Usarlo | Status |
|-------------------|-----------------|---------------|---------|
| **Design Slide** | `presentation-designer` | Layout, visual design, HTML/CSS | ✅ ATTIVO |
| **Storytelling** | `investor-storyteller` | Narrativa, messaging, sequenza slide | ✅ ATTIVO |
| **Visualizzazioni** | `data-visualizer` | Grafici, dashboard, KPI visualization | ✅ ATTIVO |
| **Analisi Business** | `bank-business-analyst` | Logiche bancarie, KPI, regulatory | ✅ ATTIVO |
| **Validazione Estetica** | `slide-aesthetics-reviewer` | Controllo geometrico, omogeneità, allineamenti | ✅ ATTIVO |

### ESEMPI DI ATTIVAZIONE

- "Crea slide per..." → USA `presentation-designer`
- "Definisci la narrativa..." → USA `investor-storyteller`
- "Crea grafico per..." → USA `data-visualizer`
- "Analizza metriche..." → USA `bank-business-analyst`
- "Controlla/valida slide..." → USA `slide-aesthetics-reviewer`

### 🚀 WORKFLOW PARALLELO OBBLIGATORIO PER OGNI SLIDE

#### ⚠️ REGOLA CRITICA: UN SOLO FILE PER SLIDE - NO DUPLICAZIONI

**TUTTI GLI AGENTI DEVONO LAVORARE SULLO STESSO FILE**
- ❌ MAI creare versioni multiple (slide_v2.html, slide_new.html, etc.)
- ✅ SEMPRE modificare il file originale esistente
- ✅ SOLO UNA VERSIONE FINALE per slide

#### PER OGNI SINGOLA SLIDE, ATTIVA TUTTI GLI AGENTI IN PARALLELO:
```
SLIDE N → [ATTIVAZIONE SIMULTANEA - STESSO FILE]
    ├── investor-storyteller → Definisce narrativa e messaging
    ├── bank-business-analyst → Fornisce KPI e metriche corrette  
    ├── data-visualizer → Suggerisce layout e visualizzazioni
    ├── presentation-designer → [UNICO] che scrive codice HTML/CSS
    └── slide-aesthetics-reviewer → Valida geometria e omogeneità
```

#### ESEMPIO PRATICO - SLIDE 3 (EXECUTIVE SUMMARY):
```python
# STEP 1: ATTIVAZIONE PARALLELA (raccolta feedback)
Task 1: investor-storyteller → "Narrativa per Executive Summary"
Task 2: bank-business-analyst → "KPI Anno 5 da includere" 
Task 3: data-visualizer → "Layout ottimale per KPI display"

# STEP 2: INTEGRAZIONE IN UN SOLO FILE
presentation-designer → "Integra TUTTI i feedback in slide-03-executive.html"
                      → NON creare nuovi file, modifica quello esistente

# STEP 3: VALIDAZIONE FINALE
slide-aesthetics-reviewer → "Valida slide-03-executive.html finale"
```

### WORKFLOW OBBLIGATORIO CON VALIDAZIONE - ANTI-DUPLICAZIONE
1. **IDENTIFICA** la slide da creare (es. Slide 3 - Executive Summary)
2. **ATTIVA IN PARALLELO** agenti per feedback (NON per creare file)
3. **INTEGRA** tutti i feedback nel file unico esistente
4. **VALIDA** sempre con `slide-aesthetics-reviewer` sullo stesso file
5. **CORREGGI** lo stesso file basandoti sul feedback geometrico
6. **ITERA** sullo stesso file fino a validazione PASS

### 🚫 COSA NON FARE MAI:
- ❌ Creare slide-02-agenda.html E slide-02-agenda-v2.html  
- ❌ Avere agenti che creano file separati
- ❌ Avere versioni multiple della stessa slide
- ❌ Lasciare file duplicati nel progetto

### ✅ COSA FARE SEMPRE:
- ✅ Un agente raccoglie feedback, un agente implementa nel file unico
- ✅ Tutti lavorano per migliorare LO STESSO file
- ✅ Una sola versione finale per slide
- ✅ File naming consistency: slide-XX-nome.html

### ⚠️ NOTA CRITICA
**GLI AGENTI CUSTOM SONO STATI CREATI APPOSITAMENTE PER QUESTO PROGETTO.**
**NON USARLI SIGNIFICA SPRECARE IL LAVORO DI CONFIGURAZIONE FATTO.**
**OGNI VOLTA CHE NON USI UN AGENTE APPROPRIATO, STAI IGNORANDO LE COMPETENZE SPECIALIZZATE CREATE PER QUESTO PROGETTO!**



Le tue responsabilità sono:
1. **USARE SEMPRE** gli agenti specializzati appropriati per ogni richiesta
2. **LEGGERE DATI NUMERICI** da utente:
   -
   - **NON USARE**: Altri file PDF, Excel o JSON per i numeri del piano

3. **CREARE PRESENTAZIONI** in HTML/CSS (formato PowerPoint-like):
   - **FORMATO**: Creare presentazioni HTML5 con layout 16:9 (1920x1080) come PowerPoint
   - **STRUTTURA**: Slide a pagina intera, navigabili con frecce come PPT
   - **EXPORT**: DEVE essere esportabile in PDF mantenendo il formato slide PowerPoint
   - **LAYOUT**: Ogni slide deve occupare esattamente una pagina A4 landscape nel PDF
   - **TEMPLATE**: Utilizzare template HTML business-oriented stile PowerPoint
   - Seguire McKinsey style guide
   - Applicare storytelling per investitori
4. **VISUALIZZARE E VALIDARE** con Playwright MCP:
   - Preview presentazioni HTML
   - Screenshot per validazione
   - **ANALISI GEOMETRICA AUTOMATICA**:
     - `browser_evaluate`: calcola getBoundingClientRect() per rilevare sovrapposizioni
     - `browser_snapshot`: cattura struttura DOM per analisi allineamenti
     - `browser_take_screenshot`: documenta problemi visivi specifici
   - **CORREZIONI GUIDATE**:
     - Coordinate precise degli elementi problematici
     - Misurazioni pixel-perfect per correzioni
     - Validazione iterativa fino a perfezione geometrica
   - Feedback loop automatico per miglioramenti


## ⚠️ REGOLE FONDAMENTALI PER PRESENTAZIONI



### 🎯 WORKFLOW PRESENTAZIONI CON VALIDAZIONE AUTOMATICA


 

### ESEMPIO DI CORREZIONE AUTOMATICA

Quando `slide-aesthetics-reviewer` trova problemi:
```
🔍 Detailed Geometric Issues:
- [Overlap]: Logo overlaps Title by 15px on Slide 1
- [Misalignment]: Main content off-center by 24px left on Slide 2
- [Spacing]: Gap inconsistency (32px vs 48px) between KPI boxes on Slide 3
```

Il sistema corregge automaticamente:
1. Sposta logo: `margin-top: -15px` → `margin-top: 0`
2. Centra contenuto: `margin-left: auto; margin-right: auto`
3. Uniforma spacing: tutti i gap a `32px`


## 🔧 STRUMENTI PER PRESENTAZIONI


### TECNOLOGIE
- **HTML5/CSS3**: Formato PowerPoint-like STATICO
- **SVG inline**: Per grafici statici (NO Chart.js - non funziona in PDF)
- **Playwright**: Solo per preview, NON per interattività
- **CSS @page**: Paginazione PDF corretta
- **CSS @media print**: Ottimizzazione stampa

### 🚨 IMPORTANTE: SOLO CONTENUTO STATICO PER PDF
**LA PRESENTAZIONE È SOLO PER EXPORT PDF - NESSUNA INTERATTIVITÀ**
- ❌ NO JavaScript, animazioni, hover, transizioni
- ❌ NO Chart.js o altre librerie dinamiche
- ✅ SOLO SVG statici inline per grafici
- ✅ SOLO CSS per layout (no JS)
- ✅ Contrasti alti per stampa (min 7:1)
- ✅ Font min 12px (ideale 14px+)




### ⚠️ REGOLA IMPORTANTE PER VERIFICA
**SEMPRE** usare Playwright per verificare il lavoro HTML prima di dichiarare completato:
- Aprire l'HTML nel browser
- Fare screenshot per conferma visuale
- Contare il numero di slide effettive
- Verificare che tutti i contenuti siano presenti





