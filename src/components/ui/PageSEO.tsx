import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface PageSEOProps {
  titleFr?: string;
  titleAr?: string;
  titleTn?: string;
  titleEn?: string;
  titleIt?: string;
  descFr?: string;
  descAr?: string;
  descEn?: string;
  descIt?: string;
  path?: string;
}

const BASE_URL = 'https://aluminium-space.tn';

const BRAND = 'Aluminium Space';

const defaults = {
  titleFr: `${BRAND} — Moustiquaires Grifo Flex sur mesure en Tunisie`,
  titleAr: `${BRAND} — مستيكارات Grifo Flex على المقاس في تونس`,
  titleEn: `${BRAND} — Custom Grifo Flex Screens in Tunisia`,
  titleIt: `${BRAND} — Zanzariere Grifo Flex su misura in Tunisia`,
  descFr: 'Partenaire agréé Grifo Flex en Tunisie — moustiquaires sur mesure, installation professionnelle à Mghira, Tunis.',
  descAr: 'الشريك المعتمد لـ Grifo Flex في تونس — مستيكارات على المقاس، تركيب احترافي في مغيرة، تونس.',
  descEn: 'Certified Grifo Flex partner in Tunisia — custom screens, professional installation in Mghira, Tunis.',
  descIt: 'Partner certificato Grifo Flex in Tunisia — zanzariere su misura, installazione professionale a Mghira.',
};

const PageSEO = ({ titleFr, titleAr, titleEn, titleIt, descFr, descAr, descEn, descIt, path = '' }: PageSEOProps) => {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const title =
    lang === 'ar' || lang === 'tn' ? (titleAr ?? defaults.titleAr) :
      lang === 'en' ? (titleEn ?? defaults.titleEn) :
        lang === 'it' ? (titleIt ?? defaults.titleIt) :
          (titleFr ?? defaults.titleFr);

  const desc =
    lang === 'ar' || lang === 'tn' ? (descAr ?? defaults.descAr) :
      lang === 'en' ? (descEn ?? defaults.descEn) :
        lang === 'it' ? (descIt ?? defaults.descIt) :
          (descFr ?? defaults.descFr);

  const canonical = `${BASE_URL}${path}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={`${BASE_URL}/logo-aluminium-space.png`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
    </Helmet>
  );
};

export default PageSEO;
