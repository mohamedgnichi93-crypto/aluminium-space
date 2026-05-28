import { useState, useEffect, useMemo } from 'react';
import { getOrders, updateOrderStatus, updateOrder, moveToTrash, getTrashOrders, restoreFromTrash, permanentlyDeleteOrder, emptyTrash } from '../store/ordersStore';
import type { Order } from '../store/ordersStore';
import { generatePDF } from '../utils/pdfGenerator';
import { toast } from '../hooks/useToast';
import { supabase } from '../lib/supabase';
import OrderDetailModal from '../components/dashboard/OrderDetailModal';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import AuthPanel from '../components/dashboard/AuthPanel';

import KpiCards from '../components/dashboard/KpiCards';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import OrdersTable from '../components/dashboard/OrdersTable';
import MeasureRequestsTable from '../components/dashboard/MeasureRequestsTable';
import TrashTable from '../components/dashboard/TrashTable';
import SettingsPanel from '../components/dashboard/SettingsPanel';
import ChatPanel from '../components/dashboard/ChatPanel';
import ProductsPanel from '../components/dashboard/ProductsPanel';
import FaqPanel from '../components/dashboard/FaqPanel';
import EditOrderModal from '../components/dashboard/EditOrderModal';
import PageSEO from '../components/ui/PageSEO';
import { Loader2 } from 'lucide-react';
import { getSettings, saveSettings, resetSettings, loadSettings, type BusinessSettings } from '../store/settingsStore';
import { useAdminChat } from '../hooks/useChat';

const COLORS = ['#1D3E61', '#81C063', '#F59E0B', '#8B5CF6', '#EF4444'];

const formatDT = (num: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(num / 1000) + ' DT';
};



