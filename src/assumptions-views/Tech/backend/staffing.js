import { techProducts } from './products';

// Tech Division Staffing
export const techStaffing = {
  headcountGrowth: 8, // % annual headcount growth
  staffing: [
    { level: 'Junior', count: 6, ralPerHead: 40 },
    { level: 'Middle', count: 5, ralPerHead: 55 },
    { level: 'Senior', count: 3, ralPerHead: 75 },
    { level: 'Head of', count: 1, ralPerHead: 130 }
  ],
  products: techProducts
};