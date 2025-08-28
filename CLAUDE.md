# **MANUALE OPERATIVO E DI STILE: INVESTOR PRESENTATION**
*Versione Integrata 2.0*

## 🎯 1. OBIETTIVO E FILOSOFIA

L'obiettivo è creare presentazioni per investitori in stile McKinsey. Ogni slide deve essere autonoma, chiara e contribuire a una narrativa "outcome-driven". Il processo è governato da agenti specializzati e da un rigoroso sistema di design per garantire la massima qualità e coerenza. L'output finale è una serie di file HTML statici, pronti per l'esportazione in un PDF impeccabile.

---

## ⚙️ 2. WORKFLOW OPERATIVO (IL "COME")

### A. Uso Obbligatorio degli Agenti Specializzati
Per ogni task, verranno attivati i seguenti agenti. L'uso è obbligatorio per garantire la separazione delle competenze.

| Agente | Ruolo |
| :--- | :--- |
| `investor-storyteller` | Definisce la narrativa, il messaggio e la sequenza logica. |
| `bank-business-analyst` | Fornisce e valida i KPI, le metriche e le logiche di business. |
| `data-visualizer` | **Raccomanda** il layout e il tipo di grafico (SVG) più efficace per i dati. |
| `presentation-designer` | **(Unico autorizzato a scrivere codice)** **Implementa** gli input in HTML/CSS/SVG. |
| `slide-aesthetics-reviewer`| Valida la geometria, l'aderenza alla griglia e allo stile. |

### B. Workflow Parallelo per Ogni Slide
1.  **Analisi Parallela**: Per ogni slide, gli agenti `storyteller`, `analyst` e `visualizer` forniscono i loro input e requisiti in parallelo.
2.  **Implementazione Centralizzata**: L'agente `presentation-designer` raccoglie **tutti** gli input e li implementa modificando **l'unico file HTML esistente** per quella slide.
3.  **Validazione Rigorosa**: L'agente `slide-aesthetics-reviewer` esegue un controllo di qualità geometrico e stilistico sullo stesso file.
4.  **Correzione Iterativa**: Eventuali correzioni vengono applicate direttamente sul file originale, senza mai creare duplicati.

### C. Input Dati
I dati numerici e i contenuti testuali vengono forniti dall'utente tramite copia-incolla direttamente nel prompt, in formati pronti per essere elaborati.

---

## 📂 3. GESTIONE FILE E STRUTTURA (REGOLA CRITICA)

### A. Struttura Progetto
piano industriale excel/
├── output/                    # ✅ CARTELLA ESCLUSIVA PER L'OUTPUT
│   ├── slide_00.html          # File master con navigazione
│   ├── slide_01.html          # Slide 1
│   └── ...
├── screenshots/               # ✅ UNICA cartella per screenshot (temporanei)
└── CLAUDE.md                  # Questo file di istruzioni


### B. Divieti Assoluti (Tolleranza Zero)
-   ❌ **MAI** creare file di backup (`slide_XX_backup.html`).
-   ❌ **MAI** creare versioni multiple (`slide_XX_v2.html`).
-   ❌ **MAI** creare file HTML di test o temporanei.
-   ✅ **SEMPRE E SOLO** modificare i file definitivi presenti nella cartella `output/`.
-   ✅ **UNA SLIDE = UN FILE**.

---

## 🎨 4. MANUALE DI STILE MCKINSEY (IL "COSA")

Questa è l'unica fonte di verità per tutti gli aspetti di design, layout e branding.

### A. Struttura Standard Obbligatoria della Slide
Ogni slide **deve** seguire questa gerarchia visiva.

┌─────────────────────────────────────────────────────────────┐
│  Breadcrumb (grigio, 14px, in alto)                        │
├─────────────────────────────────────────────────────────────┤
│  ACTION TITLE (28px, bold)                                 │
│  ─────────────────────────────────────────────────          │ ← SEMPRE BLU #0051a5
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    CONTENUTO PRINCIPALE                     │
│               (su griglia 12 colonne, space 8px)            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                    Slide #  │ (in basso a destra)
└─────────────────────────────────────────────────────────────┘


### B. Titoli "Outcome-Driven"
I titoli non descrivono il contenuto, ma comunicano il messaggio chiave.
* **Formula**: "Cosa + E quindi? + E ora?"
* **No**: "Proiezioni Finanziarie"
* **Sì**: "Il break-even viene raggiunto al terzo anno grazie alla leva operativa"

### C. Sistema di Design
* **Palette Colori**: Verrà usata la palette definita nelle variabili CSS del progetto.
    ```css
    :root {
        --mckinsey-blue: #003A70;
        --secondary-blue: #0051a5; /* Per la linea del titolo */
        --charcoal: #1a1a1a;
        --slate: #4a5568;
        --border: #e2e8f0;
        --success-green: #059669;
        --danger-red: #DC2626;
        /* ... e tutte le altre definite nella guida. */
    }
    ```
* **Tipografia**: Il font primario è `Source Sans Pro`. Le dimensioni seguono una scala gerarchica definita dalle classi CSS del progetto (`.text-title`, `.text-headline`, `.text-body`, etc.).
* **Griglia e Spaziatura**: Il layout si basa su una griglia a **12 colonne**. Ogni spaziatura (margini, padding) deve essere un multiplo di **8px**, usando le variabili CSS `--space-` del progetto.

### D. Componenti Predefiniti
Verranno utilizzati i componenti standardizzati (es. `kpi-card`, `insight-box`) per garantire massima coerenza visiva e velocità di esecuzione.

---

## 🛠️ 5. SPECIFICHE TECNICHE E DI OUTPUT

### A. Stack Tecnologico
* **Linguaggi**: Esclusivamente HTML5 e CSS3.
* **Grafici**: Implementati come **SVG statici inline**.
* **Validazione**: Tramite il connettore Playwright.

### B. Vincolo Critico: NO JAVASCRIPT
* L'output finale deve essere **totalmente statico** per garantire una perfetta esportazione in PDF.
* **Nessuna animazione, transizione, script o libreria JS è ammessa.**
* Gli esempi di codice JS nella guida di stile sono da considerarsi **solo come riferimento visuale** per lo stile dei grafici, che verranno poi creati in SVG statico.

### C. Esportazione PDF
Il CSS include regole `@media print` per assicurare che ogni slide corrisponda esattamente a una pagina A4 in formato orizzontale.

---

## ✅ 6. VALIDAZIONE E QUALITÀ

Ogni slide, prima di essere considerata completa, deve superare due livelli di controllo:
1.  **Controllo Visuale (Playwright)**: Screenshot per una verifica umana dell'aspetto generale.
2.  **Controllo Geometrico (Agente `slide-aesthetics-reviewer`)**: Validazione automatica dell'aderenza alla griglia, alla scala tipografica, alla palette colori e alle regole di spaziatura definite nel manuale di stile.
