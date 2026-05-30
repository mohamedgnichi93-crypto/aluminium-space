import React, { useState, useEffect } from 'react';
import { getAllProducts, updateProduct, type SupabaseProduct } from '../../store/productsStore';
import { toast } from '../../hooks/useToast';
import { Loader2, X, Save, ToggleLeft, ToggleRight, Star, Pencil } from 'lucide-react';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  fontSize: '14px',
  fontFamily: 'Inter, sans-serif',
  background: '#FAFBFC',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '4px',
  fontFamily: 'Inter, sans-serif',
};

const ProductsPanel: React.FC = () => {
  const [products, setProducts] = useState<SupabaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<SupabaseProduct | null>(null);
  const [saving, setSaving] = useState(false);

  const loadProducts = async () => {
    try {
      const data = await getAllProducts();
      setProducts(data);
    } catch {
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void loadProducts();
    });
  }, []);

  const handleToggleActive = async (product: SupabaseProduct) => {
    try {
      await updateProduct(product.id, { is_active: !product.is_active });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: !p.is_active } : p));
      toast.success(`${product.name} ${!product.is_active ? 'activé' : 'désactivé'}`);
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleSave = async () => {
    if (!editingProduct) return;
    setSaving(true);
    try {
      const { id, created_at, updated_at, ...rest } = editingProduct;
      await updateProduct(id, rest);
      setProducts(prev => prev.map(p => p.id === id ? editingProduct : p));
      setEditingProduct(null);
      toast.success('Produit mis à jour');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof SupabaseProduct, value: any) => {
    if (!editingProduct) return;
    setEditingProduct({ ...editingProduct, [field]: value });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <Loader2 size={32} color="#1D3E61" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', color: '#0D1B2A' }}>
            Produits
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
            {products.length} produits • {products.filter(p => p.is_active).length} actifs
          </p>
        </div>
      </div>

      {/* Products Table */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#0D1B2A', color: 'white' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, fontSize: '12px', letterSpacing: '0.5px' }}>PRODUIT</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, fontSize: '12px', letterSpacing: '0.5px' }}>TYPE</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, fontSize: '12px', letterSpacing: '0.5px' }}>PRIX BASE</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, fontSize: '12px', letterSpacing: '0.5px' }}>DIMENSIONS</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, fontSize: '12px', letterSpacing: '0.5px' }}>ACTIF</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, fontSize: '12px', letterSpacing: '0.5px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, i) => (
                <tr
                  key={product.id}
                  style={{
                    borderBottom: '1px solid #F3F4F6',
                    background: i % 2 === 0 ? '#FAFBFC' : 'white',
                    opacity: product.is_active ? 1 : 0.5,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {product.is_bestseller && <Star size={14} color="#F59E0B" fill="#F59E0B" />}
                      <span style={{ fontWeight: 600, color: '#0D1B2A' }}>{product.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      background: product.type === 'fenetre' ? '#DBEAFE' : product.type === 'porte' ? '#D1FAE5' : product.type === 'fixe' ? '#FEF3C7' : '#E0E7FF',
                      color: product.type === 'fenetre' ? '#1E40AF' : product.type === 'porte' ? '#065F46' : product.type === 'fixe' ? '#92400E' : '#3730A3',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}>
                      {product.type}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif' }}>
                    {product.base_price} {product.price_per_m2 ? 'DT/m²' : 'DT'}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', color: '#6B7280' }}>
                    {product.min_width}–{product.max_width} × {product.min_height}–{product.max_height}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleToggleActive(product)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                      title={product.is_active ? 'Désactiver' : 'Activer'}
                    >
                      {product.is_active
                        ? <ToggleRight size={24} color="#10B981" />
                        : <ToggleLeft size={24} color="#9CA3AF" />}
                    </button>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => setEditingProduct({ ...product })}
                      style={{
                        background: '#1D3E61',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      <Pencil size={14} /> Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditingProduct(null); }}
        >
          <div style={{
            background: 'white', borderRadius: '16px', width: '100%', maxWidth: '700px',
            maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #E5E7EB',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#0D1B2A', color: 'white', borderRadius: '16px 16px 0 0',
            }}>
              <h3 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', fontSize: '18px' }}>
                Modifier — {editingProduct.name}
              </h3>
              <button onClick={() => setEditingProduct(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Nom</label>
                  <input style={inputStyle} value={editingProduct.name} onChange={e => updateField('name', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Prix de base</label>
                  <input style={inputStyle} type="number" value={editingProduct.base_price} onChange={e => updateField('base_price', Number(e.target.value))} />
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <label style={labelStyle}>Description (FR)</label>
                <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={editingProduct.description_fr || ''} onChange={e => updateField('description_fr', e.target.value)} />
              </div>

              <div style={{ marginTop: '16px' }}>
                <label style={labelStyle}>Description (AR)</label>
                <textarea dir="rtl" style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={editingProduct.description_ar || ''} onChange={e => updateField('description_ar', e.target.value)} />
              </div>

              <div style={{ marginTop: '16px' }}>
                <label style={labelStyle}>Description (TN)</label>
                <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={editingProduct.description_tn || ''} onChange={e => updateField('description_tn', e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginTop: '16px' }}>
                <div>
                  <label style={labelStyle}>Min L (cm)</label>
                  <input style={inputStyle} type="number" value={editingProduct.min_width} onChange={e => updateField('min_width', Number(e.target.value))} />
                </div>
                <div>
                  <label style={labelStyle}>Max L (cm)</label>
                  <input style={inputStyle} type="number" value={editingProduct.max_width} onChange={e => updateField('max_width', Number(e.target.value))} />
                </div>
                <div>
                  <label style={labelStyle}>Min H (cm)</label>
                  <input style={inputStyle} type="number" value={editingProduct.min_height} onChange={e => updateField('min_height', Number(e.target.value))} />
                </div>
                <div>
                  <label style={labelStyle}>Max H (cm)</label>
                  <input style={inputStyle} type="number" value={editingProduct.max_height} onChange={e => updateField('max_height', Number(e.target.value))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '16px' }}>
                <div>
                  <label style={labelStyle}>Ordre d'affichage</label>
                  <input style={inputStyle} type="number" value={editingProduct.sort_order} onChange={e => updateField('sort_order', Number(e.target.value))} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
                    <input type="checkbox" checked={editingProduct.is_bestseller} onChange={e => updateField('is_bestseller', e.target.checked)} />
                    Bestseller
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
                    <input type="checkbox" checked={editingProduct.is_active} onChange={e => updateField('is_active', e.target.checked)} />
                    Actif
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid #E5E7EB',
              display: 'flex', justifyContent: 'flex-end', gap: '12px',
            }}>
              <button
                onClick={() => setEditingProduct(null)}
                style={{
                  padding: '10px 20px', borderRadius: '8px', border: '1px solid #D1D5DB',
                  background: 'white', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  fontSize: '14px', color: '#374151',
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '10px 20px', borderRadius: '8px', border: 'none',
                  background: '#1D3E61', color: 'white', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '8px',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPanel;
