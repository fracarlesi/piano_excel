// Main assumptions aggregator
// This file combines all assumptions from the modular structure

// Import General assumptions
import { generalAssumptions, personnelAssumptions } from './General';

// Import Division staffing
import { realEstateStaffing } from './RealEstate';
import { smeStaffing } from './SME';
import { digitalStaffing } from './Digital';
import { techStaffing } from './Tech';
import { incentiveStaffing } from './Incentive';
import { wealthStaffing } from './Wealth';

// Import Division products
import { realEstateProducts } from './RealEstate';
import { smeProducts } from './SME';
import { digitalProducts } from './Digital';
import { techProducts } from './Tech';
import { incentiveProducts } from './Incentive';
import { wealthProducts } from './Wealth';

// Import Central Functions
import { centralFunctionsAssumptions } from './Central';

// Import Treasury
import { treasuryAssumptions, ftpAssumptions } from './Treasury';

// Export the complete defaultAssumptions object
export const defaultAssumptions = {
  // General assumptions
  ...generalAssumptions,
  
  // Global Personnel Parameters
  personnel: personnelAssumptions,
  
  // Division staffing and specific data
  realEstateDivision: realEstateStaffing,
  smeDivision: smeStaffing,
  wealthDivision: wealthStaffing,
  incentiveDivision: incentiveStaffing,
  digitalBankingDivision: digitalStaffing,
  techDivision: techStaffing,
  
  // Central Functions
  centralFunctions: centralFunctionsAssumptions,
  
  // Treasury & ALM
  treasury: {
    ...treasuryAssumptions,
    // Remove staffing from here as it's included above
    headcountGrowth: treasuryAssumptions.headcountGrowth,
    staffing: treasuryAssumptions.staffing
  },
  
  // FTP System
  ...ftpAssumptions,
  
  // All products merged
  products: {
    ...realEstateProducts,
    ...smeProducts,
    ...digitalProducts,
    ...techProducts,
    ...incentiveProducts,
    ...wealthProducts
  }
};

// Export individual components for flexibility
export {
  generalAssumptions,
  personnelAssumptions,
  realEstateStaffing,
  smeStaffing,
  digitalStaffing,
  techStaffing,
  incentiveStaffing,
  wealthStaffing,
  centralFunctionsAssumptions,
  treasuryAssumptions,
  ftpAssumptions,
  realEstateProducts,
  smeProducts,
  digitalProducts,
  techProducts,
  incentiveProducts,
  wealthProducts
};