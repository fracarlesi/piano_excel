import Decimal from 'decimal.js';

export class PersonnelCalculator {
  constructor(divisionData, personnelAssumptions, quarters) {
    this.divisionData = divisionData || {};
    this.personnelAssumptions = personnelAssumptions || {};
    this.quarters = quarters || [];
    
    console.log('    🔨 PersonnelCalculator constructor:');
    console.log('      - Has staffing array:', Array.isArray(this.personnelAssumptions.staffing));
    console.log('      - Staffing array length:', this.personnelAssumptions.staffing?.length);
    console.log('      - Has positions array:', Array.isArray(this.personnelAssumptions.positions));
    console.log('      - Positions array length:', this.personnelAssumptions.positions?.length);
    
    // Map staffing array to positions format if needed
    if (Array.isArray(this.personnelAssumptions.positions) && this.personnelAssumptions.positions.length === 0 
        && Array.isArray(this.personnelAssumptions.staffing)) {
      console.log('      - Converting staffing to positions format');
      // Convert from staffing table format to internal format
      const divisionHeadcountGrowth = this.personnelAssumptions.headcountGrowth || 0;
      this.personnelAssumptions.positions = this.personnelAssumptions.staffing.map(staff => ({
        name: staff.level,
        seniority: this.mapLevelToSeniority(staff.level),
        ral: (staff.ralPerHead || 0) * 1000, // Convert from thousands to actual value
        headcount: staff.count || 0,
        headcountGrowth: divisionHeadcountGrowth // Use division-level growth
      }));
      console.log('      - Converted positions:', this.personnelAssumptions.positions);
    }
  }
  
  mapLevelToSeniority(level) {
    const mapping = {
      'Junior': 'junior',
      'Middle': 'middle', 
      'Senior': 'senior',
      'Head of': 'headOf'
    };
    return mapping[level] || 'junior';
  }

  calculate() {
    const results = {};
    
    this.quarters.forEach(quarter => {
      const quarterPersonnelCosts = this.calculateQuarterPersonnelCosts(quarter);
      results[quarter] = quarterPersonnelCosts;
    });
    
    return results;
  }

  calculateQuarterPersonnelCosts(quarter) {
    const quarterResult = {
      total: new Decimal(0),
      bySeniority: {
        junior: new Decimal(0),
        middle: new Decimal(0),
        senior: new Decimal(0),
        headOf: new Decimal(0)
      },
      details: []
    };

    const positions = this.personnelAssumptions.positions || [];
    const companyTaxMultiplier = new Decimal(this.personnelAssumptions.companyTaxMultiplier || 1.3);
    const annualSalaryReview = new Decimal(this.personnelAssumptions.annualSalaryReview || 0);
    
    if (quarter === 'Q1') {
      console.log(`      🧮 Calculating for quarter ${quarter}:`);
      console.log(`        - Positions to process: ${positions.length}`);
      console.log(`        - Company tax multiplier: ${companyTaxMultiplier}`);
      console.log(`        - Annual salary review: ${annualSalaryReview}%`);
    }
    
    positions.forEach(position => {
      const seniorityData = this.calculateSeniorityQuarterCost(
        position,
        quarter,
        companyTaxMultiplier,
        annualSalaryReview
      );
      
      quarterResult.bySeniority[position.seniority] = quarterResult.bySeniority[position.seniority].plus(seniorityData.cost);
      quarterResult.total = quarterResult.total.plus(seniorityData.cost);
      quarterResult.details.push(seniorityData);
    });
    
    return quarterResult;
  }

  calculateSeniorityQuarterCost(position, quarter, companyTaxMultiplier, annualSalaryReview) {
    const baseRAL = new Decimal(position.ral || 0);
    const headcount = this.getHeadcountForQuarter(position, quarter);
    
    const yearsSinceStart = this.getYearsSinceStart(quarter);
    const salaryGrowthFactor = new Decimal(1).plus(annualSalaryReview.div(100)).pow(yearsSinceStart);
    
    const adjustedRAL = baseRAL.times(salaryGrowthFactor);
    const annualCostPerPerson = adjustedRAL.times(companyTaxMultiplier);
    const quarterCostPerPerson = annualCostPerPerson.div(4);
    const totalQuarterCost = quarterCostPerPerson.times(headcount);
    
    if (quarter === 'Q1') {
      console.log(`        💵 Position: ${position.name} (${position.seniority})`);
      console.log(`          - Base RAL: ${baseRAL.toString()}`);
      console.log(`          - Headcount: ${headcount.toString()}`);
      console.log(`          - Total quarter cost: ${totalQuarterCost.toString()}`);
    }
    
    return {
      position: position.name,
      seniority: position.seniority,
      headcount: headcount,
      ral: adjustedRAL,
      quarterCostPerPerson: quarterCostPerPerson,
      cost: totalQuarterCost
    };
  }

  getHeadcountForQuarter(position, quarter) {
    const quarterIndex = this.quarters.indexOf(quarter);
    const yearIndex = Math.floor(quarterIndex / 4);
    
    const baseHeadcount = new Decimal(position.headcount || 0);
    const growthRate = new Decimal(position.headcountGrowth || 0).div(100);
    
    const growsAutomatically = position.seniority === 'junior' || position.seniority === 'middle';
    
    if (growsAutomatically && yearIndex > 0) {
      return baseHeadcount.times(new Decimal(1).plus(growthRate).pow(yearIndex));
    }
    
    return baseHeadcount;
  }

  getYearsSinceStart(quarter) {
    const quarterIndex = this.quarters.indexOf(quarter);
    return Math.floor(quarterIndex / 4);
  }

  getPersonnelCostsByQuarter() {
    const costs = this.calculate();
    const result = {};
    
    this.quarters.forEach(quarter => {
      result[quarter] = {
        total: costs[quarter].total.toNumber() / 1000000, // Convert to millions
        bySeniority: {
          junior: costs[quarter].bySeniority.junior.toNumber() / 1000000,
          middle: costs[quarter].bySeniority.middle.toNumber() / 1000000,
          senior: costs[quarter].bySeniority.senior.toNumber() / 1000000,
          headOf: costs[quarter].bySeniority.headOf.toNumber() / 1000000
        }
      };
    });
    
    return result;
  }

  getPersonnelCostsForPnL() {
    const costs = this.calculate();
    const pnlData = {};
    
    this.quarters.forEach(quarter => {
      pnlData[quarter] = {
        'Personnel costs': -costs[quarter].total.toNumber() / 1000000, // Convert to millions
        'Personnel costs - Junior': -costs[quarter].bySeniority.junior.toNumber() / 1000000,
        'Personnel costs - Middle': -costs[quarter].bySeniority.middle.toNumber() / 1000000,
        'Personnel costs - Senior': -costs[quarter].bySeniority.senior.toNumber() / 1000000,
        'Personnel costs - Head of': -costs[quarter].bySeniority.headOf.toNumber() / 1000000
      };
    });
    
    return pnlData;
  }
}