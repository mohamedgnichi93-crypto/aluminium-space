import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Shield, Award, Wrench, Users, CheckCircle } from 'lucide-react';
import PageSEO from '../components/ui/PageSEO';
import ItalyFlag from '../components/ui/ItalyFlag';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

function renderWithBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

const About = () => {
  const { t } = useTranslation();

  const values = [
    {
      icon: Shield,
      title: { fr: 'Qualité sans compromis', ar: 'جودة بلا تنازل', tn: 'جودة بلا تنازل', en: 'Uncompromising quality', it: 'Qualità senza compromessi' },
      desc: {
        fr: 'Chaque moustiquaire Grifo Flex est fabriquée en Italie avec des matériaux de premier choix, garantis pour durer.',
        ar: 'كل مستيكار Grifo Flex مصنوعة في إيطاليا بمواد عالية الجودة مضمونة للمدة الطويلة.',
        tn: 'كل موستيكار Grifo Flex مصنوعة في إيطاليا بمواد من الدرجة الأولى، مضمونة تدوم.',
        en: 'Every Grifo Flex screen is made in Italy with top-quality materials, guaranteed to last.',
        it: 'Ogni zanzariera Grifo Flex è prodotta in Italia con materiali di prima scelta, garantiti per durare.',
      },
    },
    {
      icon: Wrench,
      title: { fr: 'Service clé en main', ar: 'خدمة متكاملة', tn: 'خدمة متكاملة', en: 'Turnkey service', it: 'Servizio chiavi in mano' },
      desc: {
        fr: 'De la mesure jusqu\'à l\'installation, nous gérons tout. Vous n\'avez rien à faire — nous nous occupons du reste.',
        ar: 'من القياس حتى التركيب، نحن ندير كل شيء. ليس عليك فعل أي شيء — نحن نتولى الباقي.',
        tn: 'من القياس حتى التركيب، نحن نتكفل بكل شيء. ماعليكش تعمل حاجة — احنا نكملوها.',
        en: 'From measurement to installation, we handle everything. You don\'t have to do a thing.',
        it: 'Dalla misurazione all\'installazione, gestiamo tutto. Non devi fare nulla — pensiamo noi al resto.',
      },
    },
    {
      icon: Users,
      title: { fr: 'Proximité client', ar: 'قرب العميل', tn: 'قرب العميل', en: 'Customer closeness', it: 'Vicinanza al cliente' },
      desc: {
        fr: 'Une équipe à l\'écoute pour répondre à toutes vos questions et assurer votre satisfaction.',
        ar: 'فريق مستمع للإجابة على جميع أسئلتك وضمان رضاك.',
        tn: 'فريق يسمعك يجاوبك على كل أسئلتك ويضمن رضاك.',
        en: 'A responsive team to answer all your questions and ensure your satisfaction.',
        it: 'Un team disponibile per rispondere a tutte le tue domande e garantire la tua soddisfazione.',
      },
    },
    {
      icon: Award,
      title: { fr: 'Expertise reconnue', ar: 'خبرة معترف بها', tn: 'خبرة معترف بها', en: 'Recognized expertise', it: 'Competenza riconosciuta' },
      desc: {
        fr: 'Partenaire agréé Grifo Flex en Tunisie — nous maîtrisons chaque détail de nos produits pour vous garantir la meilleure installation.',
        ar: 'الشريك المعتمد لـ Grifo Flex في تونس — نتقن كل تفاصيل منتجاتنا لضمان أفضل تركيب لكم.',
        tn: 'الشريك المعتمد لـ Grifo Flex في تونس — نتقن كل تفاصيل منتاجاتنا باش نضمنلكم أحسن تركيب.',
        en: 'Certified Grifo Flex partner in Tunisia — we master every detail for the best installation.',
        it: 'Partner certificato Grifo Flex in Tunisia — padroneggiamo ogni dettaglio dei nostri prodotti per garantirvi la migliore installazione.',
      },
    },
  ];

  const timeline = [
    {
      year: '2016',
      title: {
        fr: 'Les Débuts',
        ar: 'البدايات',
        tn: 'البدايات',
        en: 'The Beginning',
        it: 'Gli Inizi',
      },
      desc: {
        fr: 'Avant de devenir Aluminium Space, nous étions un petit atelier à El Mourouj 3, Tunis — passionnés par la menuiserie aluminium et déterminés à offrir un travail de qualité.',
        ar: 'قبل أن نصبح Aluminium Space، كنا ورشة صغيرة في المروج 3، تونس — شغوفون بنجارة الألومنيوم وعازمون على تقديم عمل عالي الجودة.',
        tn: 'قبل ما نولوا Aluminium Space، كنا ورشة صغيرة في المروج 3، تونس — محبين للألومنيوم ومصمّمين على الخدمة الزينة.',
        en: 'Before becoming Aluminium Space, we were a small workshop in El Mourouj 3, Tunis — passionate about aluminum joinery and determined to deliver quality work.',
        it: 'Prima di diventare Aluminium Space, eravamo un piccolo laboratorio a El Mourouj 3, Tunis — appassionati di falegnameria in alluminio e determinati a offrire un lavoro di qualità.',
      },
    },
    {
      year: '2018',
      title: { fr: 'Fondation', ar: 'التأسيس', tn: 'التأسيس', en: 'Foundation', it: 'Fondazione' },
      desc: {
        fr: 'Aluminium Space ouvre ses portes à Fouchana, Tunis — avec la vision d\'apporter des solutions de menuiserie aluminium haut de gamme en Tunisie.',
        ar: 'فتح Aluminium Space أبوابه في فوشانة، تونس — برؤية إحضار حلول نجارة ألومنيوم عالية الجودة إلى تونس.',
        tn: 'Aluminium Space يفتح أبوابه في فوشانة، تونس — برؤية إحضار حلول نجارة ألمنيوم عالية الجودة لتونس.',
        en: 'Aluminium Space opens its doors in Fouchana, Tunis — with the vision of bringing premium aluminum solutions to Tunisia.',
        it: 'Aluminium Space apre le porte a Fouchana, Tunis — con la visione di portare soluzioni premium in alluminio in Tunisia.',
      },
    },
    {
      year: '2020',
      title: { fr: 'Partenariat Grifo Flex', ar: 'شراكة Grifo Flex', tn: 'شراكة Grifo Flex', en: 'Grifo Flex Partnership', it: 'Partnership Grifo Flex' },
      desc: {
        fr: 'Aluminium Space devient le **partenaire agréé de Grifo Flex** en Tunisie. Une marque italienne de référence mondiale en moustiquaires rétractables, fabriquée à Fano.',
        ar: 'أصبح Aluminium Space **الشريك المعتمد لـ Grifo Flex** في تونس. علامة إيطالية مرجعية عالمياً في المستيكارات القابلة للطي، مصنوعة في فانو.',
        tn: 'Aluminium Space يصبح **الشريك المعتمد لـ Grifo Flex** في تونس. علامة إيطالية مرجعية عالمياً في الموستيكار، مصنوعة في فانو.',
        en: 'Aluminium Space becomes the **certified Grifo Flex partner** in Tunisia. A world-reference Italian brand in retractable screens, made in Fano.',
        it: 'Aluminium Space diventa il **partner certificato Grifo Flex** in Tunisia. Un marchio italiano di riferimento mondiale nelle zanzariere avvolgibili, prodotto a Fano.',
      },
    },
    {
      year: '2022',
      title: { fr: 'Expansion & showroom', ar: 'توسع وصالة عرض', tn: 'توسع وشوروم', en: 'Expansion & showroom', it: 'Espansione e showroom' },
      desc: {
        fr: 'Ouverture du showroom de Fouchana avec exposition de tous les modèles en situation réelle. L\'équipe technique s\'agrandit pour répondre à la demande croissante.',
        ar: 'افتتاح صالة العرض في فوشانة مع عرض جميع الموديلات في وضع حقيقي. يتوسع الفريق التقني لتلبية الطلب المتزايد.',
        tn: 'فتح الشوروم في فوشانة مع عرض جميع الموديلات في الواقع. الفريق التقني يتوسع باش يلبي الطلب المتزايد.',
        en: 'Opening of the Fouchana showroom with all models on real display. Technical team expands to meet growing demand.',
        it: 'Apertura dello showroom di Fouchana con tutti i modelli in esposizione reale. Il team tecnico si espande per soddisfare la domanda crescente.',
      },
    },
    {
      year: '2026',
      title: { fr: 'Innovation digitale', ar: 'الابتكار الرقمي', tn: 'الابتكار الرقمي', en: 'Digital innovation', it: 'Innovazione digitale' },
      desc: {
        fr: 'Lancement du calculateur de devis en ligne et de l\'assistant IA multilingue — pour offrir une expérience client 100% moderne et accessible 24h/24.',
        ar: 'إطلاق حاسبة الأسعار عبر الإنترنت والمساعد الذكي متعدد اللغات — لتقديم تجربة عميل حديثة بالكامل ومتاحة 24/24.',
        tn: 'إطلاق حاسبة الأسعار أونلاين والمساعد الذكي متعدد اللغات — باش نقدموا تجربة عميل حديثة بالكامل ومتوفرة 24/24.',
        en: 'Launch of the online quote calculator and multilingual AI assistant — for a fully modern, 24/7 customer experience.',
        it: 'Lancio del calcolatore di preventivi online e dell\'assistente IA multilingue — per un\'esperienza cliente 100% moderna e accessibile 24/7.',
      },
    },
  ];

  type LangKey = 'fr' | 'ar' | 'tn' | 'en' | 'it';
  const { i18n } = useTranslation();
  const lang = (i18n.language as LangKey) || 'fr';

  const loc = (obj: Record<string, string>) => obj[lang] ?? obj.fr;

  return (
    <div className="pb-24" style={{ background: '#F5F7FA', minHeight: '100vh' }}>
      <PageSEO
        path="/about"
        titleFr="À Propos — Aluminium Space | Partenaire agréé Grifo Flex Tunisie"
        titleAr="من نحن — Aluminium Space | الشريك المعتمد Grifo Flex تونس"
        titleEn="About Us — Aluminium Space | Certified Grifo Flex Partner Tunisia"
        descFr="Aluminium Space, partenaire agréé Grifo Flex en Tunisie depuis 2018. Moustiquaires sur mesure, installation professionnelle, garantie 3 ans."
        descAr="Aluminium Space، الشريك المعتمد لـ Grifo Flex في تونس منذ 2018. مستيكارات على المقاس، تركيب احترافي، ضمان 3 سنوات."
        descEn="Aluminium Space, certified Grifo Flex partner in Tunisia since 2018. Custom screens, professional installation, 3-year warranty."
      />

      {/* ── Hero banner ──────────────────────────────────────────────────────── */}
      <div style={{ background: '#1D3E61', paddingTop: '80px', paddingBottom: '56px' }}>
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(129,192,99,0.15)',
              color: '#81C063',
              borderRadius: '20px',
              padding: '5px 16px',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              fontFamily: 'Rajdhani, sans-serif',
              marginBottom: '16px',
            }}>
              <ItalyFlag /> Partenaire agréé Grifo Flex · Mghira, Tunisie
            </div>
            <h1 style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(28px, 7vw, 52px)',
              color: '#FFFFFF',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}>
              {t('nav.about')}
            </h1>
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 'clamp(15px, 3vw, 18px)',
              color: 'rgba(255,255,255,0.85)',
              maxWidth: '560px',
              margin: '0 auto',
              lineHeight: 1.7,
            }}>
              {loc({
                fr: 'L\'histoire d\'une entreprise tunisienne qui a choisi l\'excellence italienne.',
                ar: 'قصة شركة تونسية اختارت الامتياز الإيطالي.',
                tn: 'حكاية شركة تونسية خيّرت الجودة الإيطالية.',
                en: 'The story of a Tunisian company that chose Italian excellence.',
              })}
            </p>
          </motion.div>
        </div>
      </div>


      <div className="container mx-auto px-4">

        {/* ── Our story ────────────────────────────────────────────────────── */}
        <div style={{ maxWidth: '1100px', margin: '64px auto 0 auto' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <motion.div {...fadeUp}>
              <div style={{
                background: 'rgba(129,192,99,0.1)',
                color: '#81C063',
                borderRadius: '20px',
                padding: '5px 14px',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                display: 'inline-block',
                marginBottom: '12px',
                fontFamily: 'Rajdhani, sans-serif',
              }}>
                {loc({ fr: 'Notre Histoire', ar: 'قصتنا', tn: 'حكايتنا', en: 'Our Story' })}
              </div>
              <h2 style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 700,
                fontSize: 'clamp(22px, 4vw, 36px)',
                color: '#2F2D2C',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: '16px',
              }}>
                {loc({
                  fr: 'Née à Mghira, Reconnue partout',
                  ar: 'وُلدت في مغيرة، معترف بها في كل مكان',
                  tn: 'ولدت في مغيرة، معروفة في كل بلاصة',
                  en: 'Born in Mghira, Recognized Everywhere',
                })}
              </h2>
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '15px',
                color: '#818181',
                lineHeight: 1.8,
                marginBottom: '16px',
              }}>
                {loc({
                  fr: 'Aluminium Space est une entreprise spécialisée dans la menuiserie aluminium et la distribution de moustiquaires sur mesure. Implantée à Mghira, dans la région de Tunis, nous servons les particuliers et professionnels de toute la Tunisie.',
                  ar: 'Aluminium Space شركة متخصصة في نجارة الألومنيوم وتوزيع المستيكارات على المقاس. موجودة في مغيرة، في منطقة تونس، نخدم الأفراد والمهنيين في كل أنحاء تونس.',
                  tn: 'Aluminium Space شركة متخصصة في نجارة الألمنيوم وتوزيع الموستيكار على المقاس. في مغيرة، منطقة تونس، نخدموا الأفراد والمهنيين في كل تونس.',
                  en: 'Aluminium Space is a company specializing in aluminum joinery and custom mosquito screen distribution. Located in Mghira, Tunis region, we serve individuals and professionals across all of Tunisia.',
                })}
              </p>
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '15px',
                color: '#818181',
                lineHeight: 1.8,
              }}>
                {loc({
                  fr: 'En tant que **partenaire agréé Grifo Flex** en Tunisie, nous proposons des moustiquaires de haute technologie italiennes — mesurées, fabriquées sur mesure et installées par nos techniciens qualifiés.',
                  ar: 'بوصفنا **الشريك المعتمد لـ Grifo Flex** في تونس، نقدم مستيكارات إيطالية عالية التقنية — مقاسة، مصنعة على المقاس ومركبة من قبل تقنيينا المؤهلين.',
                  tn: 'بوصفنا **الشريك المعتمد لـ Grifo Flex** في تونس، نقدموا موستيكار إيطالية عالية التقنية — تُقاس، تُصنع على المقاس وتُركب من طرف تقنيين متخصصين.',
                  en: 'As the **certified Grifo Flex partner** in Tunisia, we offer high-tech Italian mosquito screens — measured, custom-made and installed by our qualified technicians.',
                })}
              </p>
            </motion.div>

            {/* Grifo Flex showcase card */}
            <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
              <div style={{
                background: '#1D3E61',
                borderRadius: '20px',
                padding: 'clamp(24px, 4vw, 40px)',
                color: 'white',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}><ItalyFlag size={32} /></div>
                <h3 style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 700,
                  fontSize: '24px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                  color: '#81C063',
                }}>
                  Grifo Flex
                </h3>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, marginBottom: '20px' }}>
                  {loc({
                    fr: 'Marque italienne leader mondial des moustiquaires rétractables. Fabriquée depuis des décennies à Fano (Marche, Italie) — reconnue pour sa qualité, sa durabilité et son design élégant.',
                    ar: 'العلامة الإيطالية الرائدة عالمياً في المستيكارات القابلة للطي. مصنوعة منذ عقود في فانو (ماركيه، إيطاليا) — معروفة بجودتها ومتانتها وتصميمها الأنيق.',
                    tn: 'العلامة الإيطالية الرائدة عالمياً في الموستيكار. مصنوعة منذ عقود في فانو (إيطاليا) — معروفة بجودتها ومتانتها وتصميمها الأنيق.',
                    en: 'World-leading Italian brand for retractable mosquito screens. Made for decades in Fano (Marche, Italy) — known for quality, durability and elegant design.',
                  })}
                </p>
                {[
                  { fr: 'Aluminium traité anticorrosion', ar: 'ألومنيوم مضاد للتآكل', tn: 'ألمنيوم مضاد للصدأ', en: 'Anti-corrosion aluminum' },
                  { fr: 'Maille ultra-fine zéro insectes', ar: 'شبكة دقيقة لا حشرات', tn: 'شبكة رفيعة ما تدخلش حشرة', en: 'Ultra-fine zero-insect mesh' },
                  { fr: 'Mécanisme garanti 10 ans', ar: 'ميكانيزم مضمون 10 سنوات', tn: 'ميكانيزم مضمون 10 سنوات', en: '10-year mechanism guarantee' },
                  { fr: 'Montage et démontage facile', ar: 'تركيب وفك سهل', tn: 'تركيب وفك سهل', en: 'Easy assembly and removal' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <CheckCircle size={15} style={{ color: '#81C063', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                      {loc(item)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Timeline ──────────────────────────────────────────────────────── */}
        <div style={{ maxWidth: '900px', margin: '72px auto 0 auto' }}>
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(22px, 5vw, 36px)',
              color: '#2F2D2C',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              {loc({ fr: 'Notre Parcours', ar: 'مسيرتنا', tn: 'مسيرتنا', en: 'Our Journey' })}
            </h2>
            <div style={{ width: '48px', height: '3px', background: '#81C063', margin: '0 auto', borderRadius: '2px' }} />
          </motion.div>

          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              left: 'clamp(20px, 5vw, 32px)',
              top: 0,
              bottom: 0,
              width: '2px',
              background: 'linear-gradient(to bottom, #81C063, #296788)',
              borderRadius: '2px',
            }} />

            {timeline.map((item, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ delay: i * 0.12 }}
                style={{
                  display: 'flex',
                  gap: 'clamp(16px, 4vw, 32px)',
                  marginBottom: '32px',
                  paddingLeft: 'clamp(56px, 10vw, 80px)',
                  position: 'relative',
                }}
              >
                {/* Year bubble */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '6px',
                  width: 'clamp(40px, 6vw, 64px)',
                  height: 'clamp(40px, 6vw, 64px)',
                  borderRadius: '50%',
                  background: '#1D3E61',
                  border: '3px solid #81C063',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 700,
                    fontSize: 'clamp(11px, 2vw, 14px)',
                    color: '#81C063',
                    letterSpacing: '1px',
                  }}>
                    {item.year}
                  </span>
                </div>

                {/* Content */}
                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  padding: 'clamp(16px, 3vw, 24px)',
                  border: '1px solid #DBDADA',
                  flex: 1,
                  boxShadow: '0 2px 12px rgba(47,45,44,0.06)',
                }}>
                  <h3 style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 700,
                    fontSize: 'clamp(15px, 3vw, 18px)',
                    color: '#2F2D2C',
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                  }}>
                    {loc(item.title)}
                  </h3>
                  <p style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '14px',
                    color: '#818181',
                    lineHeight: 1.7,
                  }}>
                    {renderWithBold(loc(item.desc))}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Values ────────────────────────────────────────────────────────── */}
        <div style={{ maxWidth: '1100px', margin: '72px auto 0 auto' }}>
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(22px, 5vw, 36px)',
              color: '#2F2D2C',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              {loc({ fr: 'Nos Valeurs', ar: 'قيمنا', tn: 'قيمنا', en: 'Our Values' })}
            </h2>
            <div style={{ width: '48px', height: '3px', background: '#81C063', margin: '0 auto', borderRadius: '2px' }} />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ delay: i * 0.1 }}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  padding: 'clamp(20px, 3vw, 28px)',
                  border: '1px solid #DBDADA',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start',
                  boxShadow: '0 2px 12px rgba(47,45,44,0.05)',
                }}
              >
                <div style={{
                  background: 'rgba(41,103,136,0.08)',
                  borderRadius: '12px',
                  padding: '12px',
                  flexShrink: 0,
                }}>
                  <v.icon size={26} color="#296788" />
                </div>
                <div>
                  <h3 style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 700,
                    fontSize: '16px',
                    color: '#2F2D2C',
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                  }}>
                    {loc(v.title)}
                  </h3>
                  <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#818181', lineHeight: 1.7 }}>
                    {loc(v.desc)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>


      </div>
    </div>
  );
};

export default About;
