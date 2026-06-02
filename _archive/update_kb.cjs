const fs = require('fs');

const path = 'src/services/aiAgentService.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. UPDATE COMPANY KNOWLEDGE
const newCompany = `const COMPANY = {
  name: 'ALUMINIUM SPACE',
  description: 'Spécialiste menuiserie aluminium à Mghira, Tunis. Distributeur officiel agréé Grifo Flex Tunisie.',
  address: 'LOT 125 LOTISSEMENT LAROUSSI, Mghira, Tunis CP 2074',
  phone1: '53 186 611',
  phone2: '57 099 070',
  whatsapp: '+216 57 099 070',
  email: 'aluminium.space1@gmail.com',
  hours: 'Lundi–Samedi, 8h00–17h00',
  installation: 'Installation sous 3-7 jours ouvrables. Zone de service: Tunis et Grand Tunis.',
  garantie: '3 ans sur toutes les moustiquaires Grifo Flex.',
  paiement: 'Paiement: espèces, virement bancaire. RIB: 11 05500 01215002788 56 - Agence BOUMHEL',
  mapUrl: 'https://maps.google.com/?q=125+lot+Laaroussi+Mghira',
  grifoFlex: 'Marque italienne (Grifoflex® Spa) présente en Tunisie depuis 2012. Succursale à Mégrine, Ben Arous. 1200 m² de surface, 15 employés. SAV: 71 434 209.',
};`;

content = content.replace(/const COMPANY = \{[\s\S]*?\};\n/, newCompany + '\n');

// 2. UPDATE PRODUCTS
const newProducts = `const PRODUCTS: Record<string, {
  name: string; category: string; type: string; description: string;
  features: string[]; caisson: string | null; tailleEffective: string;
  minW: number; maxW: number; minH: number; maxH: number;
  startPrice?: number; pricePerM2?: Record<string, number>;
  image: string; path: string;
}> = {
  'colibri-50': {
    name: 'COLIBRÌ 50',
    category: 'Moustiquaires Enroulables',
    type: 'fenetre',
    description: 'Moustiquaire enroulable pour FENÊTRE. Idéal pour fenêtres standard et appartements. Installation en 30 minutes par vissage mural.',
    features: [
      'Mécanisme à ressort silencieux', 'Coulisses latérales à doubles joints-brosses',
      'Barre de charge avec cordon de tirage',
    ],
    caisson: '50mm', tailleEffective: '44mm',
    minW: 60, maxW: 200, minH: 60, maxH: 170,
    startPrice: 263,
    image: '/images/colibri-50.png', path: '/produits/colibri-50',
  },
  'sidney-50': {
    name: 'SIDNEY 50',
    category: 'Moustiquaires Enroulables',
    type: 'porte',
    description: "Moustiquaire enroulable pour PORTE. Idéal pour portes d'entrée et portes-fenêtres avec poignée pliante discrète.",
    features: [
      'Mécanisme à ressort', 'Coulisses latérales à doubles joints-brosses',
      'Barre de charge à poignée externe pliante',
    ],
    caisson: '50mm', tailleEffective: '44mm',
    minW: 60, maxW: 160, minH: 150, maxH: 250,
    startPrice: 380,
    image: '/images/sidney-50.png', path: '/produits/sidney-50',
  },
  'sidney-50-ac': {
    name: 'SIDNEY 50 AC',
    category: 'Moustiquaires Enroulables',
    type: 'grande-porte',
    description: 'Moustiquaire double caisson pour GRANDE OUVERTURE. Ouverture centrale bidirectionnelle, idéal pour grandes baies vitrées et terrasses.',
    features: [
      'Système 2 caissons latéraux', 'Ouverture centrale bidirectionnelle',
      'Mécanisme à ressort', 'Coulisses doubles joints-brosses',
    ],
    caisson: '50mm', tailleEffective: '44mm',
    minW: 100, maxW: 350, minH: 150, maxH: 250,
    startPrice: 650,
    image: '/images/sidney-50-ac.png', path: '/produits/sidney-50-ac',
  },
  'elba': {
    name: 'ELBA',
    category: 'Moustiquaires à Panneau Fixe',
    type: 'fixe',
    description: 'Moustiquaire à PANNEAU FIXE pour fenêtre. Très économique et durable (pas de mécanisme).',
    features: [
      'Châssis fixe en aluminium blanc',
      'Panneau en fibre de verre recouverte de PVC',
      'Fixations murales en nylon', 'Joint brosse périmétral',
    ],
    caisson: null, tailleEffective: '10mm',
    minW: 40, maxW: 200, minH: 40, maxH: 200,
    startPrice: 180,
    image: '/images/elba.png', path: '/produits/elba',
  },
};`;

