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

## Project Structure
- `/src/components/` - React components
- `/src/utils/calculations.js` - Core financial calculations
- `/src/data/defaultAssumptions.js` - Default values and version
- Firebase config in `/src/config/firebase.js`

## Version Changelog
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