import { useState, useEffect, useCallback } from 'react';
import { stockService, productService, saleService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatDate, getMovementTypeLabel } from '../utils/format';
import { exportSalesToExcel } from '../utils/excelExport';
import { FileSpreadsheet, History as HistoryIcon, X, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const History = () => {
  const [movements, setMovements] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '', endDate: '', productId: '', type: '', page: 1,
  });

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const params = { limit: 1000, startDate: filters.startDate, endDate: filters.endDate, productId: filters.productId };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const res = await saleService.getAll(params);
      const sales = res.data.data?.sales || [];
      exportSalesToExcel(sales, 'Historique_Ventes');
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    productService.getAll().then((res) => setProducts(res.data.data || [])).catch(() => {});
  }, []);

  const loadMovements = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 20, ...filters };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const res = await stockService.getMovements(params);
      setMovements(res.data.data?.movements || []);
      setPagination(res.data.data?.pagination || { total: 0, page: 1, pages: 1 });
    } catch {
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadMovements(); }, [loadMovements]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const resetFilters = () => setFilters({ startDate: '', endDate: '', productId: '', type: '', page: 1 });

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="page-header-title">Historique des Mouvements</div>
          <div className="page-header-subtitle">{pagination.total} mouvement(s) au total</div>
        </div>
        <button
          className="btn btn-success"
          onClick={handleExportExcel}
          disabled={exporting}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <FileSpreadsheet size={16} />
          <span>{exporting ? 'Génération...' : 'Exporter Ventes en Excel'}</span>
        </button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div className="filters-bar">
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>Date début</label>
              <input className="form-control" type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>Date fin</label>
              <input className="form-control" type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>Produit</label>
              <select className="form-control" name="productId" value={filters.productId} onChange={handleFilterChange} style={{ minWidth: 180 }}>
                <option value="">Tous les produits</option>
                {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>Type</label>
              <select className="form-control" name="type" value={filters.type} onChange={handleFilterChange}>
                <option value="">Tous les types</option>
                <option value="ENTRY">Entrée</option>
                <option value="SALE">Vente</option>
              </select>
            </div>
            {(filters.startDate || filters.endDate || filters.productId || filters.type) && (
              <button className="btn btn-ghost btn-sm" onClick={resetFilters} style={{ marginTop: 20 }}>
                <X size={14} /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <LoadingSpinner message="Chargement de l'historique..." />
          ) : movements.length === 0 ? (
            <EmptyState icon={<HistoryIcon size={44} className="text-muted" />} title="Aucun mouvement trouvé" message="Aucun mouvement ne correspond à vos filtres." />
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Produit</th>
                    <th>Type</th>
                    <th>Quantité</th>
                    <th>Prix unitaire</th>
                    <th>Montant total</th>
                    <th>Bénéfice</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => {
                    const itemsPerPack = m.product?.itemsPerPack || 6;
                    const isPack = m.note?.includes('pack') || (m.quantity >= itemsPerPack && m.quantity % itemsPerPack === 0);
                    const packsCount = (m.quantity / itemsPerPack).toFixed(1).replace('.0', '');
                    const sign = m.type === 'ENTRY' ? '+' : '-';
                    const qtyDisplay = isPack
                      ? `${sign}${packsCount} packs (${m.quantity} un.)`
                      : `${sign}${m.quantity} un.`;

                    return (
                      <tr key={m._id}>
                        <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: 13 }}>
                          {formatDate(m.date)}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{m.product?.name || '—'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.product?.category}</div>
                        </td>
                        <td>
                          <span className={`badge ${m.type === 'ENTRY' ? 'badge-info' : 'badge-primary'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {m.type === 'ENTRY' ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                            {getMovementTypeLabel(m.type)}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: m.type === 'ENTRY' ? 'var(--success)' : 'var(--primary)', whiteSpace: 'nowrap' }}>
                            {qtyDisplay}
                          </span>
                        </td>
                        <td>{formatCurrency(m.unitPrice)}</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(m.totalAmount)}</td>
                        <td>
                          {m.profit > 0 ? (
                            <span style={{ color: 'var(--success)', fontWeight: 600 }}>+{formatCurrency(m.profit)}</span>
                          ) : m.profit < 0 ? (
                            <span style={{ color: 'var(--danger)' }}>{formatCurrency(m.profit)}</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{m.note || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16 }}>
              <button className="btn btn-outline btn-sm" disabled={filters.page <= 1}
                onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}>← Précédent</button>
              <span style={{ padding: '6px 12px', fontSize: 14, color: 'var(--text-secondary)' }}>
                {filters.page} / {pagination.pages}
              </span>
              <button className="btn btn-outline btn-sm" disabled={filters.page >= pagination.pages}
                onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}>Suivant →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
