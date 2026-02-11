'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Map as MapIcon } from "lucide-react";

export default function HeroSection() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="text-center mb-12"
    >
      <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
        Calculadora de Inversiones Inmobiliarias
      </h1>
      <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
        Evalúa rápidamente si una propiedad es una buena oportunidad de inversión basándote en su rentabilidad estimada.
      </p>
      <motion.div 
        className="mt-8"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Link href="/map" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
          <MapIcon className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
          Ver Mapa de Propiedades
        </Link>
      </motion.div>
    </motion.div>
  );
}
