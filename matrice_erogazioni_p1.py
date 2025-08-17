# Script Python per Matrice Erogazioni - Prodotto 1
# Da usare con formula =PY() in Excel

def calcola_erogazione_p1(anno, trimestre, row_num, col_num):
    """
    Calcola l'erogazione per il Prodotto 1 nella matrice diagonale
    
    Parametri:
    - anno: numero dell'anno (1-10)
    - trimestre: numero del trimestre nell'anno (1-4)
    - row_num: riga corrente nella matrice
    - col_num: colonna corrente nella matrice
    
    La logica della matrice diagonale:
    - Le erogazioni appaiono in diagonale
    - Ogni trimestre ha la sua erogazione sulla diagonale
    - Formula: Erogazione_Anno * Allocazione_Trimestrale * Mix_Prodotto
    """
    
    # Import delle celle dal foglio Input
    # Questi valori dovranno essere passati dalla formula Excel
    import xlwings as xw
    
    # Connessione al workbook attivo
    wb = xw.Book.caller()
    ws_input = wb.sheets['Input']
    
    # Lettura parametri dal foglio Input
    # Nuove erogazioni per anno (celle D55, E55, F55, etc.)
    if anno == 1:
        erogazione_anno = ws_input.range('D55').value  # Anno 1
    elif anno == 2:
        erogazione_anno = ws_input.range('E55').value  # Anno 2
    elif anno == 3:
        erogazione_anno = ws_input.range('F55').value  # Anno 3
    elif anno == 4:
        erogazione_anno = ws_input.range('G55').value  # Anno 4
    elif anno == 5:
        erogazione_anno = ws_input.range('H55').value  # Anno 5
    else:
        erogazione_anno = 0
    
    # Allocazione trimestrale (celle D58, E58, F58, G58)
    if trimestre == 1:
        allocazione_trim = ws_input.range('D58').value  # Q1
    elif trimestre == 2:
        allocazione_trim = ws_input.range('E58').value  # Q2
    elif trimestre == 3:
        allocazione_trim = ws_input.range('F58').value  # Q3
    elif trimestre == 4:
        allocazione_trim = ws_input.range('G58').value  # Q4
    else:
        allocazione_trim = 0
    
    # Mix prodotto 1 (cella D66)
    mix_prodotto = ws_input.range('D66').value
    
    # Calcolo erogazione solo se siamo sulla diagonale corretta
    # La diagonale si verifica quando row_num - 8 == col_num - 2
    # dove 8 è la prima riga dati e 2 è la prima colonna dati (B)
    
    # Calcolo del trimestre assoluto
    trimestre_assoluto = (anno - 1) * 4 + trimestre
    
    # Verifica se siamo sulla diagonale
    if row_num == trimestre_assoluto + 8 and col_num == trimestre_assoluto + 1:
        if erogazione_anno and allocazione_trim and mix_prodotto:
            return erogazione_anno * allocazione_trim * mix_prodotto
    
    return 0


def matrice_erogazioni_prodotto1():
    """
    Genera l'intera matrice erogazioni per il Prodotto 1
    Restituisce una matrice 40x40 con le erogazioni in diagonale
    """
    import xlwings as xw
    import numpy as np
    
    # Connessione al workbook
    wb = xw.Book.caller()
    ws_input = wb.sheets['Input']
    
    # Inizializza matrice vuota
    matrice = np.zeros((40, 40))
    
    # Leggi parametri una volta sola
    erogazioni_anni = []
    for col in ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M']:
        val = ws_input.range(f'{col}55').value
        erogazioni_anni.append(val if val else 0)
    
    # Allocazioni trimestrali
    allocazioni = [
        ws_input.range('D58').value or 0.25,
        ws_input.range('E58').value or 0.25,
        ws_input.range('F58').value or 0.25,
        ws_input.range('G58').value or 0.25
    ]
    
    # Mix prodotto
    mix_prodotto = ws_input.range('D66').value or 0
    
    # Popola la diagonale
    for anno in range(1, 11):  # 10 anni
        for trimestre in range(1, 5):  # 4 trimestri
            trimestre_assoluto = (anno - 1) * 4 + trimestre - 1
            
            if trimestre_assoluto < 40 and anno <= len(erogazioni_anni):
                erogazione = erogazioni_anni[anno - 1] * allocazioni[trimestre - 1] * mix_prodotto
                matrice[trimestre_assoluto, trimestre_assoluto] = erogazione
    
    return matrice