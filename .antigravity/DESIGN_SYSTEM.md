# 💎 HouseApp Design System (v2.0)

Este documento es la **fuente de verdad** para el diseño y la experiencia de usuario en HouseApp. Todos los agentes (UX, Frontend, Copy) deben seguir estas reglas para mantener la integridad premium de la plataforma.

## 🎨 Paleta de Colores (Psicología Inversionista)
Buscamos transmitir **seguridad, autoridad y rentabilidad**.

- **Primario (Autoridad):** `Slate 900 (#0F172A)` - Uso en encabezados, botones principales y navegación.
- **Secundario (Confianza):** `Indigo 600 (#4F46E5)` - Uso en acciones secundarias, estados activos y acentos.
- **Acento (Rentabilidad):** `Emerald 600 (#059669)` - Uso exclusivo para indicadores de dinero, rentabilidad positiva y éxito.
- **Fondo:** `Slate 50 (#F8FAFC)` - Para superficies limpias y modernas.
- **Bordes:** `Slate 200 (#E2E8F0)` - Para separaciones sutiles.

## ✍️ Tipografía (Legibilidad de Datos)
- **Fuente Principal:** `Inter` (Sans-serif).
- **Estilo:** 
  - Títulos: `font-black` (900) con `tracking-tighter` para un look tech/moderno.
  - Etiquetas: `uppercase`, `tracking-widest` y `font-bold` para mini-labels.
  - Cuerpo: `text-slate-600` para descripciones y `text-slate-900` para información crítica.

## 🍱 Componentes & UI Patterns
- **Botones Premium:** 
  - Redondeado: `rounded-xl` o `rounded-2xl`.
  - Interactividad: `hover:scale-105 active:scale-95 transition-all`.
  - Sombras: `shadow-lg shadow-slate-900/10`.
- **Navegación:** 
  - Estilo: "Glassmorphism" con `backdrop-blur-xl` y borde semitransparente.
  - Comportamiento: Flotante (`sticky top-0`).
- **Cards de Datos:** 
  - Siempre con bordes sutiles y fondo `white` o `slate-50`.
  - Iconos: `lucide-react` con trazos finos (`thin` o `strokeWidth={1.5}`).

## 🧠 UX & Accesibilidad
- **Jerarquía:** La información financiera (precio, ROI) siempre debe ser el elemento más prominente.
- **Feedback:** Cada clic debe tener una respuesta visual (Framer Motion).
- **Lenguaje:** Evitar tecnicismos de programación. Usar lenguaje humano y directo (Ej: "Escritura al día" en lugar de "deed_ready").

## 🛠 Variables CSS (Source of Truth)
Las variables se encuentran en `src/app/globals.css`:
- `--brand-primary`: Slate 900
- `--brand-secondary`: Indigo 600
- `--brand-accent`: Emerald 600
- `--font-sans`: Inter
