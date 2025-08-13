#!/bin/bash

# Script per auto-push su GitHub quando ci sono modifiche

while true; do
    # Controlla se ci sono modifiche
    if [[ -n $(git status --porcelain) ]]; then
        echo "Modifiche rilevate, eseguo commit e push..."
        
        # Aggiungi tutte le modifiche
        git add -A
        
        # Crea commit con timestamp
        git commit -m "Auto-sync: $(date '+%d/%m/%Y %H:%M')"
        
        # Push su GitHub
        git push origin main
        
        echo "Push completato!"
    fi
    
    # Attendi 5 minuti prima del prossimo controllo
    sleep 300
done