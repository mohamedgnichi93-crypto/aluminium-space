-- ═══════════════════════════════════════════════════════════════
--  ALU SPACE — AI Chat Migration
--  Creates products + faq tables, seeds data, enables RLS
-- ═══════════════════════════════════════════════════════════════

-- ─── A) PRODUCTS TABLE ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'fenetre',
  category_fr TEXT,
  category_ar TEXT,
  description_fr TEXT,
  description_ar TEXT,
  description_tn TEXT,
  description_en TEXT,
  description_it TEXT,
  features JSONB DEFAULT '[]',
  caisson TEXT,
  taille_effective TEXT,
  min_width NUMERIC DEFAULT 0,
  max_width NUMERIC DEFAULT 0,
  min_height NUMERIC DEFAULT 0,
  max_height NUMERIC DEFAULT 0,
  base_price NUMERIC DEFAULT 0,
  price_per_m2 BOOLEAN DEFAULT false,
  price_tables JSONB DEFAULT '{}',
  colors JSONB DEFAULT '["Blanc", "Noir"]',
  image_url TEXT,
  path TEXT,
  is_bestseller BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_anon_read" ON products FOR SELECT TO anon USING (true);
CREATE POLICY "products_auth_all" ON products FOR ALL TO authenticated USING (true);


-- ─── B) FAQ TABLE ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS faq (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_fr TEXT NOT NULL,
  question_ar TEXT,
  question_tn TEXT,
  question_en TEXT,
  question_it TEXT,
  answer_fr TEXT NOT NULL,
  answer_ar TEXT,
  answer_tn TEXT,
  answer_en TEXT,
  answer_it TEXT,
  category TEXT DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE faq ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faq_anon_read" ON faq FOR SELECT TO anon USING (true);
CREATE POLICY "faq_auth_all" ON faq FOR ALL TO authenticated USING (true);


-- ─── C) SEED PRODUCTS ──────────────────────────────────────────

INSERT INTO products (slug, name, type, category_fr, category_ar, description_fr, description_ar, description_tn, description_en, description_it, features, caisson, taille_effective, min_width, max_width, min_height, max_height, base_price, price_per_m2, price_tables, colors, image_url, path, is_bestseller, is_active, sort_order) VALUES

-- 1. COLIBRÌ 50
(
  'colibri-50',
  'COLIBRÌ 50',
  'fenetre',
  'Moustiquaires Enroulables',
  'شبكات قابلة للطي',
  'Moustiquaire enroulable pour FENÊTRE. Idéal pour fenêtres standard et appartements. Installation en 30 minutes par vissage mural.',
  'شبكة حماية قابلة للطي للنوافذ. مثالية للنوافذ العادية والشقق. تركيب في 30 دقيقة.',
  'Moustika enroulable lel chbabek. Idéale lel chbabek standard w appartements. Tarkib f 30 d9i9a.',
  'Retractable mosquito screen for WINDOWS. Ideal for standard windows and apartments. 30-minute wall-mount installation.',
  'Zanzariera avvolgibile per FINESTRA. Ideale per finestre standard e appartamenti. Installazione in 30 minuti.',
  '["Mécanisme à ressort silencieux", "Coulisses latérales à doubles joints-brosses", "Barre de charge avec cordon de tirage"]',
  'supérieur (en haut) 50mm',
  '44mm',
  60, 200, 60, 250,
  263,
  false,
  '{
    "height170": {
      "widths": [60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200],
      "prices": [263000, 283000, 296000, 313000, 327000, 341000, 357000, 373000, 388000, 402000, 418000, 434000, 449000, 465000, 480000]
    },
    "height250": {
      "widths": [80, 90, 100, 110, 120, 130, 140, 150, 160],
      "prices": [357000, 373000, 388000, 402000, 418000, 434000, 449000, 465000, 480000]
    },
    "rules": {
      "if_height_gt_170_max_width": 160
    }
  }',
  '["Blanc", "Noir"]',
  '/images/colibri-50.webp',
  '/produits/colibri-50',
  true,
  true,
  1
),

