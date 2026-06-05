import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { saveOrder } from '../../store/ordersStore';
import { toast } from '../../hooks/useToast';
import { getSettings } from '../../store/settingsStore';
import { generatePDF } from '../../utils/pdfGenerator';
import { Link } from 'react-router-dom';
import { calculatePrice, getProductPricingOverrides } from '../../utils/priceCalculator';
import { getRemisePercent } from '../../utils/remiseCalculator';
import { usePublicProducts } from '../../hooks/usePublicProducts';


import StepProduct from './StepProduct';
import StepDimensions from './StepDimensions';
import StepClient from './StepClient';
import StepSummary from './StepSummary';

const schema = z.object({
  productId: z.string().min(1, 'Veuillez sélectionner un produit'),
  width: z.number().min(1, 'Largeur requise'),
  height: z.number().min(1, 'Hauteur requise'),
  quantity: z.number().min(1),
  meshType: z.string().optional(),
  color: z.string().optional(),
  openingType: z.enum(['fenetre', 'porte']).nullable().optional(),
  unitPrice: z.number(),
  totalPrice: z.number(),
  fullName: z.string().min(3, 'Nom complet requis'),
  phone: z.string().min(8, 'Téléphone invalide'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  address: z.string().min(5, 'Adresse requise'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export interface DevisFormData {
  productId: string;
  width: number;
  height: number;
  quantity: number;
  meshType?: string;
  color?: string;
  openingType?: 'fenetre' | 'porte' | null;
  unitPrice: number;
  totalPrice: number;
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  notes?: string;
}

export interface DevisItem {
  id: string;
  productId: string;
  productName: string;
  width: number;
  height: number;
  quantity: number;
  meshType?: string;
  color?: string;
  openingType?: 'fenetre' | 'porte' | null;
  baseUnitPrice: number;
  colorSurchargeAmount: number;
  colorSurchargePct: number;
  unitPrice: number;
  totalPrice: number;
}

interface DevisWizardProps {
  initialProductId?: string;
  onClose?: () => void;
}

const DevisWizard = ({ initialProductId, onClose: _onClose }: DevisWizardProps = {}) => {
  const { t } = useTranslation();
  const stepLabels = [t('devis_steps.product'), t('devis_steps.dimensions'), t('devis_steps.client'), t('devis_steps.summary')];
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialProduct = initialProductId ?? searchParams.get('produit');
  const initialW = searchParams.get('w');
  const initialH = searchParams.get('h');
  const initialQty = searchParams.get('qty');
  const { products } = usePublicProducts();
  const shouldStartAtDimensions = Boolean(initialProduct && products.some(p => p.id === initialProduct));

  const [step, setStep] = useState(shouldStartAtDimensions ? 2 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedOrderId, setSubmittedOrderId] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [waUrl, setWaUrl] = useState('');
  const [items, setItems] = useState<DevisItem[]>([]);
  const wizardTopRef = useRef<HTMLDivElement>(null);

  const { register, formState: { errors }, control, watch, setValue, trigger, getValues, resetField } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      productId: initialProduct || '',
      quantity: Number(initialQty) > 0 ? Number(initialQty) : 1,
      unitPrice: 0,
      totalPrice: 0,
      color: 'Blanc',
      openingType: null,
    },
    mode: 'onChange'
  });

  const productId = useWatch({ control, name: 'productId' });

  useEffect(() => {
    if (initialProduct && products.some(p => p.id === initialProduct)) {
      if (initialW) setValue('width', Number(initialW));
      if (initialH) setValue('height', Number(initialH));
      if (Number(initialQty) > 0) setValue('quantity', Number(initialQty));
    }
  }, [initialProduct, initialW, initialH, initialQty, setValue]);

  const handleAddItem = async (goToStep1: boolean) => {
    const isValid = await trigger(['width', 'height', 'quantity']);
    let meshValid = true;
    if (productId === 'elba') meshValid = await trigger(['meshType']);

    if (isValid && meshValid) {
      const data = getValues();
      const product = products.find(p => p.id === data.productId);
      if (product) {
        const newItem: DevisItem = {
          id: Date.now().toString(),
          productId: data.productId,
          productName: product.name,
          width: data.width,
          height: data.height,
          quantity: data.quantity,
          meshType: data.meshType,
          color: data.color || 'Blanc',
          openingType: data.openingType ?? null,
          baseUnitPrice: 0, // Placeholder, will be updated below
          colorSurchargeAmount: 0,
          colorSurchargePct: 0,
          unitPrice: data.unitPrice,
          totalPrice: data.totalPrice
        };

        // Recalculate to get surcharge details
        const priceResult = calculatePrice({
          productId: data.productId,
          width: data.width,
          height: data.height,
          meshType: data.meshType as 'fibre' | 'aluminium' | 'inox',
          color: data.color || 'Blanc',
          ...getProductPricingOverrides(product),
        });

        if (priceResult) {
          newItem.baseUnitPrice = priceResult.baseUnitPrice;
          newItem.colorSurchargeAmount = priceResult.colorSurchargeAmount;
          newItem.colorSurchargePct = priceResult.colorSurchargePct;
        }

        setItems(prev => [...prev, newItem]);

        if (goToStep1) {
          toast.success('✓ Article ajouté ! Vous pouvez en ajouter un autre.');
          // Reset dimension fields for next item
          resetField('width');
          resetField('height');
          setValue('quantity', 1);
          resetField('meshType');
          setValue('color', 'Blanc');
          resetField('openingType');
          setStep(1);
          wizardTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          setStep(3);
          wizardTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  };

  const handleNext = async () => {
    let isValid = false;

    if (step === 1) {
      isValid = await trigger(['productId']);
      if (isValid) {
        setStep(2);
        wizardTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (step === 2) {
      handleAddItem(false);
    } else if (step === 3) {
      isValid = await trigger(['fullName', 'phone', 'email', 'address']);
      if (isValid) {
        setStep(4);
        wizardTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handlePrev = () => {
    if (step === 3) {
      setItems(prev => prev.slice(0, -1));
    }
    setStep(prev => prev - 1);
    wizardTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
      const data = getValues();

      // Calculate global totals
      const cfg = getSettings();
      const totalQty = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
      const remisePct = getRemisePercent(totalQty);

      let globalTotalHT = 0;
      items.forEach(item => {
        const remise = item.totalPrice * (remisePct / 100);
        globalTotalHT += item.totalPrice - remise;
      });

      const fodec = globalTotalHT * (cfg.fodecPercent / 100);
      const totalAfterFodec = globalTotalHT + fodec;
      const tva = totalAfterFodec * (cfg.tvaPercent / 100);
      const timbre = cfg.timbreFiscal * 1000;
      const totalTTC = totalAfterFodec + tva + timbre;

      // Calculate total remise
      const totalRemise = items.reduce((sum, item) => sum + (item.totalPrice * (remisePct / 100)), 0);

      const savedOrder = await saveOrder({
        clientInfo: {
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
          address: data.address,
          notes: data.notes
        },
        items: items,
        totalHT: globalTotalHT,
        netHT: globalTotalHT, // Net HT is total after remise
        remise: totalRemise,
        remisePercent: remisePct,
        fodec: cfg.fodecPercent,
        fodecAmount: fodec,
        baseForTVA: totalAfterFodec,
        tva: cfg.tvaPercent,
        tvaAmount: tva,
        timbre: timbre,
        totalTTC: totalTTC
      });

      setSubmittedOrderId(savedOrder.order_number || savedOrder.id);

      // Generate and download PDF with order ID included
      await generatePDF(savedOrder);

      // Build WhatsApp URL (client clicks button on success page)
      const itemLines = items.map(i => `• ${i.productName} ${i.width}×${i.height}cm ×${i.quantity}${i.color ? ` (${i.color})` : ''}`).join('\n');
      const waMsg = encodeURIComponent(
        `🔔 *Nouvelle commande #${savedOrder.id}*\n\n` +
        `👤 ${data.fullName}\n📱 ${data.phone}\n📍 ${data.address}\n\n` +
        `${itemLines}\n\n💰 *Total TTC: ${(totalTTC / 1000).toFixed(3)} DT*`
      );
      setWaUrl(`https://wa.me/${cfg.whatsapp}?text=${waMsg}`);
      setIsSuccess(true);
    } catch (error: any) {
      console.error('Order save error:', error);
      toast.error(`Une erreur est survenue: ${error.message || 'Veuillez réessayer.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E8EDF5', overflow: 'hidden', maxWidth: '640px', margin: '0 auto' }}>
        {/* Green top bar */}
        <div style={{ background: '#81C063', height: '5px' }} />

        <div style={{ padding: 'clamp(32px, 5vw, 56px)', textAlign: 'center' }}>
          {/* Big checkmark */}
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(129,192,99,0.12)', border: '3px solid #81C063', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#81C063" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'clamp(24px, 5vw, 36px)', color: '#1D3E61', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 10px' }}>
            Commande envoyée !
          </h2>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: '#818181', marginBottom: '32px', lineHeight: 1.6 }}>
            Votre devis PDF a été téléchargé. Notre équipe vous contacte sous 24h pour confirmer.
          </p>

          {/* Order code box */}
          <div style={{ background: '#F5F7FA', border: '2px dashed #1D3E61', borderRadius: '16px', padding: '28px 24px', marginBottom: '28px' }}>
            <p style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '3px', color: '#818181', textTransform: 'uppercase', marginBottom: '14px' }}>
              Votre code de suivi
            </p>
            <div style={{ fontFamily: 'monospace', fontSize: 'clamp(24px, 6vw, 38px)', fontWeight: 700, letterSpacing: '8px', color: '#1D3E61', marginBottom: '16px', userSelect: 'all', wordBreak: 'break-all' }}>
              {submittedOrderId}
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(submittedOrderId); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2500); }}
              style={{
                background: codeCopied ? '#81C063' : '#1D3E61',
                color: 'white', border: 'none', borderRadius: '8px',
                padding: '10px 24px',
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '14px', letterSpacing: '1.5px', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '8px',
              }}
            >
              {codeCopied ? (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg> Code copié !</>
              ) : (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg> Copier le code</>
              )}
            </button>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#818181', marginTop: '12px' }}>
              Ce code est aussi inscrit dans votre PDF téléchargé. Conservez-le pour suivre votre commande.
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '360px', margin: '0 auto' }}>
            <button
              onClick={() => navigate(`/mon-espace?code=${submittedOrderId}`)}
              style={{ background: '#81C063', color: 'white', border: 'none', borderRadius: '10px', padding: '14px 24px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '14px', letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(129,192,99,0.30)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#5e9a43'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#81C063'; e.currentTarget.style.transform = 'none'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              Suivre ma commande
            </button>
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: '#25D366', color: 'white', borderRadius: '10px', padding: '14px 24px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '14px', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(37,211,102,0.25)', textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1aab4e'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#25D366'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                Notifier l'équipe via WhatsApp
              </a>
            )}
            <Link
              to="/"
              style={{ background: 'transparent', color: '#818181', border: '1px solid #DBDADA', borderRadius: '10px', padding: '13px 24px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F5F7FA'; (e.currentTarget as HTMLElement).style.borderColor = '#818181'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = '#DBDADA'; }}
            >
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={wizardTopRef}
      className="devis-wizard-container"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E8EDF5',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(29,62,97,0.08)',
        maxWidth: '860px',
        margin: '0 auto',
      }}
    >
      {/* Navy top bar */}
      <div style={{ background: '#1D3E61', height: '4px' }} />

      {/* Progress Steps */}
      <div style={{ padding: '28px 32px 0', borderBottom: '1px solid #F0F4F8', marginBottom: '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative', maxWidth: '500px', margin: '0 auto 0' }}>
          {/* Background track */}
          <div style={{ position: 'absolute', top: '18px', left: '18px', right: '18px', height: '2px', background: '#E8EDF5', zIndex: 1 }} />
          {/* Progress fill */}
          <div style={{ position: 'absolute', top: '18px', left: '18px', height: '2px', background: '#81C063', zIndex: 2, width: `${((step - 1) / (stepLabels.length - 1)) * 100}%`, transition: 'width 0.4s ease' }} />

          {stepLabels.map((label, i) => {
            const stepNum = i + 1;
            const isActive = step === stepNum;
            const isCompleted = step > stepNum;

            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, position: 'relative' }}>
                <div className="devis-step-circle" style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '15px',
                  transition: 'all 0.3s ease',
                  background: isCompleted ? '#81C063' : isActive ? '#1D3E61' : 'white',
                  color: isCompleted || isActive ? 'white' : '#DBDADA',
                  border: isCompleted ? '2px solid #81C063' : isActive ? '2px solid #1D3E61' : '2px solid #DBDADA',
                  boxShadow: isActive ? '0 0 0 4px rgba(29,62,97,0.10)' : 'none',
                }}>
                  {isCompleted ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  ) : stepNum}
                </div>
                <span className="devis-step-label" style={{
                  fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '11px',
                  letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '8px', marginBottom: '16px',
                  color: isCompleted ? '#81C063' : isActive ? '#1D3E61' : '#B3B3B3',
                  whiteSpace: 'nowrap',
                }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Mobile Single Step Label */}
        <div className="md:hidden text-center mt-6 mb-2">
          <span style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: '#1D3E61',
            background: 'rgba(29,62,97,0.06)',
            padding: '6px 14px',
            borderRadius: '20px'
          }}>
            {t('devis_steps.step_x_of_y', { step, total: stepLabels.length, defaultValue: 'Étape {{step}} sur {{total}}' })} : {stepLabels[step - 1]}
          </span>
        </div>
      </div>

      {/* Step content */}
      <div style={{ padding: 'clamp(24px, 4vw, 40px)' }}>

        <div>
          <form onSubmit={(e) => e.preventDefault()}>
            {step === 1 && (
              <StepProduct
                products={products}
                selectedProductId={productId}
                onSelect={(id) => setValue('productId', id)}
                onNext={handleNext}
              />
            )}
            {step === 2 && (
              <StepDimensions
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
                onNext={handleNext}
                onPrev={handlePrev}
                productId={productId}
                products={products}
                onAddAnother={() => handleAddItem(true)}
              />
            )}
            {step === 3 && (
              <StepClient
                register={register}
                errors={errors}
                onPrev={handlePrev}
                onSubmit={handleNext}
                itemsCount={items.length}
                items={items}
              />
            )}
            {step === 4 && (
              <StepSummary
                formData={getValues()}
                items={items}
                products={products}
                onPrev={handlePrev}
                onSubmitOrder={onSubmit}
                isSubmitting={isSubmitting}
              />
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default DevisWizard;

