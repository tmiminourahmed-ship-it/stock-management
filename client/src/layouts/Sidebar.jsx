import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';
import {
  LayoutDashboard,
  Package,
  ArrowDownLeft,
  ShoppingCart,
  History,
  TrendingUp,
  BarChart3,
  Boxes
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Tableau de bord', section: 'PRINCIPAL' },
  { path: '/produits', icon: Package, label: 'Produits', section: 'GESTION' },
  { path: '/entree-stock', icon: ArrowDownLeft, label: 'Entrée Stock', section: 'GESTION' },
  { path: '/nouvelle-vente', icon: ShoppingCart, label: 'Nouvelle Vente', section: 'GESTION' },
  { path: '/historique', icon: History, label: 'Historique', section: 'RAPPORTS' },
  { path: '/benefices', icon: TrendingUp, label: 'Bénéfices', section: 'RAPPORTS' },
  { path: '/rapports', icon: BarChart3, label: 'Rapports', section: 'RAPPORTS' },
];

const Sidebar = () => {
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const res = await dashboardService.getLowStock();
        setLowStockCount(res.data.data?.length || 0);
      } catch {}
    };
    fetchLowStock();
  }, []);

  let lastSection = '';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Boxes size={22} color="#ffffff" />
        </div>
        <div>
          <div className="brand-name">StockFlow</div>
          <div className="brand-subtitle">Gestion de Stock</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const showSection = item.section !== lastSection;
          if (showSection) lastSection = item.section;
          const IconComponent = item.icon;

          return (
            <div key={item.path}>
              {showSection && (
                <div className="nav-section-label">{item.section}</div>
              )}
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">
                  <IconComponent size={18} />
                </span>
                <span>{item.label}</span>
                {item.path === '/produits' && lowStockCount > 0 && (
                  <span className="nav-badge">{lowStockCount}</span>
                )}
              </NavLink>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-avatar">SF</div>
        <div className="sidebar-footer-info">
          <div className="name">StockFlow Pro</div>
          <div className="role">Devise: TND (DT)</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