-- 2. SIDNEY 50
(
  'sidney-50',
  'SIDNEY 50',
  'porte',
  'Moustiquaires Enroulables',
  'شبكات قابلة للطي',
  'Moustiquaire enroulable pour PORTE. Idéal pour portes d''entrée et portes-fenêtres avec poignée pliante discrète.',
  'شبكة حماية قابلة للطي للأبواب. مثالية لأبواب المدخل مع مقبض قابل للطي.',
  'Moustika enroulable lel biban. Idéale lel bab d''entrée w porte-fenêtre b poignée pliante.',
  'Retractable mosquito screen for DOORS. Ideal for entrance doors and French doors with discreet folding handle.',
  'Zanzariera avvolgibile per PORTA. Ideale per porte d''ingresso con maniglia pieghevole discreta.',
  '["Mécanisme à ressort", "Coulisses latérales à doubles joints-brosses", "Barre de charge à poignée externe pliante"]',
  'latéral (sur le côté) 50mm',
  '44mm',
  60, 200, 150, 260,
  611,
  false,
  '{
    "width160": {
      "heights": [220, 230, 240, 250, 260],
      "prices": [611000, 627000, 651000, 667000, 682000]
    },
    "width200": {
      "heights": [220, 230, 240, 250, 260],
      "prices": [651000, 667000, 682000, 697000, 712000]
    }
  }',
  '["Blanc", "Noir"]',
  '/images/sidney-50.webp',
  '/produits/sidney-50',
  false,
  true,
  2
),

-- 3. SIDNEY 50 AC
(
  'sidney-50-ac',
  'SIDNEY 50 AC',
  'grande-porte',
  'Moustiquaires Enroulables',
  'شبكات قابلة للطي',
  'Moustiquaire double caisson pour GRANDE OUVERTURE. Ouverture centrale bidirectionnelle, s''ouvre des deux côtés, idéal pour grandes baies vitrées et terrasses.',
  'شبكة حماية بصندوقين للفتحات الكبيرة. فتح مركزي ثنائي الاتجاه، مثالية للنوافذ الكبيرة والتراس.',
  'Moustika double caisson lel fta7at lkbar. Ouverture centrale bidirectionnelle, ideal lel baies vitrées w terrasses.',
  'Double-housing mosquito screen for LARGE OPENINGS. Central bidirectional opening, ideal for large bay windows and terraces.',
  'Zanzariera doppio cassone per GRANDI APERTURE. Apertura centrale bidirezionale, ideale per grandi vetrate e terrazze.',
  '["Système 2 caissons latéraux", "Ouverture centrale bidirectionnelle", "Mécanisme à ressort", "Coulisses doubles joints-brosses"]',
  '50mm',
  '44mm',
  100, 400, 150, 260,
  1224,
  false,
  '{
    "width320": {
      "heights": [220, 230, 240, 250, 260],
      "prices": [1224000, 1252000, 1284000, 1314000, 1344000]
    },
    "width400": {
      "heights": [220, 230, 240, 250, 260],
      "prices": [1252000, 1284000, 1314000, 1344000, 1375000]
    }
  }',
  '["Blanc", "Noir"]',
  '/images/sidney-50-ac.webp',
  '/produits/sidney-50-ac',
  false,
  true,
  3
),

-- 4. ELBA
(
  'elba',
  'ELBA',
  'fixe',
  'Moustiquaires à Panneau Fixe',
  'شبكات ثابتة',
  'Moustiquaire à PANNEAU FIXE pour fenêtre. Très économique et durable (pas de mécanisme).',
  'شبكة حماية ثابتة للنوافذ. اقتصادية جداً ومتينة (بدون آلية).',
  'Moustika à PANNEAU FIXE lel chbabek. Rkhissa barcha w solide (ma fihech mécanisme).',
  'FIXED PANEL mosquito screen for windows. Very economical and durable (no mechanism).',
  'Zanzariera a PANNELLO FISSO per finestra. Molto economica e resistente (senza meccanismo).',
  '["Châssis fixe en aluminium blanc", "Panneau en fibre de verre recouverte de PVC", "Fixations murales en nylon", "Joint brosse périmétral"]',
  NULL,
  '10mm',
  40, 9999, 40, 9999,
  326,
  true,
  '{
    "base_per_m2": 326000
  }',
  '["Blanc", "Noir"]',
  '/images/elba-v2.webp',
  '/produits/elba',
  false,
  true,
  4
),

