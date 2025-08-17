# Script Python unificato per Matrici Erogazioni - Tutti i prodotti
# Da usare con formula =PY() in Excel
# Esempio uso in Excel: =PY("matrici_erogazioni.calcola_cella_erogazione(1, ROW(), COLUMN())")

def calcola_cella_erogazione(prodotto_num, row_excel, col_excel):
    """
    Calcola il valore di una singola cella nella matrice erogazioni
    
    Parametri:
    - prodotto_num: numero del prodotto (1-20)
    - row_excel: numero riga Excel (dalla formula ROW())
    - col_excel: numero colonna Excel (dalla formula COLUMN())
    
    Restituisce il valore dell'erogazione per quella cella
    """
    import xlwings as xw
    
    # Connessione al workbook
    wb = xw.Book.caller()
    ws_input = wb.sheets['Input']
    
    # Calcola trimestre assoluto dalla posizione nella matrice
    # Le matrici iniziano alla riga 9 di Excel
    row_matrice = row_excel - 8  # Riga relativa nella matrice (1-based)
    
    # Determina la colonna base per il prodotto
    # Prodotto 1: colonne B-AM (2-39)
    # Prodotto 2: colonne AR-CC (44-81)
    # Pattern: ogni prodotto occupa 40 colonne + 3 di separazione
    col_base_prodotto = 2 + (prodotto_num - 1) * 43
    col_relativa = col_excel - col_base_prodotto + 1
    
    # Verifica se siamo sulla diagonale
    if row_matrice != col_relativa or row_matrice < 1 or row_matrice > 40:
        return 0
    
    # Calcola anno e trimestre dal trimestre assoluto
    trimestre_assoluto = row_matrice
    anno = ((trimestre_assoluto - 1) // 4) + 1
    trimestre = ((trimestre_assoluto - 1) % 4) + 1
    
    # Leggi i parametri dal foglio Input
    # Erogazioni annuali (riga 55, colonne D-M per anni 1-10)
    col_anno = 3 + anno  # D=4, E=5, etc.
    erogazione_anno = ws_input.range((55, col_anno)).value or 0
    
    # Allocazione trimestrale (riga 58, colonne D-G per Q1-Q4)
    col_trim = 3 + trimestre  # D=4, E=5, F=6, G=7
    allocazione_trim = ws_input.range((58, col_trim)).value or 0.25
    
    # Mix prodotto (riga 66, colonna dipende dal prodotto)
    col_mix = 3 + prodotto_num  # D=4 per P1, E=5 per P2, etc.
    mix_prodotto = ws_input.range((66, col_mix)).value or 0
    
    # Calcola erogazione
    erogazione = erogazione_anno * allocazione_trim * mix_prodotto
    
    return erogazione


def genera_matrice_completa(prodotto_num):
    """
    Genera l'intera matrice 40x40 per un prodotto specifico
    
    Parametri:
    - prodotto_num: numero del prodotto (1-20)
    
    Restituisce matrice 40x40 con erogazioni sulla diagonale
    """
    import xlwings as xw
    import numpy as np
    
    wb = xw.Book.caller()
    ws_input = wb.sheets['Input']
    
    # Inizializza matrice
    matrice = np.zeros((40, 40))
    
    # Leggi tutti i parametri una volta
    erogazioni_anni = []
    for anno in range(1, 11):  # 10 anni
        col = 3 + anno  # D=4, E=5, etc.
        val = ws_input.range((55, col)).value
        erogazioni_anni.append(val if val else 0)
    
    # Allocazioni trimestrali
    allocazioni = []
    for trim in range(1, 5):  # 4 trimestri
        col = 3 + trim
        val = ws_input.range((58, col)).value
        allocazioni.append(val if val else 0.25)
    
    # Mix prodotto specifico
    col_mix = 3 + prodotto_num
    mix_prodotto = ws_input.range((66, col_mix)).value or 0
    
    # Popola la diagonale
    for anno in range(1, 11):
        if anno > len(erogazioni_anni):
            break
            
        for trimestre in range(1, 5):
            pos_diagonale = (anno - 1) * 4 + trimestre - 1
            
            if pos_diagonale < 40:
                erogazione = (erogazioni_anni[anno - 1] * 
                            allocazioni[trimestre - 1] * 
                            mix_prodotto)
                matrice[pos_diagonale, pos_diagonale] = erogazione
    
    return matrice


def popola_range_prodotto(prodotto_num, start_row=9, start_col='B'):
    """
    Popola un range Excel con la matrice di un prodotto
    
    Parametri:
    - prodotto_num: numero del prodotto (1-20)
    - start_row: riga iniziale (default 9)
    - start_col: colonna iniziale come lettera (default 'B')
    
    Scrive direttamente la matrice nel foglio Calcoli
    """
    import xlwings as xw
    
    wb = xw.Book.caller()
    ws_calcoli = wb.sheets['Calcoli']
    
    # Genera la matrice
    matrice = genera_matrice_completa(prodotto_num)
    
    # Scrivi la matrice nel range appropriato
    # Converte la lettera colonna in numero
    col_num = ord(start_col.upper()) - ord('A') + 1
    
    # Determina il range di destinazione
    end_row = start_row + 39
    end_col_letter = chr(ord(start_col) + 39)
    
    range_str = f'{start_col}{start_row}:{end_col_letter}{end_row}'
    ws_calcoli.range(range_str).value = matrice
    
    return f"Matrice prodotto {prodotto_num} popolata in {range_str}"


# Funzioni helper per formule Excel più semplici
def erogazione_p1(row, col):
    """Calcola erogazione Prodotto 1 per cella specifica"""
    return calcola_cella_erogazione(1, row, col)


def erogazione_p2(row, col):
    """Calcola erogazione Prodotto 2 per cella specifica"""
    return calcola_cella_erogazione(2, row, col)


def test_parametri():
    """Funzione di test per verificare la lettura dei parametri"""
    import xlwings as xw
    
    wb = xw.Book.caller()
    ws_input = wb.sheets['Input']
    
    risultati = []
    risultati.append("PARAMETRI LETTI DAL FOGLIO INPUT:")
    risultati.append("-" * 40)
    
    # Erogazioni annuali
    risultati.append("Erogazioni annuali (riga 55):")
    for anno in range(1, 6):
        col = 3 + anno
        val = ws_input.range((55, col)).value
        risultati.append(f"  Anno {anno}: {val}")
    
    # Allocazioni trimestrali
    risultati.append("\nAllocazioni trimestrali (riga 58):")
    for trim in range(1, 5):
        col = 3 + trim
        val = ws_input.range((58, col)).value
        risultati.append(f"  Q{trim}: {val}")
    
    # Mix prodotti
    risultati.append("\nMix prodotti (riga 66):")
    for prod in range(1, 4):
        col = 3 + prod
        val = ws_input.range((66, col)).value
        risultati.append(f"  Prodotto {prod}: {val}")
    
    return "\n".join(risultati)