content = content.replace(/const PRODUCTS: Record<string, \{[\s\S]*?\/\/ ─── COMPANY/m, newProducts + '\n\n// ─── COMPANY');

// 3. UPDATE SYSTEM PROMPT
const systemPromptRegex = /const systemPrompt = \`[\s\S]*?\`;/m;
const newPrompt = `const systemPrompt = \`Tu es ALU, l'assistant virtuel d'Aluminium Space — entreprise tunisienne spécialisée dans la fabrication et l'installation de moustiquaires de qualité italienne Grifo Flex.

Tu connais parfaitement:
1. Les 4 produits Grifo Flex: Colibrì 50 (fenêtre), Sidney 50 (porte), Sidney 50 AC (grande ouverture), Elba (panneau fixe).
2. Grifo Flex = marque italienne (Grifoflex® Spa), distributeur officiel Aluminium Space (Mghira).
3. Garantie 3 ans sur tous les produits.
4. Installation 3-7 jours ouvrables, zone Tunis et Grand Tunis.
5. Pour choisir: fenêtre→Colibrì, porte→Sidney, grande baie→Sidney AC, économique/fixe→Elba.
6. Toujours demander les dimensions (LargeurXHauteur en cm) pour calculer le prix exact.
7. Ne jamais dire 'je ne sais pas' — toujours orienter vers WhatsApp (+216 57 099 070) si incertain.

PRODUITS:
• COLIBRÌ 50 — Moustiquaire enroulable fenêtre. Min 60×60 cm — Max 200×170 cm. Dès 263 DT HT.
• SIDNEY 50 — Moustiquaire enroulable porte. Min 60×150 cm — Max 160×250 cm. Dès 380 DT HT.
• SIDNEY 50 AC — Moustiquaire grande porte double. Min 100×150 cm — Max 350×250 cm. Dès 650 DT HT.
• ELBA — Panneau fixe fenêtre. Min 40×40 cm — Max 200×200 cm. Dès 180 DT HT.

COULEURS: Blanc RAL 9010, Noir mat. Matériaux: aluminium + fibre de verre recouverte de PVC.
ADRESSE: LOT 125 LOTISSEMENT LAROUSSI, Mghira, Tunis CP 2074.
TÉLÉPHONE: +216 53 186 611 / +216 57 099 070.
PAIEMENT: Espèces, virement bancaire. RIB: 11 05500 01215002788 56 - Agence BOUMHEL.

RÈGLES:
- \${langInstruction[lang]}
- Sois chaleureux, concis (2-4 phrases max).\`;`;
content = content.replace(systemPromptRegex, newPrompt);

// 4. ADD NEW FAQ INTENTS
// We inject these in the processMessage / intents section.
const intentsCode = `  // ORIGIN / SOURCE
  if (intent === 'about' || intent === 'origin') {
    const texts: Record<Lang, string> = {
      fr: "Grifo Flex est une marque italienne (Grifoflex® Spa). Aluminium Space est distributeur officiel agréé en Tunisie. Tous les produits sont fabriqués en Italie avec des matériaux premium.",
      tn: "Grifo Flex hia marka talianya. Aluminium Space homa el distributeur officiel fi Tounes. Kol chay masnou3 fi Italia.",
      ar: "Grifo Flex هي علامة تجارية إيطالية. Aluminium Space هو الموزع الرسمي المعتمد في تونس. جميع المنتجات مصنوعة في إيطاليا بمواد عالية الجودة.",
      en: "Grifo Flex is an Italian brand. Aluminium Space is the official distributor in Tunisia. All products are made in Italy with premium materials.",
      it: "Grifo Flex è un marchio italiano. Aluminium Space è il distributore ufficiale in Tunisia. Tutti i prodotti sono realizzati in Italia con materiali premium."
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang };
  }

  // SPECS
  if (intent === 'specs' || intent === 'technical_info') {
    const texts: Record<Lang, string> = {
      fr: "Nos moustiquaires sont en aluminium et fibre de verre recouverte de PVC. Couleurs : Blanc RAL 9010 ou Noir mat. De quel produit souhaitez-vous les caractéristiques techniques ?",
      tn: "El moustikaret mte3na b aluminium w fibre de verre bel PVC. Fama Blanc w Noir. 3ala anehou produit t7eb ta3ref ?",
      ar: "مستيكاراتنا مصنوعة من الألومنيوم والألياف الزجاجية المغطاة بـ PVC. الألوان: أبيض أو أسود. عن أي منتج تريد معلومات تقنية؟",
      en: "Our screens are made of aluminum and fiberglass covered with PVC. Colors: White or Black. Which product would you like specs for?",
      it: "Le nostre zanzariere sono in alluminio e fibra di vetro rivestita in PVC. Colori: Bianco o Nero. Per quale prodotto desideri le specifiche?"
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang };
  }

  // MEASURE
  if (intent === 'measure') {
    const texts: Record<Lang, string> = {
      fr: "Mesurez la largeur (L) et la hauteur (H) de votre ouverture en cm. Pour fenêtre : mesure intérieure du cadre. Pour porte : mesure de l'ouverture totale. Format: LargeurXHauteur (ex: 140×120).",
      tn: "9is el 3ardh w el toul b cm. Lel chbek: 9is men de5el. Lel beb: 9is el fet7a lkol. Format: 3ardhXtoul (ex: 140×120).",
      ar: "قس العرض والارتفاع لفتحتك بالسنتيمتر. للنافذة: القياس الداخلي للإطار. للباب: قياس الفتحة الكلية. مثال: 140×120.",
      en: "Measure the width (W) and height (H) of your opening in cm. For window: inner frame measure. For door: total opening. Format: WidthXHeight (e.g., 140×120).",
      it: "Misura la larghezza (L) e l'altezza (H) in cm. Finestra: misura interna del telaio. Porta: apertura totale. Es: 140×120."
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang };
  }

  // COMPARISON / CHOICE
  if (intent === 'comparison' || intent === 'choosing') {
    const texts: Record<Lang, string> = {
      fr: "Fenêtre normale → COLIBRÌ 50. Porte simple → SIDNEY 50. Grande baie / terrasse → SIDNEY 50 AC. Budget serré / fenêtre fixe → ELBA.",
      tn: "Chbek 3adi → COLIBRÌ 50. Beb 3adi → SIDNEY 50. Baie vitrée kbira → SIDNEY 50 AC. Budget sghir walla chbek fixe → ELBA.",
      ar: "نافذة عادية → COLIBRÌ 50. باب بسيط → SIDNEY 50. نافذة كبيرة → SIDNEY 50 AC. ميزانية محدودة / نافذة ثابتة → ELBA.",
      en: "Standard window → COLIBRÌ 50. Single door → SIDNEY 50. Large opening → SIDNEY 50 AC. Budget/Fixed → ELBA.",
      it: "Finestra standard → COLIBRÌ 50. Porta singola → SIDNEY 50. Grande apertura → SIDNEY 50 AC. Economica/Fissa → ELBA."
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang };
  }
`;

// Replace existing ones
content = content.replace(/if \(intent === 'warranty'\) \{[\s\S]*?return \{.*?\};\n  \}/m, `if (intent === 'warranty') {
    const texts: Record<Lang, string> = {
      fr: "🛡️ 3 ans de garantie sur toutes les moustiquaires Grifo Flex. SAV disponible, installation incluse dans la garantie.",
      tn: "🛡️ 3 snin daman 3al moustikaret Grifo Flex lkol. SAV mawjoud w tarkib da5el fel daman.",
      ar: "🛡️ ضمان 3 سنوات على جميع منتجات Grifo Flex. خدمة ما بعد البيع متاحة والتركيب مشمول.",
      en: "🛡️ 3 years warranty on all Grifo Flex mosquito nets. After-sales service available, installation included.",
      it: "🛡️ 3 anni di garanzia su tutte le zanzariere Grifo Flex. Servizio post-vendita e installazione inclusi."
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang };
  }`);

content = content.replace(/if \(intent === 'delivery'\) \{[\s\S]*?return \{.*?\};\n  \}/m, `if (intent === 'delivery' || intent === 'delay') {
    const texts: Record<Lang, string> = {
      fr: "🚚 Installation sous 3 à 7 jours ouvrables après confirmation de commande.",
      tn: "🚚 El tarkib bin 3 w 7 ayam ba3d ma tconfirmili el commande.",
      ar: "🚚 التركيب خلال 3 إلى 7 أيام عمل بعد تأكيد الطلب.",
      en: "🚚 Installation within 3 to 7 business days after order confirmation.",
      it: "🚚 Installazione entro 3-7 giorni lavorativi dopo la conferma."
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang };
  }`);

content = content.replace(/if \(intent === 'location'\) \{[\s\S]*?return \{.*?\};\n  \}/m, `if (intent === 'location' || intent === 'zone') {
    const texts: Record<Lang, string> = {
      fr: "📍 Tunis et Grand Tunis. Pour d'autres régions, contactez-nous.",
      tn: "📍 Tunis w Grand Tunis. Kenek fi blassa okhra, atslna.",
      ar: "📍 تونس وتونس الكبرى. لمناطق أخرى، اتصل بنا.",
      en: "📍 Tunis and Greater Tunis. For other regions, contact us.",
      it: "📍 Tunisi e Grande Tunisi. Per altre regioni, contattaci."
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang };
  }`);

content = content.replace(/if \(intent === 'payment'\) \{[\s\S]*?return \{.*?\};\n  \}/m, `if (intent === 'payment') {
    const texts: Record<Lang, string> = {
      fr: "💳 Paiement en espèces ou virement bancaire. RIB: 11 05500 01215002788 56 - Agence BOUMHEL.",
      tn: "💳 Tnajem tkhales cash walla virement bancaire. RIB: 11 05500 01215002788 56 - Agence BOUMHEL.",
      ar: "💳 الدفع نقداً أو تحويل بنكي. RIB: 11 05500 01215002788 56 - Agence BOUMHEL.",
      en: "💳 Payment in cash or bank transfer. RIB: 11 05500 01215002788 56 - Agence BOUMHEL.",
      it: "💳 Pagamento in contanti o bonifico bancario. RIB: 11 05500 01215002788 56 - Agence BOUMHEL."
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang };
  }`);

// Remove existing 'about' intent block if it exists
content = content.replace(/if \(intent === 'about'\) \{[\s\S]*?return \{.*?\};\n  \}\n/m, '');

// Inject new intents before maintenance intent
content = content.replace(/\/\/ MAINTENANCE/, intentsCode + '\n  // MAINTENANCE');

fs.writeFileSync(path, content, 'utf8');
console.log('Update complete.');