-- 5. PLISSÉ 31 BILATÉRALE
(
  'plisse31',
  'PLISSÉ 31 BILATÉRALE',
  'plisse',
  'Moustiquaires Plissées',
  'شبكات مطوية',
  'Moustiquaire plissée bilatérale (31mm). Idéale pour grandes ouvertures jusqu''à 5000mm. Déverrouillage à aimant, rail extra plat et maille noire de série.',
  'شبكة حماية مطوية ثنائية (31 مم). مثالية للفتحات الكبيرة حتى 5000 مم. فتح بمغناطيس وسكة رفيعة.',
  'Moustika plissée bilatérale (31mm). Idéale lel fta7at lkbar hatta 5000mm. Déverrouillage b aimant w rail extra plat.',
  'Bilateral pleated mosquito screen (31mm). Ideal for large openings up to 5000mm. Magnetic release, extra-flat rail and black mesh as standard.',
  'Zanzariera plissettata bilaterale (31mm). Ideale per grandi aperture fino a 5000mm. Sblocco a magnete, guida extra piatta.',
  '["Déverrouillage à aimant", "Rail extra plat", "Maille noire de série"]',
  '31mm',
  '31mm',
  125, 500, 120, 300,
  1115,
  false,
  '{
    "125":  { "120-180": 1115000, "180-240": 1487000, "240-300": 1859000 },
    "180":  { "120-180": 1540000, "180-240": 2018000, "240-300": 2496000 },
    "250":  { "120-180": 2018000, "180-240": 2443000, "240-300": 3102000 },
    "300":  { "120-180": 2443000, "180-240": 2868000, "240-300": 3718000 },
    "400":  { "120-180": 2709000, "180-240": 3399000, "240-300": 4355000 },
    "500":  { "120-180": 2974000, "180-240": 3930000, "240-300": 4993000 }
  }',
  '["Blanc", "Noir"]',
  '/images/plisse31.webp',
  '/produits/plisse31',
  false,
  true,
  5
);


-- ─── D) SEED FAQ ────────────────────────────────────────────────

INSERT INTO faq (question_fr, question_ar, question_tn, question_en, question_it, answer_fr, answer_ar, answer_tn, answer_en, answer_it, category, sort_order) VALUES

-- 1. Garantie
(
  'Quelle est la garantie sur les moustiquaires ?',
  'ما هي مدة الضمان على المستيكارات؟',
  'Chhal el daman 3al moustikarat ?',
  'What is the warranty on mosquito screens?',
  'Qual è la garanzia sulle zanzariere?',
  '3 ans de garantie sur toutes les moustiquaires Grifo Flex. SAV disponible, installation incluse dans la garantie.',
  'ضمان 3 سنوات على جميع منتجات Grifo Flex. خدمة ما بعد البيع متاحة والتركيب مشمول.',
  '3 snin daman 3al moustikaret Grifo Flex lkol. SAV mawjoud w tarkib da5el fel daman.',
  '3 years warranty on all Grifo Flex mosquito nets. After-sales service available, installation included.',
  '3 anni di garanzia su tutte le zanzariere Grifo Flex. Servizio post-vendita e installazione inclusi.',
  'garantie',
  1
),

-- 2. Paiement
(
  'Quels sont les modes de paiement ?',
  'ما هي طرق الدفع؟',
  'Kifech nkhales ?',
  'What are the payment methods?',
  'Quali sono i metodi di pagamento?',
  'Paiement en espèces ou virement bancaire. RIB: 11 05500 01215002788 56 - Agence BOUMHEL.',
  'الدفع نقداً أو تحويل بنكي. RIB: 11 05500 01215002788 56 - Agence BOUMHEL.',
  'Tnajem tkhales cash walla virement bancaire. RIB: 11 05500 01215002788 56 - Agence BOUMHEL.',
  'Payment in cash or bank transfer. RIB: 11 05500 01215002788 56 - Agence BOUMHEL.',
  'Pagamento in contanti o bonifico bancario. RIB: 11 05500 01215002788 56 - Agence BOUMHEL.',
  'paiement',
  2
),

-- 3. Livraison / Délai
(
  'Quel est le délai de livraison et installation ?',
  'ما هو أجل التسليم والتركيب؟',
  '9adech wa9t bech ywasslou w yrakbou ?',
  'What is the delivery and installation timeline?',
  'Qual è il tempo di consegna e installazione?',
  'Installation sous 3 à 7 jours ouvrables après confirmation de commande. Zone de service: Tunis et Grand Tunis.',
  'التركيب خلال 3 إلى 7 أيام عمل بعد تأكيد الطلب. منطقة الخدمة: تونس وتونس الكبرى.',
  'El tarkib bin 3 w 7 ayam ba3d ma tconfirmili el commande. Zone de service: Tunis w Grand Tunis.',
  'Installation within 3 to 7 business days after order confirmation. Service area: Tunis and Greater Tunis.',
  'Installazione entro 3-7 giorni lavorativi dopo la conferma. Zona: Tunisi e Grande Tunisi.',
  'livraison',
  3
),

