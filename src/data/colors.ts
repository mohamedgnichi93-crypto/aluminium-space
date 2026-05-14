export interface GrifoColor {
  id: string;
  name: string;
  hex: string;
  group: 'standard' | 'extended';
}

export const STANDARD_COLORS: GrifoColor[] = [
  { id: 'blanc', name: 'Blanc', hex: '#F5F5F5', group: 'standard' },
  { id: 'noir', name: 'Noir', hex: '#1A1A1A', group: 'standard' },
];

export const EXTENDED_COLORS: GrifoColor[] = [
  // Group 1 — Dark/Cool tones (Image 2)
  { id: 'violet-fonce', name: 'Violet foncé', hex: '#4A4568', group: 'extended' },
  { id: 'bleu-marine', name: 'Bleu marine', hex: '#2D3452', group: 'extended' },
  { id: 'marron', name: 'Marron', hex: '#8B6F5E', group: 'extended' },
  { id: 'kaki-fonce', name: 'Kaki foncé', hex: '#5C5A3A', group: 'extended' },
  { id: 'jaune-olive', name: 'Jaune olive', hex: '#A8A832', group: 'extended' },
  { id: 'bleu-gris', name: 'Bleu gris', hex: '#7A9BA8', group: 'extended' },
  { id: 'noir-charbon', name: 'Noir charbon', hex: '#1C1E26', group: 'extended' },
  { id: 'gris-argent', name: 'Gris argent', hex: '#A8ACBA', group: 'extended' },
  { id: 'orange-brique', name: 'Orange brique', hex: '#C4762A', group: 'extended' },
  { id: 'bleu-roi', name: 'Bleu roi', hex: '#1A5C96', group: 'extended' },
  { id: 'kaki-clair', name: 'Kaki clair', hex: '#9A9468', group: 'extended' },
  { id: 'vert-olive', name: 'Vert olive', hex: '#7A8C28', group: 'extended' },

  // Group 2 — Warm/Light tones (Image 3)
  { id: 'jaune-dore', name: 'Jaune doré', hex: '#C4A020', group: 'extended' },
  { id: 'orange-rouge', name: 'Orange rouge', hex: '#E84820', group: 'extended' },
  { id: 'beige-clair', name: 'Beige clair', hex: '#F5D8B0', group: 'extended' },
  { id: 'orange', name: 'Orange', hex: '#F07820', group: 'extended' },
  { id: 'saumon-clair', name: 'Saumon clair', hex: '#F0B898', group: 'extended' },
  { id: 'taupe', name: 'Taupe', hex: '#8C7E72', group: 'extended' },
  { id: 'jaune-vif', name: 'Jaune vif', hex: '#FFD020', group: 'extended' },
  { id: 'marron-rouge', name: 'Marron rouge', hex: '#922810', group: 'extended' },
  { id: 'jaune-citron', name: 'Jaune citron', hex: '#F8F020', group: 'extended' },
  { id: 'rose-clair', name: 'Rose clair', hex: '#F4B8C0', group: 'extended' },
  { id: 'marron-fonce', name: 'Marron foncé', hex: '#3C2E24', group: 'extended' },
  { id: 'rose-moyen', name: 'Rose moyen', hex: '#E890B8', group: 'extended' },

  // Group 3 — Pastel tones (Image 4)
  { id: 'gris-taupe', name: 'Gris taupe', hex: '#7A7070', group: 'extended' },
  { id: 'beige-sable', name: 'Beige sable', hex: '#DED0B0', group: 'extended' },
  { id: 'rose-poudre', name: 'Rose poudré', hex: '#E8C8C4', group: 'extended' },
  { id: 'bleu-ciel', name: 'Bleu ciel', hex: '#B8E0E4', group: 'extended' },

  // Group 4 — Technical tones (Image 5)
  { id: 'gris-moyen', name: 'Gris moyen', hex: '#8C8C8C', group: 'extended' },
  { id: 'bleu-cobalt', name: 'Bleu cobalt', hex: '#1A6AAA', group: 'extended' },
  { id: 'anthracite', name: 'Anthracite', hex: '#2C3038', group: 'extended' },
  { id: 'vert-emeraude', name: 'Vert émeraude', hex: '#1A9070', group: 'extended' },
];

export const ALL_COLORS = [...STANDARD_COLORS, ...EXTENDED_COLORS];
