# Allineamento Logica Default Trimestrale - Report

## Riepilogo Modifiche

Ho allineato la logica di calcolo dei default per applicare il danger rate **esclusivamente** sullo stock di crediti performanti in essere all'inizio di ogni trimestre, escludendo le nuove erogazioni del trimestre stesso.

### Modifiche Implementate:

1. **Nuovo modulo `defaultCalculatorAligned.js`**:
   - Calcola il portafoglio totale all'inizio del trimestre (prima delle erogazioni)
   - Applica il default rate trimestrale (10% annuo / 4 = 2.5%) sul totale
   - Distribuisce i default proporzionalmente tra i vintage attivi

2. **Aggiornato `creditCalculatorQuarterly.js`**:
   - Salva lo stato dei vintage PRIMA di ogni trimestre
   - Usa la nuova logica allineata per i default
   - Processa le erogazioni DOPO il calcolo dei default

3. **Integrazione in `creditCalculator.js`**:
   - Ora esporta la versione con logica trimestrale allineata

### Risultati Verificati:

**Scenario Test (Anno 1)**:
- Erogazioni: €100M (€25M per trimestre)
- Danger Rate: 10% annuale (2.5% trimestrale)

**Calcolo Trimestre per Trimestre**:
- Q1: Stock inizio €0M → Default €0M → Stock fine €25M
- Q2: Stock inizio €25M → Default €0.625M → Stock fine €49.375M  
- Q3: Stock inizio €49.375M → Default €1.234M → Stock fine €73.141M
- Q4: Stock inizio €73.141M → Default €1.829M → Stock fine €96.312M

**Risultati Finali**:
- ✅ Performing Assets: €96.31M (corretto)
- ✅ Non-Performing Assets (NBV): €3.16M (corretto)
- ✅ Total LLP: €-0.53M (corretto)
- ✅ Total Defaults: €3.69M (corretto)

### Logica Implementata:

```javascript
// Per ogni trimestre:
1. Salva stato vintage prima del trimestre
2. Calcola totale portafoglio inizio trimestre
3. Applica default rate: totale × 2.5%
4. Distribuisci default tra vintage proporzionalmente
5. Processa nuove erogazioni
```

Questo approccio è più in linea con la natura del rischio creditizio, che si manifesta sul portafoglio esistente piuttosto che istantaneamente sulle nuove erogazioni.

### Versione Aggiornata:
- v10.62: Logica default allineata alle vostre specifiche

Il modello ora riflette esattamente la vostra visione del rischio creditizio.