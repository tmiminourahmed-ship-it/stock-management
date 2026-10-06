import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { dashboardService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/format';
import {
  Package,
  Boxes,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Calendar,
  AlertTriangle,
  PieChart as PieChartIcon,
  Trophy,
  BarChart3,
  CheckCircle2
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

const StatCard = ({ icon: Icon, label, value, subValue, colorClass = 'blue' }) => (
  <div className="stat-card">
    <div className="stat-card-header">
      <div>
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">{value}</div>
        {subValue && <div className="stat-card-sub">{subValue}</div>}
      </div>
      <div className={`stat-card-icon ${colorClass}`}>
        <Icon size={22} />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [salesChart, setSalesChart] = useState([]);
  const [profitChart, setProfitChart] = useState([]);
  const [stockByCategory, setStockByCategory] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [statsRes, salesRes, profitRes, categoryRes, topRes, lowRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getSalesChart({ days: 30 }),
        dashboardService.getProfitChart({ days: 30 }),
        dashboardService.getStockByCategory(),
        dashboardService.getTopProducts({ limit: 5 }),
        dashboardService.getLowStock(),
      ]);
      setStats(statsRes.data.data);
      setSalesChart(salesRes.data.data || []);
      setProfitChart(profitRes.data.data || []);
      setStockByCategory(categoryRes.data.data || []);
      setTopProducts(topRes.data.data || []);
      setLowStock(lowRes.data.data || []);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  if (loading) return <LoadingSpinner message="Chargement du tableau de bord..." />;

  return (
    <div>
      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard icon={Package} label="Total Produits" value={stats?.totalProducts || 0} colorClass="blue" />
        <StatCard icon={Boxes} label="Stock Total" value={stats?.totalStockQuantity?.toLocaleString() || 0} subValue="unités" colorClass="purple" />
        <StatCard icon={ShoppingCart} label="Ventes Aujourd'hui" value={stats?.today?.salesCount || 0} subValue="transactions" colorClass="green" />
        <StatCard icon={DollarSign} label="CA Aujourd'hui" value={formatCurrency(stats?.today?.revenue)} colorClass="cyan" />
        <StatCard icon={TrendingUp} label="Bénéfice Aujourd'hui" value={formatCurrency(stats?.today?.profit)} colorClass="green" />
        <StatCard icon={Calendar} label="CA Mensuel" value={formatCurrency(stats?.monthly?.revenue)} colorClass="orange" />
        <StatCard icon={BarChart3} label="Bénéfice Mensuel" value={formatCurrency(stats?.monthly?.profit)} colorClass="purple" />
        <StatCard icon={AlertTriangle} label="Stock Faible" value={stats?.lowStockProducts || 0} subValue="à réapprovisionner" colorClass="red" />
      </div>

      {/* Sales Chart */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <BarChart3 size={18} className="text-primary" />
              Ventes & Revenus (30 derniers jours)
            </span>
          </div>
          <div className="card-body">
            {salesChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={salesChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v.toFixed(2)}`} />
                  <Tooltip formatter={(val) => formatCurrency(val)} labelStyle={{ fontSize: 12 }} />
                  <Legend iconSize={12} wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="revenue" name="Revenu" stroke="#6366f1" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="profit" name="Bénéfice" stroke="#10b981" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <BarChart3 size={40} className="empty-state-icon text-muted" />
                <div>Aucune donnée de vente disponible</div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <PieChartIcon size={18} className="text-primary" />
              Stock par Catégorie
            </span>
          </div>
          <div className="card-body">
            {stockByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={stockByCategory}
                    cx="50%"
                    cy="45%"
                    outerRadius={90}
                    dataKey="totalStock"
                    nameKey="category"
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {stockByCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v} unités`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <PieChartIcon size={40} className="empty-state-icon text-muted" />
                <div>Aucune catégorie disponible</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="charts-grid-equal">
        {/* Top Products */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Trophy size={18} style={{ color: '#f59e0b' }} />
              Top Produits Vendus
            </span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {topProducts.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Produit</th>
                    <th>Qté</th>
                    <th>Revenu</th>
                    <th>Bénéfice</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => (
                    <tr key={i}>
                      <td><span className="badge badge-primary">{i + 1}</span></td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.category}</div>
                      </td>
                      <td>{p.totalQuantity}</td>
                      <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatCurrency(p.totalRevenue)}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(p.totalProfit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <Trophy size={40} className="empty-state-icon text-muted" />
                <div>Aucune vente enregistrée</div>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <AlertTriangle size={18} className="text-danger" />
              Produits Stock Faible
            </span>
            {lowStock.length > 0 && (
              <span className="badge badge-danger">{lowStock.length}</span>
            )}
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {lowStock.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Catégorie</th>
                    <th>Stock</th>
                    <th>Min.</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.slice(0, 8).map((p) => (
                    <tr key={p._id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td><span className="badge badge-gray">{p.category}</span></td>
                      <td>
                        <span className={`badge ${p.stockQuantity === 0 ? 'badge-danger' : 'badge-warning'}`}>
                          {p.stockQuantity}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{p.minimumStock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <CheckCircle2 size={40} className="empty-state-icon" style={{ color: 'var(--success)' }} />
                <div>Tous les stocks sont suffisants</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profit Bar Chart */}
      {profitChart.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header">
            <span className="card-title">
              <TrendingUp size={18} className="text-success" />
              Évolution des Bénéfices (30 derniers jours)
            </span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={profitChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val) => formatCurrency(val)} />
                <Bar dataKey="profit" name="Bénéfice" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
