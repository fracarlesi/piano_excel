# Guida Layout e Design Presentazioni - Stile McKinsey

## 📐 SPECIFICHE TECNICHE FORMATO

### ⚠️ REGOLA FONDAMENTALE DI OMOGENEITÀ
**TUTTE LE SLIDE DEVONO SEGUIRE LO STESSO LAYOUT STANDARD**

### Struttura Standard Obbligatoria per Ogni Slide
```
┌─────────────────────────────────────────────────────────────┐
│  Breadcrumb (grigio, 14px)                                 │
├─────────────────────────────────────────────────────────────┤
│  ACTION TITLE (28px, bold)                                 │
│  ─────────────────────────────────────────────────          │ ← SEMPRE BLU #0051a5
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    CONTENUTO PRINCIPALE                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                    Slide #  │
└─────────────────────────────────────────────────────────────┘
```

## 🏗️ ARCHITETTURA SLIDE MCKINSEY

### CSS Standard Obbligatorio

```css
/* BREADCRUMB - Sempre presente in alto */
.breadcrumb {
    font-size: 14px;
    color: var(--medium-grey);  /* #666666 */
    margin-bottom: 20px;
}

/* ACTION TITLE - Sempre con bordo BLU */
.action-title {
    font-size: 28px;
    font-weight: 600;
    line-height: 1.3;
    color: #1a1a1a;
    padding-bottom: 20px;
    border-bottom: 2px solid var(--secondary-blue);  /* SEMPRE #0051a5 */
    margin-bottom: 40px;
    letter-spacing: -0.02em;
}

/* SLIDE NUMBER - Sempre in basso a destra */
.slide-number {
    position: absolute;
    bottom: 30px;
    right: 30px;
    font-size: 14px;
    color: var(--medium-grey);
}
```

