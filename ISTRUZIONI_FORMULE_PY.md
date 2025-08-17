# 📘 ISTRUZIONI PER USARE LE FORMULE PYTHON IN EXCEL

## 🚀 SETUP INIZIALE

1. **Assicurati di avere Python in Excel attivato**
   - Vai su Formule → Python → Attiva Python in Excel
   - Potrebbe essere necessario Microsoft 365 con licenza appropriata

2. **File Python creati:**
   - `matrici_erogazioni.py` - Script principale unificato (CONSIGLIATO)
   - `matrice_erogazioni_p1.py` - Script specifico Prodotto 1
   - `matrice_erogazioni_p2.py` - Script specifico Prodotto 2

## 📝 FORMULE DA INSERIRE IN EXCEL

### OPZIONE 1: Formula per singola cella (CONSIGLIATA)

Per popolare le matrici cella per cella con calcolo dinamico:

**Per Prodotto 1 (Matrice a sinistra - colonne B-AM):**
Nella cella B9 inserisci:
```
=PY("matrici_erogazioni.erogazione_p1(ROW();COLUMN())")
```
Poi copia questa formula nel range B9:AM48

**Per Prodotto 2 (Matrice a destra - colonne AR-CC):**
Nella cella AR9 inserisci:
```
=PY("matrici_erogazioni.erogazione_p2(ROW();COLUMN())")
```
Poi copia questa formula nel range AR9:CC48

### OPZIONE 2: Formula generale per qualsiasi prodotto

Per il prodotto N (dove N va da 1 a 20), nella prima cella della matrice:
```
=PY("matrici_erogazioni.calcola_cella_erogazione(N;ROW();COLUMN())")
```
Sostituisci N con il numero del prodotto desiderato.

### OPZIONE 3: Popolare l'intera matrice in un colpo solo

Per popolare tutta la matrice del Prodotto 1:
```
=PY("matrici_erogazioni.genera_matrice_completa(1)")
```
Seleziona il range B9:AM48 prima di inserire la formula, poi premi CTRL+SHIFT+INVIO

## 🔧 FUNZIONI DI TEST E DEBUG

### Test lettura parametri
In una cella qualsiasi puoi inserire:
```
=PY("matrici_erogazioni.test_parametri()")
```
Questo mostrerà tutti i parametri letti dal foglio Input

### Calcolo singola cella specifica
Per testare il calcolo di una cella specifica (es. riga 10, colonna 3):
```
=PY("matrici_erogazioni.calcola_cella_erogazione(1;10;3)")
```

## 📊 STRUTTURA DELLE MATRICI

Le matrici sono organizzate come segue nel foglio Calcoli:
- **Righe 9-48**: Dati delle matrici (40 righe per 40 trimestri)
- **Prodotto 1**: Colonne B-AM (colonne 2-39)
- **Prodotto 2**: Colonne AR-CC (colonne 44-81)
- **Prodotti futuri**: Ogni prodotto occupa 40 colonne + 3 di separazione

### Pattern colonne per prodotti:
- Prodotto 1: inizia colonna 2 (B)
- Prodotto 2: inizia colonna 44 (AR)
- Prodotto 3: inizia colonna 87
- Prodotto N: inizia colonna 2 + (N-1) × 43

## ⚙️ PARAMETRI UTILIZZATI DAL FOGLIO INPUT

Gli script leggono automaticamente questi parametri:

1. **Erogazioni annuali** (riga 55, colonne D-M)
   - Anno 1: cella D55
   - Anno 2: cella E55
   - Anno 3: cella F55
   - etc.

2. **Allocazione trimestrale** (riga 58, colonne D-G)
   - Q1: cella D58 (default 0.25)
   - Q2: cella E58 (default 0.25)
   - Q3: cella F58 (default 0.25)
   - Q4: cella G58 (default 0.25)

3. **Mix prodotti** (riga 66, colonne D-W per prodotti 1-20)
   - Prodotto 1: cella D66
   - Prodotto 2: cella E66
   - Prodotto 3: cella F66
   - etc.

## 🎯 LOGICA DI CALCOLO

La formula per ogni cella sulla diagonale è:
```
Erogazione = Erogazione_Anno × Allocazione_Trimestrale × Mix_Prodotto
```

- Le erogazioni appaiono solo sulla diagonale principale
- Ogni trimestre ha la sua erogazione nel trimestre corrispondente
- Celle fuori dalla diagonale = 0

## 🐛 TROUBLESHOOTING

### Errore "ModuleNotFoundError"
- Assicurati che xlwings sia installato: `pip install xlwings`
- Verifica che Python in Excel sia attivato

### Valori tutti zero
- Controlla che i parametri nel foglio Input siano compilati
- Verifica in particolare le celle D55-M55, D58-G58, D66-W66

### Formula non si aggiorna
- Premi F9 per ricalcolare il foglio
- Vai su Formule → Calcola ora

### Performance lenta
- Usa l'OPZIONE 1 (formule singole celle) invece di matrici complete
- Limita il numero di prodotti attivi

## 📞 SUPPORTO

Per problemi o domande, verifica:
1. Che il file `matrici_erogazioni.py` sia nella stessa cartella del file Excel
2. Che i parametri nel foglio Input siano corretti
3. Che Python in Excel sia correttamente configurato