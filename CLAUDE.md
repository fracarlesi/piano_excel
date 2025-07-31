# Claude Code Instructions for Bank Plan Project

## Project Overview
This is a financial planning application for New Bank S.p.A. with real-time collaboration via Firebase.

## Key Commands to Run
- **Lint Check**: `npm run lint`
- **Type Check**: `npm run typecheck` (if available)
- **Build**: `npm run build`
- **Deploy**: `npm run deploy`

## Important Guidelines
1. Always run lint before committing changes
2. **VERSIONING RULE**: SEMPRE incrementare la versione in `defaultAssumptions.js` per OGNI modifica funzionale:
   - Bug fix minori: incrementa di 0.01 (es: 5.10 → 5.11)
   - Nuove feature/modifiche sostanziali: incrementa di 0.1 (es: 5.10 → 5.20)
   - Cambiamenti major/breaking changes: incrementa di 1.0 (es: 5.10 → 6.00)
   - Aggiorna anche il commento accanto alla versione descrivendo il cambiamento
3. All assumptions should have descriptive tooltips
4. Maintain Italian language for business terms where appropriate
5. Test Firebase sync after major changes

## Project Structure (v10.00 - Enterprise Architecture)
```
/src/
├── features/              # Feature-based modules
│   ├── financial-modeling/    # Main financial planning UI
│   └── assumptions-editor/    # Assumption editing components
├── lib/                   # Core business logic
│   ├── financial-engine/      # Calculation engine
│   │   ├── strategies/        # Loan amortization strategies
│   │   ├── calculators/       # Specialized calculators
│   │   └── utils/            # Decimal.js utilities
│   ├── firebase/             # Firebase configuration
│   └── utils/                # Shared utilities
├── store/                 # Zustand state management
├── components/            # Reusable UI components
└── data/                  # Default assumptions
```

Key Technologies:
- **State Management**: Zustand (replaced React Context)
- **Precision Math**: Decimal.js for financial calculations
- **Design Patterns**: Strategy pattern for loan types
- **Architecture**: Feature-based folder structure

## Version Changelog
### v10.00 (2025-07-31)
- Enterprise-grade architectural refactoring
- Feature-based folder structure for better organization
- Implemented Decimal.js for precise financial calculations
- Strategy pattern for loan amortization types
- Zustand state management replacing React Context
- Eliminated prop drilling with global state store
- Firebase synchronization integrated with Zustand
- Professional-grade code organization and modularity

### v9.00 (2025-07-31)
- Major architectural refactoring for improved maintainability
- Modularized calculation engine with specialized calculators
- Implemented React Context for centralized state management
- Created StandardDivisionSheet for uniform division visualization
- Simplified DivisionAssumptions with product-specific components
- Eliminated prop drilling throughout component hierarchy
- Fixed all personnel cost calculation and display issues

### v8.02 (2025-07-31)
- Fixed critical bug where division data was being completely overwritten
- Now preserving existing division data when recalculating
- This fixes the issue where Digital and Real Estate divisions were losing their personnel costs

### v8.01 (2025-07-31)
- Created centralized division mappings in `/src/utils/divisionMappings.js`
- Eliminated all duplicate mapping definitions throughout the codebase
- Fixed inconsistent division naming that was causing personnel costs to show only for Wealth division
- Single source of truth for all division-related mappings

### v8.00 (2025-07-31) - MAJOR REFACTORING
- **Architectural Change**: Complete refactoring of personnel cost calculation system
- Created dedicated modular calculator in `/src/utils/calculators/personnelCalculator.js`
- Explicit data flow: personnel costs calculated once upfront and explicitly assigned
- Eliminated complex mapping and potential data loss issues
- Clear separation of concerns: personnel logic isolated from main calculation engine
- Better maintainability and easier debugging with clear data structure

### v7.31 (2025-07-31)
- Fixed critical bug where division structure was being recreated, wiping out personnel costs
- Personnel costs now properly preserved when calculating division-level results
- Added extensive logging to trace data flow for debugging

