import React, { useState, useEffect } from 'react';
import { getAllFaq, createFaq, updateFaq, deleteFaq, type FaqEntry } from '../../store/faqStore';
import { toast } from '../../hooks/useToast';
import { Loader2, X, Save, Plus, Pencil, Trash2 } from 'lucide-react';

const FAQ_CATEGORIES = [
  { id: 'all', label: 'Tous' },
  { id: 'general', label: 'Général' },
  { id: 'garantie', label: 'Garantie' },
  { id: 'paiement', label: 'Paiement' },
  { id: 'livraison', label: 'Livraison' },
  { id: 'entretien', label: 'Entretien' },
  { id: 'technique', label: 'Technique' },
  { id: 'showroom', label: 'Showroom' },
];

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
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '4px',
  fontFamily: 'Inter, sans-serif',
};

const emptyEntry: Omit<FaqEntry, 'id' | 'created_at' | 'updated_at'> = {
  question_fr: '',
  question_ar: null,
  question_tn: null,
  question_en: null,
  question_it: null,
  answer_fr: '',
  answer_ar: null,
  answer_tn: null,
  answer_en: null,
  answer_it: null,
  category: 'general',
  sort_order: 0,
  is_active: true,
};

const FaqPanel: React.FC = () => {
  const [faqList, setFaqList] = useState<FaqEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [editingEntry, setEditingEntry] = useState<(FaqEntry | (Omit<FaqEntry, 'id' | 'created_at' | 'updated_at'> & { id?: string })) | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadFaq = async () => {
    try {
      const data = await getAllFaq();
      setFaqList(data);
    } catch {
      toast.error('Erreur lors du chargement des FAQ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void loadFaq();
    });
  }, []);

  const handleSave = async () => {
    if (!editingEntry) return;
    if (!editingEntry.question_fr.trim() || !editingEntry.answer_fr.trim()) {
      toast.error('Question et réponse (FR) sont obligatoires');
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const { id, ...rest } = editingEntry as any;
        await createFaq(rest);
        toast.success('FAQ ajoutée');
      } else {
        const entry = editingEntry as FaqEntry;
        const { id, created_at, updated_at, ...rest } = entry;
        await updateFaq(id, rest);
        toast.success('FAQ mise à jour');
      }
      setEditingEntry(null);
      await loadFaq();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous supprimer cette entrée FAQ ?')) return;
    try {
      await deleteFaq(id);
      setFaqList(prev => prev.filter(f => f.id !== id));
      toast.success('FAQ supprimée');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const openNewEntry = () => {
    setIsNew(true);
    setEditingEntry({ ...emptyEntry, sort_order: faqList.length + 1 });
  };

  const openEditEntry = (entry: FaqEntry) => {
    setIsNew(false);
    setEditingEntry({ ...entry });
  };

  const updateField = (field: string, value: any) => {
    if (!editingEntry) return;
    setEditingEntry({ ...editingEntry, [field]: value });
  };

  const filteredFaq = activeCategory === 'all'
    ? faqList
    : faqList.filter(f => f.category === activeCategory);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <Loader2 size={32} color="#1D3E61" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', color: '#0D1B2A' }}>
            FAQ
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
            {faqList.length} entrées • {faqList.filter(f => f.is_active).length} actives
          </p>
        </div>
        <button
          onClick={openNewEntry}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '8px', border: 'none',
            background: '#1D3E61', color: 'white', cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600,
          }}
        >
          <Plus size={16} /> Ajouter une FAQ
        </button>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {FAQ_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              background: activeCategory === cat.id ? '#1D3E61' : '#F3F4F6',
              color: activeCategory === cat.id ? 'white' : '#374151',
              transition: 'all 0.2s',
            }}
          >
            {cat.label}
            {cat.id !== 'all' && (
              <span style={{ marginLeft: '6px', opacity: 0.7 }}>
                ({faqList.filter(f => f.category === cat.id).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* FAQ List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredFaq.length === 0 && (
          <div style={{
            padding: '40px', textAlign: 'center', color: '#9CA3AF',
            fontFamily: 'Inter, sans-serif', fontSize: '14px',
            background: 'white', borderRadius: '12px',
          }}>
            Aucune entrée FAQ dans cette catégorie
          </div>
        )}

        {filteredFaq.map(entry => (
          <div
            key={entry.id}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              opacity: entry.is_active ? 1 : 0.5,
              transition: 'opacity 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{
                    background: '#E0E7FF',
                    color: '#3730A3',
                    padding: '3px 10px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    fontFamily: 'Inter, sans-serif',
                    textTransform: 'uppercase',
                  }}>
                    {entry.category}
                  </span>
                  {!entry.is_active && (
                    <span style={{
                      background: '#FEE2E2', color: '#991B1B',
                      padding: '3px 10px', borderRadius: '10px',
                      fontSize: '11px', fontWeight: 600,
                    }}>
                      Inactif
                    </span>
                  )}
                </div>
                <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#0D1B2A', fontSize: '15px', fontFamily: 'Inter, sans-serif' }}>
                  Q: {entry.question_fr}
                </p>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '13px', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                  R: {entry.answer_fr}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={() => openEditEntry(entry)}
                  style={{
                    background: '#F3F4F6', border: 'none', borderRadius: '8px',
                    padding: '8px', cursor: 'pointer', color: '#374151',
                  }}
                  title="Modifier"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  style={{
                    background: '#FEE2E2', border: 'none', borderRadius: '8px',
                    padding: '8px', cursor: 'pointer', color: '#991B1B',
                  }}
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Add Modal */}
      {editingEntry && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditingEntry(null); }}
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
                {isNew ? 'Ajouter une FAQ' : 'Modifier la FAQ'}
              </h3>
              <button onClick={() => setEditingEntry(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {/* Category + Sort */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Catégorie</label>
                  <select
                    style={inputStyle}
                    value={editingEntry.category}
                    onChange={e => updateField('category', e.target.value)}
                  >
                    {FAQ_CATEGORIES.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Ordre</label>
                  <input style={inputStyle} type="number" value={editingEntry.sort_order} onChange={e => updateField('sort_order', Number(e.target.value))} />
                </div>
              </div>

              {/* FR (required) */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ ...labelStyle, color: '#DC2626' }}>Question (FR) *</label>
                <input style={inputStyle} value={editingEntry.question_fr} onChange={e => updateField('question_fr', e.target.value)} placeholder="La question en français..." />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ ...labelStyle, color: '#DC2626' }}>Réponse (FR) *</label>
                <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={editingEntry.answer_fr} onChange={e => updateField('answer_fr', e.target.value)} placeholder="La réponse en français..." />
              </div>

              {/* AR */}
              <div style={{ padding: '16px', background: '#FAFBFC', borderRadius: '10px', marginBottom: '12px' }}>
                <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: '#0D1B2A', fontFamily: 'Inter, sans-serif' }}>🇹🇳 Arabe</p>
                <input dir="rtl" style={{ ...inputStyle, marginBottom: '8px' }} value={editingEntry.question_ar || ''} onChange={e => updateField('question_ar', e.target.value)} placeholder="السؤال بالعربية" />
                <textarea dir="rtl" style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={editingEntry.answer_ar || ''} onChange={e => updateField('answer_ar', e.target.value)} placeholder="الإجابة بالعربية" />
              </div>

              {/* TN */}
              <div style={{ padding: '16px', background: '#FAFBFC', borderRadius: '10px', marginBottom: '12px' }}>
                <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: '#0D1B2A', fontFamily: 'Inter, sans-serif' }}>🇹🇳 Tunisien</p>
                <input style={{ ...inputStyle, marginBottom: '8px' }} value={editingEntry.question_tn || ''} onChange={e => updateField('question_tn', e.target.value)} placeholder="So2el b tounsi" />
                <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={editingEntry.answer_tn || ''} onChange={e => updateField('answer_tn', e.target.value)} placeholder="Jaweb b tounsi" />
              </div>

              {/* EN */}
              <div style={{ padding: '16px', background: '#FAFBFC', borderRadius: '10px', marginBottom: '12px' }}>
                <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: '#0D1B2A', fontFamily: 'Inter, sans-serif' }}>🇬🇧 English</p>
                <input style={{ ...inputStyle, marginBottom: '8px' }} value={editingEntry.question_en || ''} onChange={e => updateField('question_en', e.target.value)} placeholder="Question in English" />
                <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={editingEntry.answer_en || ''} onChange={e => updateField('answer_en', e.target.value)} placeholder="Answer in English" />
              </div>

              {/* IT */}
              <div style={{ padding: '16px', background: '#FAFBFC', borderRadius: '10px', marginBottom: '12px' }}>
                <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: '#0D1B2A', fontFamily: 'Inter, sans-serif' }}>🇮🇹 Italiano</p>
                <input style={{ ...inputStyle, marginBottom: '8px' }} value={editingEntry.question_it || ''} onChange={e => updateField('question_it', e.target.value)} placeholder="Domanda in italiano" />
                <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={editingEntry.answer_it || ''} onChange={e => updateField('answer_it', e.target.value)} placeholder="Risposta in italiano" />
              </div>

              {/* Active toggle */}
              <div style={{ marginTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
                  <input type="checkbox" checked={editingEntry.is_active} onChange={e => updateField('is_active', e.target.checked)} />
                  Actif (visible par le chatbot)
                </label>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid #E5E7EB',
              display: 'flex', justifyContent: 'flex-end', gap: '12px',
            }}>
              <button
                onClick={() => setEditingEntry(null)}
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
                {isNew ? 'Ajouter' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaqPanel;
