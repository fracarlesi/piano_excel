/**
 * Interest Calculator Orchestrator
 * 
 * Routes interest calculations to specialized microservices based on loan type
 * Provides unified interface for all loan types
 */

import { calculateBulletInterest, calculateBulletPrincipalRepayment } from './bulletInterestCalculator.js';
import { calculateFrenchGraceInterest, calculateFrenchGracePrincipalRepayment } from './frenchGraceInterestCalculator.js';
import { calculateFrenchNoGraceInterest, calculateFrenchNoGracePrincipalRepayment } from './frenchNoGraceInterestCalculator.js';

/**
 * Main interest calculation orchestrator
 * @param {Array} vintages - Array of all loan vintages
 * @param {number} currentQuarter - Current quarter index
 * @param {number} quarterlyRate - Quarterly interest rate
 * @param {number} nplStock - Non-performing loans stock
 * @returns {Object} Complete interest calculation results
 */
export const calculateInterestByType = (vintages, currentQuarter, quarterlyRate, nplStock = 0) => {
  // Separate vintages by type
  const bulletVintages = vintages.filter(v => v.type === 'bullet');
  const frenchGraceVintages = vintages.filter(v => v.type === 'french' && v.gracePeriod > 0);
  const frenchNoGraceVintages = vintages.filter(v => v.type === 'french' && (!v.gracePeriod || v.gracePeriod === 0));
  
  // Calculate interest for each type
  const bulletResult = calculateBulletInterest(bulletVintages, currentQuarter, quarterlyRate);
  const frenchGraceResult = calculateFrenchGraceInterest(frenchGraceVintages, currentQuarter, quarterlyRate);
  const frenchNoGraceResult = calculateFrenchNoGraceInterest(frenchNoGraceVintages, currentQuarter, quarterlyRate);
  
  // Calculate NPL interest (simplified - on NBV)
  const nplInterest = nplStock * quarterlyRate;
  
  // Aggregate results
  const totalPerformingInterest = bulletResult.totalInterest + 
                                 frenchGraceResult.totalInterest + 
                                 frenchNoGraceResult.totalInterest;
  
  const totalInterest = totalPerformingInterest + nplInterest;
  
  const totalInterestBearingPrincipal = bulletResult.interestBearingPrincipal + 
                                       frenchGraceResult.interestBearingPrincipal + 
                                       frenchNoGraceResult.interestBearingPrincipal + 
                                       nplStock;
  
  return {
    totalInterest,
    performingInterest: totalPerformingInterest,
    nplInterest,
    interestBearingPrincipal: totalInterestBearingPrincipal,
    performingPrincipal: totalInterestBearingPrincipal - nplStock,
    averageRate: totalInterestBearingPrincipal > 0 ? totalInterest / totalInterestBearingPrincipal : 0,
    
    // Breakdown by type
    breakdown: {
      bullet: bulletResult,
      frenchWithGrace: frenchGraceResult,
      frenchNoGrace: frenchNoGraceResult,
      npl: {
        totalInterest: nplInterest,
        interestBearingPrincipal: nplStock,
        averageRate: quarterlyRate,
        calculationType: 'npl'
      }
    },
    
    // Detailed breakdown
    allDetails: [
      ...bulletResult.details,
      ...frenchGraceResult.details,
      ...frenchNoGraceResult.details
    ]
  };
};

/**
 * Principal repayment calculation orchestrator
 * @param {Array} vintages - Array of all loan vintages
 * @param {number} currentQuarter - Current quarter index
 * @param {number} quarterlyRate - Quarterly interest rate
 * @returns {Object} Complete principal repayment results
 */
export const calculatePrincipalRepaymentByType = (vintages, currentQuarter, quarterlyRate) => {
  // Separate vintages by type
  const bulletVintages = vintages.filter(v => v.type === 'bullet');
  const frenchGraceVintages = vintages.filter(v => v.type === 'french' && v.gracePeriod > 0);
  const frenchNoGraceVintages = vintages.filter(v => v.type === 'french' && (!v.gracePeriod || v.gracePeriod === 0));
  
  // Calculate repayments for each type
  const bulletRepayment = calculateBulletPrincipalRepayment(bulletVintages, currentQuarter);
  const frenchGraceRepayment = calculateFrenchGracePrincipalRepayment(frenchGraceVintages, currentQuarter, quarterlyRate);
  const frenchNoGraceRepayment = calculateFrenchNoGracePrincipalRepayment(frenchNoGraceVintages, currentQuarter, quarterlyRate);
  
  // Aggregate results
  const totalRepayment = bulletRepayment.totalRepayment + 
                        frenchGraceRepayment.totalRepayment + 
                        frenchNoGraceRepayment.totalRepayment;
  
  return {
    totalRepayment,
    
    // Breakdown by type
    breakdown: {
      bullet: bulletRepayment,
      frenchWithGrace: frenchGraceRepayment,
      frenchNoGrace: frenchNoGraceRepayment
    },
    
    // All details
    allDetails: [
      ...bulletRepayment.details,
      ...frenchGraceRepayment.details,
      ...frenchNoGraceRepayment.details
    ]
  };
};

/**
 * Get loan type classification for UI selection
 * @returns {Array} Available loan types with descriptions
 */
export const getLoanTypes = () => {
  return [
    {
      id: 'bullet',
      name: 'Bullet',
      description: 'Solo interessi trimestrali, capitale a scadenza',
      characteristics: [
        'Interessi pagati ogni trimestre su intero capitale',
        'Rimborso capitale solo alla scadenza',
        'Flusso di cassa costante fino a scadenza'
      ],
      gracePeriod: false,
      amortization: false
    },
    {
      id: 'french_with_grace',
      name: 'Francese con Grace Period',
      description: 'Solo interessi durante grace period, poi rata costante',
      characteristics: [
        'Periodo di grazia: solo interessi su intero capitale',
        'Dopo grace period: rata costante (capitale + interessi)',
        'Capitale si riduce solo dopo il grace period'
      ],
      gracePeriod: true,
      amortization: true
    },
    {
      id: 'french_no_grace',
      name: 'Francese senza Grace Period',
      description: 'Rata costante da subito (capitale + interessi)',
      characteristics: [
        'Rata costante dal primo trimestre dopo erogazione',
        'Ogni rata contiene capitale + interessi',
        'Capitale si riduce progressivamente da subito'
      ],
      gracePeriod: false,
      amortization: true
    }
  ];
};