import { z } from 'zod';

export const propertyTypeEnum = z.enum(['house', 'apartment', 'land', 'commercial', 'warehouse']);
export const legalStatusEnum = z.enum(['deed_ready', 'possession', 'legal_issue']);

// Base fields
const baseSchema = z.object({
  title: z.string().min(3, 'El título es requerido'),
  type: propertyTypeEnum,
  salePrice: z.coerce.number().min(1, 'Precio de venta requerido'),
  rentPrice: z.coerce.number().min(0).default(0),
  areaTotal: z.coerce.number().min(1, 'Área total requerida'),
  areaBuilt: z.coerce.number().min(0).default(0),
  address: z.string().min(5, 'Dirección requerida'),
  neighborhood: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  age: z.coerce.number().min(0).default(0),
  stratum: z.coerce.number().min(1).max(6).default(3),
});

// Specific fields (all optional, validated conditionally)
const detailsSchema = z.object({
  rooms: z.coerce.number().optional(),
  bathrooms: z.coerce.number().optional(),
  parking: z.coerce.number().optional(),
  amenities: z.array(z.string()).optional(),
  
  landUse: z.string().optional(), // Residential, Commercial, Industrial
  topography: z.string().optional(), // Flat, Sloped
  
  frontage: z.coerce.number().optional(),
  footTraffic: z.enum(['high', 'medium', 'low']).optional(),
  
  floorResistance: z.coerce.number().optional(), // Ton/m2
  ceilingHeight: z.coerce.number().optional(),
  loadingDocks: z.coerce.number().optional(),
  power: z.coerce.number().optional(), // kVA
});

// Risk fields
const riskSchema = z.object({
  legalStatus: legalStatusEnum.default('deed_ready'),
  riskZone: z.boolean().default(false),
  roadAffectation: z.boolean().default(false),
  taxDebt: z.coerce.number().default(0),
  heritage: z.boolean().default(false),
});

// Combined schema
export const propertyFormSchema = baseSchema.merge(detailsSchema).merge(riskSchema);

export type PropertyFormData = z.infer<typeof propertyFormSchema>;
