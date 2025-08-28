#!/usr/bin/env python3
import os
import re
from pathlib import Path

def restore_and_fix_slide(file_path):
    """
    Ripristina dalla backup e applica correttamente lo stile PowerPoint
    """
    # Prima ripristina dal backup se esiste
    backup_path = file_path.replace('.html', '_backup.html')
    if os.path.exists(backup_path):
        with open(backup_path, 'r', encoding='utf-8') as f:
            content = f.read()
    else:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    
    # 1. Rimuovi tutto il codice del bottone "Mostra Bordo A4"
    
    # Rimuovi commenti relativi ad A4
    content = re.sub(r'/\*\s*Visualizzazione Bordo A4.*?\*/', '', content, flags=re.DOTALL)
    content = re.sub(r'<!--\s*Visualizzazione Bordo A4\s*-->', '', content)
    content = re.sub(r'<!--\s*Bottone toggle A4.*?-->', '', content, flags=re.DOTALL)
    content = re.sub(r'<!--\s*A4 Border Overlay.*?-->', '', content, flags=re.DOTALL)
    
    # Rimuovi classi CSS A4
    content = re.sub(r'\.a4-toggle-btn\s*\{[^}]*\}', '', content, flags=re.DOTALL)
    content = re.sub(r'\.a4-toggle-btn:hover\s*\{[^}]*\}', '', content, flags=re.DOTALL)
    content = re.sub(r'\.a4-border-view\s*\{[^}]*\}', '', content, flags=re.DOTALL)
    content = re.sub(r'\.a4-border-view\.active\s*\{[^}]*\}', '', content, flags=re.DOTALL)
    content = re.sub(r'\.a4-border-frame\s*\{[^}]*\}', '', content, flags=re.DOTALL)
    content = re.sub(r'\.a4-border-label\s*\{[^}]*\}', '', content, flags=re.DOTALL)
    content = re.sub(r'\.a4-overlay\s*\{[^}]*\}', '', content, flags=re.DOTALL)
    
    # Rimuovi HTML del bottone A4
    content = re.sub(r'<button[^>]*class="a4-toggle-btn"[^>]*>.*?</button>', '', content, flags=re.DOTALL)
    content = re.sub(r'<div[^>]*class="a4-border-view"[^>]*>.*?</div>\s*</div>', '', content, flags=re.DOTALL)
    
    # Rimuovi JavaScript del toggle
    content = re.sub(r'function\s+toggleA4Border\s*\(\)\s*\{[^}]*\}', '', content, flags=re.DOTALL)
    content = re.sub(r'document\.addEventListener\(\'keydown\'[^}]*toggleA4Border[^}]*\}\);', '', content, flags=re.DOTALL)
    
    # 2. Modifica lo stile del body per aggiungere sfondo PowerPoint
    # Trova e sostituisci lo stile del body esistente
    body_pattern = r'body\s*\{([^}]*)\}'
    
    def replace_body(match):
        # Mantieni font-family se presente
        existing = match.group(1)
        font_family = ""
        if 'font-family' in existing:
            font_match = re.search(r'font-family:[^;]+;', existing)
            if font_match:
                font_family = font_match.group(0)
        
        if not font_family:
            font_family = "font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Arial', sans-serif;"
        
        return f"""body {{
            {font_family}
            /* Sfondo grigio scuro PowerPoint */
            background: #404040;
            color: var(--dark-grey);
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }}"""
    
    content = re.sub(body_pattern, replace_body, content, count=1, flags=re.DOTALL)
    
    # 3. Modifica lo stile della slide per aggiungere bordo e ombra PowerPoint
    slide_pattern = r'\.slide\s*\{([^}]*)\}'
    
    def replace_slide(match):
        return f""".slide {{
            width: 1122px;
            height: 794px;
            background: white;
            /* Bordo nero visibile per delimitare A4 */
            border: 1px solid #2a2a2a;
            /* Ombra professionale PowerPoint */
            box-shadow: 
                0 0 30px rgba(0, 0, 0, 0.4),
                0 10px 50px rgba(0, 0, 0, 0.3);
            padding: 40px;
            box-sizing: border-box;
            overflow: hidden;
            position: relative;
            page-break-after: always;
            display: flex;
            align-items: center;
            justify-content: center;
        }}"""
    
    content = re.sub(slide_pattern, replace_slide, content, count=1, flags=re.DOTALL)
    
    # 4. Pulisci spazi vuoti multipli nel CSS
    content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
    
    # 5. Se c'è ancora del JavaScript con toggleA4Border, sostituiscilo con script vuoto
    if 'toggleA4Border' in content:
        content = re.sub(r'<script>.*?</script>', '<script>\n    // Clean script\n</script>', content, flags=re.DOTALL)
    
    # Salva il file aggiornato
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return True

def main():
    """
    Processa tutte le slide da slide_01.html a slide_23.html
    """
    output_dir = Path("/Users/francescocarlesi/Downloads/Progetti Python/piano industriale excel/output")
    
    # Lista delle slide da processare (da 1 a 23)
    slides_to_process = []
    for i in range(1, 24):
        slide_file = output_dir / f"slide_{i:02d}.html"
        if slide_file.exists():
            slides_to_process.append(slide_file)
    
    print(f"Trovate {len(slides_to_process)} slide da processare")
    print("Ripristino dai backup e applicazione stile PowerPoint corretto...")
    
    # Processa ogni slide
    success_count = 0
    for slide_path in slides_to_process:
        try:
            print(f"Processando: {slide_path.name}...", end=" ")
            if restore_and_fix_slide(str(slide_path)):
                print("✓ OK")
                success_count += 1
            else:
                print("✗ Errore")
        except Exception as e:
            print(f"✗ Errore: {str(e)}")
    
    print(f"\n{'='*60}")
    print(f"Completato: {success_count}/{len(slides_to_process)} slide aggiornate con successo")
    
    # Verifica una slide campione
    if success_count > 0:
        print(f"\n{'='*60}")
        print("Verifica slide campione (slide_01.html):")
        sample_file = output_dir / "slide_01.html"
        if sample_file.exists():
            with open(sample_file, 'r', encoding='utf-8') as f:
                content = f.read()
                # Verifica che non ci siano più riferimenti al bottone
                has_button = 'toggleA4Border' in content or 'a4-toggle-btn' in content or 'a4-border' in content
                has_powerpoint_style = '#404040' in content and 'box-shadow' in content
                
                print(f"  ✓ Bottone A4 rimosso: {'Sì' if not has_button else 'No'}")
                print(f"  ✓ Stile PowerPoint applicato: {'Sì' if has_powerpoint_style else 'No'}")
                print(f"  ✓ Contenuto preservato: {'Sì' if 'WHITE BANK' in content or 'action-title' in content else 'No'}")

if __name__ == "__main__":
    main()