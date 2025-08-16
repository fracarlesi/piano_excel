
import pandas as pd

def analyze_excel(file_path):
    """
    Reads an Excel file and prints the first 5 rows of each sheet.
    """
    try:
        xls = pd.ExcelFile(file_path)
        print(f"Successfully read Excel file: {file_path}")
        print("Found sheets:", xls.sheet_names)
        print("\n" + "="*50 + "\n")

        for sheet_name in xls.sheet_names:
            print(f"Analyzing sheet: '{sheet_name}'")
            df = pd.read_excel(xls, sheet_name=sheet_name)
            print("First 5 rows:")
            print(df.head())
            print("\n" + "="*50 + "\n")

    except FileNotFoundError:
        print(f"Error: The file '{file_path}' was not found.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    analyze_excel("modello.xlsx")

