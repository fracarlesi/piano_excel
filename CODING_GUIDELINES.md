# Coding Guidelines - New Bank S.p.A. Financial Model

## Rule #1: Firebase is the Single Source of Truth

### ❌ NEVER USE FALLBACK VALUES
```javascript
// ❌ BAD: Hardcoded fallbacks
const spread = product.spread || 2.5;
const volumes = assumptions.quarterlyAllocation || [25, 25, 25, 25];
const rate = assumptions.depositRate || 0.5;

// ✅ GOOD: Trust Firebase data
const spread = product.spread;
const volumes = assumptions.quarterlyAllocation;
const rate = assumptions.depositRate;
```

### Exceptions (Only when legitimate)
```javascript
// ✅ OK: Protecting against null/undefined in UI components
const displayValue = value ?? 0; // Only for display, not calculation logic

// ✅ OK: Array/object safety
const safeArray = someArray || []; // Only when array might be undefined
```

## Rule #2: No Default Values in Business Logic

### ❌ NEVER
- Use hardcoded rates, percentages, or amounts in calculators
- Provide fallback values for business parameters
- Override Firebase data with local defaults

### ✅ ALWAYS
- Use data directly from assumptions object
- Let Firebase control all business parameters
- Trust that Firebase has the correct values

## Rule #3: Data Validation

### If data is missing from Firebase:
1. **Fix the data in Firebase**, don't add fallbacks
2. **Log an error** if critical data is missing
3. **Fail fast** rather than use wrong defaults

```javascript
// ✅ GOOD: Fail fast approach
if (!assumptions.quarterlyAllocation) {
  console.error('Missing quarterlyAllocation in Firebase');
  throw new Error('Critical configuration missing');
}
```

## Version History
- v10.23: Established "Firebase as Single Source of Truth" policy
- Removed all quarterly allocation fallbacks
- Eliminated product-level quarterlyDist in favor of global quarterlyAllocation

---

**Remember: Every fallback value is a potential bug waiting to happen when Firebase data changes!**