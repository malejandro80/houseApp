type RentabilityResultProps = {
  annualRent: number;
  grossYield: number;
  isProfitable: boolean;
  suggestedPrice: number;
  suggestedRent: number;
};

export default function RentabilityResult({ annualRent, grossYield, isProfitable, suggestedPrice, suggestedRent }: RentabilityResultProps) {
  return (
    <div className={`mt-6 sm:mt-8 p-4 sm:p-6 rounded-xl border ${isProfitable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-bold ${isProfitable ? 'text-green-800' : 'text-red-800'}`}>
              {isProfitable ? '¡Propiedad Rentable!' : 'Rentabilidad Baja'}
          </h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${isProfitable ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
              ROI: {grossYield.toFixed(2)}%
          </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm mb-6">
          <div className="bg-white/60 p-3 rounded-lg">
              <p className="text-gray-500">Alquiler Anual</p>
              <p className="font-semibold text-gray-900">${annualRent.toLocaleString()}</p>
          </div>
          <div className="bg-white/60 p-3 rounded-lg">
              <p className="text-gray-500">Rentabilidad Bruta</p>
              <p className="font-semibold text-gray-900">{grossYield.toFixed(2)}%</p>
          </div>
      </div>

      <div className="border-t border-gray-200/50 pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Sugerencias para Rentabilidad</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-sm">
            <div className="bg-blue-50/80 p-3 rounded-lg border border-blue-100">
                <p className="text-blue-600 text-xs uppercase font-bold tracking-wider mb-1">Precio de Compra Ideal</p>
                <p className="text-gray-600 text-xs mb-1">a partir del precio de alquiler estimado</p>
                <p className="font-bold text-blue-900 text-lg">${suggestedPrice.toLocaleString()}</p>
            </div>
            <div className="bg-indigo-50/80 p-3 rounded-lg border border-indigo-100">
                <p className="text-indigo-600 text-xs uppercase font-bold tracking-wider mb-1">Alquiler Sugerido</p>
                <p className="text-gray-600 text-xs mb-1">a partir del precio de compra estimado</p>
                <p className="font-bold text-indigo-900 text-lg">${suggestedRent.toLocaleString()}<span className="text-xs font-normal text-gray-500">/mes</span></p>
            </div>
        </div>
      </div>
    </div>
  );
}
