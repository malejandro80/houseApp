import { useState } from 'react';

export type PropertyData = {
  purchasePrice: number;
  estimatedRent: number;
};

export type ProfitabilityResult = {
  annualRent: number;
  grossYield: number;
  isProfitable: boolean;
  suggestedPrice: number;
  suggestedRent: number;
};

export function usePropertyProfitability() {
  const [result, setResult] = useState<ProfitabilityResult | null>(null);

  const calculateProfitability = (data: PropertyData) => {
    const annualRent = data.estimatedRent * 12;
    const grossYield = (annualRent / data.purchasePrice) * 100;
    const isProfitable = grossYield >= 5; // Simple threshold for example

    // Calculations for suggestions (Target Yield = 5%)
    const targetYield = 0.05;
    const suggestedPrice = annualRent / targetYield;
    const suggestedRent = (data.purchasePrice * targetYield) / 12;

    setResult({
      annualRent,
      grossYield,
      isProfitable,
      suggestedPrice,
      suggestedRent,
    });
  };

  const resetResult = () => setResult(null);

  return { result, calculateProfitability, resetResult };
}