### ❌ ERRORI DA EVITARE
- **MAI** usare colori diversi dal blu (#0051a5) per il bordo sotto il titolo
- **MAI** omettere il breadcrumb nelle slide di dettaglio
- **MAI** posizionare il numero slide in posti diversi
- **MAI** usare font size diversi da quelli specificati
- **MAI** aggiungere loghi o elementi decorativi non necessari

### Dimensioni Master (16:9)
```css
.slide-container {
    width: 1920px;
    height: 1080px;
    background: #ffffff;
    position: relative;
    font-family: 'SourceSansPro', Arial, sans-serif;
}

.slide-header {
    height: 80px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 60px;
    border-bottom: 1px solid #e6e6e6;
}

.slide-title-zone {
    height: 120px;
    padding: 40px 60px 20px 60px;
    display: flex;
    align-items: center;
}

.slide-content {
    height: 560px;
    padding: 40px 60px;
}

.slide-footer {
    height: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 60px;
    font-size: 11px;
    color: #666666;
    border-top: 1px solid #e6e6e6;
}
```

---

## 🎯 OUTCOME-DRIVEN TITLES

### Formula dei Titoli McKinsey
**"WHAT + SO WHAT + NOW WHAT"**

#### ❌ Titoli Descrittivi (Da Evitare)
- "Analisi del mercato bancario"
- "Overview delle divisioni"
- "Proiezioni finanziarie"

#### ✅ Titoli Outcome-Driven (McKinsey Style)
- "Organizations can break even on cloud programs through eventual run-rate savings"
- "The specialized divisions generate 15.8% ROE through focused market positioning"
- "AI-native infrastructure delivers 67% cost reduction versus traditional banking operations"

### Regole per Titoli Potenti
```css
.outcome-title {
    font-family: 'SourceSansPro', Arial, sans-serif;
    font-size: 32px;                    /* Più grande per impatto */
    font-weight: 600;                   /* Semi-bold professionale */
    line-height: 1.25;                  /* Compatto per leggibilità */
    color: #1a1a1a;                     /* Nero profondo */
    letter-spacing: -0.01em;            /* Kerning ottimizzato */
    max-width: 80%;                     /* Non occupare tutta la larghezza */
}

/* Varianti per lunghezza */
.outcome-title.long {
    font-size: 28px;                    /* Per titoli più lunghi */
    line-height: 1.3;
}

.outcome-title.extra-long {
    font-size: 24px;                    /* Per titoli molto lunghi */
    line-height: 1.4;
}
```

### Template Titoli per Settori
- **Financial Performance**: "[Metric] achieves [target] through [key driver]"
- **Market Analysis**: "[Segment] represents [opportunity size] driven by [trend]"
- **Strategy**: "[Action] enables [outcome] by [mechanism]"
- **Operations**: "[Process] reduces [cost/time] while improving [quality metric]"

---

## 🎨 SISTEMA CROMATICO MCKINSEY

### Palette Master
```css
:root {
    /* McKinsey Brand Colors */
    --mckinsey-blue: #003A70;           /* Logo e accent primario */
    --mckinsey-teal: #0076A8;           /* Dati positivi */
    --mckinsey-navy: #1E3A5F;           /* Testo titoli */
    
    /* Neutral Palette */
    --charcoal: #1a1a1a;               /* Testo primario */
    --slate: #4a5568;                   /* Testo secondario */
    --light-slate: #64748b;            /* Testo ausiliario */
    --border: #e2e8f0;                 /* Bordi sottili */
    --background: #f8fafc;             /* Sfondi box */
    --pure-white: #ffffff;             /* Background slide */
    
    /* Data Visualization Colors */
    --data-primary: #0076A8;           /* Serie principale */
    --data-secondary: #00A76F;         /* Serie secondaria */
    --data-tertiary: #7B68EE;          /* Serie terziaria */
    --data-quaternary: #FF6B6B;        /* Evidenziazione/Warning */
    --data-neutral: #94A3B8;           /* Dati baseline/neutri */
    
    /* Semantic Colors */
    --success-green: #059669;          /* Performance positive */
    --warning-amber: #D97706;          /* Attenzione */
    --danger-red: #DC2626;             /* Performance negative */
    --insight-purple: #7C3AED;         /* Insights chiave */
}
```

### Codifica Semantica Avanzata
```css
/* Gradazioni per intensity mapping */
.data-intensity-1 { background: #E0F2FE; }  /* Lowest intensity */
.data-intensity-2 { background: #BAE6FD; }
.data-intensity-3 { background: #7DD3FC; }
.data-intensity-4 { background: #38BDF8; }
.data-intensity-5 { background: #0284C7; }  /* Highest intensity */

/* Stati di performance */
.performance-excellent { color: #059669; font-weight: 600; }
.performance-good { color: #00A76F; font-weight: 500; }
.performance-neutral { color: #64748b; font-weight: 400; }
.performance-poor { color: #F59E0B; font-weight: 500; }
.performance-critical { color: #DC2626; font-weight: 600; }
```

---

## 📐 TIPOGRAFIA MCKINSEY PROFESSIONAL

### Font Stack Gerarchico
```css
/* Primary Font - SourceSansPro (McKinsey standard) */
@import url('https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;600;700&display=swap');

.font-primary {
    font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
}

/* Secondary Font - Inter (per elementi moderni/digitali) */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.font-secondary {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Monospace - per codici, dati tecnici */
.font-mono {
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
}
```

### Scale Tipografica Professionale
```css
/* Display - Per numeri molto grandi, KPI hero */
.text-display {
    font-size: 72px;
    font-weight: 700;
    line-height: 0.9;
    letter-spacing: -0.025em;
}

/* Title - Titoli slide outcome-driven */
.text-title {
    font-size: 32px;
    font-weight: 600;
    line-height: 1.25;
    letter-spacing: -0.01em;
}

/* Headline - Sottotitoli, sezioni */
.text-headline {
    font-size: 24px;
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: -0.005em;
}

/* Subheadline - Etichette importanti */
.text-subheadline {
    font-size: 18px;
    font-weight: 500;
    line-height: 1.4;
}

/* Body Large - Testo principale */
.text-body-large {
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
}

/* Body - Testo standard */
.text-body {
    font-size: 14px;
    font-weight: 400;
    line-height: 1.6;
}

/* Caption - Fonti, note, labels */
.text-caption {
    font-size: 12px;
    font-weight: 400;
    line-height: 1.4;
    color: var(--light-slate);
}

/* Label - Etichette piccole, uppercase */
.text-label {
    font-size: 11px;
    font-weight: 500;
    line-height: 1.3;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--slate);
}
```

---

## 📊 COMPONENTI VISUALI AVANZATI

### KPI Card McKinsey Style
```css
.kpi-card {
    background: var(--pure-white);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 32px 24px;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    transition: all 0.2s ease;
}

.kpi-value {
    font-size: 48px;
    font-weight: 700;
    color: var(--mckinsey-blue);
    line-height: 1;
    margin-bottom: 8px;
}

.kpi-label {
    font-size: 14px;
    color: var(--slate);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 4px;
}

.kpi-change {
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
}

.kpi-change.positive { color: var(--success-green); }
.kpi-change.negative { color: var(--danger-red); }
.kpi-change.neutral { color: var(--light-slate); }
```

### Insight Box per Key Messages
```css
.insight-box {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border-left: 4px solid var(--mckinsey-blue);
    border-radius: 6px;
    padding: 24px 28px;
    margin: 24px 0;
    position: relative;
}

.insight-box::before {
    content: "💡";
    font-size: 20px;
    position: absolute;
    top: 20px;
    left: -12px;
    background: var(--pure-white);
    border: 2px solid var(--mckinsey-blue);
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.insight-text {
    font-size: 16px;
    font-weight: 500;
    color: var(--charcoal);
    line-height: 1.5;
}
```

### Progress Indicator Sofisticato
```css
.progress-ring {
    position: relative;
    width: 120px;
    height: 120px;
}

.progress-ring circle {
    fill: none;
    stroke-width: 8;
    stroke-linecap: round;
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
}

.progress-ring .track {
    stroke: var(--border);
}

.progress-ring .progress {
    stroke: var(--mckinsey-blue);
    stroke-dasharray: 283;
    stroke-dashoffset: calc(283 - (283 * var(--progress)) / 100);
    transition: stroke-dashoffset 0.5s ease-in-out;
}

.progress-value {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 24px;
    font-weight: 700;
    color: var(--charcoal);
}
```

---

## 📈 VISUALIZZAZIONI DATI MCKINSEY

### Chart.js Configurazione Professionale
```javascript
// Configurazione base per tutti i grafici McKinsey
const mckinseyChartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false  // McKinsey preferisce legende personalizzate
        },
        tooltip: {
            backgroundColor: '#1a1a1a',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false,
            titleFont: { size: 14, weight: '600' },
            bodyFont: { size: 13, weight: '400' }
        }
    },
    scales: {
        x: {
            grid: {
                display: false  // Griglia pulita
            },
            ticks: {
                font: { size: 12, weight: '500' },
                color: '#64748b'
            }
        },
        y: {
            grid: {
                color: '#f1f5f9',
                lineWidth: 1
            },
            ticks: {
                font: { size: 12, weight: '500' },
                color: '#64748b'
            }
        }
    }
};

// Bar Chart Orizzontale McKinsey Style
const horizontalBarConfig = {
    type: 'bar',
    data: {
        labels: ['Real Estate', 'Turnaround', 'Public Guarantee', 'Digital', 'Wealth', 'Tech'],
        datasets: [{
            data: [635, 817, 502, 180, 120, 75],
            backgroundColor: [
                '#0076A8', '#00A76F', '#7B68EE', 
                '#FF6B6B', '#FFC107', '#9C27B0'
            ],
            borderRadius: 4,
            borderWidth: 0
        }]
    },
    options: {
        ...mckinseyChartDefaults,
        indexAxis: 'y',
        plugins: {
            ...mckinseyChartDefaults.plugins,
            datalabels: {
                anchor: 'end',
                align: 'right',
                color: '#1a1a1a',
                font: { size: 13, weight: '600' },
                formatter: (value) => `€${value}M`
            }
        }
    }
};

// Line Chart con Area Fill
const trendLineConfig = {
    type: 'line',
    data: {
        labels: ['2025', '2026', '2027', '2028', '2029'],
        datasets: [{
            label: 'Net Income',
            data: [-16, 8, 24, 33, 42.6],
            borderColor: '#0076A8',
            backgroundColor: 'rgba(0, 118, 168, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#0076A8',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 3,
            pointRadius: 6
        }]
    },
    options: {
        ...mckinseyChartDefaults,
        plugins: {
            ...mckinseyChartDefaults.plugins,
            datalabels: {
                backgroundColor: '#0076A8',
                borderColor: '#ffffff',
                borderRadius: 4,
                borderWidth: 2,
                color: '#ffffff',
                font: { size: 11, weight: '600' },
                padding: 6,
                formatter: (value) => `€${value}M`
            }
        }
    }
};
```

### Waterfall Chart per P&L
```javascript
// Waterfall Chart Implementation
class WaterfallChart {
    constructor(canvas, data) {
        this.canvas = canvas;
        this.data = data;
        this.init();
    }
    
    init() {
        const ctx = this.canvas.getContext('2d');
        
        // Calcola posizioni cumulative
        let cumulative = 0;
        const positions = this.data.map((item, index) => {
            const start = cumulative;
            cumulative += item.value;
            return {
                label: item.label,
                value: item.value,
                start: start,
                end: cumulative,
                isPositive: item.value >= 0,
                isTotal: item.isTotal || false
            };
        });
        
        this.drawWaterfall(ctx, positions);
    }
    
    drawWaterfall(ctx, positions) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const margin = { top: 40, right: 60, bottom: 60, left: 60 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
        
        // Calcola scale
        const maxValue = Math.max(...positions.map(p => Math.max(p.start, p.end)));
        const minValue = Math.min(...positions.map(p => Math.min(p.start, p.end)));
        const valueRange = maxValue - minValue;
        
        // Disegna barre
        positions.forEach((pos, index) => {
            const x = margin.left + (index * chartWidth / positions.length);
            const barWidth = chartWidth / positions.length * 0.6;
            
            const startY = margin.top + chartHeight - ((pos.start - minValue) / valueRange * chartHeight);
            const endY = margin.top + chartHeight - ((pos.end - minValue) / valueRange * chartHeight);
            const barHeight = Math.abs(endY - startY);
            
            // Colore basato su tipo
            let color = '#94A3B8'; // neutro
            if (pos.isTotal) color = '#0076A8'; // totale
            else if (pos.isPositive) color = '#059669'; // positivo
            else color = '#DC2626'; // negativo
            
            // Disegna barra
            ctx.fillStyle = color;
            ctx.fillRect(x, Math.min(startY, endY), barWidth, barHeight);
            
            // Connettori tra barre (linee tratteggiate)
            if (index < positions.length - 1) {
                ctx.strokeStyle = '#CBD5E1';
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(x + barWidth, endY);
                ctx.lineTo(x + chartWidth / positions.length, endY);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            
            // Etichette valori
            ctx.fillStyle = '#1a1a1a';
            ctx.font = '12px Source Sans Pro, Arial';
            ctx.textAlign = 'center';
            const labelY = Math.min(startY, endY) - 8;
            ctx.fillText(`€${pos.value}M`, x + barWidth / 2, labelY);
            
            // Etichette nomi
            ctx.save();
            ctx.translate(x + barWidth / 2, height - margin.bottom + 20);
            ctx.rotate(-Math.PI / 4);
            ctx.textAlign = 'right';
            ctx.fillText(pos.label, 0, 0);
            ctx.restore();
        });
    }
}
```

---

## 🏗️ LAYOUT PATTERNS AVANZATI

### Pattern A: Executive Summary (Hero Layout)
```css
.hero-layout {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    grid-gap: 60px;
    height: 100%;
}

.hero-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.hero-statement {
    font-size: 28px;
    font-weight: 600;
    color: var(--charcoal);
    line-height: 1.3;
    margin-bottom: 32px;
}

.hero-bullets {
    list-style: none;
    padding: 0;
}

.hero-bullets li {
    padding: 12px 0;
    padding-left: 28px;
    position: relative;
    font-size: 16px;
    line-height: 1.5;
    color: var(--slate);
}

.hero-bullets li::before {
    content: "→";
    position: absolute;
    left: 0;
    color: var(--mckinsey-blue);
    font-weight: 600;
    font-size: 18px;
}

.hero-metrics {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: 24px;
}
```

### Pattern B: Data Storytelling (Chart + Insight)
```css
.data-story-layout {
    display: grid;
    grid-template-columns: 1fr 400px;
    grid-gap: 48px;
    height: 100%;
}

.chart-container {
    position: relative;
    background: var(--pure-white);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 32px;
}

.insight-panel {
    background: var(--background);
    border-radius: 8px;
    padding: 32px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.key-insight {
    font-size: 20px;
    font-weight: 600;
    color: var(--mckinsey-blue);
    margin-bottom: 24px;
    line-height: 1.4;
}

.supporting-facts {
    list-style: none;
    padding: 0;
}

.supporting-facts li {
    padding: 8px 0;
    font-size: 14px;
    color: var(--slate);
    padding-left: 20px;
    position: relative;
}

.supporting-facts li::before {
    content: "•";
    position: absolute;
    left: 0;
    color: var(--mckinsey-teal);
    font-weight: 600;
}
```

### Pattern C: Process Flow (5-Step)
```css
.process-flow {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    height: 400px;
    position: relative;
}

.process-step {
    flex: 1;
    text-align: center;
    position: relative;
    max-width: 200px;
}

.step-number {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--mckinsey-blue);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 700;
    margin: 0 auto 16px auto;
}

.step-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--charcoal);
    margin-bottom: 12px;
    line-height: 1.3;
}

.step-description {
    font-size: 13px;
    color: var(--slate);
    line-height: 1.4;
}

/* Connettori tra step */
.process-step:not(:last-child)::after {
    content: "";
    position: absolute;
    top: 24px;
    right: -50%;
    width: 100%;
    height: 2px;
    background: var(--border);
    z-index: -1;
}

.process-step:not(:last-child)::before {
    content: "→";
    position: absolute;
    top: 16px;
    right: -25%;
    color: var(--mckinsey-blue);
    font-size: 20px;
    font-weight: 600;
    z-index: 1;
}
```

---

## 🎯 BRANDING MCKINSEY

### Header con Logo e Navigazione
```css
.slide-header {
    height: 80px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 60px;
    border-bottom: 1px solid var(--border);
}

.logo-container {
    display: flex;
    align-items: center;
    gap: 12px;
}

.logo {
    width: 120px;
    height: auto;
}

.company-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--charcoal);
}

.slide-navigation {
    display: flex;
    align-items: center;
    gap: 24px;
    font-size: 14px;
    color: var(--slate);
}

.slide-counter {
    font-weight: 500;
}

.breadcrumb {
    color: var(--light-slate);
}
```

### Footer McKinsey Professionale
```css
.mckinsey-footer {
    height: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 60px;
    border-top: 1px solid var(--border);
    background: #fafbfc;
}

.source-info {
    font-size: 11px;
    color: var(--light-slate);
}

.mckinsey-brand {
    font-size: 11px;
    font-weight: 500;
    color: var(--slate);
}

.action-buttons {
    display: flex;
    gap: 16px;
}

.action-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: var(--pure-white);
    border: 1px solid var(--border);
    border-radius: 4px;
    font-size: 11px;
    color: var(--slate);
    text-decoration: none;
    transition: all 0.2s ease;
}

.action-button:hover {
    background: var(--background);
    border-color: var(--mckinsey-blue);
    color: var(--mckinsey-blue);
}

.action-icon {
    width: 12px;
    height: 12px;
}
```

---

## 📐 GRIGLIA MCKINSEY E ALLINEAMENTO

### Sistema Grid Professionale
```css
.mckinsey-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-gap: 24px;
    height: 100%;
    padding: 0;
}

/* Colonne comuni */
.col-1 { grid-column: span 1; }
.col-2 { grid-column: span 2; }
.col-3 { grid-column: span 3; }
.col-4 { grid-column: span 4; }
.col-5 { grid-column: span 5; }
.col-6 { grid-column: span 6; }
.col-7 { grid-column: span 7; }
.col-8 { grid-column: span 8; }
.col-9 { grid-column: span 9; }
.col-10 { grid-column: span 10; }
.col-11 { grid-column: span 11; }
.col-12 { grid-column: span 12; }

/* Layout patterns comuni */
.two-column { grid-template-columns: 1fr 1fr; }
.golden-ratio { grid-template-columns: 1.618fr 1fr; }
.sidebar-main { grid-template-columns: 300px 1fr; }
.main-sidebar { grid-template-columns: 1fr 300px; }
```

### Spacing System (8px Base)
```css
:root {
    /* Spacing scale basata su 8px */
    --space-1: 4px;      /* 0.5 * 8px */
    --space-2: 8px;      /* 1 * 8px */
    --space-3: 12px;     /* 1.5 * 8px */
    --space-4: 16px;     /* 2 * 8px */
    --space-5: 20px;     /* 2.5 * 8px */
    --space-6: 24px;     /* 3 * 8px */
    --space-8: 32px;     /* 4 * 8px */
    --space-10: 40px;    /* 5 * 8px */
    --space-12: 48px;    /* 6 * 8px */
    --space-16: 64px;    /* 8 * 8px */
    --space-20: 80px;    /* 10 * 8px */
    --space-24: 96px;    /* 12 * 8px */
}

/* Utility classes per spacing */
.m-0 { margin: 0; }
.p-0 { padding: 0; }

.mt-1 { margin-top: var(--space-1); }
.mt-2 { margin-top: var(--space-2); }
.mt-3 { margin-top: var(--space-3); }
.mt-4 { margin-top: var(--space-4); }
.mt-6 { margin-top: var(--space-6); }
.mt-8 { margin-top: var(--space-8); }
.mt-10 { margin-top: var(--space-10); }
.mt-12 { margin-top: var(--space-12); }

/* Ripeti per mb, ml, mr, pt, pb, pl, pr */
```

### Allineamento Perfetto
```css
/* Container per allineamento perfetto */
.perfect-align {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
}

.center-content {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}

.baseline-align {
    display: flex;
    align-items: baseline;
}

.top-align {
    display: flex;
    align-items: flex-start;
}

.bottom-align {
    display: flex;
    align-items: flex-end;
}
```

---

## 🖨️ ESPORTAZIONE PDF PROFESSIONALE

### CSS Print Ottimizzato
```css
@media print {
    @page {
        size: A4 landscape;
        margin: 0;
        color-adjust: exact;
        -webkit-print-color-adjust: exact;
    }
    
    * {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
    }
    
    .slide {
        width: 100%;
        height: 100vh;
        page-break-after: always;
        page-break-inside: avoid;
        background: white !important;
    }
    
    /* Nascondi elementi interattivi */
    .no-print,
    .action-button,
    .hover-effect {
        display: none !important;
    }
    
    /* Ottimizza grafici per stampa */
    .chart-container {
        background: white !important;
        border: 1px solid #ccc !important;
    }
    
    /* Forza visualizzazione colori critici */
    .mckinsey-blue,
    .data-primary,
    .kpi-value {
        color: #003A70 !important;
    }
    
    /* Rimuovi ombre per risparmio inchiostro */
    * {
        box-shadow: none !important;
        text-shadow: none !important;
    }
    
    /* Ottimizza bordi */
    .border {
        border: 1px solid #ccc !important;
    }
}
```

### Script per Export Automatico
```javascript
// Funzione per export PDF ottimizzato
function exportToPDF() {
    // Rimuovi elementi interattivi
    document.querySelectorAll('.no-print, .hover-effect').forEach(el => {
        el.style.display = 'none';
    });
    
    // Ottimizza per stampa
    document.body.classList.add('print-mode');
    
    // Trigger print dialog
    window.print();
    
    // Ripristina dopo stampa
    setTimeout(() => {
        document.querySelectorAll('.no-print, .hover-effect').forEach(el => {
            el.style.display = '';
        });
        document.body.classList.remove('print-mode');
    }, 1000);
}

// Auto-sizing per contenuti dinamici
function autoScaleContent() {
    const slides = document.querySelectorAll('.slide');
    slides.forEach(slide => {
        const content = slide.querySelector('.slide-content');
        const availableHeight = slide.clientHeight - 200; // Header + footer
        const contentHeight = content.scrollHeight;
        
        if (contentHeight > availableHeight) {
            const scale = availableHeight / contentHeight;
            content.style.transform = `scale(${scale})`;
            content.style.transformOrigin = 'top left';
        }
    });
}

// Esegui auto-scaling al caricamento
document.addEventListener('DOMContentLoaded', autoScaleContent);
window.addEventListener('resize', autoScaleContent);
```

---

## ✅ QUALITY ASSURANCE MCKINSEY

### Checklist Pre-Delivery
```javascript
// Automated Quality Check
function runQualityCheck() {
    const issues = [];
    
    // Check 1: Outcome-driven titles
    document.querySelectorAll('.outcome-title').forEach((title, index) => {
        const text = title.textContent.trim();
        if (text.length < 10 || text.length > 120) {
            issues.push(`Slide ${index + 1}: Title length issue (${text.length} chars)`);
        }
        
        if (!text.includes(' ')) {
            issues.push(`Slide ${index + 1}: Title should be a complete sentence`);
        }
        
        if (text.toLowerCase().includes('overview') || 
            text.toLowerCase().includes('analysis')) {
            issues.push(`Slide ${index + 1}: Avoid generic titles`);
        }
    });
    
    // Check 2: Color contrast
    document.querySelectorAll('[style*="color"]').forEach(el => {
        // Implement contrast ratio check
    });
    
    // Check 3: Font consistency
    const fontFamilies = new Set();
    document.querySelectorAll('*').forEach(el => {
        const style = getComputedStyle(el);
        if (style.fontFamily) {
            fontFamilies.add(style.fontFamily);
        }
    });
    
    if (fontFamilies.size > 3) {
        issues.push('Too many font families used');
    }
    
    // Check 4: Data sources
    document.querySelectorAll('.chart-container').forEach((chart, index) => {
        const source = chart.querySelector('.source-info');
        if (!source) {
            issues.push(`Chart ${index + 1}: Missing data source`);
        }
    });
    
    return issues;
}

// Validation Rules
const validationRules = {
    titleLength: { min: 10, max: 120 },
    maxBulletPoints: 7,
    minFontSize: 11,
    maxColorsPerChart: 7,
    requiredElements: ['.outcome-title', '.slide-content', '.mckinsey-footer']
};

// Performance Audit
function auditPerformance() {
    return {
        slideCount: document.querySelectorAll('.slide').length,
        imageCount: document.querySelectorAll('img').length,
        chartCount: document.querySelectorAll('.chart-container').length,
        totalElements: document.querySelectorAll('*').length,
        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart
    };
}
```

### Manual Checklist
```markdown
## Pre-Delivery Checklist ✅

### Content Quality
- [ ] Ogni slide ha un outcome-driven title specifico
- [ ] Titoli leggibili come storia completa (flow orizzontale)
- [ ] Ogni grafico supporta inequivocabilmente il titolo (flow verticale)
- [ ] Fonte dati presente su ogni visualizzazione
- [ ] Numeri consistenti tra slide
- [ ] Acronimi spiegati alla prima occorrenza

### Design Quality
- [ ] Font consistency: max 2 font families
- [ ] Color usage: semantico e consistente
- [ ] Allineamento: tutto su griglia invisibile
- [ ] Spacing: multipli di 8px
- [ ] Contrast ratio: min 4.5:1 per accessibilità
- [ ] Charts: max 7 colori, etichette leggibili

### Technical Quality
- [ ] PDF export: 1 slide = 1 pagina A4 landscape
- [ ] Print test: tutto leggibile in B/N
- [ ] File size: <10MB per distribuzione
- [ ] Cross-browser: Chrome, Safari, Firefox
- [ ] Performance: load <3 secondi

### McKinsey Standards
- [ ] Logo positioning: top-left
- [ ] Footer: "McKinsey & Company" + action buttons
- [ ] Slide numbers: consistent positioning
- [ ] Corporate colors: palette approved
- [ ] Professional tone: business appropriate
```

---

## 🚫 ANTI-PATTERNS DA EVITARE

### Design Anti-Patterns
```css
/* ❌ MAI USARE */
.forbidden-styles {
    /* Animazioni eccessive */
    animation: bounce 2s infinite; /* NO */
    
    /* Troppi font */
    font-family: "Comic Sans", cursive; /* NO */
    
    /* Colori non-brand */
    color: #ff00ff; /* NO */
    background: linear-gradient(45deg, red, blue, green); /* NO */
    
    /* Effetti 3D */
    transform: rotateX(45deg) rotateY(45deg); /* NO */
    
    /* Ombre eccessive */
    box-shadow: 0 0 50px 20px rgba(255,0,255,0.8); /* NO */
    
    /* Text-shadow */
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5); /* NO */
}
```

### Content Anti-Patterns
- ❌ "Analysis of the market" → ✅ "Market grows 23% driven by digital adoption"
- ❌ "Financial projections" → ✅ "Break-even achieved by Year 3 through operational leverage"
- ❌ "Our solution overview" → ✅ "AI-native platform reduces costs 67% vs traditional banking"
- ❌ Bullet points > 7 per slide
- ❌ Font size < 11px
- ❌ Charts senza fonte dati
- ❌ Jargon non spiegato

### Technical Anti-Patterns
- ❌ Responsive design per presentazioni
- ❌ Hover effects che non funzionano in PDF
- ❌ Animazioni CSS che rallentano export
- ❌ Background images che non stampano
- ❌ Element positioning assoluto fragile
- ❌ JavaScript dependencies pesanti

---

*McKinsey Professional Presentation Design Guide v3.0*  
*Ultimo aggiornamento: 27 Agosto 2025*  
*Ottimizzato per: Presentazioni Investitori Bancari*  

---

## 📚 TEMPLATE DI RIFERIMENTO

### Slide Template Base
```html
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Investor Presentation</title>
    <link href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;600;700&display=swap" rel="stylesheet">
    <link href="styles/mckinsey-presentation.css" rel="stylesheet">
</head>
<body>
    <div class="slide" id="slide-1">
        <header class="slide-header">
            <div class="logo-container">
                <img src="assets/logo.svg" alt="Logo" class="logo">
                <span class="company-name"></span>
            </div>
            <div class="slide-navigation">
                <span class="breadcrumb">Executive Summary</span>
                <span class="slide-counter">1 / 23</span>
            </div>
        </header>
        
        <div class="slide-title-zone">
            <h1 class="outcome-title">
                The specialized divisions generate 15.8% ROE through focused market positioning
            </h1>
        </div>
        
        <main class="slide-content">
            <div class="hero-layout">
                <div class="hero-content">
                    <p class="hero-statement">
                        Un modello bancario AI-nativo che serve mercati ad alto potenziale 
                        con efficienza operativa superiore e ritorno garantito per investitori.
                    </p>
                    
                    <ul class="hero-bullets">
                        <li>6 divisioni sinergiche con focus su Real Estate e PMI specialistiche</li>
                        <li>Piattaforma tecnologica BaaS per monetizzazione aggiuntiva</li>
                        <li>Break-even operativo raggiunto entro Anno 3</li>
                        <li>MOIC 2.66x per investitori con exit a 10 anni</li>
                    </ul>
                </div>
                
                <div class="hero-metrics">
                    <div class="kpi-card">
                        <div class="kpi-label">Total Loans Y5</div>
                        <div class="kpi-value">€1,953.5M</div>
                        <div class="kpi-change positive">+2,847% vs Y1</div>
                    </div>
                    
                    <div class="kpi-card">
                        <div class="kpi-label">ROE Target</div>
                        <div class="kpi-value">15.8%</div>
                        <div class="kpi-change positive">Top quartile</div>
                    </div>
                    
                    <div class="kpi-card">
                        <div class="kpi-label">Cost/Income</div>
                        <div class="kpi-value">32.4%</div>
                        <div class="kpi-change positive">Best in class</div>
                    </div>
                    
                    <div class="kpi-card">
                        <div class="kpi-label">CET1 Ratio</div>
                        <div class="kpi-value">16.37%</div>
                        <div class="kip-change neutral">Well capitalized</div>
                    </div>
                </div>
            </div>
        </main>
        
        <footer class="mckinsey-footer">
            <div class="source-info">
                Source: Financial Model 2025-2029
            </div>
            <div class="mckinsey-brand">
                McKinsey & Company
            </div>
            <div class="action-buttons">
                <a href="#" class="action-button">
                    <span class="action-icon">📁</span>
                    Download
                </a>
                <a href="#" class="action-button">
                    <span class="action-icon">✏️</span>
                    Edit
                </a>
            </div>
        </footer>
    </div>
</body>
</html>
```

Questa guida rappresenta gli standard professionali McKinsey per la creazione di presentazioni di livello consulting, ottimizzate per investitori bancari con focus su outcome-driven storytelling e visual excellence.