-- 4. Entretien
(
  'Comment entretenir les moustiquaires ?',
  'كيف أعتني بالمستيكارات؟',
  'Kifech nnadhef el moustikarat ?',
  'How to maintain mosquito screens?',
  'Come si mantengono le zanzariere?',
  'Nettoyez la grille avec un chiffon doux légèrement humide. Évitez les produits abrasifs. Lubrifiez les coulisses une fois par an. Vérifiez les joints-brosses annuellement.',
  'نظف الشبكة بقطعة قماش مبللة قليلاً. تجنب المواد الكاشطة. زيت المزالق مرة في السنة. افحص الجوانت سنوياً.',
  'Ndhef el grille b chiffon mo3alla chwiya. Tevit produits abrasifs. Dhen el coulisses marra f sna. Verifie el joints marra f sna.',
  'Clean the mesh with a soft, slightly damp cloth. Avoid abrasive products. Lubricate the runners once a year. Check brush seals annually.',
  'Pulire la rete con un panno morbido leggermente umido. Evitare prodotti abrasivi. Lubrificare le guide una volta l''anno. Verificare le spazzole annualmente.',
  'entretien',
  4
),

-- 5. Zone de livraison
(
  'Dans quelles zones livrez-vous ?',
  'ما هي مناطق التوصيل؟',
  'Win twasslou ?',
  'Which areas do you deliver to?',
  'In quali zone consegnate?',
  'Tunis et Grand Tunis uniquement. Pour d''autres régions, laissez votre contact et on vous informera dès l''extension de notre zone.',
  'تونس وتونس الكبرى فقط. لمناطق أخرى، اترك معلومات الاتصال وسنعلمك عند توسيع منطقتنا.',
  'Tunis w Grand Tunis bark. Ken fi blassa okhra, khalili numéro w nkalmek ki nwasslou l blastek.',
  'Tunis and Greater Tunis only. For other regions, leave your contact and we will inform you when we expand.',
  'Tunisi e Grande Tunisi. Per altre regioni, lascia il contatto e ti informeremo con l''espansione.',
  'livraison',
  5
),

-- 6. Showroom / Visite
(
  'Peut-on visiter votre showroom ?',
  'هل يمكن زيارة المعرض؟',
  'Najem nji nchouf el showroom ?',
  'Can we visit your showroom?',
  'Si può visitare lo showroom?',
  'Oui, venez découvrir nos produits ! Adresse: 125 lot Laaroussi, Mghira, Tunis. Horaires: Lun–Ven 8h00–17h00 | Sam 8h00–12h00.',
  'نعم، تعال لزيارة معرضنا! العنوان: 125 لوت العروسي، مغيرة، تونس. الدوام: الاثنين-الجمعة 8:00-17:00 | السبت 8:00-12:00.',
  'Ih, aji tchouf el showroom mte3na! Adresse: 125 lot Laaroussi, Mghira, Tunis. Horaires: Lun–Ven 8h00–17h00 | Sam 8h00–12h00.',
  'Yes, come discover our products! Address: 125 lot Laaroussi, Mghira, Tunis. Hours: Mon–Fri 8:00–17:00 | Sat 8:00–12:00.',
  'Sì, vieni a scoprire i nostri prodotti! Indirizzo: 125 lot Laaroussi, Mghira, Tunisi. Orari: Lun–Ven 8:00–17:00 | Sab 8:00–12:00.',
  'showroom',
  6
),

-- 7. Comment mesurer
(
  'Comment mesurer pour une moustiquaire ?',
  'كيف أقيس لتركيب المستيكار؟',
  'Kifech n9is bech nrakkeb moustika ?',
  'How to measure for a mosquito screen?',
  'Come misurare per una zanzariera?',
  'Mesurez la largeur (L) et la hauteur (H) de votre ouverture en cm. Pour fenêtre: mesure intérieure du cadre. Pour porte: mesure de l''ouverture totale. Format: LargeurXHauteur (ex: 140×120).',
  'قس العرض والارتفاع لفتحتك بالسنتيمتر. للنافذة: القياس الداخلي للإطار. للباب: قياس الفتحة الكلية. مثال: 140×120.',
  '9is el 3ardh w el toul b cm. Lel chbek: 9is men de5el. Lel beb: 9is el fet7a lkol. Format: 3ardhXtoul (ex: 140×120).',
  'Measure the width (W) and height (H) of your opening in cm. For window: inner frame measure. For door: total opening. Format: WidthXHeight (e.g., 140×120).',
  'Misura la larghezza (L) e l''altezza (H) in cm. Finestra: misura interna del telaio. Porta: apertura totale. Es: 140×120.',
  'technique',
  7
);


-- ─── E) NOTIFY SCHEMA RELOAD ────────────────────────────────────

NOTIFY pgrst, 'reload schema';
