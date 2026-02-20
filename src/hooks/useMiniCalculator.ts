import { useState, useEffect } from 'react';

export const useMiniCalculator = () => {
    const [price, setPrice] = useState<number | ''>('');
    const [rent, setRent] = useState<number | ''>('');
    const [yieldResult, setYieldResult] = useState<number>(0);
    const [status, setStatus] = useState<'bad' | 'ok' | 'good'>('ok');

    useEffect(() => {
        if (price && rent && Number(price) > 0) {
            const annualRent = Number(rent) * 12;
            const calculatedYield = (annualRent / Number(price)) * 100;
            setYieldResult(calculatedYield);

            if (calculatedYield < 5) setStatus('bad');
            else if (calculatedYield < 10) setStatus('ok');
            else setStatus('good');
        } else {
            setYieldResult(0);
            setStatus('ok');
        }
    }, [price, rent]);

    const getFeedback = () => {
        if (!yieldResult) return "Ingresa los valores para calcular.";
        const years = (100 / yieldResult).toFixed(1);
        
        if (status === 'bad') return `Rentabilidad Baja (<5%). Retorno menor al promedio. Recuperarías tu inversión en ${years} años.`;
        if (status === 'ok') return `Rentabilidad Moderada (5-10%). Es una inversión estándar. Recuperarías tu inversión en ${years} años.`;
        return `¡Excelente Oportunidad! (>10%). El retorno es muy atractivo. Recuperarías tu inversión en tan solo ${years} años.`;
    };

    const getColor = (status: 'bad' | 'ok' | 'good') => {
        if (status === 'bad') return 'text-red-500';
        if (status === 'ok') return 'text-yellow-500';
        return 'text-green-500';
    };

    const getBgColor = (status: 'bad' | 'ok' | 'good') => {
        if (status === 'bad') return 'bg-red-500';
        if (status === 'ok') return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return {
        price,
        setPrice,
        rent,
        setRent,
        yieldResult,
        status,
        getFeedback,
        getColor,
        getBgColor
    };
};
