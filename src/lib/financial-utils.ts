export type InvestmentHealth = 'safe' | 'average' | 'risky';

export const getHealthLabel = (health: InvestmentHealth) => {
  switch (health) {
    case 'safe': return { text: 'Excelente', color: 'text-green-600', bg: 'bg-green-100', borderColor: 'border-green-200' };
    case 'average': return { text: 'Promedio', color: 'text-yellow-600', bg: 'bg-yellow-100', borderColor: 'border-yellow-200' };
    case 'risky': return { text: 'Riesgo', color: 'text-red-600', bg: 'bg-red-100', borderColor: 'border-red-200' };
    default: return { text: 'Desconocido', color: 'text-gray-600', bg: 'bg-gray-100', borderColor: 'border-gray-200' };
  }
};

export const calculateProfitabilityForList = (purchasePrice: number, estimatedRent: number): { netReturn: number, health: InvestmentHealth } => {
  if (!purchasePrice || purchasePrice <= 0) return { netReturn: 0, health: 'risky' };
  
  const annualRent = estimatedRent * 12;
  // Simple estimation for list view: 20% expenses
  const netIncome = annualRent * 0.8; 
  const roi = (netIncome / purchasePrice) * 100;

  let health: InvestmentHealth = 'risky';
  if (roi >= 6) health = 'safe';
  else if (roi >= 4) health = 'average';

  return { netReturn: roi, health };
};
