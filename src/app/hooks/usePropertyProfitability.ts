import { useState } from 'react';

export type PropertyData = {
  purchasePrice: number;
  estimatedRent: number;
  expenses: {
    ibi: number;
    community: number;
    insurance: number;
    vacancyMonths: number;
  };
};

export type ProfitabilityResult = {
  annualRent: number;
  grossYield: number;
  netYield: number;
  cashFlow: number;
  monthlyExpenses: number;
  monthlyNetIncome: number;
  totalExpenses: number;
  vacancyCost: number;
  emergencyFund: number;
  isProfitable: boolean;
  investmentHealth: 'safe' | 'average' | 'risky';
  comparisonVsMarket: number; // Percentage difference from average (mocked)
};

export function usePropertyProfitability() {
  const [result, setResult] = useState<ProfitabilityResult | null>(null);

  const calculateProfitability = (data: PropertyData) => {
    // Basic Calculations
    const annualRent = data.estimatedRent * 12;
    const grossYield = (annualRent / data.purchasePrice) * 100;
    
    // Expense Calculations
    const annualVacancyCost = (annualRent / 12) * data.expenses.vacancyMonths;
    const annualExpenses = 
        data.expenses.ibi + 
        (data.expenses.community * 12) + 
        data.expenses.insurance + 
        annualVacancyCost; // Include vacancy as an expense/loss
    
    const monthlyExpenses = annualExpenses / 12;
    const netOperatingIncome = annualRent - annualExpenses;
    const monthlyNetIncome = netOperatingIncome / 12;

    const netYield = (netOperatingIncome / data.purchasePrice) * 100;
    const cashFlow = monthlyNetIncome; // Simplified definition for this context (Monthly Net Income)

    // Investment Health Assessment
    let investmentHealth: 'safe' | 'average' | 'risky' = 'average';
    if (netYield >= 6) investmentHealth = 'safe';
    else if (netYield >= 3) investmentHealth = 'average';
    else investmentHealth = 'risky';

    // Emergency Fund Suggestion (3 months of expenses + potential vacancy if tenant leaves)
    // Here we use 1 month of vacancy as requested: "cover 1 month of empty house" => 1 month rent + 1 month expenses (roughly)
    // Or just 1 month of full rent loss cover? The request says "1 mes de casa vacía". 
    // Usually means you need to cover fixed costs when empty.
    // Let's interpret as: 1 month of fixed costs (Community + Insurance/12 + IBI/12) + 1 month mortgage (if any, but we don't have mortgage here).
    // Let's follow instruction: "Amount user should save to cover 1 month of vacancy".
    // If empty, you lose rent, but you still pay IBI, Community, Insurance.
    // So Emergency Fund for 1 month vacancy = Monthly Fixed Costs.
    // BUT usually Emergency Fund is 3-6 months. Let's make it smarter: 3 months of fixed costs.
    // Let's stick to the prompt: "Cuánto debería ahorrar el usuario para cubrir 1 mes de casa vacía"
    // The "cost" of vacancy is the lost rent (opportunity cost) + actual expenses.
    // Saving "Amount to cover" implies paying the bills.
    const monthlyFixedCosts = (data.expenses.ibi / 12) + data.expenses.community + (data.expenses.insurance / 12);
    // const emergencyFund = monthlyFixedCosts * data.expenses.vacancyMonths; // Covering the actual vacancy duration entered?
    // Let's stick to 1 month explicit request:
    const emergencyFundOneMonth = monthlyFixedCosts; 

    // Market Comparison (Mock - Average Net Yield in a "good" area is around 4-5%)
    const marketAverageYield = 4.5;
    const comparisonVsMarket = netYield - marketAverageYield;

    setResult({
      annualRent,
      grossYield,
      netYield,
      cashFlow,
      monthlyExpenses,
      monthlyNetIncome,
      totalExpenses: annualExpenses,
      vacancyCost: annualVacancyCost,
      emergencyFund: emergencyFundOneMonth,
      isProfitable: netYield > 0,
      investmentHealth,
      comparisonVsMarket
    });
  };

  const resetResult = () => setResult(null);

  return { result, calculateProfitability, resetResult };
}
