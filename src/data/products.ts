export type ProductCategory = 'plisse' | 'enroulable' | 'panneau';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  descriptionKey: string;
  imageUrl: string;
  maxW?: number;
  maxH?: number;
}

export const products: Product[] = [
  {
    id: 'colibri-50',
    name: 'COLIBRÌ 50',
    category: 'plisse',
    descriptionKey: 'products.colibri50_desc',
    description: 'Moustiquaire enroulable pour fenêtre à caisson supérieur. Mécanisme à ressort. Coulisses latérales à doubles joints-brosses. Barre de charge avec cordon de tirage. Panneau moustiquaire en fibre de verre recouverte de PVC. Structure en aluminium blanc.',
    imageUrl: '/images/colibri-50.webp',

  },
  {
    id: 'sidney-50',
    name: 'SIDNEY 50',
    category: 'enroulable',
    descriptionKey: 'products.sidney50_desc',
    description: 'Moustiquaire pour portes à caisson latéral. Mécanisme à ressort. Coulisses latérales à doubles joints-brosses. Barre de charge à poignée externe pliante. Panneau moustiquaire en fibre de verre recouverte de PVC. Structure en aluminium blanc.',
    imageUrl: '/images/sidney-50.webp',

  },
  {
    id: 'sidney-50-ac',
    name: 'SIDNEY 50 AC',
    category: 'plisse',
    descriptionKey: 'products.sidney50ac_desc',
    description: 'Moustiquaire pour portes à caisson latéral. Système à deux caissons pour grandes ouvertures. Mécanisme à ressort. Coulisses à doubles joints-brosses. Barre de charge à poignées externes pliantes. Panneau moustiquaire en fibre de verre recouverte de PVC. Structure en aluminium blanc.',
    imageUrl: '/images/sidney-50-ac.webp',

  },
  {
    id: 'elba',
    name: 'ELBA',
    category: 'panneau',
    descriptionKey: 'products.elba_desc',
    description: 'Moustiquaire à panneau fixe pour fenêtre. Châssis fixe en aluminium blanc. Panneau moustiquaire en fibre de verre recouverte de PVC. Fixations murales en nylon. Joint-brosse périmétral (en option). Joint magnétique périmétral (en option). Sur demande : panneau en aluminium ou acier inox.',
    imageUrl: '/images/elba.webp',
    maxW: 0,
    maxH: 0,
  },
  {
    id: 'plisse31',
    name: 'Plissé 31 Bilatérale',
    category: 'plisse',
    descriptionKey: 'products.plisse31_desc',
    description: 'Moustiquaire plissée bilatérale (encombrement 31mm). Idéale pour grandes ouvertures (5000x3000mm). Déverrouillage à aimant et rail inférieur extra plat.',
    imageUrl: '/images/plisse31.webp',
  }
];

// Price tables
export const priceTables = {
  colibri50: {
    height170: {
      widths: [60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200],
      prices: [263000, 283000, 296000, 313000, 327000, 341000, 357000, 373000, 388000, 402000, 418000, 434000, 449000, 465000, 480000]
    },
    height250: {
      widths: [80, 90, 100, 110, 120, 130, 140, 150, 160],
      prices: [357000, 373000, 388000, 402000, 418000, 434000, 449000, 465000, 480000]
    }
  },
  sidney50: {
    width160: {
      heights: [220, 230, 240, 250, 260],
      prices: [611000, 627000, 651000, 667000, 682000]
    },
    width200: {
      heights: [220, 230, 240, 250, 260],
      prices: [651000, 667000, 682000, 697000, 712000]
    }
  },
  sidney50ac: {
    width320: {
      heights: [220, 230, 240, 250, 260],
      prices: [1224000, 1252000, 1284000, 1314000, 1344000]
    },
    width400: {
      heights: [220, 230, 240, 250, 260],
      prices: [1252000, 1284000, 1314000, 1344000, 1375000]
    }
  },
  elba: {
    base: 326000
  },
  plisse31: {
    125: { '120-180': 1115000, '180-240': 1487000, '240-300': 1859000 },
    180: { '120-180': 1540000, '180-240': 2018000, '240-300': 2496000 },
    250: { '120-180': 2018000, '180-240': 2443000, '240-300': 3102000 },
    300: { '120-180': 2443000, '180-240': 2868000, '240-300': 3718000 },
    400: { '120-180': 2709000, '180-240': 3399000, '240-300': 4355000 },
    500: { '120-180': 2974000, '180-240': 3930000, '240-300': 4993000 },
  }
};
