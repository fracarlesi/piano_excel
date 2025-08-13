#!/bin/bash

# Script per sincronizzare immediatamente quando il file Excel viene modificato

echo "Monitoraggio del file Excel per modifiche..."
echo "Premi Ctrl+C per fermare"

# Funzione per eseguire sync
sync_changes() {
    if [[ -n $(git status --porcelain) ]]; then
        echo "$(date '+%H:%M:%S') - Sincronizzazione in corso..."
        git add -A
        git commit -m "Auto-sync: $(date '+%d/%m/%Y %H:%M:%S')"
        git push origin main
        echo "$(date '+%H:%M:%S') - Sincronizzazione completata!"
    fi
}

# Se fswatch è installato, usa quello per monitoraggio in tempo reale
if command -v fswatch &> /dev/null; then
    fswatch -o modello_bancario_completo.xlsx | while read f; do
        sync_changes
    done
else
    # Altrimenti usa un loop con controllo periodico
    echo "fswatch non trovato, uso controllo periodico ogni 30 secondi..."
    while true; do
        sync_changes
        sleep 30
    done
fi