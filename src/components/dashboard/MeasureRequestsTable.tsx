import { useEffect, useState } from 'react';
import {
  getMeasureRequests,
  updateMeasureRequest,
  deleteMeasureRequest,
  type MeasureRequest
} from '../../store/measureRequestsStore';
import { saveOrder } from '../../store/ordersStore';
import { toast } from '../../hooks/useToast';
import { calculatePrice } from '../../utils/priceCalculator';
import { getRemisePercent } from '../../utils/remiseCalculator';
import { getSettings } from '../../store/settingsStore';
import {
  Search, Phone, MessageSquare, CheckCircle, FileText, Trash2,
  ChevronDown, ChevronUp, Calendar, User, MapPin, Sparkles,
  Clock, ArrowRight, Save, Clipboard, RefreshCw, Layers
} from 'lucide-react';

const MeasureRequestsTable = () => {
  const [requests, setRequests] = useState<MeasureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'contacted' | 'converted'>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [adminNotesText, setAdminNotesText] = useState<{ [key: string]: string }>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      const data = await getMeasureRequests();
      setRequests(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

      // Initialize admin notes state
      const notesMap: { [key: string]: string } = {};
      data.forEach(req => {
        notesMap[req.id] = req.adminNotes || '';
      });
      setAdminNotesText(notesMap);
    } catch (err) {
      console.error('Failed to load measure requests:', err);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // Auto refresh every 15s
    const interval = setInterval(loadRequests, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleExpand = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleStatusChange = async (id: string, newStatus: MeasureRequest['status']) => {
    try {
      setActionLoadingId(id);
      await updateMeasureRequest(id, { status: newStatus });
      toast.success(`Statut mis à jour : ${newStatus === 'contacted' ? 'Contacté' : newStatus}`);
      await loadRequests();
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du changement de statut');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSaveAdminNotes = async (id: string) => {
    try {
      setSavingNoteId(id);
      await updateMeasureRequest(id, { adminNotes: adminNotesText[id] || '' });
      toast.success('Notes internes enregistrées');
      await loadRequests();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'enregistrement des notes");
    } finally {
      setSavingNoteId(null);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer définitivement cette demande de mesure ?')) {
      try {
        setActionLoadingId(id);
        await deleteMeasureRequest(id);
        toast.success('Demande supprimée avec succès');
        await loadRequests();
      } catch (err) {
        console.error(err);
        toast.error('Erreur lors de la suppression');
      } finally {
        setActionLoadingId(null);
      }
    }
  };

  const handleConvertToOrder = async (req: MeasureRequest) => {
    if (req.status === 'converted') {
      toast.warning('Cette demande a déjà été convertie en commande.');
      return;
    }

    if (window.confirm(`Voulez-vous convertir la demande de ${req.clientName} en commande ?`)) {
      try {
        setActionLoadingId(req.id);

        const width = Number(req.width || 0);
        const height = Number(req.height || 0);
        const quantity = Number(req.quantity || 1);
        const priceResult = calculatePrice({
          productId: req.productId,
          width,
          height,
          color: 'Blanc',
        });

        if (!req.productId || !width || !height || !priceResult) {
          throw new Error('Prix requis avant conversion');
        }

        const cfg = getSettings();
        const totalHT = priceResult.unitPrice * quantity;
        const remisePercent = getRemisePercent(quantity);
        const remise = totalHT * (remisePercent / 100);
        const netHT = totalHT - remise;
        const fodec = cfg.fodecPercent;
        const fodecAmount = netHT * (fodec / 100);
        const baseForTVA = netHT + fodecAmount;
        const tva = cfg.tvaPercent;
        const tvaAmount = baseForTVA * (tva / 100);
        const timbre = cfg.timbreFiscal * 1000;
        const totalTTC = baseForTVA + tvaAmount + timbre;

        if (!totalTTC || totalTTC <= 1000) {
          throw new Error('Prix requis avant conversion');
        }

        const orderItems = [
          {
            id: crypto.randomUUID().slice(0, 8),
            productId: req.productId,
            productName: req.productName || 'Produit personnalisé',
            width,
            height,
            quantity,
            baseUnitPrice: priceResult.baseUnitPrice,
            colorSurchargeAmount: priceResult.colorSurchargeAmount,
            colorSurchargePct: priceResult.colorSurchargePct,
            unitPrice: priceResult.unitPrice,
            totalPrice: totalHT,
            meshType: '',
            color: 'Blanc'
          }
        ];

        const newOrder = await saveOrder({
          clientInfo: {
            fullName: req.clientName,
            phone: req.clientPhone,
            email: req.clientEmail || '',
            address: req.clientAddress || "Adresse non fournie (voir fiche d'origine)",
            notes: req.notes || ''
          },
          items: orderItems,
          totalHT,
          netHT,
          remisePercent,
          remise,
          fodec,
          fodecAmount,
          baseForTVA,
          tva,
          tvaAmount,
          timbre,
          totalTTC
        });

        // Update the request with 'converted' status and the new order code
        await updateMeasureRequest(req.id, {
          status: 'converted',
          convertedOrderId: newOrder.id
        });

        toast.success(`Succès ! Commande ${newOrder.id} créée.`);
        await loadRequests();
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Erreur lors de la conversion en commande");
      } finally {
        setActionLoadingId(null);
      }
    }
  };

  const handleDownloadPDF = (req: MeasureRequest) => {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();

      // Brand Header Banner
      doc.setFillColor(29, 62, 97); // Dark navy blue #1D3E61
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('ALUMINIUM SPACE', 15, 18);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Fiche de Mesure & CRM Client', 15, 27);

      // Date in Header
      doc.setTextColor(200, 220, 255);
      doc.setFontSize(10);
      doc.text(`Imprimé le ${new Date().toLocaleDateString('fr-TN')} à ${new Date().toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' })}`, 15, 34);

      // Unique Ref
      const shortId = req.id.split('-')[0].toUpperCase();
      doc.setFillColor(129, 192, 99); // Brand Green #81C063
      doc.rect(145, 10, 50, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`REF: MR-${shortId}`, 150, 16.5);

      // Section 1: Client Profile (Left Column Box)
      doc.setDrawColor(230, 235, 245);
      doc.setFillColor(248, 250, 252);
      doc.rect(15, 50, 85, 95, 'FD');

      doc.setTextColor(29, 62, 97);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMATIONS CLIENT', 20, 58);
      doc.setDrawColor(29, 62, 97);
      doc.line(20, 60, 95, 60);

      doc.setTextColor(50, 50, 50);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Nom :', 20, 70);
      doc.setFont('helvetica', 'normal');
      doc.text(req.clientName || '—', 35, 70);

      doc.setFont('helvetica', 'bold');
      doc.text('Tél :', 20, 80);
      doc.setFont('helvetica', 'normal');
      doc.text(req.clientPhone || '—', 35, 80);

      doc.setFont('helvetica', 'bold');
      doc.text('Email :', 20, 90);
      doc.setFont('helvetica', 'normal');
      doc.text(req.clientEmail || 'Non fourni', 35, 90);

      doc.setFont('helvetica', 'bold');
      doc.text('Adresse :', 20, 100);
      doc.setFont('helvetica', 'normal');
      const addressLines = doc.splitTextToSize(req.clientAddress || 'Non fournie', 70);
      doc.text(addressLines, 20, 105);

      doc.setFont('helvetica', 'bold');
      doc.text('Statut :', 20, 130);
      doc.setFont('helvetica', 'bold');

      const statusLabel = req.status === 'new' ? 'Nouveau' : req.status === 'contacted' ? 'Contacte' : req.status === 'converted' ? 'Converti' : 'En attente';
      doc.text(statusLabel, 35, 130);

      // Section 2: Product & Measurements (Right Column Box)
      doc.setDrawColor(230, 235, 245);
      doc.setFillColor(248, 250, 252);
      doc.rect(110, 50, 85, 95, 'FD');

      doc.setTextColor(29, 62, 97);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DETAILS MESURES', 115, 58);
      doc.line(115, 60, 190, 60);

      doc.setTextColor(50, 50, 50);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Produit :', 115, 70);
      doc.setFont('helvetica', 'normal');
      const productLines = doc.splitTextToSize(req.productName || 'Produit personnalisé', 70);
      doc.text(productLines, 115, 75);

      doc.setFont('helvetica', 'bold');
      doc.text('Dimensions :', 115, 90);
      doc.setFont('helvetica', 'normal');
      doc.text(`${req.width || '—'} cm  x  ${req.height || '—'} cm`, 115, 95);

      doc.setFont('helvetica', 'bold');
      doc.text('Quantité :', 115, 105);
      doc.setFont('helvetica', 'normal');
      doc.text(`${req.quantity || 1}`, 115, 110);

      doc.setFont('helvetica', 'bold');
      doc.text('Date demande :', 115, 120);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(req.date).toLocaleDateString('fr-TN'), 115, 125);

      // Section 3: Notes & Comments (Bottom Boxes)
      // Client Notes
      doc.setFillColor(240, 245, 250);
      doc.rect(15, 155, 180, 32, 'F');
      doc.setTextColor(29, 62, 97);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes du Client :', 20, 163);
      doc.setTextColor(70, 70, 70);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'italic');
      const clientNoteLines = doc.splitTextToSize(req.notes || "Aucun commentaire laisse par le client.", 170);
      doc.text(clientNoteLines, 20, 169);

      // Admin Internal Notes
      doc.setFillColor(254, 250, 240);
      doc.rect(15, 195, 180, 42, 'F');
      doc.setTextColor(150, 80, 10);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes Internes (Administration) :', 20, 203);
      doc.setTextColor(70, 70, 70);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      const adminNoteLines = doc.splitTextToSize(req.adminNotes || "Aucune note administrative interne.", 170);
      doc.text(adminNoteLines, 20, 209);

      if (req.convertedOrderId) {
        doc.setFillColor(230, 245, 235);
        doc.rect(15, 245, 180, 12, 'F');
        doc.setTextColor(22, 101, 52);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Associe a la Commande Aluminium Space : ${req.convertedOrderId}`, 20, 252);
      }

      // Footer
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Aluminium Space — Fiche technique administrative confidentielle.', 105, 280, { align: 'center' });

      doc.save(`fiche-mesure-${shortId}.pdf`);
      toast.success('Fiche PDF générée !');
    });
  };

  // Tunisian Phone Code Formatting (+216 prefix)
  const formatPhoneForWA = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    if (clean.startsWith('216')) return clean;
    return `216${clean}`;
  };

  // KPI calculations
  const totalCount = requests.length;
  const newCount = requests.filter(r => r.status === 'new' || r.status === 'pending').length;
  const contactedCount = requests.filter(r => r.status === 'contacted').length;
  const convertedCount = requests.filter(r => r.status === 'converted').length;

  // Filter requests
  const filteredRequests = requests.filter(req => {
    const matchesSearch =
      req.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.clientPhone.includes(searchTerm) ||
      (req.productName || '').toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'new') {
      matchesStatus = req.status === 'new' || req.status === 'pending';
    } else if (statusFilter === 'contacted') {
      matchesStatus = req.status === 'contacted';
    } else if (statusFilter === 'converted') {
      matchesStatus = req.status === 'converted';
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'Inter, sans-serif' }}>

      {/* ── KPI STATS RIBBON ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Total demandes', value: totalCount, icon: <Layers size={22} color="#1D3E61" />, bg: '#F0F4F8', border: '#D0E0EE' },
          { label: 'Nouveaux', value: newCount, icon: <Clock size={22} color="#D97706" />, bg: '#FFFBEB', border: '#FDE68A' },
          { label: 'Contactés', value: contactedCount, icon: <Phone size={22} color="#2563EB" />, bg: '#EFF6FF', border: '#BFDBFE' },
          { label: 'Convertis', value: convertedCount, icon: <CheckCircle size={22} color="#16A34A" />, bg: '#ECFDF5', border: '#A7F3D0' }
        ].map((card, idx) => (
          <div key={idx} style={{
            background: card.bg,
            border: `1.5px solid ${card.border}`,
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            transition: 'transform 0.2s'
          }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</p>
              <h3 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', margin: '4px 0 0' }}>{card.value}</h3>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN CRM WORKSPACE CARD ── */}
      <div style={{ background: '#fff', borderRadius: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', border: '1px solid #E5E7EB', overflow: 'hidden' }}>

        {/* CRM TITLE & REFRESH */}
        <div style={{ padding: '24px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1D3E61', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              📐 Demandes de mesure
            </h2>
            <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0' }}>Gérez les prises de cotes clients et convertissez-les en commandes actives</p>
          </div>
          <button
            onClick={() => { setLoading(true); loadRequests(); }}
            style={{ border: 'none', background: '#F3F4F6', color: '#4B5563', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
            title="Rafraîchir"
            onMouseEnter={e => e.currentTarget.style.background = '#E5E7EB'}
            onMouseLeave={e => e.currentTarget.style.background = '#F3F4F6'}
          >
            <RefreshCw size={16} className={loading ? 'spin-anim' : ''} style={{ transition: 'transform 0.5s' }} />
          </button>
        </div>

        {/* CRM FILTERS TOOLBAR */}
        <div style={{ padding: '16px 24px', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Tabs Filters */}
          <div style={{ display: 'flex', background: '#E5E7EB', padding: '4px', borderRadius: '10px', gap: '2px' }}>
            {[
              { id: 'all', label: 'Toutes' },
              { id: 'new', label: 'Nouveaux' },
              { id: 'contacted', label: 'Contactés' },
              { id: 'converted', label: 'Convertis' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: statusFilter === tab.id ? 700 : 500,
                  background: statusFilter === tab.id ? '#1D3E61' : 'transparent',
                  color: statusFilter === tab.id ? '#fff' : '#4B5563',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
            <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone, produit..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                border: '1.5px solid #E5E7EB',
                borderRadius: '10px',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#1D3E61'}
              onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'}
            />
          </div>
        </div>

        {/* CRM DATA TABLE */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E5E7EB', color: '#4B5563' }}>
                <th style={{ padding: '16px 20px', fontWeight: 600, width: '40px' }}></th>
                <th style={{ padding: '16px', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '16px', fontWeight: 600 }}>Client</th>
                <th style={{ padding: '16px', fontWeight: 600 }}>Produit</th>
                <th style={{ padding: '16px', fontWeight: 600 }}>Dimensions (L×H)</th>
                <th style={{ padding: '16px', fontWeight: 600, textAlign: 'center' }}>Qté</th>
                <th style={{ padding: '16px', fontWeight: 600 }}>Statut</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#6B7280' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <RefreshCw size={24} className="spin-anim" color="#1D3E61" />
                      <span>Chargement des demandes de mesure...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#6B7280', fontWeight: 500 }}>
                    Aucune demande trouvée
                  </td>
                </tr>
              ) : filteredRequests.map(req => {
                const isExpanded = expandedRow === req.id;
                const isNew = req.status === 'new' || req.status === 'pending';
                const isContacted = req.status === 'contacted';
                const isConverted = req.status === 'converted';

                return (
                  <>
                    {/* Row Content */}
                    <tr
                      key={req.id}
                      style={{
                        borderBottom: '1px solid #F3F4F6',
                        background: isExpanded ? '#F8FAFF' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => handleToggleExpand(req.id)}
                      onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
                      onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {/* Expander Icon */}
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        {isExpanded ? <ChevronUp size={16} color="#1D3E61" /> : <ChevronDown size={16} color="#6B7280" />}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '14px', color: '#4B5563' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={13} color="#9CA3AF" />
                          {new Date(req.date).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Client */}
                      <td style={{ padding: '14px' }}>
                        <div>
                          <p style={{ fontWeight: 700, color: '#111827', margin: 0 }}>{req.clientName}</p>
                          <p style={{ color: '#6B7280', fontSize: '11px', margin: '2px 0 0' }}>📞 {req.clientPhone}</p>
                        </div>
                      </td>

                      {/* Product */}
                      <td style={{ padding: '14px', fontWeight: 600, color: '#1D3E61' }}>
                        {req.productName || 'Produit personnalisé'}
                      </td>

                      {/* Dimensions */}
                      <td style={{ padding: '14px', fontFamily: 'monospace', fontWeight: 700, color: '#374151' }}>
                        {req.width ?? '—'} × {req.height ?? '—'} cm
                      </td>

                      {/* Quantity */}
                      <td style={{ padding: '14px', textAlign: 'center', fontWeight: 600, color: '#4B5563' }}>
                        {req.quantity || 1}
                      </td>

                      {/* Status badge */}
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: isNew ? '#FEF3C7' : isContacted ? '#DBEAFE' : isConverted ? '#D1FAE5' : '#E5E7EB',
                          color: isNew ? '#92400E' : isContacted ? '#1E40AF' : isConverted ? '#065F46' : '#374151'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                          {isNew ? 'Nouveau' : isContacted ? 'Contacté' : isConverted ? 'Converti' : 'En attente'}
                        </span>
                      </td>

                      {/* Quick actions buttons */}
                      <td style={{ padding: '14px 20px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>

                          {/* Call Client */}
                          <a
                            href={`tel:${req.clientPhone}`}
                            style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F3F4F6', color: '#1D3E61', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                            title="Appeler"
                            onMouseEnter={e => e.currentTarget.style.background = '#E5E7EB'}
                            onMouseLeave={e => e.currentTarget.style.background = '#F3F4F6'}
                          >
                            <Phone size={14} />
                          </a>

                          {/* WhatsApp Client */}
                          <a
                            href={`https://wa.me/${formatPhoneForWA(req.clientPhone)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                            title="Contacter sur WhatsApp"
                            onMouseEnter={e => e.currentTarget.style.background = '#D1FAE5'}
                            onMouseLeave={e => e.currentTarget.style.background = '#ECFDF5'}
                          >
                            <MessageSquare size={14} />
                          </a>

                          {/* Mark Contacted action */}
                          {isNew && (
                            <button
                              onClick={() => handleStatusChange(req.id, 'contacted')}
                              disabled={actionLoadingId === req.id}
                              style={{ border: 'none', width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                              title="Marquer comme contacté"
                              onMouseEnter={e => e.currentTarget.style.background = '#DBEAFE'}
                              onMouseLeave={e => e.currentTarget.style.background = '#EFF6FF'}
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}

                          {/* Convert to order action */}
                          {!isConverted && (
                            <button
                              onClick={() => handleConvertToOrder(req)}
                              disabled={actionLoadingId === req.id}
                              style={{ border: 'none', width: '32px', height: '32px', borderRadius: '8px', background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                              title="Convertir en commande"
                              onMouseEnter={e => e.currentTarget.style.background = '#FDE68A'}
                              onMouseLeave={e => e.currentTarget.style.background = '#FFFBEB'}
                            >
                              <RefreshCw size={14} className={actionLoadingId === req.id ? 'spin-anim' : ''} />
                            </button>
                          )}

                          {/* Delete action */}
                          <button
                            onClick={() => handleDeleteRequest(req.id)}
                            disabled={actionLoadingId === req.id}
                            title="Supprimer"
                            style={{
                              background: 'rgba(239,68,68,0.1)',
                              border: '1px solid rgba(239,68,68,0.3)',
                              borderRadius: 8,
                              padding: '6px 8px',
                              cursor: 'pointer',
                              color: '#EF4444',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              boxSizing: 'border-box'
                            }}
                          >
                            {actionLoadingId === req.id ? <RefreshCw size={14} className="spin-anim" /> : <Trash2 size={15} />}
                          </button>

                        </div>
                      </td>
                    </tr>

                    {/* Expandable Details Panel */}
                    {isExpanded && (
                      <tr key={`${req.id}-expanded`} style={{ background: '#F8FAFF', borderBottom: '1px solid #E5E7EB' }}>
                        <td colSpan={8} style={{ padding: '0 24px 24px 64px' }} onClick={e => e.stopPropagation()}>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1.2fr 1fr',
                            gap: '24px',
                            background: '#fff',
                            border: '1.5px solid #E5E7EB',
                            borderRadius: '16px',
                            padding: '24px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
                          }}>

                            {/* Left Side: Profiles */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                              {/* Client Info block */}
                              <div>
                                <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 800, color: '#1D3E61', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <User size={15} /> Informations de contact
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                                  <div style={{ background: '#F9FAFB', padding: '10px 12px', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '11px', color: '#6B7280', display: 'block', fontWeight: 600 }}>NOM DU CLIENT</span>
                                    <strong style={{ color: '#111827' }}>{req.clientName}</strong>
                                  </div>
                                  <div style={{ background: '#F9FAFB', padding: '10px 12px', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '11px', color: '#6B7280', display: 'block', fontWeight: 600 }}>NUMÉRO DE TÉLÉPHONE</span>
                                    <strong style={{ color: '#111827' }}>{req.clientPhone}</strong>
                                  </div>
                                  <div style={{ background: '#F9FAFB', padding: '10px 12px', borderRadius: '8px', gridColumn: 'span 2' }}>
                                    <span style={{ fontSize: '11px', color: '#6B7280', display: 'block', fontWeight: 600 }}>EMAIL CLIENT</span>
                                    <span style={{ color: '#374151' }}>{req.clientEmail || 'Non fourni'}</span>
                                  </div>
                                  <div style={{ background: '#F9FAFB', padding: '10px 12px', borderRadius: '8px', gridColumn: 'span 2' }}>
                                    <span style={{ fontSize: '11px', color: '#6B7280', display: 'block', fontWeight: 600 }}>ADRESSE POSTALE</span>
                                    <span style={{ color: '#374151' }}><MapPin size={12} color="#9CA3AF" style={{ display: 'inline', marginRight: '4px' }} />{req.clientAddress || 'Non fournie'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Dimensions and specs block */}
                              <div>
                                <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 800, color: '#1D3E61', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Sparkles size={15} /> Détails de la mesure
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                                  <div style={{ background: '#F9FAFB', padding: '10px 12px', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '11px', color: '#6B7280', display: 'block', fontWeight: 600 }}>PRODUIT CIBLE</span>
                                    <strong style={{ color: '#111827' }}>{req.productName || '—'}</strong>
                                  </div>
                                  <div style={{ background: '#F9FAFB', padding: '10px 12px', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '11px', color: '#6B7280', display: 'block', fontWeight: 600 }}>DIMENSIONS FINALES</span>
                                    <strong style={{ color: '#111827', fontFamily: 'monospace' }}>{req.width || '—'} × {req.height || '—'} cm</strong>
                                  </div>
                                  <div style={{ background: '#F9FAFB', padding: '10px 12px', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '11px', color: '#6B7280', display: 'block', fontWeight: 600 }}>QUANTITÉ</span>
                                    <strong style={{ color: '#111827' }}>{req.quantity || 1}</strong>
                                  </div>
                                </div>
                              </div>

                              {/* Original notes */}
                              <div>
                                <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: '#4B5563' }}>
                                  📝 Remarques complémentaires du client
                                </h4>
                                <div style={{ background: '#F9FAFB', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', color: '#4B5563', fontStyle: 'italic', borderLeft: '3px solid #D1D5DB' }}>
                                  {req.notes || 'Aucun commentaire formulé.'}
                                </div>
                              </div>

                            </div>

                            {/* Right Side: Admin notes editor & status timeline */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'space-between', borderLeft: '1px solid #E5E7EB', paddingLeft: '24px' }}>

                              {/* Internal admin notes */}
                              <div>
                                <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 800, color: '#1D3E61', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Clipboard size={15} /> Notes administratives internes
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <textarea
                                    value={adminNotesText[req.id] || ''}
                                    onChange={e => setAdminNotesText({ ...adminNotesText, [req.id]: e.target.value })}
                                    placeholder="Ajouter des notes internes (ex: Client rappelé, en attente de validation du devis, etc.)"
                                    style={{
                                      width: '100%',
                                      height: '90px',
                                      padding: '10px',
                                      borderRadius: '8px',
                                      border: '1.5px solid #E5E7EB',
                                      fontSize: '13px',
                                      outline: 'none',
                                      resize: 'none',
                                      boxSizing: 'border-box',
                                      fontFamily: 'inherit'
                                    }}
                                  />
                                  <button
                                    onClick={() => handleSaveAdminNotes(req.id)}
                                    disabled={savingNoteId === req.id}
                                    style={{
                                      border: 'none',
                                      background: '#1D3E61',
                                      color: 'white',
                                      padding: '8px 16px',
                                      borderRadius: '8px',
                                      fontSize: '12px',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      alignSelf: 'flex-end',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      boxShadow: '0 2px 4px rgba(29,62,97,0.1)'
                                    }}
                                  >
                                    <Save size={13} />
                                    {savingNoteId === req.id ? 'Enregistrement...' : 'Enregistrer la note'}
                                  </button>
                                </div>
                              </div>

                              {/* Timeline */}
                              <div>
                                <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 800, color: '#1D3E61', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Clock size={14} /> Suivi de la demande
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                                  {/* Step 1: Created */}
                                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                                    <span style={{ color: '#6B7280' }}>Demande initiée par le client le {new Date(req.date).toLocaleDateString('fr-TN')}</span>
                                  </div>

                                  {/* Step 2: Contacted */}
                                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: (isContacted || isConverted) ? '#10B981' : '#D1D5DB' }} />
                                    <span style={{ color: (isContacted || isConverted) ? '#374151' : '#9CA3AF' }}>
                                      {isContacted || isConverted ? 'Client contacté par le commercial' : 'Contact client planifié'}
                                    </span>
                                  </div>

                                  {/* Step 3: Converted */}
                                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isConverted ? '#10B981' : '#D1D5DB' }} />
                                    <span style={{ color: isConverted ? '#16A34A' : '#9CA3AF', fontWeight: isConverted ? 700 : 500 }}>
                                      {isConverted ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                          Converti en Commande <ArrowRight size={12} /> <strong style={{ color: '#1D3E61' }}>{req.convertedOrderId}</strong>
                                        </span>
                                      ) : 'Convertir en commande'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Footer Actions inside Box */}
                              <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                                <button
                                  onClick={() => handleDownloadPDF(req)}
                                  style={{
                                    flex: 1,
                                    border: '1.5px solid #1D3E61',
                                    background: 'transparent',
                                    color: '#1D3E61',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                  <FileText size={14} />
                                  Exporter PDF
                                </button>

                                <button
                                  onClick={() => handleDeleteRequest(req.id)}
                                  style={{
                                    border: 'none',
                                    background: '#FEE2E2',
                                    color: '#EF4444',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.background = '#FCA5A5'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = '#FEE2E2'; }}
                                >
                                  <Trash2 size={14} />
                                  Supprimer
                                </button>
                              </div>

                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-anim {
          animation: spin 1.2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default MeasureRequestsTable;
