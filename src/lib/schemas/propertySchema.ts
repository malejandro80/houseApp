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
  neighborhood: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  age: z.coerce.number().min(0).default(0),
  physicalCondition: z.coerce.number().min(1).max(5).default(3),
});

// Specific fields (all optional, validated conditionally)
const detailsSchema = z.object({
  rooms: z.coerce.number().nullable().optional(),
  bathrooms: z.coerce.number().nullable().optional(),
  parking: z.coerce.number().nullable().optional(),
  amenities: z.array(z.string()).nullable().optional(),
  
  landUse: z.string().nullable().optional(), // Residential, Commercial, Industrial
  topography: z.string().nullable().optional(), // Flat, Sloped
  
  frontage: z.coerce.number().nullable().optional(),
  footTraffic: z.enum(['high', 'medium', 'low']).nullable().optional(),
  
  floorResistance: z.coerce.number().nullable().optional(), // Ton/m2
  ceilingHeight: z.coerce.number().nullable().optional(),
  loadingDocks: z.coerce.number().nullable().optional(),
  power: z.coerce.number().nullable().optional(), // kVA
});

// Risk fields
const riskSchema = z.object({
  legalStatus: legalStatusEnum.default('deed_ready'),
  riskZone: z.boolean().default(false),
  roadAffectation: z.boolean().default(false),
  taxDebt: z.coerce.number().default(0),
  heritage: z.boolean().default(false),
  acceptedListingTerms: z.boolean().default(false),
});

// Contact fields
const contactSchema = z.object({
  ownerName: z.string().nullable().optional(),
  ownerPhone: z.string().nullable().optional(),
  ownerEmail: z.string().email('Email inválido').nullable().optional().or(z.literal('').nullable()).or(z.literal('')),
});

// Combined schema
export const propertyFormSchema = baseSchema.merge(detailsSchema).merge(riskSchema).merge(contactSchema);

export type PropertyFormData = z.infer<typeof propertyFormSchema>;
