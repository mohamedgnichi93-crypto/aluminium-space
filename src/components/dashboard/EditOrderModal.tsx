import React, { useState, useEffect } from 'react';
import { X as XIcon, Plus, Minus } from 'lucide-react';
import { toast } from '../../hooks/useToast';
import type { Order } from '../../store/ordersStore';
import { getRemisePercent } from '../../utils/remiseCalculator';
import { calculatePrice, resolveProductDimensionLimits } from '../../utils/priceCalculator';
import { getProducts, type SupabaseProduct } from '../../store/productsStore';
import { ALL_COLORS } from '../../data/colors';
import { motion, AnimatePresence } from 'framer-motion';

interface EditOrderModalProps {
  editingOrder: Order;
  setEditingOrder: React.Dispatch<React.SetStateAction<Order | null>> | ((order: Order | null) => void);
  updateOrder: (id: string, order: Order) => Promise<any>;
  loadData: () => void;
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({
  editingOrder,
  setEditingOrder,
  updateOrder,
  loadData
}) => {
  const [productsList, setProductsList] = useState<SupabaseProduct[]>([]);
  const [itemWarnings, setItemWarnings] = useState<Record<number, string>>({});
  const [manualRemise, setManualRemise] = useState<number | null>(() => {
    const autoPct = getRemisePercent(editingOrder.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || 0);
    return editingOrder.remisePercent !== autoPct ? editingOrder.remisePercent : null;
  });

  useEffect(() => {
    getProducts()
      .then(data => setProductsList(data || []))
      .catch(err => console.error('Error fetching products:', err));
  }, []);

  const items = editingOrder.items || [];
  const totalQty = items.reduce((sum, it) => sum + (it.quantity || 1), 0);
  const autoRemisePercent = getRemisePercent(totalQty);
  const effectiveRemise = manualRemise !== null ? manualRemise : autoRemisePercent;
  
  const grossTotalHT = items.reduce((sum, it) => sum + ((it.unitPrice || 0) * (it.quantity || 1)), 0);
  const remiseAmount = Math.round(grossTotalHT * effectiveRemise / 100);
  const netHT = grossTotalHT - remiseAmount;
  
  const fodecAmount = Math.round(netHT * (editingOrder.fodec ?? 1) / 100);
  const baseForTVA = netHT + fodecAmount;
  const tvaAmount = Math.round(baseForTVA * (editingOrder.tva ?? 19) / 100);
  const timbre = 1000;
  const totalTTC = baseForTVA + tvaAmount + timbre;

  const getColorOptions = (item: any) => {
    const selectedP = productsList.find(p => p.slug === item.productId);
    const prodColors = selectedP?.colors || [];
    const allColorNames = ALL_COLORS.map(c => c.name);
    const finalColors = Array.from(new Set([...prodColors, ...allColorNames]));
    return finalColors.map(cName => (
      <option key={cName} value={cName}>{cName}</option>
    ));
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) setEditingOrder(null); }}
    >
      <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '860px', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1D3E61, #1A5DA8)', padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white' }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '20px', letterSpacing: '0.5px' }}>
              Modifier la Commande
            </h2>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#E2E8F0', marginTop: '2px', opacity: 0.85 }}>
              Devis AS-{editingOrder.id}
            </div>
          </div>
          <button 
            onClick={() => setEditingOrder(null)} 
            style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Body Container */}
        <div style={{ padding: '28px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Section 1: Informations Client */}
          <div>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '14px', color: '#1D3E61', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '2px solid #F1F5F9', paddingBottom: '6px' }}>
              Informations Client
            </h3>
            
            <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Nom complet</label>
                  <input
                    type="text"
                    value={editingOrder.clientInfo.fullName ?? ''}
                    onChange={e => setEditingOrder({ ...editingOrder, clientInfo: { ...editingOrder.clientInfo, fullName: e.target.value } })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'white', transition: 'border-color 0.2s' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#1D3E61'}
                    onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                  />
                </div>
                <div>
                  <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Téléphone</label>
                  <input
                    type="tel"
                    value={editingOrder.clientInfo.phone ?? ''}
                    onChange={e => setEditingOrder({ ...editingOrder, clientInfo: { ...editingOrder.clientInfo, phone: e.target.value } })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'white', transition: 'border-color 0.2s' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#1D3E61'}
                    onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Email</label>
                <input
                  type="text"
                  value={editingOrder.clientInfo.email ?? ''}
                  onChange={e => setEditingOrder({ ...editingOrder, clientInfo: { ...editingOrder.clientInfo, email: e.target.value } })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'white', transition: 'border-color 0.2s' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#1D3E61'}
                  onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                />
              </div>

              <div>
                <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Adresse de livraison</label>
                <input
                  type="text"
                  value={editingOrder.clientInfo.address ?? ''}
                  onChange={e => setEditingOrder({ ...editingOrder, clientInfo: { ...editingOrder.clientInfo, address: e.target.value } })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'white', transition: 'border-color 0.2s' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#1D3E61'}
                  onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Remise (%)</label>
                  <input
                    type="number" min="0" max="100" step="0.1"
                    value={manualRemise !== null ? manualRemise : autoRemisePercent}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '') {
                        setManualRemise(null);
                      } else {
                        setManualRemise(parseFloat(val) || 0);
                      }
                    }}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                  />
                  <span style={{ fontSize: '10px', color: '#888', display: 'block', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>
                    {manualRemise !== null ? 'Remise manuelle' : `Tier (${totalQty} prod.)`}
                  </span>
                </div>
                <div>
                  <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>FODEC (%)</label>
                  <input
                    type="number" min="0" max="100" step="0.1"
                    value={editingOrder.fodec}
                    onChange={e => setEditingOrder({ ...editingOrder, fodec: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>TVA (%)</label>
                  <input
                    type="number" min="0" max="100" step="0.1"
                    value={editingOrder.tva}
                    onChange={e => setEditingOrder({ ...editingOrder, tva: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Produits */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '2px solid #F1F5F9', paddingBottom: '6px' }}>
              <h3 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '14px', color: '#1D3E61', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Produits Commandés
              </h3>
              <button
                onClick={() => setEditingOrder({
                  ...editingOrder, items: [...(editingOrder.items || []), { id: Math.random().toString(36).slice(2), productId: '', productName: '', width: 0, height: 0, quantity: 1, meshType: '', unitPrice: 0, totalPrice: 0, color: 'Blanc', baseUnitPrice: 0, colorSurchargeAmount: 0, colorSurchargePct: 0 }]
                })}
                style={{ background: '#27AE60', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Inter, sans-serif', boxShadow: '0 2px 4px rgba(39,174,96,0.2)' }}
              >
                <Plus size={14} /> Ajouter un produit
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <AnimatePresence>
                {items.map((item, idx) => {
                  const product = productsList.find(p => p.slug === item.productId);
                  const imageUrl = product?.image_url || (product as any)?.imageUrl;
                  const limits = item.productId ? resolveProductDimensionLimits(item.productId, item.height, {}) : null;
                  const hasWidthError = item.productId && item.width > 0 && limits && item.width > limits.maxW;
                  const hasHeightError = item.productId && item.height > 0 && limits && item.height > limits.maxH;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      style={{ background: 'white', border: '1px solid #E8EDF4', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}
                    >
                      {/* Top Line of Card */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {imageUrl ? (
                            <img src={imageUrl} alt={item.productName} style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', padding: '2px' }} />
                          ) : (
                            <div style={{ width: '60px', height: '60px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F4F7FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#1D3E61', fontSize: '20px', fontFamily: 'Space Grotesk, sans-serif' }}>
                              {item.productName ? item.productName.charAt(0).toUpperCase() : 'P'}
                            </div>
                          )}
                          <div>
                            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#1D3E61', display: 'block' }}>
                              Article {idx + 1}
                            </span>
                            <span style={{ fontSize: '12px', color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
                              {item.productName || 'Nouveau Produit'}
                            </span>
                          </div>
                        </div>
                        {items.length > 1 && (
                          <button
                            onClick={() => setEditingOrder({ ...editingOrder, items: items.filter((_, i) => i !== idx) })}
                            style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#FCA5A5'}
                            onMouseLeave={e => e.currentTarget.style.background = '#FEE2E2'}
                            title="Supprimer l'article"
                          >
                            <Minus size={16} />
                          </button>
                        )}
                      </div>

                      {/* Inputs Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Produit</label>
                          <select
                            value={item.productId || ''}
                            onChange={e => {
                              const pId = e.target.value;
                              const selectedP = productsList.find(p => p.slug === pId);
                              const newName = selectedP ? selectedP.name : '';
                              const defaultColor = selectedP?.colors?.[0] || 'Blanc';
                              
                              let newPrice = item.unitPrice;
                              let baseUnitPrice = item.baseUnitPrice || 0;
                              let colorSurchargeAmount = item.colorSurchargeAmount || 0;
                              let colorSurchargePct = item.colorSurchargePct || 0;

                              if (selectedP && item.width > 0 && item.height > 0) {
                                const result = calculatePrice({
                                  productId: selectedP.slug,
                                  width: item.width,
                                  height: item.height,
                                  color: defaultColor,
                                  meshType: (item.meshType || 'fibre') as any,
                                  basePrice: selectedP.base_price,
                                  pricePerM2: selectedP.price_per_m2,
                                });
                                if (result) {
                                  newPrice = result.unitPrice;
                                  baseUnitPrice = result.baseUnitPrice;
                                  colorSurchargeAmount = result.colorSurchargeAmount;
                                  colorSurchargePct = result.colorSurchargePct;
                                  setItemWarnings(prev => {
                                    const next = { ...prev };
                                    delete next[idx];
                                    return next;
                                  });
                                } else {
                                  setItemWarnings(prev => ({
                                    ...prev,
                                    [idx]: 'Dimensions hors limites pour ce produit — prix non recalculé'
                                  }));
                                }
                              }

                              setEditingOrder({
                                ...editingOrder,
                                  items: items.map((it, i) =>
                                  i === idx
                                    ? {
                                        ...it,
                                        productId: pId,
                                        productName: newName,
                                        color: defaultColor,
                                        unitPrice: newPrice,
                                        totalPrice: newPrice * it.quantity,
                                        baseUnitPrice,
                                        colorSurchargeAmount,
                                        colorSurchargePct
                                      }
                                    : it
                                )
                              });
                            }}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                          >
                            <option value="">-- Choisir un produit --</option>
                            {productsList.map(p => (
                              <option key={p.slug} value={p.slug}>{p.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Couleur</label>
                          <select
                            value={item.color || 'Blanc'}
                            onChange={e => {
                              const newColor = e.target.value;
                              const selectedP = productsList.find(p => p.slug === item.productId);
                              
                              let newPrice = item.unitPrice;
                              let baseUnitPrice = item.baseUnitPrice || 0;
                              let colorSurchargeAmount = item.colorSurchargeAmount || 0;
                              let colorSurchargePct = item.colorSurchargePct || 0;

                              if (selectedP && item.width > 0 && item.height > 0) {
                                const result = calculatePrice({
                                  productId: selectedP.slug,
                                  width: item.width,
                                  height: item.height,
                                  color: newColor,
                                  meshType: (item.meshType || 'fibre') as any,
                                  basePrice: selectedP.base_price,
                                  pricePerM2: selectedP.price_per_m2,
                                });
                                if (result) {
                                  newPrice = result.unitPrice;
                                  baseUnitPrice = result.baseUnitPrice;
                                  colorSurchargeAmount = result.colorSurchargeAmount;
                                  colorSurchargePct = result.colorSurchargePct;
                                  setItemWarnings(prev => {
                                    const next = { ...prev };
                                    delete next[idx];
                                    return next;
                                  });
                                } else {
                                  setItemWarnings(prev => ({
                                    ...prev,
                                    [idx]: 'Dimensions hors limites pour ce produit — prix non recalculé'
                                  }));
                                }
                              }

                              setEditingOrder({
                                ...editingOrder,
                                items: items.map((it, i) =>
                                  i === idx
                                    ? {
                                        ...it,
                                        color: newColor,
                                        unitPrice: newPrice,
                                        totalPrice: newPrice * it.quantity,
                                        baseUnitPrice,
                                        colorSurchargeAmount,
                                        colorSurchargePct
                                      }
                                    : it
                                )
                              });
                            }}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                          >
                            {getColorOptions(item)}
                          </select>
                        </div>

                        <div>
                          <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Type d'ouverture</label>
                          <select
                            value={item.openingType || 'fenetre'}
                            onChange={e => {
                              const val = e.target.value;
                              setEditingOrder({
                                ...editingOrder,
                                items: items.map((it, i) => i === idx ? { ...it, openingType: val } : it)
                              });
                            }}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                          >
                            <option value="fenetre">Fenêtre</option>
                            <option value="porte">Porte</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Type de toile</label>
                          <select
                            value={item.meshType || 'fibre'}
                            onChange={e => {
                              const val = e.target.value;
                              const selectedP = productsList.find(p => p.slug === item.productId);
                              
                              let newPrice = item.unitPrice;
                              let baseUnitPrice = item.baseUnitPrice || 0;
                              let colorSurchargeAmount = item.colorSurchargeAmount || 0;
                              let colorSurchargePct = item.colorSurchargePct || 0;

                              if (selectedP && item.width > 0 && item.height > 0) {
                                const result = calculatePrice({
                                  productId: selectedP.slug,
                                  width: item.width,
                                  height: item.height,
                                  color: item.color || 'Blanc',
                                  meshType: val as 'fibre' | 'aluminium' | 'inox',
                                  basePrice: selectedP.base_price,
                                  pricePerM2: selectedP.price_per_m2,
                                });
                                if (result) {
                                  newPrice = result.unitPrice;
                                  baseUnitPrice = result.baseUnitPrice;
                                  colorSurchargeAmount = result.colorSurchargeAmount;
                                  colorSurchargePct = result.colorSurchargePct;
                                  setItemWarnings(prev => {
                                    const next = { ...prev };
                                    delete next[idx];
                                    return next;
                                  });
                                } else {
                                  setItemWarnings(prev => ({
                                    ...prev,
                                    [idx]: 'Dimensions hors limites pour ce produit — prix non recalculé'
                                  }));
                                }
                              }

                              setEditingOrder({
                                ...editingOrder,
                                items: items.map((it, i) =>
                                  i === idx
                                    ? {
                                        ...it,
                                        meshType: val,
                                        unitPrice: newPrice,
                                        totalPrice: newPrice * it.quantity,
                                        baseUnitPrice,
                                        colorSurchargeAmount,
                                        colorSurchargePct
                                      }
                                    : it
                                )
                              });
                            }}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                          >
                            <option value="fibre">Fibre de verre</option>
                            <option value="aluminium">Aluminium</option>
                            <option value="inox">Inox</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Largeur (cm)</label>
                          <input
                            type="number" min="0"
                            value={item.width}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              let calculatedUnitPrice = item.unitPrice;
                              let baseUnitPrice = item.baseUnitPrice || 0;
                              let colorSurchargeAmount = item.colorSurchargeAmount || 0;
                              let colorSurchargePct = item.colorSurchargePct || 0;

                              const selectedP = productsList.find(p => p.slug === item.productId);
                              if (selectedP && val > 0 && item.height > 0) {
                                const result = calculatePrice({
                                  productId: selectedP.slug,
                                  width: val,
                                  height: item.height,
                                  color: item.color || 'Blanc',
                                  meshType: (item.meshType || 'fibre') as any,
                                  basePrice: selectedP.base_price,
                                  pricePerM2: selectedP.price_per_m2,
                                });
                                if (result) {
                                  calculatedUnitPrice = result.unitPrice;
                                  baseUnitPrice = result.baseUnitPrice;
                                  colorSurchargeAmount = result.colorSurchargeAmount;
                                  colorSurchargePct = result.colorSurchargePct;
                                  setItemWarnings(prev => {
                                    const next = { ...prev };
                                    delete next[idx];
                                    return next;
                                  });
                                } else {
                                  setItemWarnings(prev => ({
                                    ...prev,
                                    [idx]: 'Dimensions hors limites pour ce produit — prix non recalculé'
                                  }));
                                }
                              } else if (selectedP) {
                                  calculatedUnitPrice = 0;
                                  baseUnitPrice = 0;
                                  colorSurchargeAmount = 0;
                                  colorSurchargePct = 0;
                              }
                              setEditingOrder({
                                ...editingOrder,
                                items: items.map((it, i) => i === idx ? { ...it, width: val, unitPrice: calculatedUnitPrice, totalPrice: calculatedUnitPrice * it.quantity, baseUnitPrice, colorSurchargeAmount, colorSurchargePct } : it)
                              });
                            }}
                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${hasWidthError ? '#EF4444' : '#E2E8F0'}`, borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                          />
                          {hasWidthError && limits && (
                            <div style={{ color: '#EF4444', fontSize: '11px', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>
                              Largeur maximale : {limits.maxW} cm
                            </div>
                          )}
                        </div>

                        <div>
                          <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Hauteur (cm)</label>
                          <input
                            type="number" min="0"
                            value={item.height}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              let calculatedUnitPrice = item.unitPrice;
                              let baseUnitPrice = item.baseUnitPrice || 0;
                              let colorSurchargeAmount = item.colorSurchargeAmount || 0;
                              let colorSurchargePct = item.colorSurchargePct || 0;

                              const selectedP = productsList.find(p => p.slug === item.productId);
                              if (selectedP && item.width > 0 && val > 0) {
                                const result = calculatePrice({
                                  productId: selectedP.slug,
                                  width: item.width,
                                  height: val,
                                  color: item.color || 'Blanc',
                                  meshType: (item.meshType || 'fibre') as any,
                                  basePrice: selectedP.base_price,
                                  pricePerM2: selectedP.price_per_m2,
                                });
                                if (result) {
                                  calculatedUnitPrice = result.unitPrice;
                                  baseUnitPrice = result.baseUnitPrice;
                                  colorSurchargeAmount = result.colorSurchargeAmount;
                                  colorSurchargePct = result.colorSurchargePct;
                                  setItemWarnings(prev => {
                                    const next = { ...prev };
                                    delete next[idx];
                                    return next;
                                  });
                                } else {
                                  setItemWarnings(prev => ({
                                    ...prev,
                                    [idx]: 'Dimensions hors limites pour ce produit — prix non recalculé'
                                  }));
                                }
                              } else if (selectedP) {
                                calculatedUnitPrice = 0;
                                baseUnitPrice = 0;
                                colorSurchargeAmount = 0;
                                colorSurchargePct = 0;
                              }
                              setEditingOrder({
                                ...editingOrder,
                                items: items.map((it, i) => i === idx ? { ...it, height: val, unitPrice: calculatedUnitPrice, totalPrice: calculatedUnitPrice * it.quantity, baseUnitPrice, colorSurchargeAmount, colorSurchargePct } : it)
                              });
                            }}
                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${hasHeightError ? '#EF4444' : '#E2E8F0'}`, borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                          />
                          {hasHeightError && limits && (
                            <div style={{ color: '#EF4444', fontSize: '11px', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>
                              Hauteur maximale : {limits.maxH} cm
                            </div>
                          )}
                        </div>

                        <div>
                          <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Quantité</label>
                          <input
                            type="number" min="1"
                            value={item.quantity}
                            onChange={e => {
                              const val = parseInt(e.target.value) || 1;
                              setEditingOrder({
                                ...editingOrder,
                                items: items.map((it, i) => i === idx ? { ...it, quantity: val, totalPrice: it.unitPrice * val } : it)
                              });
                            }}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Prix unitaire (mDT)</label>
                          <input
                            type="number" min="0"
                            value={item.unitPrice}
                            readOnly
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #E2E8F0',
                              borderRadius: '8px',
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '14px',
                              outline: 'none',
                              boxSizing: 'border-box',
                              background: '#F1F5F9',
                              color: '#64748B',
                              cursor: 'not-allowed',
                            }}
                          />
                        </div>
                      </div>

                      {itemWarnings[idx] && (
                        <div style={{
                          marginTop: 10,
                          padding: '8px 12px',
                          backgroundColor: '#FFFBEB',
                          color: '#B45309',
                          borderRadius: 8,
                          fontSize: 12,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          border: '1px solid #FDE68A',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                        }}>
                          ⚠️ {itemWarnings[idx]}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Section 3: Résumé Financier */}
          <div>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '14px', color: '#1D3E61', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '2px solid #F1F5F9', paddingBottom: '6px' }}>
              Résumé Financier
            </h3>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Total Brut HT :</span>
                <span style={{ fontWeight: 600, color: '#1D3E61' }}>{new Intl.NumberFormat('fr-FR').format(grossTotalHT)} mDT</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#E11D48' }}>
                <span>Remise ({effectiveRemise}%) :</span>
                <span style={{ fontWeight: 600 }}>-{new Intl.NumberFormat('fr-FR').format(remiseAmount)} mDT</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', borderBottom: '1px dashed #CBD5E1', paddingBottom: '8px' }}>
                <span>Total Net HT :</span>
                <span style={{ fontWeight: 600, color: '#1D3E61' }}>{new Intl.NumberFormat('fr-FR').format(netHT)} mDT</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>FODEC ({editingOrder.fodec ?? 1}%) :</span>
                <span style={{ fontWeight: 600, color: '#1D3E61' }}>{new Intl.NumberFormat('fr-FR').format(fodecAmount)} mDT</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>TVA ({editingOrder.tva ?? 19}%) :</span>
                <span style={{ fontWeight: 600, color: '#1D3E61' }}>{new Intl.NumberFormat('fr-FR').format(tvaAmount)} mDT</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
                <span>Timbre Fiscal :</span>
                <span style={{ fontWeight: 600, color: '#1D3E61' }}>1 000 mDT</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', paddingTop: '8px' }}>
                <span style={{ fontWeight: 800, color: '#1D3E61', fontFamily: 'Space Grotesk, sans-serif' }}>TOTAL TTC :</span>
                <span style={{ fontWeight: 800, color: '#27AE60', fontFamily: 'Space Grotesk, sans-serif' }}>{new Intl.NumberFormat('fr-FR').format(totalTTC)} mDT</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer sticky */}
        <div style={{ position: 'sticky', bottom: 0, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(8px)', borderTop: '1px solid #E2E8F0', padding: '16px 28px', display: 'flex', gap: '12px', justifyContent: 'flex-end', zIndex: 10 }}>
          <button
            onClick={() => setEditingOrder(null)}
            style={{ padding: '10px 24px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#F8FAFC', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', cursor: 'pointer', color: '#64748B', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#334155'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#64748B'; }}
          >
            Annuler
          </button>
          <button
            onClick={async () => {
              const orderItems = editingOrder.items || [];
              for (let idx = 0; idx < orderItems.length; idx++) {
                const item = orderItems[idx];
                if (item.productId && item.width > 0 && item.height > 0) {
                  const limits = resolveProductDimensionLimits(item.productId, item.height, {});
                  if (limits && (item.width > limits.maxW || item.height > limits.maxH)) {
                    toast.error(`Article ${idx + 1}: dimensions invalides. Vérifiez les limites du produit.`);
                    return;
                  }
                }
              }

              try {
                const updatedItems = editingOrder.items || [];
                const finalOrder = {
                  ...editingOrder,
                  totalHT: netHT,
                  netHT: netHT,
                  remise: remiseAmount,
                  remisePercent: effectiveRemise,
                  fodecAmount: fodecAmount,
                  baseForTVA: baseForTVA,
                  tvaAmount: tvaAmount,
                  totalTTC: totalTTC,
                  timbre: timbre,
                  items: updatedItems,
                  grossTotalHT: grossTotalHT,
                };

                await updateOrder(editingOrder.id, finalOrder as any);
                await loadData();
                setEditingOrder(null);
                toast.success('Commande modifiée avec succès');
              } catch (err) {
                console.error('Error updating order:', err);
                toast.error('Erreur lors de la modification');
              }
            }}
            style={{ padding: '10px 28px', border: 'none', borderRadius: '8px', background: '#27AE60', color: 'white', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(39,174,96,0.2), 0 2px 4px -1px rgba(39,174,96,0.1)', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#219653'}
            onMouseLeave={e => e.currentTarget.style.background = '#27AE60'}
          >
            Enregistrer
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditOrderModal;
