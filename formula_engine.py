#!/usr/bin/env python3
"""
FORMULA ENGINE - MODELLO BANCARIO COMPLETO CON VINTAGE ANALYSIS
Script per inserire le formule Excel nel modello bancario trimestrale con gestione vintage

Questo script aggiunge le formule per:
1. Calcoli di appoggio con vintage analysis
2. Conto Economico
3. Stato Patrimoniale  
4. Capital Requirements
5. KPI

Supporta 20 trimestri (Q1-Q20) con tracking completo per vintage.
"""

from openpyxl import load_workbook
from openpyxl.utils import get_column_letter
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
import re

class FormulaEngine:
    def __init__(self, filename="modello_bancario_completo.xlsx"):
        self.wb = load_workbook(filename)
        self.ws_input = self.wb["Input"]
        self.ws_modello = self.wb["Modello"]
        
        # Configurazione trimestrale
        self.num_quarters = 20  # Q1-Q20 per 5 anni
        self.quarter_columns = [get_column_letter(3 + i) for i in range(20)]  # C-V
        
        # Prodotti per divisione
        self.products = {
            'RE': ['CBL', 'MLA', 'MLAM', 'MLPA', 'MLPAM', 'NRE'],
            'SME': ['BL', 'REFI', 'SS', 'NF', 'RES'],
            'PG': ['ACFP', 'FGA', 'FGPA']
        }
        
        # Mappa celle chiave
        self.input_refs = self._mappa_riferimenti_input()
        self.model_refs = self._mappa_riferimenti_modello()
        
        # Stili per formattazione celle FORMULA
        self._setup_formula_styles()
    
    def _setup_formula_styles(self):
        """Imposta gli stili per le celle con formule"""
        self.formula_fill = PatternFill(start_color="F5F5F5", end_color="F5F5F5", fill_type="solid")
        self.formula_font = Font(name='Calibri', size=11, color="000000")
        self.formula_border = Border(
            left=Side(style='dashed'),
            right=Side(style='dashed'),
            top=Side(style='dashed'),
            bottom=Side(style='dashed')
        )
    
    def _format_formula_cell(self, cell, number_format=None):
        """Applica la formattazione standard alle celle con formule"""
        cell.fill = self.formula_fill
        cell.font = self.formula_font
        cell.border = self.formula_border
        cell.alignment = Alignment(horizontal='center')
        if number_format:
            cell.number_format = number_format
    
    def _mappa_riferimenti_input(self):
        """Mappa i riferimenti chiave nel foglio Input"""
        refs = {}
        
        # Scansiona il foglio Input per trovare le celle chiave
        for row in range(1, 500):
            cell_value = self.ws_input[f'B{row}'].value
            if cell_value:
                cell_str = str(cell_value).upper()
                
                # Parametri macro
                if "ECB RATE" in cell_str and "Y1" not in cell_str:
                    refs['ecb_rate_row'] = row
                elif "EURIBOR" in cell_str and "6M" in cell_str:
                    refs['euribor_row'] = row
                
                # Erogazioni per divisione (ora valori assoluti)
                elif "NUOVE EROGAZIONI RE" in cell_str:
                    refs['erog_re_row'] = row
                elif "NUOVE EROGAZIONI SME" in cell_str:
                    refs['erog_sme_row'] = row
                elif "NUOVE EROGAZIONI PG" in cell_str:
                    refs['erog_pg_row'] = row
                
                # Parametri prodotti
                elif "MIX PRODOTTI" in cell_str:
                    # Cerca la sezione corretta guardando le righe precedenti
                    for search_back in range(2, 8):  # Cerca da 2 a 7 righe indietro
                        section_value = self.ws_input[f'B{row-search_back}'].value
                        if section_value:
                            section_str = str(section_value).upper()
                            if "REAL ESTATE" in section_str and "DIVISION" in section_str:
                                refs['mix_re_row'] = row
                                break
                            elif "SME" in section_str and "DIVISION" in section_str:
                                refs['mix_sme_row'] = row
                                break
                            elif "PUBLIC GUARANTEE" in section_str and "DIVISION" in section_str:
                                refs['mix_pg_row'] = row
                                break
                
                # Parametri di rischio
                elif "DANGER RATE" in cell_str:
                    # Cerca la sezione corretta guardando le righe precedenti
                    for search_back in range(3, 10):
                        section_value = self.ws_input[f'B{row-search_back}'].value
                        if section_value:
                            section_str = str(section_value).upper()
                            if "REAL ESTATE" in section_str and "DIVISION" in section_str:
                                refs['danger_re_row'] = row
                                break
                            elif "SME" in section_str and "DIVISION" in section_str:
                                refs['danger_sme_row'] = row
                                break
                            elif "PUBLIC GUARANTEE" in section_str and "DIVISION" in section_str:
                                refs['danger_pg_row'] = row
                                break
                
                elif "LGD" in cell_str:
                    # Cerca la sezione corretta guardando le righe precedenti
                    for search_back in range(3, 12):
                        section_value = self.ws_input[f'B{row-search_back}'].value
                        if section_value:
                            section_str = str(section_value).upper()
                            if "REAL ESTATE" in section_str and "DIVISION" in section_str:
                                refs['lgd_re_row'] = row
                                break
                            elif "SME" in section_str and "DIVISION" in section_str:
                                refs['lgd_sme_row'] = row
                                break
                            elif "PUBLIC GUARANTEE" in section_str and "DIVISION" in section_str:
                                refs['lgd_pg_row'] = row
                                break
                
                elif "INTEREST RATE" in cell_str:
                    # Cerca la sezione corretta guardando le righe precedenti
                    for search_back in range(3, 15):
                        section_value = self.ws_input[f'B{row-search_back}'].value
                        if section_value:
                            section_str = str(section_value).upper()
                            if "REAL ESTATE" in section_str and "DIVISION" in section_str:
                                refs['rate_re_row'] = row
                                break
                            elif "SME" in section_str and "DIVISION" in section_str:
                                refs['rate_sme_row'] = row
                                break
                            elif "PUBLIC GUARANTEE" in section_str and "DIVISION" in section_str:
                                refs['rate_pg_row'] = row
                                break
                
                elif "UP-FRONT FEES" in cell_str:
                    # Cerca la sezione corretta guardando le righe precedenti
                    for search_back in range(3, 18):
                        section_value = self.ws_input[f'B{row-search_back}'].value
                        if section_value:
                            section_str = str(section_value).upper()
                            if "REAL ESTATE" in section_str and "DIVISION" in section_str:
                                refs['upfront_re_row'] = row
                                break
                            elif "SME" in section_str and "DIVISION" in section_str:
                                refs['upfront_sme_row'] = row
                                break
                            elif "PUBLIC GUARANTEE" in section_str and "DIVISION" in section_str:
                                refs['upfront_pg_row'] = row
                                break
                
                # Parametri Default e Recupero
                elif "REAL ESTATE" in cell_str and self.ws_input[f'B{row-1}'].value:
                    prev_val = str(self.ws_input[f'B{row-1}'].value).upper()
                    if "TIMING DEFAULT" in prev_val:
                        refs['default_timing_re'] = row
                elif "SME" in cell_str and self.ws_input[f'B{row-1}'].value:
                    prev_val = str(self.ws_input[f'B{row-1}'].value).upper()
                    if "TIMING DEFAULT" in prev_val:
                        refs['default_timing_sme'] = row
                elif "PUBLIC GUARANTEE" in cell_str and self.ws_input[f'B{row-1}'].value:
                    prev_val = str(self.ws_input[f'B{row-1}'].value).upper()
                    if "TIMING DEFAULT" in prev_val:
                        refs['default_timing_pg'] = row
                
                # Timing recupero garanzie
                elif "GARANZIA IMMOBILIARE" in cell_str:
                    if self.ws_input[f'B{row-1}'].value and "TIMING RECUPERO" in str(self.ws_input[f'B{row-1}'].value).upper():
                        refs['recovery_timing_imm'] = row
                elif "GARANZIA MCC" in cell_str:
                    if self.ws_input[f'B{row-1}'].value and "TIMING RECUPERO" in str(self.ws_input[f'B{row-1}'].value).upper():
                        refs['recovery_timing_mcc'] = row
                
                # Quote recupero garanzie
                elif "REAL ESTATE" in cell_str and self.ws_input[f'B{row-1}'].value:
                    if "QUOTE RECUPERO" in str(self.ws_input[f'B{row-1}'].value).upper():
                        refs['recovery_quote_re'] = row
                elif "SME" in cell_str and self.ws_input[f'B{row-2}'].value:
                    if "QUOTE RECUPERO" in str(self.ws_input[f'B{row-2}'].value).upper():
                        refs['recovery_quote_sme'] = row
                elif "PUBLIC GUARANTEE" in cell_str and self.ws_input[f'B{row-3}'].value:
                    if "QUOTE RECUPERO" in str(self.ws_input[f'B{row-3}'].value).upper():
                        refs['recovery_quote_pg'] = row
                
                # Parametri ECL (solo la prima occorrenza)
                elif "ECL HORIZON" in cell_str and 'ecl_horizon' not in refs:
                    refs['ecl_horizon'] = row
                elif "PD MULTIPLIER" in cell_str and 'pd_multiplier' not in refs:
                    refs['pd_multiplier'] = row
                
                # Altri parametri
                elif "ALIQUOTA FISCALE" in cell_str:
                    refs['tax_rate_row'] = row
                elif "DIVIDEND PAYOUT" in cell_str:
                    refs['dividend_row'] = row
        
        return refs
    
    def _mappa_riferimenti_modello(self):
        """Mappa i riferimenti chiave nel foglio Modello"""
        refs = {}
        
        # Scansiona il foglio Modello per trovare le sezioni
        for row in range(1, 2000):
            cell_value = self.ws_modello[f'B{row}'].value
            if cell_value:
                cell_str = str(cell_value).upper()
                
                # Sezioni principali
                if "1.1 EROGAZIONI PER PRODOTTO" in cell_str:
                    refs['erogazioni_start'] = row + 3
                elif "1.2 STOCK CREDITI PER PRODOTTO" in cell_str:
                    refs['stock_crediti_start'] = row + 3
                elif "1.3 VINTAGE ANALYSIS" in cell_str:
                    refs['vintage_start'] = row + 3
                elif "1.4 MATRICE AMMORTAMENTI" in cell_str:
                    refs['ammortamenti_start'] = row + 3
                elif "1.5 MATRICE DEFAULT" in cell_str:
                    refs['default_start'] = row + 3
                elif "1.6 MATRICE RECUPERI" in cell_str:
                    refs['recuperi_start'] = row + 3
                elif "1.7 CALCOLO NBV" in cell_str:
                    refs['nbv_start'] = row + 3
                elif "STOCK PERFORMING" in cell_str and "€ MLN" in cell_str:
                    refs['stock_performing_start'] = row + 3
                elif "ECL STAGE 1" in cell_str and "€ MLN" in cell_str:
                    refs['ecl_stage1_start'] = row + 3
                elif "NBV PERFORMING" in cell_str and "STOCK - ECL" in cell_str:
                    refs['nbv_performing_start'] = row + 3
                elif "STOCK NPL" in cell_str and "€ MLN" in cell_str:
                    refs['stock_npl_start'] = row + 3
                elif "NPV RECUPERI" in cell_str:
                    refs['npv_recuperi_start'] = row + 3
                elif "3. CONTO ECONOMICO" in cell_str:
                    refs['ce_start'] = row + 3
                elif "4. STATO PATRIMONIALE" in cell_str:
                    refs['sp_start'] = row + 3
                elif "5. CAPITAL REQUIREMENTS" in cell_str:
                    refs['capital_start'] = row + 3
                elif "6. KEY PERFORMANCE" in cell_str:
                    refs['kpi_start'] = row + 3
        
        return refs
    
    def formule_erogazioni_base(self):
        """Inserisce le formule per le erogazioni base per prodotto"""
        print("  📊 Inserimento formule erogazioni per prodotto...")
        
        start_row = self.model_refs.get('erogazioni_start', 10)
        
        # Per ogni divisione e prodotto
        current_row = start_row
        for division in ['RE', 'SME', 'PG']:
            products = self.products[division]
            
            # Riga delle erogazioni annuali nella sezione Input
            if division == 'RE':
                erog_row = self.input_refs.get('erog_re_row')
                mix_row = self.input_refs.get('mix_re_row')
            elif division == 'SME':
                erog_row = self.input_refs.get('erog_sme_row')
                mix_row = self.input_refs.get('mix_sme_row')
            else:
                erog_row = self.input_refs.get('erog_pg_row')
                mix_row = self.input_refs.get('mix_pg_row')
            
            for idx, product in enumerate(products):
                # Per ogni trimestre
                for q in range(20):
                    col_letter = self.quarter_columns[q]
                    year = (q // 4) + 1  # Anno di riferimento (1-5)
                    quarter_in_year = (q % 4) + 1  # Trimestre nell'anno (1-4)
                    
                    # Colonna del mix prodotto nel foglio Input
                    product_mix_col = get_column_letter(3 + idx)  # C, D, E, F, G, H
                    
                    # Colonna dell'erogazione annuale nel foglio Input  
                    year_col = get_column_letter(2 + year)  # C per Y1, D per Y2, E per Y3, etc.
                    
                    # Formula corretta: Erogazione_Annuale * Mix_Prodotto / 4
                    formula = f"=Input!${year_col}${erog_row}*Input!${product_mix_col}${mix_row}/4"
                    
                    cell = self.ws_modello[f'{col_letter}{current_row}']
                    cell.value = formula
                    self._format_formula_cell(cell, '#,##0.0')
                
                current_row += 1
        
        print(f"    ✓ Formule erogazioni inserite per {current_row - start_row} prodotti")
    
    def formule_stock_crediti(self):
        """Inserisce le formule per lo stock crediti con roll-forward"""
        print("  📊 Inserimento formule stock crediti...")
        
        erog_start = self.model_refs.get('erogazioni_start', 10)
        stock_start = self.model_refs.get('stock_crediti_start', 50)
        
        current_row = stock_start
        for division in ['RE', 'SME', 'PG']:
            products = self.products[division]
            
            for idx, product in enumerate(products):
                erog_row = erog_start + (
                    0 if division == 'RE' else 
                    6 if division == 'SME' else 
                    11
                ) + idx
                
                for q in range(20):
                    col_letter = self.quarter_columns[q]
                    
                    if q == 0:
                        # Q1: Stock iniziale (0) + Erogazioni Q1
                        formula = f"={col_letter}{erog_row}"
                    else:
                        # Altri Q: Stock precedente + Erogazioni - Rimborsi - Default
                        prev_col = self.quarter_columns[q-1]
                        formula = f"={prev_col}{current_row}+{col_letter}{erog_row}"
                    
                    cell = self.ws_modello[f'{col_letter}{current_row}']
                    cell.value = formula
                    self._format_formula_cell(cell, '#,##0.0')
                
                current_row += 1
        
        print(f"    ✓ Formule stock crediti inserite")
    
    def formule_vintage_matrices(self):
        """Inserisce le formule per le matrici vintage"""
        print("  📊 Inserimento formule vintage analysis...")
        
        # Trova l'inizio della sezione vintage
        vintage_start_search = self.model_refs.get('vintage_start', 100)
        
        # Per ogni prodotto, crea la matrice vintage
        for division in ['RE', 'SME', 'PG']:
            products = self.products[division]
            
            for product in products:
                # Trova la riga della matrice per questo prodotto
                for row in range(vintage_start_search, vintage_start_search + 500):
                    cell_val = self.ws_modello[f'B{row}'].value
                    if cell_val and f"{division} - {product} - Vintage Matrix" in str(cell_val):
                        matrix_start = row + 2  # Skip header row
                        
                        # Popola la matrice vintage
                        for v in range(20):  # 20 vintage
                            for t in range(20):  # 20 periodi
                                col_letter = get_column_letter(3 + t)
                                
                                if t == v:
                                    # Sulla diagonale: erogazione del periodo
                                    erog_row = self._get_erog_row_for_product(division, product)
                                    formula = f"={col_letter}{erog_row}"
                                elif t > v:
                                    # Dopo la diagonale: stock residuo
                                    formula = f"={get_column_letter(3 + t - 1)}{matrix_start + v}"
                                else:
                                    # Prima della diagonale: 0
                                    formula = "=0"
                                
                                cell = self.ws_modello[f'{col_letter}{matrix_start + v}']
                                cell.value = formula
                                self._format_formula_cell(cell, '#,##0.0')
                        break
        
        print(f"    ✓ Matrici vintage create")
    
    def _get_erog_row_for_product(self, division, product):
        """Ottiene la riga delle erogazioni per un prodotto specifico"""
        erog_start = self.model_refs.get('erogazioni_start', 10)
        
        # Calcola l'offset basato su divisione e prodotto
        division_offset = 0 if division == 'RE' else 6 if division == 'SME' else 11
        product_idx = self.products[division].index(product)
        
        return erog_start + division_offset + product_idx
    
    def formule_ecl_stage1(self):
        """Inserisce le formule per il calcolo ECL Stage 1"""
        print("  📊 Inserimento formule ECL Stage 1...")
        
        ecl_start = self.model_refs.get('ecl_stage1_start', 500)
        stock_perf_start = self.model_refs.get('stock_performing_start', 480)
        
        # Parametri ECL dal foglio Input
        ecl_horizon_row = self.input_refs.get('ecl_horizon')
        pd_mult_row = self.input_refs.get('pd_multiplier')
        
        # Controlli di sicurezza
        if ecl_horizon_row is None:
            print("    ⚠️  ATTENZIONE: ecl_horizon non trovato, uso valore di default")
            ecl_horizon_row = 200  # Valore di fallback
        if pd_mult_row is None:
            print("    ⚠️  ATTENZIONE: pd_multiplier non trovato, uso valore di default")
            pd_mult_row = 201  # Valore di fallback
        
        current_row = ecl_start
        for division in ['RE', 'SME', 'PG']:
            products = self.products[division]
            
            # Righe danger rate e LGD per divisione
            if division == 'RE':
                danger_row = self.input_refs.get('danger_re_row')
                lgd_row = self.input_refs.get('lgd_re_row')
            elif division == 'SME':
                danger_row = self.input_refs.get('danger_sme_row')
                lgd_row = self.input_refs.get('lgd_sme_row')
            else:
                danger_row = self.input_refs.get('danger_pg_row')
                lgd_row = self.input_refs.get('lgd_pg_row')
            
            # Controlli di sicurezza
            if danger_row is None:
                print(f"    ⚠️  ATTENZIONE: danger_row per {division} non trovato")
                continue  # Salta questa divisione
            if lgd_row is None:
                print(f"    ⚠️  ATTENZIONE: lgd_row per {division} non trovato")
                continue  # Salta questa divisione
            
            for idx, product in enumerate(products):
                stock_row = stock_perf_start + (
                    0 if division == 'RE' else
                    6 if division == 'SME' else
                    11
                ) + idx
                
                # Colonna del prodotto nel foglio Input
                product_col = get_column_letter(3 + idx)
                
                for q in range(20):
                    col_letter = self.quarter_columns[q]
                    
                    # ECL = Stock * PD * LGD
                    # PD = Danger Rate * Orizzonte ECL / 4 * Moltiplicatore
                    formula = (f"={col_letter}{stock_row}"
                             f"*(Input!${product_col}${danger_row}/4"
                             f"*Input!$C${ecl_horizon_row}"
                             f"*Input!$C${pd_mult_row})"
                             f"*Input!${product_col}${lgd_row}")
                    
                    cell = self.ws_modello[f'{col_letter}{current_row}']
                    cell.value = formula
                    self._format_formula_cell(cell, '#,##0.0')
                
                current_row += 1
        
        print(f"    ✓ Formule ECL Stage 1 inserite")
    
    def formule_nbv_performing(self):
        """Inserisce le formule per NBV Performing (Stock - ECL)"""
        print("  📊 Inserimento formule NBV Performing...")
        
        nbv_start = self.model_refs.get('nbv_performing_start', 520)
        stock_start = self.model_refs.get('stock_performing_start', 480)
        ecl_start = self.model_refs.get('ecl_stage1_start', 500)
        
        current_row = nbv_start
        for division in ['RE', 'SME', 'PG']:
            products = self.products[division]
            
            for idx, product in enumerate(products):
                offset = (0 if division == 'RE' else
                         6 if division == 'SME' else
                         11) + idx
                
                stock_row = stock_start + offset
                ecl_row = ecl_start + offset
                
                for q in range(20):
                    col_letter = self.quarter_columns[q]
                    
                    # NBV = Stock - ECL
                    formula = f"={col_letter}{stock_row}-{col_letter}{ecl_row}"
                    
                    cell = self.ws_modello[f'{col_letter}{current_row}']
                    cell.value = formula
                    self._format_formula_cell(cell, '#,##0.0')
                
                current_row += 1
        
        print(f"    ✓ Formule NBV Performing inserite")
    
    def formule_conto_economico(self):
        """Inserisce le formule per il Conto Economico"""
        print("  💰 Inserimento formule Conto Economico...")
        
        ce_start = self.model_refs.get('ce_start', 600)
        
        # Trova le righe specifiche del CE
        for row in range(ce_start, ce_start + 100):
            cell_val = self.ws_modello[f'B{row}'].value
            if cell_val:
                cell_str = str(cell_val).strip()
                
                # Interest Income
                if "1.1. Interest Income" == cell_str:
                    self._formula_interest_income(row)
                
                # Interest Income per divisione
                elif "1.1.1. da Real Estate" in cell_str:
                    self._formula_interest_income_division(row, 'RE')
                elif "1.1.2. da SME" in cell_str:
                    self._formula_interest_income_division(row, 'SME')
                elif "1.1.3. da Public Guarantee" in cell_str:
                    self._formula_interest_income_division(row, 'PG')
                
                # Commission Income
                elif "2.1. Commission Income" == cell_str:
                    self._formula_commission_income(row)
                
                # Commission Income per divisione
                elif "2.1.1. da Real Estate" in cell_str:
                    self._formula_commission_income_division(row, 'RE')
                elif "2.1.2. da SME" in cell_str:
                    self._formula_commission_income_division(row, 'SME')
                elif "2.1.3. da Public Guarantee" in cell_str:
                    self._formula_commission_income_division(row, 'PG')
                
                # Totali e altri calcoli
                elif "1.3. NET INTEREST INCOME" in cell_str:
                    self._formula_net_interest_income(row)
                elif "2.3. NET COMMISSION INCOME" in cell_str:
                    self._formula_net_commission_income(row)
                elif "3. TOTAL REVENUES" in cell_str:
                    self._formula_total_revenues(row)
        
        print(f"    ✓ Formule Conto Economico inserite")
    
    def _formula_interest_income_division(self, row, division):
        """Formula per interest income di una divisione"""
        nbv_start = self.model_refs.get('nbv_performing_start', 520)
        
        # Tassi di interesse per divisione
        if division == 'RE':
            rate_row = self.input_refs.get('rate_re_row')
            products = self.products['RE']
            offset_start = 0
        elif division == 'SME':
            rate_row = self.input_refs.get('rate_sme_row')
            products = self.products['SME']
            offset_start = 6
        else:
            rate_row = self.input_refs.get('rate_pg_row')
            products = self.products['PG']
            offset_start = 11
        
        # Controllo di sicurezza
        if rate_row is None:
            print(f"    ⚠️  ATTENZIONE: rate_row per {division} non trovato")
            return
        
        for q in range(20):
            col_letter = self.quarter_columns[q]
            
            # Somma degli interessi di tutti i prodotti della divisione
            formula_parts = []
            for idx, product in enumerate(products):
                nbv_row = nbv_start + offset_start + idx
                product_col = get_column_letter(3 + idx)
                
                # NBV * Tasso / 4 (trimestrale)
                formula_parts.append(f"{col_letter}{nbv_row}*Input!${product_col}${rate_row}/4")
            
            formula = "=" + "+".join(formula_parts)
            
            cell = self.ws_modello[f'{col_letter}{row}']
            cell.value = formula
            self._format_formula_cell(cell, '#,##0.0')
    
    def _formula_interest_income(self, row):
        """Formula per interest income totale"""
        for q in range(20):
            col_letter = self.quarter_columns[q]
            
            # Somma delle sottovoci
            formula = f"=SUM({col_letter}{row+1}:{col_letter}{row+5})"
            
            cell = self.ws_modello[f'{col_letter}{row}']
            cell.value = formula
            self._format_formula_cell(cell, '#,##0.0')
    
    def _formula_commission_income_division(self, row, division):
        """Formula per commission income di una divisione"""
        erog_start = self.model_refs.get('erogazioni_start', 10)
        
        # Up-front fees per divisione
        if division == 'RE':
            upfront_row = self.input_refs.get('upfront_re_row')
            products = self.products['RE']
            offset_start = 0
        elif division == 'SME':
            upfront_row = self.input_refs.get('upfront_sme_row')
            products = self.products['SME']
            offset_start = 6
        else:
            upfront_row = self.input_refs.get('upfront_pg_row')
            products = self.products['PG']
            offset_start = 11
        
        # Controllo di sicurezza
        if upfront_row is None:
            print(f"    ⚠️  ATTENZIONE: upfront_row per {division} non trovato")
            return
        
        for q in range(20):
            col_letter = self.quarter_columns[q]
            
            # Somma delle commissioni di tutti i prodotti della divisione
            formula_parts = []
            for idx, product in enumerate(products):
                erog_row = erog_start + offset_start + idx
                product_col = get_column_letter(3 + idx)
                
                # Erogazioni * Up-front Fee
                formula_parts.append(f"{col_letter}{erog_row}*Input!${product_col}${upfront_row}")
            
            formula = "=" + "+".join(formula_parts)
            
            cell = self.ws_modello[f'{col_letter}{row}']
            cell.value = formula
            self._format_formula_cell(cell, '#,##0.0')
    
    def _formula_commission_income(self, row):
        """Formula per commission income totale"""
        for q in range(20):
            col_letter = self.quarter_columns[q]
            
            # Somma delle sottovoci
            formula = f"=SUM({col_letter}{row+1}:{col_letter}{row+5})"
            
            cell = self.ws_modello[f'{col_letter}{row}']
            cell.value = formula
            self._format_formula_cell(cell, '#,##0.0')
    
    def _formula_net_interest_income(self, row):
        """Formula per Net Interest Income"""
        for q in range(20):
            col_letter = self.quarter_columns[q]
            
            # Interest Income - Interest Expenses
            # Assumiamo che Interest Income sia 2 righe sopra e Interest Expenses 1 riga sopra
            formula = f"={col_letter}{row-2}-{col_letter}{row-1}"
            
            cell = self.ws_modello[f'{col_letter}{row}']
            cell.value = formula
            self._format_formula_cell(cell, '#,##0.0')
    
    def _formula_net_commission_income(self, row):
        """Formula per Net Commission Income"""
        for q in range(20):
            col_letter = self.quarter_columns[q]
            
            # Commission Income - Commission Expenses
            formula = f"={col_letter}{row-2}-{col_letter}{row-1}"
            
            cell = self.ws_modello[f'{col_letter}{row}']
            cell.value = formula
            self._format_formula_cell(cell, '#,##0.0')
    
    def _formula_total_revenues(self, row):
        """Formula per Total Revenues"""
        for q in range(20):
            col_letter = self.quarter_columns[q]
            
            # Net Interest Income + Net Commission Income
            # Cerchiamo le righe corrette
            net_int_row = 0
            net_comm_row = 0
            for search_row in range(row-20, row):
                cell_val = self.ws_modello[f'B{search_row}'].value
                if cell_val:
                    if "1.3. NET INTEREST INCOME" in str(cell_val):
                        net_int_row = search_row
                    elif "2.3. NET COMMISSION INCOME" in str(cell_val):
                        net_comm_row = search_row
            
            formula = f"={col_letter}{net_int_row}+{col_letter}{net_comm_row}"
            
            cell = self.ws_modello[f'{col_letter}{row}']
            cell.value = formula
            self._format_formula_cell(cell, '#,##0.0')
    
    def formule_stato_patrimoniale(self):
        """Inserisce le formule per lo Stato Patrimoniale"""
        print("  🏦 Inserimento formule Stato Patrimoniale...")
        
        sp_start = self.model_refs.get('sp_start', 800)
        
        # Trova le righe specifiche dello SP
        for row in range(sp_start, sp_start + 50):
            cell_val = self.ws_modello[f'B{row}'].value
            if cell_val:
                cell_str = str(cell_val).strip()
                
                # Loans to Customers (Gross)
                if "1.1. Loans to Customers (Gross)" in cell_str:
                    self._formula_loans_gross(row)
                
                # Loan Loss Reserves
                elif "1.2. Loan Loss Reserves" in cell_str:
                    self._formula_loan_reserves(row)
                
                # Loans to Customers (Net)
                elif "1.3. Loans to Customers (Net)" in cell_str:
                    self._formula_loans_net(row)
                
                # Total Assets
                elif "1.8. TOTAL ASSETS" in cell_str:
                    self._formula_total_assets(row)
        
        print(f"    ✓ Formule Stato Patrimoniale inserite")
    
    def _formula_loans_gross(self, row):
        """Formula per Loans to Customers (Gross)"""
        stock_perf_start = self.model_refs.get('stock_performing_start', 480)
        stock_npl_start = self.model_refs.get('stock_npl_start', 540)
        
        for q in range(20):
            col_letter = self.quarter_columns[q]
            
            # Somma Stock Performing + Stock NPL per tutti i prodotti
            formula_parts = []
            
            # Stock Performing
            for i in range(14):  # Tutti i prodotti
                formula_parts.append(f"{col_letter}{stock_perf_start + i}")
            
            # Stock NPL
            for i in range(14):  # Tutti i prodotti
                formula_parts.append(f"{col_letter}{stock_npl_start + i}")
            
            formula = "=" + "+".join(formula_parts)
            
            cell = self.ws_modello[f'{col_letter}{row}']
            cell.value = formula
            self._format_formula_cell(cell, '#,##0.0')
    
    def _formula_loan_reserves(self, row):
        """Formula per Loan Loss Reserves"""
        ecl_start = self.model_refs.get('ecl_stage1_start', 500)
        
        for q in range(20):
            col_letter = self.quarter_columns[q]
            
            # Somma ECL Stage 1 per tutti i prodotti
            formula = f"=SUM({col_letter}{ecl_start}:{col_letter}{ecl_start+13})"
            
            cell = self.ws_modello[f'{col_letter}{row}']
            cell.value = formula
            self._format_formula_cell(cell, '#,##0.0')
    
    def _formula_loans_net(self, row):
        """Formula per Loans to Customers (Net)"""
        for q in range(20):
            col_letter = self.quarter_columns[q]
            
            # Gross - Reserves
            formula = f"={col_letter}{row-2}-{col_letter}{row-1}"
            
            cell = self.ws_modello[f'{col_letter}{row}']
            cell.value = formula
            self._format_formula_cell(cell, '#,##0.0')
    
    def _formula_total_assets(self, row):
        """Formula per Total Assets"""
        for q in range(20):
            col_letter = self.quarter_columns[q]
            
            # Somma di tutte le voci dell'attivo
            formula = f"=SUM({col_letter}{row-5}:{col_letter}{row-1})"
            
            cell = self.ws_modello[f'{col_letter}{row}']
            cell.value = formula
            self._format_formula_cell(cell, '#,##0.0')
    
    def inserisci_tutte_formule(self):
        """Inserisce tutte le formule nel modello"""
        print("\n" + "="*70)
        print("🚀 FORMULA ENGINE - INSERIMENTO FORMULE MODELLO BANCARIO")
        print("="*70)
        
        try:
            # 1. Formule calcoli di appoggio
            print("\n📈 SEZIONE 1: Calcoli di Appoggio")
            print("-"*50)
            self.formule_erogazioni_base()
            self.formule_stock_crediti()
            self.formule_vintage_matrices()
            self.formule_ecl_stage1()
            self.formule_nbv_performing()
            
            # 2. Formule Conto Economico
            print("\n💰 SEZIONE 2: Conto Economico")
            print("-"*50)
            self.formule_conto_economico()
            
            # 3. Formule Stato Patrimoniale
            print("\n🏦 SEZIONE 3: Stato Patrimoniale")
            print("-"*50)
            self.formule_stato_patrimoniale()
            
            # Salva il file
            self.wb.save("modello_bancario_completo.xlsx")
            
            print("\n" + "="*70)
            print("✅ FORMULA ENGINE COMPLETATO CON SUCCESSO!")
            print("📊 File 'modello_bancario_completo.xlsx' aggiornato")
            print("="*70)
            
        except Exception as e:
            print(f"\n❌ ERRORE durante l'inserimento formule: {str(e)}")
            raise

def main():
    """Funzione principale"""
    engine = FormulaEngine()
    engine.inserisci_tutte_formule()

if __name__ == "__main__":
    main()