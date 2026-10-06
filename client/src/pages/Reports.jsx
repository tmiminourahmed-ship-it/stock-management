import { useState, useEffect, useCallback } from 'react';
import { reportService, saleService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatDate } from '../utils/format';
import { exportSalesToExcel } from '../utils/excelExport';
import { FileSpreadsheet, BarChart3, ShoppingCart, X, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const Reports = () => {
  const [sales, setSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '', endDate: '', groupBy: 'day', page: 1,
  });
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const params = { limit: 1000, startDate: filters.startDate, endDate: filters.endDate };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const res = await saleService.getAll(params);
      const allSales = res.data.data?.sales || [];
      exportSalesToExcel(allSales, 'Rapport_Ventes_Quotidien');
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const loadSales = useCallback(async () => {
    setSalesLoading(true);
    try {
      const params = { limit: 20, ...filters };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const res = await saleService.getAll(params);
      setSales(res.data.data?.sales || []);
      setPagination(res.data.data?.pagination || { total: 0, pages: 1 });
    } catch {} finally {
      setSalesLoading(false);
    }
  }, [filters]);

  const loadChart = useCallback(async () => {
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      params.groupBy = filters.groupBy;
      const res = await reportService.getSales(params);
      const raw = res.data.data || [];
      const mapped = raw.map((item) => ({
        label: item._id.day
          ? `${item._id.day}/${item._id.month}`
          : item._id.week
          ? `S${item._id.week}`
          : `${item._id.month}/${item._id.year}`,
        revenue: item.revenue,
        cost: item.cost,
        profit: item.profit,
        count: item.count,
      }));
      setChartData(mapped);
    } catch {}
  }, [filters.startDate, filters.endDate, filters.groupBy]);

  useEffect(() => { loadSales(); }, [loadSales]);
  useEffect(() => { loadChart(); }, [loadChart]);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="page-header-title">Rapports des Ventes</div>
          <div className="page-header-subtitle">Analyse détaillée de vos ventes</div>
        </div>
        <button
          className="btn btn-success"
          onClick={handleExportExcel}
          disabled={exporting}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <FileSpreadsheet size={16} />
          <span>{exporting ? 'Génération...' : 'Exporter en Excel'}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div className="filters-bar">
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 12 }}>Date début</label>
              <input className="form-control" type="date" value={filters.startDate}
                onChange={(e) => setFilters((p) => ({ ...p, startDate: e.target.value, page: 1 }))} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 12 }}>Date fin</label>
              <input className="form-control" type="date" value={filters.endDate}
                onChange={(e) => setFilters((p) => ({ ...p, endDate: e.target.value, page: 1 }))} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 12 }}>Grouper par</label>
              <select className="form-control" value={filters.groupBy}
                onChange={(e) => setFilters((p) => ({ ...p, groupBy: e.target.value }))}>
                <option value="day">Jour</option>
                <option value="week">Semaine</option>
                <option value="month">Mois</option>
              </select>
            </div>
            {(filters.startDate || filters.endDate) && (
              <button className="btn btn-ghost btn-sm" onClick={() => setFilters((p) => ({ ...p, startDate: '', endDate: '', page: 1 }))}
                style={{ marginTop: 20 }}>
                <X size={14} /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span className="card-title">
              <BarChart3 size={18} className="text-primary" />
              Revenus & Bénéfices
            </span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v.toFixed(0)}`} />
                <Tooltip formatter={(val) => formatCurrency(val)} />
                <Legend iconSize={12} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="revenue" name="Revenu" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Bénéfice" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Sales Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <ShoppingCart size={18} className="text-primary" />
            Détail des Ventes
          </span>
          <span className="badge badge-gray">{pagination.total} vente(s)</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {salesLoading ? (
            <LoadingSpinner message="Chargement des ventes..." />
          ) : sales.length === 0 ? (
            <EmptyState icon={<ShoppingCart size={44} className="text-muted" />} title="Aucune vente trouvée" message="Aucune vente ne correspond à vos critères." />
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Produit</th>
                    <th>Quantité</th>
                    <th>Prix d'achat</th>
                    <th>Prix de vente</th>
                    <th>Total vente</th>
                    <th>Coût total</th>
                    <th>Bénéfice</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s._id}>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{formatDate(s.date)}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{s.product?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.product?.category}</div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{s.quantity}</td>
                      <td>{formatCurrency(s.purchasePrice)}</td>
                      <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{formatCurrency(s.sellingPrice)}</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(s.totalSale)}</td>
                      <td style={{ color: 'var(--danger)' }}>{formatCurrency(s.totalCost)}</td>
                      <td>
                        <span style={{ color: s.profit >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                          {s.profit >= 0 ? '+' : ''}{formatCurrency(s.profit)}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{s.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16 }}>
              <button className="btn btn-outline btn-sm" disabled={filters.page <= 1}
                onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}>
                <ChevronLeft size={15} /> Précédent
              </button>
              <span style={{ padding: '6px 12px', fontSize: 14, color: 'var(--text-secondary)' }}>
                {filters.page} / {pagination.pages}
              </span>
              <button className="btn btn-outline btn-sm" disabled={filters.page >= pagination.pages}
                onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}>
                Suivant <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
