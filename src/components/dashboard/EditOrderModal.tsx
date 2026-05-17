import { X as XIcon, Plus, Minus } from 'lucide-react';
import { toast } from '../../hooks/useToast';
import type { Order } from '../../store/ordersStore';


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
  // Derive remisePercent: use stored value, or reverse-engineer from amounts
  const totalHT = editingOrder.items.reduce((sum, it) => sum + it.unitPrice * (it.quantity || 1), 0);
  const remisePercent = editingOrder.remisePercent ?? (totalHT > 0 ? Math.round((editingOrder.remise / totalHT) * 100) : 0);
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={e => { if (e.target === e.currentTarget) setEditingOrder(null); }}
    >
      <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0F4F8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
          <div>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '18px', color: '#1D3E61', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Modifier Commande
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>AS-{editingOrder.id}</div>
          </div>
          <button onClick={() => setEditingOrder(null)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F4F7FB', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
            <XIcon size={16} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Client Info */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '13px', color: '#6B7280', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Informations client</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {(['fullName', 'phone', 'email', 'address'] as const).map(field => (
                <div key={field} style={{ gridColumn: field === 'address' ? '1 / -1' : 'auto' }}>
                  <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    {field === 'fullName' ? 'Nom' : field === 'phone' ? 'Téléphone' : field === 'email' ? 'Email' : 'Adresse'}
                  </label>
                  <input
                    type={field === 'phone' ? 'tel' : 'text'}
                    value={editingOrder.clientInfo[field] ?? ''}
                    onChange={e => setEditingOrder({ ...editingOrder, clientInfo: { ...editingOrder.clientInfo, [field]: e.target.value } })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #E8EDF5', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#1D3E61'}
                    onBlur={e => e.currentTarget.style.borderColor = '#E8EDF5'}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Remise / FODEC / TVA */}
          <div style={{ marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            {/* Remise — uses remisePercent, NOT the raw millimes amount */}
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Remise (%)</label>
              <input
                type="number" min="0" max="100" step="0.1"
                value={remisePercent}
                onChange={e => setEditingOrder({ ...editingOrder, remisePercent: parseFloat(e.target.value) || 0 })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E8EDF5', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.currentTarget.style.borderColor = '#1D3E61'}
                onBlur={e => e.currentTarget.style.borderColor = '#E8EDF5'}
              />
            </div>
            {[{ key: 'fodec' as const, label: 'FODEC (%)' }, { key: 'tva' as const, label: 'TVA (%)' }].map(({ key, label }) => (
              <div key={key}>
                <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>{label}</label>
                <input
                  type="number" min="0" max="100" step="0.1"
                  value={editingOrder[key]}
                  onChange={e => setEditingOrder({ ...editingOrder, [key]: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #E8EDF5', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#1D3E61'}
                  onBlur={e => e.currentTarget.style.borderColor = '#E8EDF5'}
                />
              </div>
            ))}
          </div>

          {/* Items */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '13px', color: '#6B7280', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              Produits
              <button
                onClick={() => setEditingOrder({
                  ...editingOrder, items: [...editingOrder.items, { id: Math.random().toString(36).slice(2), productId: '', productName: '', width: 100, height: 100, quantity: 1, meshType: '', unitPrice: 0, totalPrice: 0 }]
                })}
                style={{ background: '#1D3E61', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Inter, sans-serif' }}
              >
                <Plus size={12} /> Ajouter
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {editingOrder.items.map((item, idx) => (
                <div key={item.id} style={{ background: '#F8FAFC', borderRadius: '12px', padding: '16px', border: '1px solid #E8EDF5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#1D3E61' }}>Article {idx + 1}</span>
                    {editingOrder.items.length > 1 && (
                      <button
                        onClick={() => setEditingOrder({ ...editingOrder, items: editingOrder.items.filter((_, i) => i !== idx) })}
                        style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '6px', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Minus size={12} />
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Produit</label>
                      <input
                        value={item.productName}
                        onChange={e => setEditingOrder({ ...editingOrder, items: editingOrder.items.map((it, i) => i === idx ? { ...it, productName: e.target.value } : it) })}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #E8EDF5', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                        onFocus={e => e.currentTarget.style.borderColor = '#1D3E61'}
                        onBlur={e => e.currentTarget.style.borderColor = '#E8EDF5'}
                      />
                    </div>
                    {[
                      { key: 'width' as const, label: 'Largeur (cm)' },
                      { key: 'height' as const, label: 'Hauteur (cm)' },
                      { key: 'quantity' as const, label: 'Quantité' },
                      { key: 'unitPrice' as const, label: 'Prix unitaire (mDT)' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>{label}</label>
                        <input
                          type="number" min="0"
                          value={item[key]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setEditingOrder({ ...editingOrder, items: editingOrder.items.map((it, i) => i === idx ? { ...it, [key]: val, totalPrice: key === 'unitPrice' ? val * it.quantity : key === 'quantity' ? it.unitPrice * val : it.totalPrice } : it) });
                          }}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #E8EDF5', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                          onFocus={e => e.currentTarget.style.borderColor = '#1D3E61'}
                          onBlur={e => e.currentTarget.style.borderColor = '#E8EDF5'}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setEditingOrder(null)}
              style={{ padding: '10px 20px', border: '1px solid #DBDADA', borderRadius: '9px', background: 'white', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', color: '#6B7280' }}
            >
              Annuler
            </button>
            <button
              onClick={async () => {
                try {
                  const items = editingOrder.items;
                  const totalHT = items.reduce((sum, it) => sum + ((it.unitPrice || 0) * (it.quantity || 1)), 0);
                  const fodec = editingOrder.fodec ?? 1;
                  const tva = editingOrder.tva ?? 19;
                  const rp = editingOrder.remisePercent || 0;
                  const timbre = editingOrder.timbre ?? 1000;

                  const remise = totalHT * (rp / 100);
                  const netHT = totalHT - remise;
                  const fodecAmount = netHT * (fodec / 100);
                  const baseForTVA = netHT + fodecAmount;
                  const tvaAmount = baseForTVA * (tva / 100);
                  const totalTTC = baseForTVA + tvaAmount + timbre;

                  const finalOrder = {
                    ...editingOrder,
                    totalHT,
                    remise,
                    remisePercent: rp,
                    netHT,
                    fodecAmount,
                    baseForTVA,
                    tvaAmount,
                    totalTTC,
                    fodec,
                    tva,
                    timbre
                  };

                  await updateOrder(editingOrder.id, finalOrder as any);
                  // updateOrder has void return type in ordersStore.ts, so if it didn't throw, we assume success
                  await loadData();
                  setEditingOrder(null);
                  toast.success('Commande modifiée avec succès');
                } catch (err) {
                  toast.error('Erreur lors de la modification');
                }
              }}
              style={{ padding: '10px 24px', border: 'none', borderRadius: '9px', background: '#1D3E61', color: 'white', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 2px 8px rgba(29,62,97,0.25)' }}
              onMouseEnter={e => e.currentTarget.style.background = '#81C063'}
              onMouseLeave={e => e.currentTarget.style.background = '#1D3E61'}
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditOrderModal;
