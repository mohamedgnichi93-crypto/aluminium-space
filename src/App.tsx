import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import NotFound from './pages/NotFound';
import ClientPortal from './pages/ClientPortal';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { AIAgentProvider, useAIAgentContext, type Lang } from './context/AIAgentContext';
import AIAgent from './components/ai/AIAgent';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout />}>
          <Route index element={<motion.div {...pageVariants} initial="initial" animate="animate" exit="exit"><Home /></motion.div>} />
          <Route path="produits" element={<motion.div {...pageVariants} initial="initial" animate="animate" exit="exit"><Products /></motion.div>} />
          <Route path="produits/:id" element={<motion.div {...pageVariants} initial="initial" animate="animate" exit="exit"><ProductDetail /></motion.div>} />
          <Route path="contact" element={<motion.div {...pageVariants} initial="initial" animate="animate" exit="exit"><Contact /></motion.div>} />
          <Route path="about" element={<motion.div {...pageVariants} initial="initial" animate="animate" exit="exit"><About /></motion.div>} />
          <Route path="dashboard" element={<motion.div {...pageVariants} initial="initial" animate="animate" exit="exit"><Dashboard /></motion.div>} />
          <Route path="dashbord" element={<Navigate to="/dashboard" replace />} />
          <Route path="admin" element={<Navigate to="/dashboard" replace />} />
          <Route path="devis" element={<Navigate to="/produits" replace />} />
          <Route path="mon-espace" element={<motion.div {...pageVariants} initial="initial" animate="animate" exit="exit"><ClientPortal /></motion.div>} />
          <Route path="*" element={<motion.div {...pageVariants} initial="initial" animate="animate" exit="exit"><NotFound /></motion.div>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function AppContent() {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/');
  const { i18n } = useTranslation();
  const { setLanguage } = useAIAgentContext();

  useEffect(() => {
    setLanguage(i18n.language as Lang);
  }, [i18n.language, setLanguage]);

  return (
    <>
      <AnimatedRoutes />
      {!isDashboard && <AIAgent />}
    </>
  );
}

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const dir = ['ar', 'tn'].includes(i18n.language) ? 'rtl' : 'ltr';
    document.documentElement.dir  = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <Router>
      <AIAgentProvider>
        <AppContent />
      </AIAgentProvider>
    </Router>
  );
}

export default App;
