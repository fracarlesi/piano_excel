import { calculateAllPersonnelCosts, getDivisionPersonnelCosts } from '../personnelCalculator';

describe('Personnel Calculator - Core Logic Tests', () => {
  const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  describe('Cumulative Headcount Growth', () => {
    test('should apply compound growth to headcount correctly', () => {
      // Setup: Start with 10 employees, 10% annual growth
      const assumptions = {
        personnel: {
          annualSalaryReview: 0, // No salary increase for this test
          companyTaxMultiplier: 1.4
        },
        realEstateDivision: {
          headcountGrowth: 10, // 10% annual growth
          staffing: [
            { level: 'Junior', count: 10, ralPerHead: 30 }
          ]
        }
      };

      const result = calculateAllPersonnelCosts(assumptions, years);
      const rePersonnel = getDivisionPersonnelCosts(result, 'RealEstateFinancing');
      
      // Extract headcount for years 0, 1, 2, 3
      const headcounts = rePersonnel.headcount;
      
      // Year 0: 10 employees
      expect(headcounts[0]).toBeCloseTo(10, 1);
      
      // Year 1: 10 * 1.1 = 11
      expect(headcounts[1]).toBeCloseTo(11, 1);
      
      // Year 2: 10 * 1.1 * 1.1 = 12.1 (not 12!)
      expect(headcounts[2]).toBeCloseTo(12.1, 1);
      
      // Year 3: 10 * 1.1^3 = 13.31
      expect(headcounts[3]).toBeCloseTo(13.31, 1);
      
      console.log('Headcount progression with 10% compound growth:');
      console.log('Year 0:', headcounts[0]);
      console.log('Year 1:', headcounts[1]);
      console.log('Year 2:', headcounts[2]);
      console.log('Year 3:', headcounts[3]);
    });

    test('should NOT apply growth to Senior and Head of positions', () => {
      // Setup: Mixed seniority levels with growth
      const assumptions = {
        personnel: {
          annualSalaryReview: 0,
          companyTaxMultiplier: 1.4
        },
        smeDivision: {
          headcountGrowth: 20, // 20% growth for Junior/Middle only
          staffing: [
            { level: 'Junior', count: 5, ralPerHead: 30 },
            { level: 'Middle', count: 5, ralPerHead: 45 },
            { level: 'Senior', count: 5, ralPerHead: 65 },
            { level: 'Head of', count: 2, ralPerHead: 120 }
          ]
        }
      };

      const result = calculateAllPersonnelCosts(assumptions, years);
      const smePersonnel = getDivisionPersonnelCosts(result, 'SMEFinancing');
      
      // Get detailed breakdown for year 3
      const year3Details = smePersonnel.details[3];
      
      // Find each level
      const junior = year3Details.find(d => d.level === 'Junior');
      const middle = year3Details.find(d => d.level === 'Middle');
      const senior = year3Details.find(d => d.level === 'Senior');
      const headOf = year3Details.find(d => d.level === 'Head of');
      
      // Junior and Middle should grow: 5 * 1.2^3 = 8.64
      expect(junior.headcount).toBeCloseTo(8.64, 1);
      expect(middle.headcount).toBeCloseTo(8.64, 1);
      
      // Senior and Head of should NOT grow
      expect(senior.headcount).toBeCloseTo(5, 1);
      expect(headOf.headcount).toBeCloseTo(2, 1);
      
      console.log('\nYear 3 headcount by level (20% growth for Junior/Middle only):');
      console.log('Junior:', junior.headcount, '(grows)');
      console.log('Middle:', middle.headcount, '(grows)');
      console.log('Senior:', senior.headcount, '(fixed)');
      console.log('Head of:', headOf.headcount, '(fixed)');
    });
  });

  describe('Cumulative Salary Growth', () => {
    test('should apply compound salary increases correctly', () => {
      // Setup: 50k€ starting salary, 5% annual review
      const assumptions = {
        personnel: {
          annualSalaryReview: 5, // 5% annual increase
          companyTaxMultiplier: 1 // No multiplier for this test
        },
        wealthDivision: {
          headcountGrowth: 0, // No headcount growth for this test
          staffing: [
            { level: 'Middle', count: 1, ralPerHead: 50 } // 50k€ starting
          ]
        }
      };

      const result = calculateAllPersonnelCosts(assumptions, years);
      const wealthPersonnel = getDivisionPersonnelCosts(result, 'WealthAndAssetManagement');
      
      // Extract cost per head for years 0, 1, 2, 3
      const details = wealthPersonnel.details.map(yearDetails => yearDetails[0]);
      
      // Year 0: 50k€
      expect(details[0].ralPerHead).toBeCloseTo(50, 1);
      
      // Year 1: 50 * 1.05 = 52.5k€
      expect(details[1].ralPerHead).toBeCloseTo(52.5, 1);
      
      // Year 2: 50 * 1.05^2 = 55.125k€ (not 55k€!)
      expect(details[2].ralPerHead).toBeCloseTo(55.125, 1);
      
      // Year 3: 50 * 1.05^3 = 57.88125k€
      expect(details[3].ralPerHead).toBeCloseTo(57.88125, 1);
      
      console.log('\nSalary progression with 5% compound increase:');
      console.log('Year 0:', details[0].ralPerHead, 'k€');
      console.log('Year 1:', details[1].ralPerHead, 'k€');
      console.log('Year 2:', details[2].ralPerHead, 'k€');
      console.log('Year 3:', details[3].ralPerHead, 'k€');
    });
  });

  describe('Combined Growth Effects', () => {
    test('should correctly combine headcount and salary growth', () => {
      // Setup: Both headcount and salary growth
      const assumptions = {
        personnel: {
          annualSalaryReview: 3, // 3% salary increase
          companyTaxMultiplier: 1.4 // Include tax multiplier
        },
        techDivision: {
          headcountGrowth: 8, // 8% headcount growth
          staffing: [
            { level: 'Junior', count: 10, ralPerHead: 40 }
          ]
        }
      };

      const result = calculateAllPersonnelCosts(assumptions, years);
      const techPersonnel = getDivisionPersonnelCosts(result, 'Tech');
      
      // Year 0 cost: 10 * 40 * 1.4 = 560k€ = 0.56 €M
      expect(techPersonnel.costs[0]).toBeCloseTo(-0.56, 2);
      
      // Year 3 cost: (10 * 1.08^3) * (40 * 1.03^3) * 1.4
      const year3Headcount = 10 * Math.pow(1.08, 3);
      const year3Salary = 40 * Math.pow(1.03, 3);
      const year3Cost = year3Headcount * year3Salary * 1.4;
      
      expect(Math.abs(techPersonnel.costs[3])).toBeCloseTo(year3Cost / 1000, 2); // Convert to €M
      
      console.log('\nCombined growth effect (8% headcount, 3% salary):');
      console.log('Year 0 cost:', Math.abs(techPersonnel.costs[0]), '€M');
      console.log('Year 3 cost:', Math.abs(techPersonnel.costs[3]), '€M');
      console.log('Expected Y3:', year3Cost / 1000, '€M');
    });
  });

  describe('Central Functions Department Structure', () => {
    test('should correctly aggregate multiple departments', () => {
      const assumptions = {
        personnel: {
          annualSalaryReview: 0,
          companyTaxMultiplier: 1
        },
        centralFunctions: {
          departments: {
            CEOOffice: {
              headcountGrowth: 0,
              staffing: [
                { level: 'Head of', count: 1, ralPerHead: 350 }
              ]
            },
            HR: {
              headcountGrowth: 10,
              staffing: [
                { level: 'Junior', count: 2, ralPerHead: 28 },
                { level: 'Middle', count: 2, ralPerHead: 40 }
              ]
            },
            Legal: {
              headcountGrowth: 5,
              staffing: [
                { level: 'Junior', count: 1, ralPerHead: 40 },
                { level: 'Senior', count: 1, ralPerHead: 85 }
              ]
            }
          }
        }
      };

      const result = calculateAllPersonnelCosts(assumptions, years);
      const centralPersonnel = getDivisionPersonnelCosts(result, 'CentralFunctions');
      
      // Year 0: CEO (350) + HR (2*28 + 2*40 = 136) + Legal (40 + 85 = 125) = 611k€ = 0.611 €M
      const expectedY0Cost = (350 + 136 + 125) / 1000; // Convert to €M
      expect(Math.abs(centralPersonnel.costs[0])).toBeCloseTo(expectedY0Cost, 3);
      
      // Check department breakdown
      const deptDetails = centralPersonnel.details;
      expect(deptDetails.CEOOffice).toBeDefined();
      expect(deptDetails.HR).toBeDefined();
      expect(deptDetails.Legal).toBeDefined();
      
      console.log('\nCentral Functions department costs (Year 0):');
      console.log('CEO Office:', Math.abs(deptDetails.CEOOffice.costs[0]), '€M');
      console.log('HR:', Math.abs(deptDetails.HR.costs[0]), '€M');
      console.log('Legal:', Math.abs(deptDetails.Legal.costs[0]), '€M');
      console.log('Total:', Math.abs(centralPersonnel.costs[0]), '€M');
    });
  });
});