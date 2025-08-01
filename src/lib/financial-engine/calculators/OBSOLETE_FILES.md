# Obsolete Files After Microservice Migration

## Files that can be safely removed:

### 1. **creditCalculatorFixed.js**
- Status: OBSOLETE
- Reason: Replaced by creditCalculatorQuarterly.js
- Dependencies: Uses old llpCalculator.js
- Action: Can be deleted

### 2. **creditCalculatorRefactored.js** 
- Status: OBSOLETE
- Reason: Intermediate refactoring version, replaced by creditCalculatorQuarterly.js
- Dependencies: Not imported anywhere
- Action: Can be deleted

### 3. **llpCalculator.js**
- Status: PARTIALLY OBSOLETE
- Reason: LLP calculation now handled by NBV microservice via dangerRateCalculator
- Current Usage: Only imported by obsolete creditCalculatorFixed.js
- Action: Can be deleted after removing creditCalculatorFixed.js

## Files that have been properly replaced:

### NBV Calculation Chain:
- Old: Direct NBV calculation in various places
- New: 
  1. `defaultRecoveryCalculator.js` - Calculates recovery values
  2. `nbvCalculator.js` - Calculates NPV of recoveries
  3. `dangerRateCalculator.js` - Orchestrates defaults and uses NBV calculator

### Interest Calculation:
- Old: Single interest calculation logic
- New: 
  1. `interestCalculatorBullet.js`
  2. `interestCalculatorFrenchGrace.js`
  3. `interestCalculatorFrenchNoGrace.js`
  4. `interestCalculatorOrchestrator.js`

## Files still in use:

### 1. **recoveryCalculator.js**
- Status: ACTIVE (but contains some obsolete functions)
- Used by: creditCalculatorQuarterly.js (processQuarterlyRecoveries function)
- Obsolete functions: 
  - calculateCollateralRecovery (replaced by defaultRecoveryCalculator)
  - calculateUnsecuredRecovery (replaced by defaultRecoveryCalculator)
  - calculateTotalRecovery (replaced by defaultRecoveryCalculator)
- Action: Keep processQuarterlyRecoveries, remove obsolete functions

### 2. **creditCalculator.js**
- Status: ACTIVE (facade)
- Purpose: Exports creditCalculatorQuarterly as the main calculator
- Action: Keep as is

### 3. **creditCalculatorQuarterly.js**
- Status: ACTIVE (main calculator)
- Purpose: Main credit calculation engine with quarterly granularity
- Action: Keep as is

## Recommendations:

1. Delete obsolete files (creditCalculatorFixed.js, creditCalculatorRefactored.js, llpCalculator.js)
2. Clean up recoveryCalculator.js to remove obsolete functions
3. Update any remaining references to ensure they use the new microservices
4. Run full test suite after cleanup to ensure nothing breaks