const Dashboard = () => {
  // --- SESSION & AUTH STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- UI STATE ---
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved !== null) return saved === 'true';
    return window.innerWidth < 768;
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- DATA STATE ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [trashedOrders, setTrashedOrders] = useState<Order[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // --- TABS & FILTERS ---
  const [activeTab, setActiveTab] = useState('dashboard');

  // --- SETTINGS ---
  const [settings, setSettings] = useState<BusinessSettings>(getSettings());
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsSection, setSettingsSection] = useState<'finances' | 'contact' | 'horaires' | 'legales'>('finances');

  // --- CHAT ---
  const { sessions, activeSession, setActiveSession, replyToSession, markSessionRead, isLoading: chatLoading, unreadSessions } = useAdminChat();
  const [chatReply, setChatReply] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- INIT EFFECT ---
  useEffect(() => {
    // Check Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    // Load settings from Supabase into cache
    loadSettings().then(s => setSettings(s));

    // Clock interval
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => {
      subscription.unsubscribe();
      clearInterval(clockInterval);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      toast.error('Identifiants incorrects');
    } else {
      toast.success('Connexion réussie');
    }
    setPassword('');
  };

  const handleLogout = async () => {
    if (window.confirm('Voulez-vous vous déconnecter ?')) {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setOrders([]);
      setTrashedOrders([]);
    }
  };



  // --- ONLINE / OFFLINE LISTENER ---
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- DATA LOADING ---
  const loadData = async () => {
    try {
      const [currentOrdersRaw, trashedOrdersRaw] = await Promise.all([
        getOrders(),
        getTrashOrders()
      ]);

      const currentOrders = currentOrdersRaw.sort((a: Order, b: Order) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders(currentOrders);

      const trashed = trashedOrdersRaw.sort((a: Order, b: Order) => new Date(b.deletedAt || b.date).getTime() - new Date(a.deletedAt || a.date).getTime());
      setTrashedOrders(trashed);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      toast.error('Erreur lors du chargement des données');
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await loadData();
    setIsSyncing(false);
    toast.success('Synchronisé avec le serveur');
  };

  useEffect(() => {
    if (isAuthenticated) {
      setIsSyncing(true);
      loadData().finally(() => setIsSyncing(false));
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // --- ACTIONS ---
  const handleStatusChange = async (id: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatus(id, newStatus);
      await loadData();
      toast.success('Statut mis à jour');
      if (selectedOrder?.id === id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handleMoveToTrash = async (id: string) => {
    if (window.confirm('Voulez-vous déplacer cette commande vers la corbeille ?')) {
      try {
        await moveToTrash(id);
        await loadData();
        toast.success('Commande déplacée vers la corbeille');
      } catch (err) {
        console.error(err);
        toast.error('Erreur lors du déplacement vers la corbeille');
      }
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreFromTrash(id);
      await loadData();
      toast.success('Commande restaurée');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la restauration');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (window.confirm('Voulez-vous supprimer définitivement cette commande ? Cette action est irréversible.')) {
      try {
        await permanentlyDeleteOrder(id);
        await loadData();
        toast.success('Commande supprimée définitivement');
      } catch (err) {
        console.error(err);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleEmptyTrash = async () => {
    if (window.confirm('Voulez-vous vider toute la corbeille ? Cette action est irréversible.')) {
      try {
        await emptyTrash();
        await loadData();
        toast.success('Corbeille vidée');
      } catch (err) {
        console.error(err);
        toast.error('Erreur lors du vidage de la corbeille');
      }
    }
  };

  const handleDownloadPDF = async (order: Order) => {
    try {
      generatePDF(order);
      toast.success('PDF téléchargé');
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('sidebar_collapsed', newState ? 'true' : 'false');
  };

  // --- KPI & Charts Calculations ---
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending' || (o.status as any) === 'en_attente').length;
  const confirmedOrders = orders.filter(o => o.status === 'confirmed' || (o.status as any) === 'confirme' || o.status === 'en_fabrication' || o.status === 'pret').length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalHT || 0), 0);

  const barChartData = useMemo(() => {
    const monthsMap: Record<string, number> = {};
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const monthStr = monthDate.toLocaleDateString('fr-FR', { month: 'short' });
      monthsMap[monthStr] = 0;
    }
    orders.forEach(o => {
      const oDate = new Date(o.date);
      const mStr = oDate.toLocaleDateString('fr-FR', { month: 'short' });
      if (monthsMap[mStr] !== undefined) {
        monthsMap[mStr]++;
      }
    });
    return Object.keys(monthsMap).map(k => ({ name: k, Commandes: monthsMap[k] }));
  }, [orders]);

  const pieChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        counts[item.productName] = (counts[item.productName] || 0) + item.quantity;
      });
    });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [orders]);

  // Filtering
  const filteredOrders = orders.filter(o => {
    const matchesSearch = (o.clientInfo?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.clientInfo?.phone || '').includes(searchTerm) ||
      o.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;

    let matchesDate = true;
    const orderDate = new Date(o.date);
    const today = new Date();
    if (dateFilter === 'week') {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = orderDate >= weekAgo;
    } else if (dateFilter === 'month') {
      matchesDate = orderDate.getMonth() === today.getMonth() && orderDate.getFullYear() === today.getFullYear();
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const currentItems = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- LOADING SCREEN ---
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0D1B2A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={40} color="#81C063" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <AuthPanel
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        handleLogin={handleLogin}
        authError={authError}
        loading={loading}
      />
    );
  }

  // --- DASHBOARD LAYOUT ---

  return (
    <>
      <PageSEO titleFr="Dashboard — Aluminium Space" path="/dashboard" noIndex />
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F4F7FB' }}>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

        {/* MOBILE OVERLAY */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 39
            }}
          />
        )}

        {/* SIDEBAR */}
        <DashboardSidebar
          isMobile={isMobile}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeTab={activeTab}
          isSidebarCollapsed={isSidebarCollapsed}
          unreadSessions={unreadSessions}
          trashedOrdersCount={trashedOrders.length}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (isMobile) setSidebarOpen(false);
          }}
          toggleSidebar={toggleSidebar}
          handleLogout={handleLogout}
        />

        {/* MAIN CONTENT AREA */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <DashboardHeader
            onMenuClick={() => setSidebarOpen(prev => !prev)}
            isMobile={isMobile}
            activeTab={activeTab}
            currentTime={currentTime}
            isOnline={isOnline}
            isSyncing={isSyncing}
            handleSync={handleSync}
            handleLogout={handleLogout}
          />

          {/* CONTENT AREA SCROLLABLE */}
          <div className="dashboard-content-area" style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '32px'
          }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

              {/* ── PARAMÈTRES ─────────────────────────────────────────────────── */}
              {activeTab === 'parametres' && (
                <SettingsPanel
                  settings={settings}
                  setSettings={setSettings}
                  settingsSection={settingsSection}
                  setSettingsSection={setSettingsSection}
                  saveSettings={async (s: BusinessSettings) => {
                    await saveSettings(s);
                  }}
                  resetSettings={async () => {
                    await resetSettings();
                    setSettings(getSettings());
                  }}
                  getSettings={getSettings}
                  settingsSaved={settingsSaved}
                  setSettingsSaved={setSettingsSaved}
                />
              )}

              {activeTab === 'corbeille' ? (
                <TrashTable
                  trashedOrders={trashedOrders}
                  handleEmptyTrash={handleEmptyTrash}
                  handleRestore={handleRestore}
                  handlePermanentDelete={handlePermanentDelete}
                />
              ) : activeTab === 'demandes' ? (
                <MeasureRequestsTable />
              ) : activeTab === 'stats' && (
                <>

                  <KpiCards
                    totalOrders={totalOrders}
                    pendingOrders={pendingOrders}
                    confirmedOrders={confirmedOrders}
                    totalRevenue={totalRevenue}
                    orders={orders}
                    formatDT={formatDT}
                  />

                  <DashboardCharts
                    orders={orders}
                    activeTab={activeTab}
                    totalOrders={totalOrders}
                    barChartData={barChartData}
                    pieChartData={pieChartData}
                    formatDT={formatDT}
                    COLORS={COLORS}
                  />
                </>
              )}

              {activeTab === 'chat' && (
                <ChatPanel
                  sessions={sessions}
                  activeSession={activeSession}
                  setActiveSession={setActiveSession}
                  chatLoading={chatLoading}
                  chatReply={chatReply}
                  setChatReply={setChatReply}
                  replyToSession={replyToSession}
                  markSessionRead={markSessionRead}
                />
              )}

              {activeTab === 'produits' && <ProductsPanel />}

              {activeTab === 'faq' && <FaqPanel />}

              {(activeTab === 'dashboard' || activeTab === 'orders') && (
                <>
                  {activeTab === 'dashboard' && (
                    <KpiCards
                      totalOrders={totalOrders}
                      pendingOrders={pendingOrders}
                      confirmedOrders={confirmedOrders}
                      totalRevenue={totalRevenue}
                      orders={orders}
                      formatDT={formatDT}
                    />
                  )}

                  <OrdersTable
                    filteredOrders={filteredOrders}
                    currentItems={currentItems}
                    totalPages={totalPages}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    setCurrentPage={setCurrentPage}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    dateFilter={dateFilter}
                    setDateFilter={setDateFilter}
                    handleStatusChange={handleStatusChange}
                    handleMoveToTrash={handleMoveToTrash}
                    handleDownloadPDF={handleDownloadPDF}
                    setSelectedOrder={setSelectedOrder}
                    setEditingOrder={setEditingOrder}
                    formatDT={formatDT}
                  />
                </>
              )}
            </div>
          </div>
        </main>

        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onStatusChange={handleStatusChange}
            onDownloadPDF={handleDownloadPDF}
          />
        )}

        {editingOrder && (
          <EditOrderModal
            editingOrder={editingOrder}
            setEditingOrder={setEditingOrder}
            updateOrder={updateOrder}
            loadData={loadData}
          />
        )}
      </div>
    </>
  );
};

export default Dashboard;
