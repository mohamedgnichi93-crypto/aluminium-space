export type ProductCategory = 'plisse' | 'enroulable' | 'panneau';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  descriptionKey: string;
  imageUrl: string;
  specs: {
    caisson?: string;
    tailleEffective: string;
    mesures: string;
  };
}

export const products: Product[] = [
  {
    id: 'colibri-50',
    name: 'COLIBRÌ 50',
    category: 'plisse',
    descriptionKey: 'products.colibri50_desc',
    description: 'Moustiquaire enroulable pour fenêtre à caisson supérieur. Mécanisme à ressort. Coulisses latérales à doubles joints-brosses. Barre de charge avec cordon de tirage. Panneau moustiquaire en fibre de verre recouverte de PVC. Structure en aluminium blanc.',
    imageUrl: '/images/colibri-50.png',
    specs: {
      caisson: '45 mm',
      tailleEffective: '52 mm',
      mesures: 'Min 350×500 mm — Max 2000×1700 mm (L×H)'
    }
  },
  {
    id: 'sidney-50',
    name: 'SIDNEY 50',
    category: 'enroulable',
    descriptionKey: 'products.sidney50_desc',
    description: 'Moustiquaire pour portes à caisson latéral. Mécanisme à ressort. Coulisses latérales à doubles joints-brosses. Barre de charge à poignée externe pliante. Panneau moustiquaire en fibre de verre recouverte de PVC. Structure en aluminium blanc.',
    imageUrl: '/images/sidney-50.png',
    specs: {
      caisson: '45 mm',
      tailleEffective: '58 mm',
      mesures: 'Min 350×700 mm — Max 2000×2600 mm (L×H)'
    }
  },
  {
    id: 'sidney-50-ac',
    name: 'SIDNEY 50 AC',
    category: 'plisse',
    descriptionKey: 'products.sidney50ac_desc',
    description: 'Moustiquaire pour portes à caisson latéral. Système à deux caissons pour grandes ouvertures. Mécanisme à ressort. Coulisses à doubles joints-brosses. Barre de charge à poignées externes pliantes. Panneau moustiquaire en fibre de verre recouverte de PVC. Structure en aluminium blanc.',
    imageUrl: '/images/sidney-50-ac.png',
    specs: {
      caisson: '45 mm',
      tailleEffective: '58 mm',
      mesures: 'Min 70×700 mm — Max 4000×2600 mm (L×H)'
    }
  },
  {
    id: 'elba',
    name: 'ELBA',
    category: 'panneau',
    descriptionKey: 'products.elba_desc',
    description: 'Moustiquaire à panneau fixe pour fenêtre. Châssis fixe en aluminium blanc. Panneau moustiquaire en fibre de verre recouverte de PVC. Fixations murales en nylon. Joint-brosse périmétral (en option). Joint magnétique périmétral (en option). Sur demande : panneau en aluminium ou acier inox.',
    imageUrl: '/images/elba.png',
    specs: {
      tailleEffective: '10 mm',
      mesures: 'Min 300×300 mm — Max 1200×2500 mm (L×H)'
    }
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
    fibre: 143000,
    aluminium: 183000,
    inox: 262000
  }
};
