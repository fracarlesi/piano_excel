# Test Results for Financial Engine Calculators

## Personnel Calculator Tests ✅

All personnel calculator tests are passing. The tests validate:

### 1. Cumulative Headcount Growth
- **Test**: Start with 10 employees, 10% annual growth
- **Result**: Year 3 shows 13.31 employees (10 × 1.1³)
- **Validates**: Compound growth is correctly applied, not linear

### 2. Selective Growth by Seniority
- **Test**: 20% growth applied to different seniority levels
- **Result**: Junior/Middle grow to 8.64 (5 × 1.2³), Senior/Head of stay at 5 and 2
- **Validates**: Growth only applies to Junior and Middle positions as designed

### 3. Cumulative Salary Increases
- **Test**: 50k€ starting salary, 5% annual review
- **Result**: Year 3 shows 57.88k€ (50 × 1.05³)
- **Validates**: Compound salary growth is correctly calculated

### 4. Combined Effects
- **Test**: 8% headcount growth + 3% salary growth
- **Result**: Total cost grows from 0.56 €M to 0.77 €M over 3 years
- **Validates**: Both growth factors compound correctly together

### 5. Department Aggregation
- **Test**: Central Functions with multiple departments
- **Result**: CEO (0.35) + HR (0.136) + Legal (0.125) = 0.611 €M
- **Validates**: Department costs aggregate correctly

## Credit Calculator Tests ⚠️

The credit calculator tests reveal complex behavior that needs further investigation:

### 1. Quarterly Allocation ✅
- **Q1 Disbursement**: 75% of annual interest (9 months)
- **Q4 Disbursement**: 0% of annual interest (no time for accrual)
- **Validates**: Interest accrual follows banking convention (starts quarter after disbursement)

### 2. Outstanding Stock Calculation ❓
- **Issue**: Performing assets showing unexpected multiplier (12.5x)
- **Needs**: Further investigation of vintage accumulation logic

### 3. Amortization Behavior ❓
- **Issue**: French amortization not showing expected decreasing interest pattern
- **Needs**: Review of quarterly amortization calculations

## Recommendations

1. **Personnel Calculator**: Ready for production use with high confidence
2. **Credit Calculator**: Requires additional investigation to understand:
   - The 12.5x multiplier in performing assets
   - Quarterly vintage accumulation logic
   - French amortization implementation

## Test Coverage Summary

| Calculator | Tests Written | Tests Passing | Confidence Level |
|------------|--------------|---------------|------------------|
| Personnel  | 5            | 5 (100%)      | High ✅          |
| Credit     | 5            | 2 (40%)       | Low ⚠️           |