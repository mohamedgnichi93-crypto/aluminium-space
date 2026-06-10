import { X, Phone, Mail, FileText, ClipboardList, Receipt, Calendar, MapPin, MessageCircle, CheckCircle, Loader2, Trash2, Plus, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { type Order, updateOrder } from '../../store/ordersStore';
import { generatePDF } from '../../utils/pdfGenerator';
import { toast } from '../../hooks/useToast';
import { getProducts, type SupabaseProduct } from '../../store/productsStore';

interface Props {
  order: Order;
  onClose: () => void;
  onStatusChange: (id: string, status: Order['status']) => void;
  onDownloadPDF: (order: Order) => void | Promise<void>;
  onDownloadBonDeCommande: (order: Order) => void | Promise<void>;
  onDownloadFacture: (order: Order) => void | Promise<void>;
  generatingPdfId?: string | null;
  onOrderUpdate?: (updatedOrder: Order) => void | Promise<void>;
}

const formatDT = (num: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(num / 1000) + ' DT';
};

const OrderDetailModal = ({ order, onClose, onStatusChange, onDownloadPDF, onDownloadBonDeCommande, onDownloadFacture, generatingPdfId, onOrderUpdate }: Props) => {
  const [productsList, setProductsList] = useState<SupabaseProduct[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<Order['status']>(order.status);
  const [editingRemise, setEditingRemise] = useState(false);
  const [remiseInput, setRemiseInput] = useState('');
  const [savingRemise, setSavingRemise] = useState(false);

  // States for product editing inline
  const [isEditingProducts, setIsEditingProducts] = useState(false);
  const [editItems, setEditItems] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState({ productName: '', width: 100, height: 100, quantity: 1, unitPrice: 0 });
  const [savingProducts, setSavingProducts] = useState(false);

  useEffect(() => {
    getProducts()
      .then(data => setProductsList(data || []))
      .catch(err => console.error(err));
  }, []);

  const handleStartEditProducts = () => {
    setEditItems(JSON.parse(JSON.stringify(order.items || [])));
    setIsEditingProducts(true);
    setIsAdding(false);
  };

  const handleDeleteProduct = (idx: number) => {
    if (window.confirm('Voulez-vous supprimer cet article ?')) {
      setEditItems(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const handleConfirmAddProduct = () => {
    if (!newProduct.productName.trim()) {
      alert('Veuillez saisir le nom/description du produit.');
      return;
    }
    if (newProduct.width <= 0 || newProduct.height <= 0 || newProduct.quantity <= 0 || newProduct.unitPrice <= 0) {
      alert('Veuillez saisir des valeurs positives pour les dimensions, quantité et prix.');
      return;
    }

    const newItem = {
      id: Math.random().toString(36).slice(2),
      productName: newProduct.productName,
      width: Number(newProduct.width),
      height: Number(newProduct.height),
      quantity: Number(newProduct.quantity),
      unitPrice: Number(newProduct.unitPrice),
      totalPrice: Number(newProduct.unitPrice) * Number(newProduct.quantity),
      color: 'Blanc',
    };

    setEditItems(prev => [...prev, newItem]);
    setIsAdding(false);
    setNewProduct({ productName: '', width: 100, height: 100, quantity: 1, unitPrice: 0 });
  };

  const handleSaveProducts = async () => {
    if (editItems.length === 0) {
      alert('Une commande doit contenir au moins un produit.');
      return;
    }

    setSavingProducts(true);
    try {
      const totalHT = editItems.reduce((sum, it) => sum + ((it.unitPrice ?? 0) * (it.quantity ?? 1)), 0);
      const rp = order.remisePercent ?? 0;
      const fodec = order.fodec ?? 1;
      const tva = order.tva ?? 19;
      const timbre = order.timbre ?? 1000;

      const remise = totalHT * (rp / 100);
      const netHT = totalHT - remise;
      const fodecAmount = netHT * (fodec / 100);
      const baseForTVA = netHT + fodecAmount;
      const tvaAmount = baseForTVA * (tva / 100);
      const totalTTC = baseForTVA + tvaAmount + timbre;

      const updatedOrder: Order = {
        ...order,
        items: editItems,
        totalHT,
        remise,
        netHT,
        fodecAmount,
        baseForTVA,
        tvaAmount,
        totalTTC,
      };

      await updateOrder(order.id, updatedOrder);
      
      if (onOrderUpdate) {
        await onOrderUpdate(updatedOrder);
      }

      setIsEditingProducts(false);
      toast.success('Produits mis à jour avec succès');
    } catch (err) {
      console.error('Erreur mise à jour produits:', err);
      toast.error('Erreur lors de la modification des produits');
    } finally {
      setSavingProducts(false);
    }
  };

  const isPdfLocked = Boolean(generatingPdfId);
  const isGenerating = (kind: 'devis' | 'bon' | 'facture') => generatingPdfId === `${order.id}:${kind}`;

  const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: '#FEF3C7', color: '#D97706', label: 'En attente' },
    confirmed: { bg: '#D1FAE5', color: '#27AE60', label: 'Confirmé' },
    mesure: { bg: '#FEF3C7', color: '#D97706', label: 'Mesure en cours' },
    avance: { bg: '#DBEAFE', color: '#2563EB', label: 'Avance reçue' },
    en_fabrication: { bg: '#DBEAFE', color: '#2563EB', label: 'En fabrication' },
    pret: { bg: '#EDE9FE', color: '#8B5CF6', label: 'Prêt' },
    installe: { bg: '#D1FAE5', color: '#27AE60', label: 'Installé' },
    livree: { bg: '#F3F4F6', color: '#6B7280', label: 'Livrée' },
    cancelled: { bg: '#FEE2E2', color: '#EF4444', label: 'Annulé' },
  };

  const getStatusBadge = (status: string) => {
    const s = statusConfig[status] || statusConfig.pending;
    return (
      <span style={{
        background: s.bg, color: s.color, borderRadius: '20px', padding: '6px 14px',
        fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
      }}>
        {s.label}
      </span>
    );
  };

  const handleUpdateStatus = () => {
    onStatusChange(order.id, selectedStatus);
    onClose();
  };

  const handleSaveRemise = async () => {
    const rp = parseFloat(remiseInput);
    if (isNaN(rp) || rp < 0 || rp > 100) return;

    setSavingRemise(true);
    try {
      const itemsList = order.items ?? [];
      const totalHT = itemsList.reduce(
        (sum, it) => sum + ((it.unitPrice ?? 0) * (it.quantity ?? 1)), 0
      );
      const fodec    = order.fodec    ?? 1;
      const tva      = order.tva      ?? 19;
      const timbre   = order.timbre   ?? 1000;

      const remise       = totalHT * (rp / 100);
      const netHT        = totalHT - remise;
      const fodecAmount  = netHT * (fodec / 100);
      const baseForTVA   = netHT + fodecAmount;
      const tvaAmount    = baseForTVA * (tva / 100);
      const totalTTC     = baseForTVA + tvaAmount + timbre;

      const updatedOrder: Order = {
        ...order,
        totalHT,
        remise,
        remisePercent: rp,
        netHT,
        fodecAmount,
        baseForTVA,
        tvaAmount,
        totalTTC,
      };

      await updateOrder(order.id, updatedOrder);
      
      if (onOrderUpdate) {
        await onOrderUpdate(updatedOrder);
      }

      setEditingRemise(false);
      
      const regen = window.confirm(
        'Remise mise à jour ✅\nVoulez-vous régénérer le PDF ?'
      );
      if (regen) {
        await generatePDF(updatedOrder);
      }
    } catch (err) {
      console.error('Erreur mise à jour remise:', err);
    } finally {
      setSavingRemise(false);
    }
  };

  const getColorHex = (colorName: string): string => {
    const c = (colorName || '').toLowerCase().trim();
    if (c.includes('blanc')) return '#FFFFFF';
    if (c.includes('noir')) return '#1A1A1A';
    if (c.includes('marron')) return '#5C4033';
    if (c.includes('bronze')) return '#804A00';
    if (c.includes('ivoire')) return '#FFFFF0';
    if (c.includes('gris')) return '#808080';
    if (c.includes('chêne') || c.includes('bois') || c.includes('chene')) return '#C19A6B';
    if (c.includes('sablé') || c.includes('sable')) return '#D2B48C';
    return '#CCCCCC';
  };

  // Compute gross from items if grossTotalHT not stored (legacy orders)
  const computedGrossHT = order.items && order.items.length > 0
    ? order.items.reduce((sum: number, item: any) => 
        sum + ((item.unitPrice || item.unit_price || 0) * (item.quantity || 1)), 0)
    : null;

  const grossHT = (order as any).grossTotalHT || computedGrossHT || order.totalHT || 0;
  const remise = order.remise || 0;
  const netHT = grossHT - remise;
  const fodec = order.fodecAmount || 0;
  const tva = order.tvaAmount || 0;
  const timbre = order.timbre || 1000;
  const totalTTC = order.totalTTC || 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15,23,42,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '16px', maxWidth: '780px', width: '100%',
          maxHeight: '90vh', overflow: 'hidden', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          display: 'flex', flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1D3E61, #1A5DA8)', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '20px', margin: 0 }}>
                Devis AS-{order.id}
              </h2>
              {getStatusBadge(order.status)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', color: '#E2E8F0', fontFamily: 'Inter, sans-serif', fontSize: '13px', opacity: 0.85 }}>
              <Calendar size={14} />
              {new Date(order.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
              width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white', transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '28px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Section 1: Produits */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #F1F5F9', paddingBottom: '6px', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '14px', color: '#1D3E61', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>
                Produits Commandés
              </h3>
              {!isEditingProducts ? (
                <button
                  onClick={handleStartEditProducts}
                  style={{ background: '#EEF4FF', color: '#1A5DA8', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#E0ECFF'}
                  onMouseLeave={e => e.currentTarget.style.background = '#EEF4FF'}
                >
                  ✏️ Modifier les produits
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingProducts(false)}
                  style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                >
                  Annuler
                </button>
              )}
            </div>

            {/* List/Grid of Products */}
            {!isEditingProducts ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(order.items || []).map((item, idx) => {
                  const product = productsList.find(p => p.slug === item.productId);
                  const imageUrl = product?.image_url || (product as any)?.imageUrl;
                  
                  return (
                    <div key={idx} style={{ background: 'white', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {imageUrl ? (
                          <img src={imageUrl} alt={item.productName} style={{ width: '70px', height: '70px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', padding: '4px' }} />
                        ) : (
                          <div style={{ width: '70px', height: '70px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F4F7FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#1D3E61', fontSize: '20px', fontFamily: 'Space Grotesk, sans-serif' }}>
                            {item.productName ? item.productName.charAt(0).toUpperCase() : 'P'}
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#1D3E61' }}>{item.productName}</span>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ background: '#EEF2FF', color: '#3730A3', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                              {item.width} × {item.height} cm
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', fontFamily: 'Inter, sans-serif' }}>
                              <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: getColorHex(item.color), border: '1px solid #CBD5E1' }}></span>
                              {item.color || 'Blanc'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '16px', color: '#1D3E61' }}>
                          {formatDT(item.totalPrice)}
                        </div>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                          {item.quantity} × {formatDT(item.unitPrice)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(editItems || []).map((item, idx) => (
                  <div key={idx} style={{ background: '#F8FAFC', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #E2E8F0' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#1D3E61' }}>{item.productName}</span>
                        <span style={{ background: '#1D3E61', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>{item.width} × {item.height} cm</span>
                      </div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#64748B' }}>
                        Qté: {item.quantity} × {formatDT(item.unitPrice)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '15px', color: '#1D3E61' }}>
                        {formatDT(item.totalPrice)}
                      </div>
                      <button
                        onClick={() => handleDeleteProduct(idx)}
                        style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FCA5A5'}
                        onMouseLeave={e => e.currentTarget.style.background = '#FEE2E2'}
                        title="Supprimer cet article"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Form to add item */}
                <div style={{ marginTop: '16px', borderTop: '1px dashed #E2E8F0', paddingTop: '16px' }}>
                  {!isAdding ? (
                    <button
                      onClick={() => setIsAdding(true)}
                      style={{ background: '#27AE60', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Inter, sans-serif', boxShadow: '0 2px 4px rgba(39,174,96,0.2)' }}
                    >
                      <Plus size={16} /> Ajouter un produit
                    </button>
                  ) : (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1D3E61', fontFamily: 'Inter, sans-serif' }}>Ajouter un produit à la commande</div>
                      
                      <div>
                        <label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>Description</label>
                        <input
                          type="text"
                          placeholder="Ex: Moustiquaire Colibrì 50"
                          value={newProduct.productName}
                          onChange={e => setNewProduct({ ...newProduct, productName: e.target.value })}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>Largeur (cm)</label>
                          <input
                            type="number"
                            value={newProduct.width}
                            onChange={e => setNewProduct({ ...newProduct, width: parseFloat(e.target.value) || 0 })}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>Hauteur (cm)</label>
                          <input
                            type="number"
                            value={newProduct.height}
                            onChange={e => setNewProduct({ ...newProduct, height: parseFloat(e.target.value) || 0 })}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>Qté</label>
                          <input
                            type="number"
                            value={newProduct.quantity}
                            onChange={e => setNewProduct({ ...newProduct, quantity: parseInt(e.target.value) || 1 })}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>P.U HT (mDT)</label>
                          <input
                            type="number"
                            value={newProduct.unitPrice}
                            onChange={e => setNewProduct({ ...newProduct, unitPrice: parseInt(e.target.value) || 0 })}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <button
                          onClick={() => setIsAdding(false)}
                          style={{ padding: '6px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', background: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: '#6B7280' }}
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleConfirmAddProduct}
                          style={{ padding: '6px 16px', border: 'none', borderRadius: '8px', background: '#27AE60', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Confirmer l'ajout
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Edit mode Save/Cancel Actions */}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                    <button
                      onClick={() => setIsEditingProducts(false)}
                      style={{ padding: '8px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', background: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#6B7280' }}
                    >
                      Annuler les modifications
                    </button>
                    <button
                      onClick={handleSaveProducts}
                      disabled={savingProducts}
                      style={{ padding: '8px 20px', border: 'none', borderRadius: '8px', background: '#1D3E61', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: savingProducts ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {savingProducts ? 'Enregistrement...' : <Check size={16} />} Enregistrer les produits
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Client */}
          <div>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '14px', color: '#1D3E61', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '2px solid #F1F5F9', paddingBottom: '6px', marginBottom: '12px' }}>
              Fiche Client
            </h3>
            
            <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '280px' }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#1D3E61' }}>{order.clientInfo.fullName}</div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
                  <Phone size={14} /> <a href={`tel:${order.clientInfo.phone}`} style={{ color: '#1A5DA8', textDecoration: 'none', fontWeight: 500 }}>{order.clientInfo.phone}</a>
                </div>
                {order.clientInfo.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
                    <Mail size={14} /> <span>{order.clientInfo.email}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
                  <MapPin size={14} /> <span>{order.clientInfo.address}</span>
                </div>
                {order.clientInfo.notes && (
                  <div style={{ marginTop: '8px', background: '#FFFBEB', color: '#92400E', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', borderLeft: '3px solid #D97706', fontFamily: 'Inter, sans-serif' }}>
                    <strong>Note:</strong> {order.clientInfo.notes}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href={`tel:${order.clientInfo.phone}`} style={{ background: '#1D3E61', color: 'white', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#1A5DA8'} onMouseLeave={e => e.currentTarget.style.background = '#1D3E61'}>
                  <Phone size={18} />
                </a>
                <a href={`https://wa.me/${(order.clientInfo?.phone || '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ background: '#27AE60', color: 'white', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#219653'} onMouseLeave={e => e.currentTarget.style.background = '#27AE60'}>
                  <MessageCircle size={18} />
                </a>
                {order.clientInfo.email && (
                  <a href={`mailto:${order.clientInfo.email}`} style={{ background: '#7C3AED', color: 'white', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#6D28D9'} onMouseLeave={e => e.currentTarget.style.background = '#7C3AED'}>
                    <Mail size={18} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Calcul financier */}
          <div>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '14px', color: '#1D3E61', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '2px solid #F1F5F9', paddingBottom: '6px', marginBottom: '12px' }}>
              Résumé Financier
            </h3>
            
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Brut HT</span>
                <span style={{ fontWeight: 600, color: '#1D3E61' }}>{formatDT(grossHT)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Remise
                  {!editingRemise && (
                    <button
                      onClick={() => {
                        setRemiseInput(String(order.remisePercent ?? 0));
                        setEditingRemise(true);
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '14px', marginLeft: '2px' }}
                      title="Modifier la remise"
                    >
                      ✏️
                    </button>
                  )}
                </span>
                {editingRemise ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={remiseInput}
                      onChange={e => setRemiseInput(e.target.value)}
                      style={{
                        width: '60px',
                        padding: '4px 8px',
                        border: '1px solid #1D3E61',
                        borderRadius: '6px',
                        fontSize: '13px',
                        textAlign: 'right',
                        outline: 'none',
                        background: 'white'
                      }}
                      autoFocus
                    />
                    <span style={{ fontSize: '13px', color: '#64748B' }}>%</span>
                    <button
                      onClick={handleSaveRemise}
                      disabled={savingRemise}
                      style={{
                        background: '#27AE60',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        opacity: savingRemise ? 0.5 : 1
                      }}
                    >
                      {savingRemise ? '...' : 'Valider'}
                    </button>
                    <button
                      onClick={() => setEditingRemise(false)}
                      style={{
                        background: '#E2E8F0',
                        color: '#475569',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Annuler
                    </button>
                  </span>
                ) : (
                  <span style={{ color: '#E11D48', fontWeight: 600 }}>
                    - {formatDT(remise)} ({order.remisePercent ?? 0}%)
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', borderBottom: '1px dashed #CBD5E1', paddingBottom: '8px' }}>
                <span>Net HT</span>
                <span style={{ fontWeight: 600, color: '#1D3E61' }}>{formatDT(netHT)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>FODEC ({order.fodec ?? 1}%)</span>
                <span style={{ fontWeight: 600, color: '#1D3E61' }}>{formatDT(fodec)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>TVA ({order.tva ?? 19}%)</span>
                <span style={{ fontWeight: 600, color: '#1D3E61' }}>{formatDT(tva)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
                <span>Timbre fiscal</span>
                <span style={{ fontWeight: 600, color: '#1D3E61' }}>{formatDT(timbre)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', paddingTop: '8px' }}>
                <span style={{ fontWeight: 800, color: '#1D3E61', fontFamily: 'Space Grotesk, sans-serif' }}>TOTAL TTC</span>
                <span style={{ fontWeight: 800, color: '#27AE60', fontFamily: 'Space Grotesk, sans-serif' }}>{formatDT(totalTTC)}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Statut */}
          <div>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '14px', color: '#1D3E61', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '2px solid #F1F5F9', paddingBottom: '6px', marginBottom: '12px' }}>
              Statut de la Commande
            </h3>
            
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Statut actuel</span>
                <div>{getStatusBadge(order.status)}</div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as Order['status'])}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', background: 'white' }}
                >
                  <option value="pending">En attente</option>
                  <option value="confirmed">Confirmé</option>
                  <option value="mesure">Mesure en cours</option>
                  <option value="avance">Avance reçue</option>
                  <option value="en_fabrication">En fabrication</option>
                  <option value="pret">Prêt</option>
                  <option value="installe">Installé</option>
                  <option value="cancelled">Annulé</option>
                </select>
                <button
                  onClick={handleUpdateStatus}
                  style={{ background: '#1D3E61', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1A5DA8'}
                  onMouseLeave={e => e.currentTarget.style.background = '#1D3E61'}
                >
                  Mettre à jour
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer sticky */}
        <div style={{ position: 'sticky', bottom: 0, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(8px)', borderTop: '1px solid #E2E8F0', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', zIndex: 10 }}>
          <div>
            {order.status !== 'livree' && (
              <button
                onClick={() => {
                  onStatusChange(order.id, 'livree');
                  onClose();
                }}
                style={{
                  background: '#D1FAE5', color: '#27AE60', border: 'none', borderRadius: '8px',
                  padding: '10px 18px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(39,174,96,0.1)'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#A7F3D0'}
                onMouseLeave={e => e.currentTarget.style.background = '#D1FAE5'}
              >
                <CheckCircle size={16} /> Marquer comme livrée
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onDownloadPDF(order)}
              disabled={isPdfLocked}
              style={{
                background: 'white', color: '#1D3E61', border: '1px solid #1D3E61', borderRadius: '8px',
                padding: '10px 16px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600,
                cursor: isPdfLocked ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s',
                opacity: isPdfLocked ? 0.65 : 1,
              }}
              onMouseEnter={e => { if (!isPdfLocked) e.currentTarget.style.background = '#F4F7FB'; }}
              onMouseLeave={e => { if (!isPdfLocked) e.currentTarget.style.background = 'white'; }}
            >
              {isGenerating('devis') ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={14} />} PDF
            </button>
            <button
              onClick={() => onDownloadBonDeCommande(order)}
              disabled={isPdfLocked}
              style={{
                background: 'white', color: '#0D9488', border: '1px solid #0D9488', borderRadius: '8px',
                padding: '10px 16px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600,
                cursor: isPdfLocked ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s',
                opacity: isPdfLocked ? 0.65 : 1,
              }}
              onMouseEnter={e => { if (!isPdfLocked) e.currentTarget.style.background = '#F0FDFA'; }}
              onMouseLeave={e => { if (!isPdfLocked) e.currentTarget.style.background = 'white'; }}
            >
              {isGenerating('bon') ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <ClipboardList size={14} />} Bon
            </button>
            <button
              onClick={() => onDownloadFacture(order)}
              disabled={isPdfLocked}
              style={{
                background: 'white', color: '#7C3AED', border: '1px solid #7C3AED', borderRadius: '8px',
                padding: '10px 16px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600,
                cursor: isPdfLocked ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s',
                opacity: isPdfLocked ? 0.65 : 1,
              }}
              onMouseEnter={e => { if (!isPdfLocked) e.currentTarget.style.background = '#F5F3FF'; }}
              onMouseLeave={e => { if (!isPdfLocked) e.currentTarget.style.background = 'white'; }}
            >
              {isGenerating('facture') ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Receipt size={14} />} Facture
            </button>
            <button
              onClick={onClose}
              style={{
                background: '#64748B', color: 'white', border: 'none', borderRadius: '8px',
                padding: '10px 20px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#475569'}
              onMouseLeave={e => e.currentTarget.style.background = '#64748B'}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
