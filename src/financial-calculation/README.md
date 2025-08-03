# Calculation Engines

This directory contains all calculation engines for the application, organized by division.

## Structure

```
calculation/
├── Central/         # Central Functions calculations
├── Digital/         # Digital Bank division calculations
├── General/         # General bank-wide calculations
├── Incentive/       # Incentive Accounts division calculations
├── RealEstate/      # Real Estate division calculations
├── SME/             # SME division calculations
├── Tech/            # Tech division calculations
├── Treasury/        # Treasury/ALM calculations
├── Wealth/          # Wealth Management division calculations
└── shared/          # Shared calculations used by multiple divisions
```

## Guidelines

- Each division folder contains only backend calculation logic
- Shared calculations that are used by multiple divisions go in the `shared/` folder
- All calculations should be pure functions with clear inputs and outputs
- Use Decimal.js for all financial calculations
- Folder names match exactly those in the `assumptions/` directory for consistency