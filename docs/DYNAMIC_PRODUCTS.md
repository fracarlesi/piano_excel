# Sistema di Gestione Prodotti Dinamici

## Panoramica

Il sistema è ora progettato per gestire prodotti con nomi completamente dinamici, senza necessità di mappature hardcoded nel codice.

## Come Funziona

### 1. Creazione Prodotti
Quando crei un nuovo prodotto nell'interfaccia:
- Puoi scegliere qualsiasi nome
- Il sistema genera automaticamente una chiave unica basata su divisione + nome
- Esempio: divisione "re" + nome "Mutuo Verde" → chiave "reMutuoVerde"

### 2. Calcolo Interessi
Il `DynamicProductInterestCalculator` cerca la configurazione del prodotto in 2 modi:

1. **Ricerca Diretta**: Cerca il prodotto nei dati del balance sheet
2. **Ricerca in Assumptions**: Cerca nelle assumptions per chiave esatta

**IMPORTANTE**: Se non trova la configurazione, il prodotto avrà ZERO interessi. Non c'è fallback automatico.

### 3. Divisioni
Il sistema determina automaticamente la divisione dal prefisso del prodotto:
- `re*` → Real Estate
- `sme*` → SME
- `digital*` → Digital Banking
- `wealth*` → Wealth Management
- etc.

## Vantaggi

1. **Scalabilità Infinita**: Puoi creare quanti prodotti vuoi con qualsiasi nome
2. **Nessun Aggiornamento Codice**: Non devi modificare il codice per nuovi prodotti
3. **Controllo Esplicito**: Ogni prodotto deve avere la sua configurazione, nessun valore implicito

## Esempio Pratico

```javascript
// Prodotto creato dall'utente
{
  nome: "Prestito Ecologico PMI",
  divisione: "sme",
  spread: 4.5,
  durata: 20
}

// Chiave generata automaticamente
"smePrestito EcologicoPMI" → "smePrestitoEcologicoPMI"

// Il sistema:
1. Trova i Net Performing Assets per "smePrestitoEcologicoPMI"
2. Cerca la configurazione (spread 4.5%)
3. Calcola: interesse = NPA × (euribor + 4.5%) / 4
4. Aggrega nella divisione SME
```

## Best Practices

1. **Naming Convention**: Usa nomi descrittivi e chiari
2. **Divisione Corretta**: Assicurati di selezionare la divisione giusta
3. **Parametri Completi**: Inserisci tutti i parametri del prodotto (spread, durata, etc.)

## Troubleshooting

Se un prodotto non calcola correttamente gli interessi:
1. Verifica che abbia volumi > 0
2. Controlla che lo spread sia definito
3. Verifica nei log della console quale configurazione sta usando