### v7.23 (2025-07-31)
- Personnel costs from bottom-up model now correctly reflected in P&L for each division
- Division FTE in KPIs now shows actual headcount from staffing tables
- Fixed calculation logic to use new personnel data structure
- Each division's P&L now shows its specific personnel costs
### v7.22 (2025-07-31)
- Headcount growth now applies only to Junior and Middle levels
- Senior and Head of positions remain constant over time (no automatic growth)
- Added visual indicator (↗) for levels subject to growth in staffing tables
- Updated UI labels and tooltips to clarify growth behavior
### v7.21 (2025-07-31)
- Fixed staffing tables to always show all 4 seniority levels (Junior, Middle, Senior, Head of)
- Added default RAL values for each level when adding new positions
- Tables now allow adding personnel at any seniority level even if not initially present
### v7.20 (2025-07-31)
- Moved personnel staffing from centralized structure to individual division assumptions
- Each division now manages its own staffing table (headcount growth, levels, RAL)
- Central Functions split into 9 departments with individual staffing
- Kept only global parameters (annualSalaryReview, companyTaxMultiplier) in personnel object
- Better organization and division-specific control of HR planning
### v5.20 (2025-07-31)
- Fixed unsecured fields appearing in Structure & Operations section
- Properly filtered fields to show only in Risk & RWA section

### v5.19 (2025-07-31)
- Fixed duplicate display of Unsecured LGD field
- Properly organized unsecured-specific fields

### v5.18 (2025-07-31)
- Fixed unsecured loan selection dropdown functionality
- Corrected boolean handling for Secured/Unsecured toggle

### v5.17 (2025-07-31)
- Added support for unsecured loans:
  - New "Secured/Unsecured" toggle for credit products
  - Configurable LGD for unsecured loans (default 45%)
  - Dynamic UI that shows relevant fields based on loan type
  - Proper LGD calculation for both secured and unsecured loans

### v5.16 (2025-07-31)
- UI improvement: Changed "Bank Navigation" to "Model Navigation" for clarity
- Minor interface enhancement

### v5.15 (2025-07-31)
- Implemented smart merge logic for Firebase sync:
  - Structure and new fields come from code (defaultAssumptions.js)
  - Existing values are preserved from Firebase (user modifications)
  - Best of both worlds: updated structure + preserved user data
- Added detailed logging to show what's being kept/added

### v5.14 (2025-07-31)
- Fixed version comparison logic to handle semantic versioning correctly
- Now properly compares versions like 5.9 vs 5.13 (was treating as decimals)
- Version auto-sync now works correctly

### v5.13 (2025-07-31)
- Added anonymous authentication for Firebase write permissions
- Enables automatic version sync from code to database
- No user login required - authentication happens automatically

### v5.12 (2025-07-31)
- Auto-sync version from defaultAssumptions.js to Firebase on production deployment
- No manual intervention needed: version updates automatically when deployed
- Removed unnecessary scripts folder

### v5.11 (2025-07-31)
- Implemented development mode: uses local defaultAssumptions.js instead of Firebase
- Added visual indicator for Local Dev Mode in header
- Faster development workflow without Firebase sync delays

### v5.10 (2025-07-31)
- Added comprehensive tooltip system for all assumptions
- Enhanced user guidance with detailed explanations of each parameter

### v5.9 (2025-07-31) 
- Added Central Functions division for non-allocated costs
- Added Treasury/ALM division for liquidity management
- Implemented FTP (Funds Transfer Pricing) mechanism

### v5.8 (2025-07-31)
- Implemented Firebase Realtime Database integration
- Replaced localStorage with cloud-based persistence
- Added real-time collaboration features

### v5.7
- Added expandable/collapsible rows in financial tables
- Improved UI for product-level detail viewing

## Notes
- The app uses Firebase Realtime Database for persistence
- Auto-save is enabled with 3-second debouncing
- All financial calculations follow Italian banking standards