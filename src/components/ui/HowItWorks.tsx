import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Ruler, MessageSquare, Wrench, CheckCircle } from 'lucide-react';

const HowItWorks = () => {
  const { t } = useTranslation();

  const steps = [
    { step: '01', labelKey: 'steps.measure', icon: Ruler },
    { step: '02', labelKey: 'steps.quote', icon: MessageSquare },
    { step: '03', labelKey: 'steps.make', icon: Wrench },
    { step: '04', labelKey: 'steps.install', icon: CheckCircle },
  ];

  return (
    <section className="py-12 sm:py-24 relative" style={{ background: '#F5F7FA' }}>
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-20"
        >
          <h2
            className="font-display font-bold section-title"
            style={{ color: '#2F2D2C', fontSize: 'clamp(22px, 4vw, 42px)' }}
          >
            {t('steps.title')}
          </h2>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          {/* Horizontal connecting line — desktop only */}
          <div
            className="hidden lg:block absolute top-[48px] left-[12%] right-[12%] h-[2px]"
            style={{ borderTop: '2px dashed #B3B3B3' }}
          />

          {/* Steps grid: vertical list on mobile, horizontal on lg */}
          <div className="flex flex-col lg:grid lg:grid-cols-4 gap-5 sm:gap-8 lg:gap-8 relative z-10">
            {steps.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="flex flex-row lg:flex-col items-center gap-4 lg:gap-0 group"
              >
                {/* Circle + number */}
                <div className="flex flex-col items-center shrink-0">
                  <span
                    className="font-display font-bold text-[13px] mb-1 lg:mb-2"
                    style={{ color: '#81C063', letterSpacing: '2px' }}
                  >
                    {item.step}
                  </span>
                  <div
                    className="w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-500"
                    style={{ background: '#1D3E61', border: '2px solid #296788' }}
                  >
                    <item.icon className="w-6 h-6 lg:w-[26px] lg:h-[26px] text-white" />
                  </div>
                </div>

                {/* Label */}
                <h3
                  className="font-display font-semibold text-[14px] lg:mt-4 text-left lg:text-center"
                  style={{ color: '#2F2D2C', letterSpacing: '2px' }}
                >
                  {t(item.labelKey)}
                </h3>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
