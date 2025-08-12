#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
STEP 2: Script per aggiungere il foglio Modello TRIMESTRALE con tutte le tabelle di calcolo
al file modello_bancario_completo.xlsx esistente.
Supporta 20 trimestri (Q1-Q20) invece di 5 anni.
"""

from openpyxl import load_workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def add_model_sheet():
    """Aggiunge il foglio Modello trimestrale al file Excel esistente con tutte le tabelle"""
    
    # Carica il workbook esistente
    filename = 'modello_bancario_completo.xlsx'
    print(f"📂 Caricamento file esistente: {filename}")
    wb = load_workbook(filename)
    
    # Crea il foglio Modello
    if 'Modello' in wb.sheetnames:
        wb.remove(wb['Modello'])
    ws = wb.create_sheet('Modello')
    print("📊 Creazione foglio 'Modello' trimestrale...")
    
    # Imposta larghezza colonne per 20 trimestri
    ws.column_dimensions['A'].width = 2
    ws.column_dimensions['B'].width = 45
    # Colonne C-V per i 20 trimestri (Q1-Q20)
    for col_idx in range(3, 23):  # C to V (20 colonne)
        ws.column_dimensions[get_column_letter(col_idx)].width = 12
    ws.column_dimensions['W'].width = 5  # Spazio
    ws.column_dimensions['X'].width = 50  # Descrizione
    
    # Stili
    header_fill = PatternFill(start_color="002060", end_color="002060", fill_type="solid")
    subheader_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    section_fill = PatternFill(start_color="D9E2F3", end_color="D9E2F3", fill_type="solid")
    thin_border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    
    # Stili per distinzione INPUT/FORMULA
    formula_fill = PatternFill(start_color="F5F5F5", end_color="F5F5F5", fill_type="solid")  # Grigio chiaro per FORMULA
    formula_font = Font(name='Calibri', size=11, color="000000")  # Nero per testo FORMULA
    formula_border = Border(
        left=Side(style='dashed'),
        right=Side(style='dashed'),
        top=Side(style='dashed'),
        bottom=Side(style='dashed')
    )
    
    # Funzione helper per applicare formattazione FORMULA
    def format_formula_cell(cell, number_format=None):
        """Applica la formattazione delle celle con FORMULA"""
        cell.fill = formula_fill
        cell.font = formula_font
        cell.border = formula_border
        cell.alignment = Alignment(horizontal='center')
        if number_format:
            cell.number_format = number_format
    
    # Funzione per creare headers trimestrali
    def create_quarterly_headers(row):
        """Crea headers per i 20 trimestri (Q1-Q20)"""
        # Header "Prodotto/Voce"
        cell = ws.cell(row=row, column=2, value="Prodotto")
        cell.font = Font(bold=True)
        cell.fill = section_fill
        cell.border = thin_border
        
        # Headers Q1-Q20
        for i in range(20):
            col_idx = 3 + i
            quarter = i + 1
            year = (i // 4) + 1
            quarter_in_year = (i % 4) + 1
            header_text = f"Q{quarter}\n(Y{year}Q{quarter_in_year})"
            
            cell = ws.cell(row=row, column=col_idx, value=header_text)
            cell.font = Font(name='Calibri', size=10, bold=True)
            cell.fill = section_fill
            cell.border = thin_border
            cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        
        # Header "Descrizione"
        cell = ws.cell(row=row, column=24, value="Descrizione")  # Colonna X
        cell.font = Font(bold=True)
        cell.fill = section_fill
        cell.border = thin_border
    
    current_row = 2
    
    # ===== SEZIONE 1: CALCOLI DI APPOGGIO =====
    print("  📈 Creazione sezione: Calcoli di Appoggio...")
    
    # Titolo principale
    ws.cell(row=current_row, column=2, value="2. CALCOLI DI APPOGGIO - MOTORE DI CALCOLO TRIMESTRALE")
    ws.merge_cells(f'B{current_row}:X{current_row}')
    ws.cell(row=current_row, column=2).font = Font(size=14, bold=True, color="FFFFFF")
    ws.cell(row=current_row, column=2).fill = header_fill
    ws.cell(row=current_row, column=2).alignment = Alignment(horizontal='center')
    current_row += 2
    
    # 1.1 Tabella Erogazioni per Prodotto
    ws.cell(row=current_row, column=2, value="1.1 EROGAZIONI PER PRODOTTO (€ mln)")
    ws.cell(row=current_row, column=2).font = Font(size=12, bold=True)
    ws.cell(row=current_row, column=2).fill = subheader_fill
    ws.cell(row=current_row, column=2).font = Font(color="FFFFFF", bold=True)
    current_row += 1
    
    # Headers trimestrali
    create_quarterly_headers(current_row)
    current_row += 1
    
    # Prodotti Real Estate
    re_products = ["CBL", "MLA", "MLAM", "MLPA", "MLPAM", "NRE"]
    for product in re_products:
        ws.cell(row=current_row, column=2, value=f"RE - {product}").border = thin_border
        for col in range(3, 23):  # C to V (Q1-Q20)
            cell = ws.cell(row=current_row, column=col)
            format_formula_cell(cell, '#,##0.0')
        current_row += 1
    
    # Prodotti SME
    sme_products = ["BL", "REFI", "SS", "NF", "RES"]
    for product in sme_products:
        ws.cell(row=current_row, column=2, value=f"SME - {product}").border = thin_border
        for col in range(3, 23):  # C to V (Q1-Q20)
            cell = ws.cell(row=current_row, column=col)
            format_formula_cell(cell, '#,##0.0')
        current_row += 1
    
    # Prodotti Public Guarantee
    pg_products = ["ACFP", "FGA", "FGPA"]
    for product in pg_products:
        ws.cell(row=current_row, column=2, value=f"PG - {product}").border = thin_border
        for col in range(3, 23):  # C to V (Q1-Q20)
            cell = ws.cell(row=current_row, column=col)
            format_formula_cell(cell, '#,##0.0')
        current_row += 1
    
    current_row += 2
    
    # 1.2 Stock Crediti per Prodotto
    ws.cell(row=current_row, column=2, value="1.2 STOCK CREDITI PER PRODOTTO (€ mln)")
    ws.cell(row=current_row, column=2).font = Font(size=12, bold=True)
    ws.cell(row=current_row, column=2).fill = subheader_fill
    ws.cell(row=current_row, column=2).font = Font(color="FFFFFF", bold=True)
    current_row += 1
    
    # Headers
    create_quarterly_headers(current_row)
    current_row += 1
    
    # Ripeti prodotti per stock
    all_products = re_products + sme_products + pg_products
    for product in re_products:
        ws.cell(row=current_row, column=2, value=f"RE - {product}").border = thin_border
        for col in range(3, 23):  # C to V (Q1-Q20)
            cell = ws.cell(row=current_row, column=col)
            format_formula_cell(cell, '#,##0.0')
        current_row += 1
    for product in sme_products:
        ws.cell(row=current_row, column=2, value=f"SME - {product}").border = thin_border
        for col in range(3, 23):  # C to V (Q1-Q20)
            cell = ws.cell(row=current_row, column=col)
            format_formula_cell(cell, '#,##0.0')
        current_row += 1
    for product in pg_products:
        ws.cell(row=current_row, column=2, value=f"PG - {product}").border = thin_border
        for col in range(3, 23):  # C to V (Q1-Q20)
            cell = ws.cell(row=current_row, column=col)
            format_formula_cell(cell, '#,##0.0')
        current_row += 1
    
    current_row += 2
    
    # 1.3 VINTAGE ANALYSIS - Matrice Erogazioni per Vintage
    ws.cell(row=current_row, column=2, value="1.3 VINTAGE ANALYSIS - MATRICE EROGAZIONI PER VINTAGE (€ mln)")
    ws.cell(row=current_row, column=2).font = Font(size=12, bold=True)
    ws.cell(row=current_row, column=2).fill = subheader_fill
    ws.cell(row=current_row, column=2).font = Font(color="FFFFFF", bold=True)
    current_row += 1
    
    ws.cell(row=current_row, column=2, value="Per ogni prodotto, erogazioni per trimestre di origine")
    ws.cell(row=current_row, column=2).font = Font(italic=True, size=10)
    current_row += 1
    
    # Per ogni prodotto, creiamo una matrice 20x20 (vintage x tempo)
    for division in ["RE", "SME", "PG"]:
        if division == "RE":
            products = ["CBL", "MLA", "MLAM", "MLPA", "MLPAM", "NRE"]
        elif division == "SME":
            products = ["BL", "REFI", "SS", "NF", "RES"]
        else:
            products = ["ACFP", "FGA", "FGPA"]
        
        for product in products:
            ws.cell(row=current_row, column=2, value=f"{division} - {product} - Vintage Matrix")
            ws.cell(row=current_row, column=2).font = Font(bold=True)
            ws.cell(row=current_row, column=2).fill = PatternFill(start_color="E6F3FF", end_color="E6F3FF", fill_type="solid")
            current_row += 1
            
            # Headers vintage
            ws.cell(row=current_row, column=2, value="Vintage\\Time").border = thin_border
            for q in range(1, 21):
                cell = ws.cell(row=current_row, column=2+q, value=f"Q{q}")
                cell.border = thin_border
                cell.font = Font(bold=True, size=9)
                cell.alignment = Alignment(horizontal='center')
            current_row += 1
            
            # Righe per ogni vintage
            for v in range(1, 21):
                ws.cell(row=current_row, column=2, value=f"V{v}").border = thin_border
                ws.cell(row=current_row, column=2).font = Font(bold=True, size=9)
                for q in range(1, 21):
                    cell = ws.cell(row=current_row, column=2+q)
                    format_formula_cell(cell, '#,##0.0')
                current_row += 1
            current_row += 1
    
    current_row += 2
    
    # 1.4 MATRICE AMMORTAMENTI PER VINTAGE
    ws.cell(row=current_row, column=2, value="1.4 MATRICE AMMORTAMENTI PER VINTAGE (€ mln)")
    ws.cell(row=current_row, column=2).font = Font(size=12, bold=True)
    ws.cell(row=current_row, column=2).fill = subheader_fill
    ws.cell(row=current_row, column=2).font = Font(color="FFFFFF", bold=True)
    current_row += 1
    
    ws.cell(row=current_row, column=2, value="Rimborsi programmati per vintage")
    ws.cell(row=current_row, column=2).font = Font(italic=True, size=10)
    current_row += 1
    
    # Tabella riassuntiva ammortamenti
    create_quarterly_headers(current_row)
    current_row += 1
    
    for division in ["RE", "SME", "PG"]:
        if division == "RE":
            products = ["CBL", "MLA", "MLAM", "MLPA", "MLPAM", "NRE"]
        elif division == "SME":
            products = ["BL", "REFI", "SS", "NF", "RES"]
        else:
            products = ["ACFP", "FGA", "FGPA"]
        
        for product in products:
            ws.cell(row=current_row, column=2, value=f"{division} - {product} - Rimborsi").border = thin_border
            for col in range(3, 23):
                cell = ws.cell(row=current_row, column=col)
                format_formula_cell(cell, '#,##0.0')
            current_row += 1
    
    current_row += 2
    
    # 1.5 MATRICE DEFAULT PER VINTAGE
    ws.cell(row=current_row, column=2, value="1.5 MATRICE DEFAULT PER VINTAGE (€ mln)")
    ws.cell(row=current_row, column=2).font = Font(size=12, bold=True)
    ws.cell(row=current_row, column=2).fill = subheader_fill
    ws.cell(row=current_row, column=2).font = Font(color="FFFFFF", bold=True)
    current_row += 1
    
    ws.cell(row=current_row, column=2, value="Stock che va in default per trimestre")
    ws.cell(row=current_row, column=2).font = Font(italic=True, size=10)
    current_row += 1
    
    create_quarterly_headers(current_row)
    current_row += 1
    
    for division in ["RE", "SME", "PG"]:
        if division == "RE":
            products = ["CBL", "MLA", "MLAM", "MLPA", "MLPAM", "NRE"]
        elif division == "SME":
            products = ["BL", "REFI", "SS", "NF", "RES"]
        else:
            products = ["ACFP", "FGA", "FGPA"]
        
        for product in products:
            ws.cell(row=current_row, column=2, value=f"{division} - {product} - Default").border = thin_border
            for col in range(3, 23):
                cell = ws.cell(row=current_row, column=col)
                format_formula_cell(cell, '#,##0.0')
            current_row += 1
    
    current_row += 2
    
    # 1.6 MATRICE RECUPERI SU DEFAULT
    ws.cell(row=current_row, column=2, value="1.6 MATRICE RECUPERI SU DEFAULT (€ mln)")
    ws.cell(row=current_row, column=2).font = Font(size=12, bold=True)
    ws.cell(row=current_row, column=2).fill = subheader_fill
    ws.cell(row=current_row, column=2).font = Font(color="FFFFFF", bold=True)
    current_row += 1
    
    ws.cell(row=current_row, column=2, value="Cash flow di recupero attesi")
    ws.cell(row=current_row, column=2).font = Font(italic=True, size=10)
    current_row += 1
    
    create_quarterly_headers(current_row)
    current_row += 1
    
    # Recuperi per tipo di garanzia
    ws.cell(row=current_row, column=2, value="RECUPERI GARANZIA IMMOBILIARE").font = Font(bold=True)
    ws.cell(row=current_row, column=2).fill = PatternFill(start_color="FFE6E6", end_color="FFE6E6", fill_type="solid")
    current_row += 1
    
    for division in ["RE", "SME", "PG"]:
        if division == "RE":
            products = ["CBL", "MLA", "MLAM", "MLPA", "MLPAM", "NRE"]
        elif division == "SME":
            products = ["BL", "REFI", "SS", "NF", "RES"]
        else:
            products = ["ACFP", "FGA", "FGPA"]
        
        for product in products:
            ws.cell(row=current_row, column=2, value=f"{division} - {product}").border = thin_border
            for col in range(3, 23):
                cell = ws.cell(row=current_row, column=col)
                format_formula_cell(cell, '#,##0.0')
            current_row += 1
    
    current_row += 1
    
    ws.cell(row=current_row, column=2, value="RECUPERI GARANZIA MCC").font = Font(bold=True)
    ws.cell(row=current_row, column=2).fill = PatternFill(start_color="E6FFE6", end_color="E6FFE6", fill_type="solid")
    current_row += 1
    
    for division in ["RE", "SME", "PG"]:
        if division == "RE":
            products = ["CBL", "MLA", "MLAM", "MLPA", "MLPAM", "NRE"]
        elif division == "SME":
            products = ["BL", "REFI", "SS", "NF", "RES"]
        else:
            products = ["ACFP", "FGA", "FGPA"]
        
        for product in products:
            ws.cell(row=current_row, column=2, value=f"{division} - {product}").border = thin_border
            for col in range(3, 23):
                cell = ws.cell(row=current_row, column=col)
                format_formula_cell(cell, '#,##0.0')
            current_row += 1
    
    current_row += 2
    
    # 1.7 CALCOLO NBV E ECL
    ws.cell(row=current_row, column=2, value="1.7 CALCOLO NBV E ECL")
    ws.cell(row=current_row, column=2).font = Font(size=12, bold=True)
    ws.cell(row=current_row, column=2).fill = subheader_fill
    ws.cell(row=current_row, column=2).font = Font(color="FFFFFF", bold=True)
    current_row += 1
    
    # Stock Performing
    ws.cell(row=current_row, column=2, value="STOCK PERFORMING (€ mln)").font = Font(bold=True)
    ws.cell(row=current_row, column=2).fill = PatternFill(start_color="E6F3FF", end_color="E6F3FF", fill_type="solid")
    current_row += 1
    
    create_quarterly_headers(current_row)
    current_row += 1
    
    for division in ["RE", "SME", "PG"]:
        if division == "RE":
            products = ["CBL", "MLA", "MLAM", "MLPA", "MLPAM", "NRE"]
        elif division == "SME":
            products = ["BL", "REFI", "SS", "NF", "RES"]
        else:
            products = ["ACFP", "FGA", "FGPA"]
        
        for product in products:
            ws.cell(row=current_row, column=2, value=f"{division} - {product}").border = thin_border
            for col in range(3, 23):
                cell = ws.cell(row=current_row, column=col)
                format_formula_cell(cell, '#,##0.0')
            current_row += 1
    
    current_row += 1
    
    # ECL Stage 1
    ws.cell(row=current_row, column=2, value="ECL STAGE 1 (€ mln)").font = Font(bold=True)
    ws.cell(row=current_row, column=2).fill = PatternFill(start_color="FFE6CC", end_color="FFE6CC", fill_type="solid")
    current_row += 1
    
    create_quarterly_headers(current_row)
    current_row += 1
    
    for division in ["RE", "SME", "PG"]:
        if division == "RE":
            products = ["CBL", "MLA", "MLAM", "MLPA", "MLPAM", "NRE"]
        elif division == "SME":
            products = ["BL", "REFI", "SS", "NF", "RES"]
        else:
            products = ["ACFP", "FGA", "FGPA"]
        
        for product in products:
            ws.cell(row=current_row, column=2, value=f"{division} - {product}").border = thin_border
            for col in range(3, 23):
                cell = ws.cell(row=current_row, column=col)
                format_formula_cell(cell, '#,##0.0')
            current_row += 1
    
    current_row += 1
    
    # NBV Performing (Stock - ECL)
    ws.cell(row=current_row, column=2, value="NBV PERFORMING (Stock - ECL) (€ mln)").font = Font(bold=True)
    ws.cell(row=current_row, column=2).fill = PatternFill(start_color="CCE6FF", end_color="CCE6FF", fill_type="solid")
    current_row += 1
    
    create_quarterly_headers(current_row)
    current_row += 1
    
    for division in ["RE", "SME", "PG"]:
        if division == "RE":
            products = ["CBL", "MLA", "MLAM", "MLPA", "MLPAM", "NRE"]
        elif division == "SME":
            products = ["BL", "REFI", "SS", "NF", "RES"]
        else:
            products = ["ACFP", "FGA", "FGPA"]
        
        for product in products:
            ws.cell(row=current_row, column=2, value=f"{division} - {product}").border = thin_border
            for col in range(3, 23):
                cell = ws.cell(row=current_row, column=col)
                format_formula_cell(cell, '#,##0.0')
            current_row += 1
    
    current_row += 1
    
    # Stock NPL
    ws.cell(row=current_row, column=2, value="STOCK NPL (€ mln)").font = Font(bold=True)
    ws.cell(row=current_row, column=2).fill = PatternFill(start_color="FFE6E6", end_color="FFE6E6", fill_type="solid")
    current_row += 1
    
    create_quarterly_headers(current_row)
    current_row += 1
    
    for division in ["RE", "SME", "PG"]:
        if division == "RE":
            products = ["CBL", "MLA", "MLAM", "MLPA", "MLPAM", "NRE"]
        elif division == "SME":
            products = ["BL", "REFI", "SS", "NF", "RES"]
        else:
            products = ["ACFP", "FGA", "FGPA"]
        
        for product in products:
            ws.cell(row=current_row, column=2, value=f"{division} - {product}").border = thin_border
            for col in range(3, 23):
                cell = ws.cell(row=current_row, column=col)
                format_formula_cell(cell, '#,##0.0')
            current_row += 1
    
    current_row += 1
    
    # NPV Recuperi (NBV Non-Performing)
    ws.cell(row=current_row, column=2, value="NPV RECUPERI / NBV NON-PERFORMING (€ mln)").font = Font(bold=True)
    ws.cell(row=current_row, column=2).fill = PatternFill(start_color="FFCCCC", end_color="FFCCCC", fill_type="solid")
    current_row += 1
    
    create_quarterly_headers(current_row)
    current_row += 1
    
    for division in ["RE", "SME", "PG"]:
        if division == "RE":
            products = ["CBL", "MLA", "MLAM", "MLPA", "MLPAM", "NRE"]
        elif division == "SME":
            products = ["BL", "REFI", "SS", "NF", "RES"]
        else:
            products = ["ACFP", "FGA", "FGPA"]
        
        for product in products:
            ws.cell(row=current_row, column=2, value=f"{division} - {product}").border = thin_border
            for col in range(3, 23):
                cell = ws.cell(row=current_row, column=col)
                format_formula_cell(cell, '#,##0.0')
            current_row += 1
    
    current_row += 3
    
    # ===== SEZIONE 2: CONTO ECONOMICO =====
    print("  💰 Creazione sezione: Conto Economico Consolidato...")
    
    ws.cell(row=current_row, column=2, value="3. CONTO ECONOMICO CONSOLIDATO TRIMESTRALE (€ mln)")
    ws.merge_cells(f'B{current_row}:X{current_row}')
    ws.cell(row=current_row, column=2).font = Font(size=14, bold=True, color="FFFFFF")
    ws.cell(row=current_row, column=2).fill = header_fill
    ws.cell(row=current_row, column=2).alignment = Alignment(horizontal='center')
    current_row += 2
    
    # Headers trimestrali per CE
    ws.cell(row=current_row, column=2, value="Voce").font = Font(bold=True)
    ws.cell(row=current_row, column=2).fill = section_fill
    ws.cell(row=current_row, column=2).border = thin_border
    
    for i in range(20):
        col_idx = 3 + i
        quarter = i + 1
        year = (i // 4) + 1
        quarter_in_year = (i % 4) + 1
        header_text = f"Q{quarter}\n(Y{year}Q{quarter_in_year})"
        
        cell = ws.cell(row=current_row, column=col_idx, value=header_text)
        cell.font = Font(name='Calibri', size=10, bold=True)
        cell.fill = section_fill
        cell.border = thin_border
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    
    ws.cell(row=current_row, column=24, value="Descrizione").font = Font(bold=True)
    ws.cell(row=current_row, column=24).fill = section_fill
    ws.cell(row=current_row, column=24).border = thin_border
    current_row += 1
    
    # Voci del Conto Economico con indentazione
    ce_items = [
        ("1. MARGINE DI INTERESSE", True, 0),
        ("1.1. Interest Income", False, 1),
        ("    1.1.1. da Real Estate Division", False, 2),
        ("    1.1.2. da SME Division", False, 2),
        ("    1.1.3. da Public Guarantee Division", False, 2),
        ("    1.1.4. da Digital Banking Division", False, 2),
        ("    1.1.5. da Treasury Division", False, 2),
        ("1.2. Interest Expenses", False, 1),
        ("1.3. NET INTEREST INCOME", True, 1),
        ("", False, 0),
        ("2. COMMISSIONI", True, 0),
        ("2.1. Commission Income", False, 1),
        ("    2.1.1. da Real Estate Division", False, 2),
        ("    2.1.2. da SME Division", False, 2),
        ("    2.1.3. da Public Guarantee Division", False, 2),
        ("    2.1.4. da Wealth Management Division", False, 2),
        ("    2.1.5. da Digital Banking Division", False, 2),
        ("2.2. Commission Expenses", False, 1),
        ("2.3. NET COMMISSION INCOME", True, 1),
        ("", False, 0),
        ("3. TOTAL REVENUES", True, 0),
        ("", False, 0),
        ("4. COSTI OPERATIVI", True, 0),
        ("4.1. Staff Costs", False, 1),
        ("    4.1.1. da Real Estate Division", False, 2),
        ("    4.1.2. da SME Division", False, 2),
        ("    4.1.3. da Public Guarantee Division", False, 2),
        ("    4.1.4. da Digital Banking Division", False, 2),
        ("    4.1.5. da Wealth Management Division", False, 2),
        ("    4.1.6. da Technology Division", False, 2),
        ("    4.1.7. da Central Functions", False, 2),
        ("4.2. Other Operating Costs", False, 1),
        ("4.3. TOTAL OPERATING COSTS", True, 1),
        ("", False, 0),
        ("5. GROSS OPERATING PROFIT", True, 0),
        ("", False, 0),
        ("6. Ammortamenti", False, 0),
        ("7. Loan Loss Provisions", False, 0),
        ("    7.1. da Real Estate Division", False, 1),
        ("    7.2. da SME Division", False, 1),
        ("    7.3. da Public Guarantee Division", False, 1),
        ("", False, 0),
        ("8. OPERATING PROFIT", True, 0),
        ("", False, 0),
        ("9. Taxes", False, 0),
        ("10. NET PROFIT", True, 0),
    ]
    
    for item_name, is_bold, indent_level in ce_items:
        if item_name:  # Skip empty rows
            cell = ws.cell(row=current_row, column=2, value=item_name)
            cell.border = thin_border
            if is_bold:
                cell.font = Font(bold=True)
                if indent_level == 0:
                    cell.fill = section_fill
            
            # Add value cells for all 20 quarters
            for col in range(3, 23):  # C to V (Q1-Q20)
                cell = ws.cell(row=current_row, column=col, value=0)
                if is_bold:
                    cell.font = Font(bold=True)
                    cell.border = thin_border
                else:
                    format_formula_cell(cell, '#,##0.0')
            
            # Description column
            ws.cell(row=current_row, column=24, value="").border = thin_border
        
        current_row += 1
    
    current_row += 3
    
    # ===== SEZIONE 3: STATO PATRIMONIALE =====
    print("  🏦 Creazione sezione: Stato Patrimoniale Consolidato...")
    
    ws.cell(row=current_row, column=2, value="4. STATO PATRIMONIALE CONSOLIDATO TRIMESTRALE (€ mln)")
    ws.merge_cells(f'B{current_row}:X{current_row}')
    ws.cell(row=current_row, column=2).font = Font(size=14, bold=True, color="FFFFFF")
    ws.cell(row=current_row, column=2).fill = header_fill
    ws.cell(row=current_row, column=2).alignment = Alignment(horizontal='center')
    current_row += 2
    
    # Headers trimestrali per SP
    ws.cell(row=current_row, column=2, value="Voce").font = Font(bold=True)
    ws.cell(row=current_row, column=2).fill = section_fill
    ws.cell(row=current_row, column=2).border = thin_border
    
    for i in range(20):
        col_idx = 3 + i
        quarter = i + 1
        year = (i // 4) + 1
        quarter_in_year = (i % 4) + 1
        header_text = f"Q{quarter}\n(Y{year}Q{quarter_in_year})"
        
        cell = ws.cell(row=current_row, column=col_idx, value=header_text)
        cell.font = Font(name='Calibri', size=10, bold=True)
        cell.fill = section_fill
        cell.border = thin_border
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    
    ws.cell(row=current_row, column=24, value="Descrizione").font = Font(bold=True)
    ws.cell(row=current_row, column=24).fill = section_fill
    ws.cell(row=current_row, column=24).border = thin_border
    current_row += 1
    
    # Voci dello Stato Patrimoniale
    sp_items = [
        ("1. ATTIVO", True, 0),
        ("1.1. Loans to Customers (Gross)", False, 1),
        ("    1.1.1. Real Estate Division loans", False, 2),
        ("    1.1.2. SME Division loans", False, 2),
        ("    1.1.3. Public Guarantee Division loans", False, 2),
        ("1.2. Loan Loss Reserves", False, 1),
        ("1.3. Loans to Customers (Net)", True, 1),
        ("1.4. Securities Portfolio", False, 1),
        ("1.5. Immobilizzazioni Immateriali (Net)", False, 1),
        ("1.6. Cash & Central Banks", False, 1),
        ("1.7. Other Assets", False, 1),
        ("1.8. TOTAL ASSETS", True, 1),
        ("", False, 0),
        ("2. PASSIVO E PATRIMONIO NETTO", True, 0),
        ("2.1. Customer Deposits", False, 1),
        ("    2.1.1. Digital Banking Division deposits", False, 2),
        ("    2.1.2. Wealth Management Division deposits", False, 2),
        ("    2.1.3. Corporate deposits", False, 2),
        ("2.2. Debt Securities & Funding", False, 1),
        ("2.3. Other Liabilities", False, 1),
        ("2.4. TOTAL LIABILITIES", True, 1),
        ("", False, 0),
        ("2.5. Share Capital & Reserves", False, 1),
        ("2.6. Retained Earnings", False, 1),
        ("2.7. TOTAL EQUITY", True, 1),
        ("2.8. TOTAL LIABILITIES & EQUITY", True, 1),
        ("", False, 0),
        ("2.9. CHECK DI QUADRATURA", True, 0),
    ]
    
    for item_name, is_bold, indent_level in sp_items:
        if item_name:
            cell = ws.cell(row=current_row, column=2, value=item_name)
            cell.border = thin_border
            if is_bold:
                cell.font = Font(bold=True)
                if indent_level == 0:
                    cell.fill = section_fill
            
            # Add value cells for all 20 quarters
            for col in range(3, 23):  # C to V (Q1-Q20)
                cell = ws.cell(row=current_row, column=col, value=0)
                if is_bold:
                    cell.font = Font(bold=True)
                    cell.border = thin_border
                else:
                    format_formula_cell(cell, '#,##0.0')
            
            ws.cell(row=current_row, column=24, value="").border = thin_border
        
        current_row += 1
    
    current_row += 3
    
    # ===== SEZIONE 4: CAPITAL REQUIREMENTS =====
    print("  🏛️ Creazione sezione: Capital Requirements...")
    
    ws.cell(row=current_row, column=2, value="5. CAPITAL REQUIREMENTS TRIMESTRALI (€ mln)")
    ws.merge_cells(f'B{current_row}:X{current_row}')
    ws.cell(row=current_row, column=2).font = Font(size=14, bold=True, color="FFFFFF")
    ws.cell(row=current_row, column=2).fill = header_fill
    ws.cell(row=current_row, column=2).alignment = Alignment(horizontal='center')
    current_row += 2
    
    # Headers trimestrali per Capital Requirements
    ws.cell(row=current_row, column=2, value="Voce").font = Font(bold=True)
    ws.cell(row=current_row, column=2).fill = section_fill
    ws.cell(row=current_row, column=2).border = thin_border
    
    for i in range(20):
        col_idx = 3 + i
        quarter = i + 1
        year = (i // 4) + 1
        quarter_in_year = (i % 4) + 1
        header_text = f"Q{quarter}\n(Y{year}Q{quarter_in_year})"
        
        cell = ws.cell(row=current_row, column=col_idx, value=header_text)
        cell.font = Font(name='Calibri', size=10, bold=True)
        cell.fill = section_fill
        cell.border = thin_border
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    
    ws.cell(row=current_row, column=24, value="Descrizione").font = Font(bold=True)
    ws.cell(row=current_row, column=24).fill = section_fill
    ws.cell(row=current_row, column=24).border = thin_border
    current_row += 1
    
    # Voci Capital Requirements
    cap_items = [
        ("1. RISK WEIGHTED ASSETS (RWA)", True, 0),
        ("1.1. Credit Risk RWA", False, 1),
        ("    1.1.1. da Real Estate Division", False, 2),
        ("    1.1.2. da SME Division", False, 2),
        ("    1.1.3. da Public Guarantee Division", False, 2),
        ("1.2. Market Risk RWA", False, 1),
        ("1.3. Operational Risk RWA", False, 1),
        ("1.4. TOTAL RWA", True, 1),
        ("", False, 0),
        ("2. CAPITAL", True, 0),
        ("2.1. CET1 Capital", False, 1),
        ("2.2. AT1 Capital", False, 1),
        ("2.3. Tier 2 Capital", False, 1),
        ("2.4. TOTAL CAPITAL", True, 1),
        ("", False, 0),
        ("3. REQUIREMENTS & RATIOS", True, 0),
        ("3.1. CET1 Ratio", False, 1),
        ("3.2. Total Capital Ratio", False, 1),
        ("3.3. Total Requirement %", False, 1),
        ("3.4. Excess Capital (vs CET1)", False, 1),
    ]
    
    for item_name, is_bold, indent_level in cap_items:
        if item_name:
            cell = ws.cell(row=current_row, column=2, value=item_name)
            cell.border = thin_border
            if is_bold:
                cell.font = Font(bold=True)
                if indent_level == 0:
                    cell.fill = section_fill
            
            # Add value cells for all 20 quarters
            for col in range(3, 23):  # C to V (Q1-Q20)
                cell = ws.cell(row=current_row, column=col, value=0)
                if is_bold:
                    cell.font = Font(bold=True)
                    cell.border = thin_border
                else:
                    format_formula_cell(cell, '#,##0.0')
            
            ws.cell(row=current_row, column=24, value="").border = thin_border
        
        current_row += 1
    
    current_row += 3
    
    # ===== SEZIONE 5: KEY PERFORMANCE INDICATORS =====
    print("  📊 Creazione sezione: Key Performance Indicators...")
    
    ws.cell(row=current_row, column=2, value="6. KEY PERFORMANCE INDICATORS TRIMESTRALI (KPI)")
    ws.merge_cells(f'B{current_row}:X{current_row}')
    ws.cell(row=current_row, column=2).font = Font(size=14, bold=True, color="FFFFFF")
    ws.cell(row=current_row, column=2).fill = header_fill
    ws.cell(row=current_row, column=2).alignment = Alignment(horizontal='center')
    current_row += 2
    
    # Headers trimestrali per KPI
    ws.cell(row=current_row, column=2, value="KPI").font = Font(bold=True)
    ws.cell(row=current_row, column=2).fill = section_fill
    ws.cell(row=current_row, column=2).border = thin_border
    
    for i in range(20):
        col_idx = 3 + i
        quarter = i + 1
        year = (i // 4) + 1
        quarter_in_year = (i % 4) + 1
        header_text = f"Q{quarter}\n(Y{year}Q{quarter_in_year})"
        
        cell = ws.cell(row=current_row, column=col_idx, value=header_text)
        cell.font = Font(name='Calibri', size=10, bold=True)
        cell.fill = section_fill
        cell.border = thin_border
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    
    ws.cell(row=current_row, column=24, value="Descrizione").font = Font(bold=True)
    ws.cell(row=current_row, column=24).fill = section_fill
    ws.cell(row=current_row, column=24).border = thin_border
    current_row += 1
    
    # KPI items
    kpi_items = [
        ("1. PROFITABILITY - CONSOLIDATO", True, 0),
        ("1.1. ROE % (Annualizzato)", False, 1),
        ("1.2. ROA % (Annualizzato)", False, 1),
        ("1.3. NIM (Net Interest Margin) % (Annualizzato)", False, 1),
        ("1.4. Cost/Income % (Rolling 4Q)", False, 1),
        ("", False, 0),
        ("2. PROFITABILITY - PER DIVISIONE", True, 0),
        ("2.1. ROE % - Real Estate Division (Annualizzato)", False, 1),
        ("2.2. ROE % - SME Division (Annualizzato)", False, 1),
        ("2.3. ROE % - Public Guarantee Div. (Annualizzato)", False, 1),
        ("", False, 0),
        ("3. ASSET QUALITY", True, 0),
        ("3.1. NPL Ratio (Net) %", False, 1),
        ("3.2. Coverage Ratio %", False, 1),
        ("3.3. Cost of Risk (bps) (Annualizzato)", False, 1),
        ("", False, 0),
        ("4. LIQUIDITY & LEVERAGE", True, 0),
        ("4.1. LCR %", False, 1),
        ("4.2. NSFR %", False, 1),
        ("4.3. Loan/Deposit %", False, 1),
        ("4.4. Leverage Ratio %", False, 1),
    ]
    
    for item_name, is_bold, indent_level in kpi_items:
        if item_name:
            cell = ws.cell(row=current_row, column=2, value=item_name)
            cell.border = thin_border
            if is_bold:
                cell.font = Font(bold=True)
                if indent_level == 0:
                    cell.fill = section_fill
            
            # Add value cells for all 20 quarters
            for col in range(3, 23):  # C to V (Q1-Q20)
                cell = ws.cell(row=current_row, column=col, value=0)
                if is_bold:
                    cell.font = Font(bold=True)
                    cell.border = thin_border
                    # Formato percentuale per i KPI
                    if "%" in item_name or "bps" in item_name:
                        cell.number_format = '0.00%' if "%" in item_name else '0'
                else:
                    # Formato per celle FORMULA dei KPI
                    kpi_format = '0.00%' if "%" in item_name else ('0' if "bps" in item_name else '#,##0.0')
                    format_formula_cell(cell, kpi_format)
            
            ws.cell(row=current_row, column=24, value="").border = thin_border
        
        current_row += 1
    
    return wb

def main():
    """Funzione principale per STEP 2 - Modello Trimestrale"""
    print("📊 STEP 2: Aggiunta foglio Modello TRIMESTRALE con tabelle di calcolo...")
    print("⏱️ Supporta 20 trimestri (Q1-Q20) invece di 5 anni")
    print("=" * 70)
    
    try:
        # Aggiungi il foglio Modello trimestrale
        wb = add_model_sheet()
        
        # Salva il file aggiornato
        filename = 'modello_bancario_completo.xlsx'
        wb.save(filename)
        
        print("=" * 70)
        print(f"✅ STEP 2 COMPLETATO!")
        print(f"📁 File '{filename}' aggiornato con successo")
        print("📊 Il foglio 'Modello' contiene (VERSIONE TRIMESTRALE):")
        print("   - Calcoli di Appoggio (20 trimestri)")
        print("   - Conto Economico Consolidato (20 trimestri)")
        print("   - Stato Patrimoniale Consolidato (20 trimestri)")
        print("   - Capital Requirements (20 trimestri)")
        print("   - Key Performance Indicators (20 trimestri)")
        print("   - Headers: Q1, Q2, Q3... Q20 (con indicazione anno)")
        print("\n⏭️  Pronto per STEP 3: Inserimento formule Excel trimestrali")
        
    except FileNotFoundError:
        print("❌ ERRORE: File 'modello_bancario_completo.xlsx' non trovato!")
        print("   Assicurati di aver eseguito prima lo STEP 1 (create_input_sheet.py)")
    except Exception as e:
        print(f"❌ ERRORE: {str(e)}")

if __name__ == "__main__":
    main()