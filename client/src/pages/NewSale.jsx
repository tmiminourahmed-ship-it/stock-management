import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { productService, saleService } from '../services/api';
import { formatCurrency, todayInputDate, formatStockDisplay } from '../utils/format';
import ConfirmDialog from '../components/ConfirmDialog';
import { ShoppingCart, Trash2, Clock, BarChart3, Package, Check, AlertCircle } from 'lucide-react';

const NewSale = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [saleType, setSaleType] = useState('UNIT'); // 'UNIT' or 'PACK'
  const [form, setForm] = useState({
    productId: '', quantity: '', sellingPrice: '', date: todayInputDate(), note: '',
  });
  const [loading, setLoading] = useState(false);
  const [recentSales, setRecentSales] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    loadProducts();
    loadRecentSales();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await productService.getAll();
      setProducts(res.data.data || []);
    } catch {}
  };

  const loadRecentSales = async () => {
    try {
      // Only today's sales — section auto-resets each morning
      const today = todayInputDate(); // "YYYY-MM-DD"
      const res = await saleService.getAll({ limit: 50, startDate: today, endDate: today });
      setRecentSales(res.data.data?.sales || []);
    } catch {}
  };

  const handleDeleteSale = async () => {
    if (!deleteTarget) return;
    try {
      await saleService.delete(deleteTarget._id);
      toast.success('Vente supprimée avec succès et stock réapprovisionné.');
      setDeleteTarget(null);
      loadProducts();
      loadRecentSales();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleProductChange = (e) => {
    const id = e.target.value;
    const product = products.find((p) => p._id === id);
    setSelectedProduct(product || null);
    if (product) {
      const price = saleType === 'PACK'
        ? (product.packSellingPrice ? Math.round(product.packSellingPrice * 1000) : Math.round(product.sellingPrice * (product.itemsPerPack || 6) * 1000))
        : Math.round(product.sellingPrice * 1000);
      setForm((prev) => ({
        ...prev,
        productId: id,
        sellingPrice: price,
      }));
    } else {
      setForm((prev) => ({ ...prev, productId: id, sellingPrice: '' }));
    }
  };

  const handleSaleTypeChange = (type) => {
    setSaleType(type);
    if (selectedProduct) {
      const price = type === 'PACK'
        ? (selectedProduct.packSellingPrice ? Math.round(selectedProduct.packSellingPrice * 1000) : Math.round(selectedProduct.sellingPrice * (selectedProduct.itemsPerPack || 6) * 1000))
        : Math.round(selectedProduct.sellingPrice * 1000);
      setForm((prev) => ({ ...prev, sellingPrice: price }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const itemsPerPack = selectedProduct?.itemsPerPack || 6;
  const inputQty = Number(form.quantity) || 0;
  const unitsDeducted = saleType === 'PACK' ? inputQty * itemsPerPack : inputQty;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productId) { toast.error('Veuillez sélectionner un produit'); return; }
    if (!form.quantity || inputQty <= 0) { toast.error('La quantité doit être supérieure à 0'); return; }
    if (!form.sellingPrice || Number(form.sellingPrice) < 0) { toast.error('Le prix de vente est invalide'); return; }

    if (selectedProduct && unitsDeducted > selectedProduct.stockQuantity) {
      toast.error(`Stock insuffisant. Quantité disponible : ${selectedProduct.stockQuantity} unités (${(selectedProduct.stockQuantity / itemsPerPack).toFixed(1)} packs).`);
      return;
    }

    setLoading(true);
    try {
      const priceInDT = Number(form.sellingPrice) / 1000;
      // If sold as pack, equivalent per-unit price = packPrice / itemsPerPack
      const unitPriceDT = saleType === 'PACK' ? priceInDT / itemsPerPack : priceInDT;
      const saleNote = form.note || (saleType === 'PACK' ? `Vente en pack (${inputQty} pack(s) = ${unitsDeducted} unités)` : '');

      await saleService.create({
        productId: form.productId,
        quantity: unitsDeducted,
        sellingPrice: unitPriceDT,
        saleType,           // 'PACK' ou 'UNIT'
        numPacks: saleType === 'PACK' ? inputQty : undefined,
        date: form.date,
        note: saleNote,
      });
      toast.success(saleType === 'PACK' ? `Vente de ${inputQty} pack(s) enregistrée avec succès.` : 'Vente enregistrée avec succès.');
      setForm({ productId: '', quantity: '', sellingPrice: '', date: todayInputDate(), note: '' });
      setSelectedProduct(null);
      loadProducts();
      loadRecentSales();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const enteredPriceDT = (Number(form.sellingPrice) || 0) / 1000;
  const purchasePriceN = selectedProduct?.purchasePrice || 0; // purchasePrice = prix d'achat du PACK entier
  const totalSale = inputQty * enteredPriceDT;
  // purchasePrice = prix d'achat par PACK, donc:
  //   PACK mode: coût = nombre de packs × prix d'achat du pack
  //   UNIT mode: coût = nombre d'unités × (prix d'achat du pack / unités par pack)
  const totalCost = saleType === 'PACK'
    ? inputQty * purchasePriceN
    : inputQty * (purchasePriceN / itemsPerPack);
  const profit = totalSale - totalCost;
  const hasCalc = inputQty > 0 && enteredPriceDT > 0;

  // Calcul du Bilan d'Aujourd'hui uniquement (réinitialisé automatiquement chaque jour)
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySalesList = recentSales.filter((s) => {
    if (!s.date) return false;
    const saleDateStr = new Date(s.date).toISOString().split('T')[0];
    return saleDateStr === todayStr;
  });

  const todayTotalCA = todaySalesList.reduce((acc, s) => acc + (s.totalSale || 0), 0);
  const todayTotalProfit = todaySalesList.reduce((acc, s) => acc + (s.profit || 0), 0);
  const todaySalesCount = todaySalesList.length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
      {/* Form */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">🛒 Nouvelle Vente</span>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Sale Type Selector */}
            <div className="form-group">
              <label>Mode de vente</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className={`btn ${saleType === 'UNIT' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ flex: 1, padding: '10px' }}
                  onClick={() => handleSaleTypeChange('UNIT')}
                >
                  🥤 À l'unité (Détail)
                </button>
                <button
                  type="button"
                  className={`btn ${saleType === 'PACK' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ flex: 1, padding: '10px' }}
                  onClick={() => handleSaleTypeChange('PACK')}
                >
                  📦 En Pack complet
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Produit *</label>
              <select className="form-control" name="productId" value={form.productId} onChange={handleProductChange} required>
                <option value="">-- Sélectionner un produit --</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id} disabled={p.stockQuantity === 0}>
                    {p.name} (Stock: {formatStockDisplay(p.stockQuantity, p.itemsPerPack)}){p.stockQuantity === 0 ? ' - Rupture' : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div className={`alert ${selectedProduct.stockQuantity === 0 ? 'alert-danger' : selectedProduct.stockQuantity <= selectedProduct.minimumStock ? 'alert-warning' : 'alert-info'}`}
                style={{ marginBottom: 16 }}>
                <span>{selectedProduct.stockQuantity === 0 ? '❌' : selectedProduct.stockQuantity <= selectedProduct.minimumStock ? '⚠️' : '📦'}</span>
                <span>
                  <strong>{selectedProduct.name}</strong> ·
                  Stock actuel: <strong>{formatStockDisplay(selectedProduct.stockQuantity, itemsPerPack)}</strong> ·
                  Prix d'achat (pack): {formatCurrency(selectedProduct.purchasePrice)}
                </span>
              </div>
            )}

            <div className="form-grid-2">
              <div className="form-group">
                <label>{saleType === 'PACK' ? 'Nombre de packs *' : 'Quantité (unités) *'}</label>
                <input className="form-control" type="number" min="1"
                  name="quantity" value={form.quantity} onChange={handleChange} placeholder="0" required />
                {saleType === 'PACK' && inputQty > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginTop: 4 }}>
                    = {unitsDeducted} unités retirées du stock
                  </div>
                )}
                {selectedProduct && unitsDeducted > selectedProduct.stockQuantity && (
                  <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>
                    ⚠️ Stock insuffisant! Max: {selectedProduct.stockQuantity} unités
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>{saleType === 'PACK' ? 'Prix du pack complet (millimes) *' : 'Prix unitaire (millimes) *'}</label>
                <input className="form-control" type="number" step="1" min="0" name="sellingPrice"
                  value={form.sellingPrice} onChange={handleChange} placeholder="Ex: 5000" required />
                {form.sellingPrice && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>= {(Number(form.sellingPrice) / 1000).toFixed(3)} DT</div>}
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Date *</label>
                <input className="form-control" type="date" name="date" value={form.date} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Note</label>
                <input className="form-control" name="note" value={form.note} onChange={handleChange}
                  placeholder="Note optionnelle..." />
              </div>
            </div>

            {/* Summary */}
            {hasCalc && selectedProduct && (
              <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius)', padding: '16px', marginBottom: 16, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>
                  📊 Récapitulatif de la vente ({saleType === 'PACK' ? `${inputQty} pack(s) = ${unitsDeducted} un.` : `${inputQty} un.`})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div style={{ textAlign: 'center', background: 'var(--primary-light)', padding: '10px', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 500 }}>Chiffre d'affaires</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>{totalSale.toFixed(3)} DT</div>
                  </div>
                  <div style={{ textAlign: 'center', background: 'var(--danger-light)', padding: '10px', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 500 }}>Coût total</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--danger)' }}>{totalCost.toFixed(3)} DT</div>
                  </div>
                  <div style={{ textAlign: 'center', background: profit >= 0 ? 'var(--success-light)' : 'var(--danger-light)', padding: '10px', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: 11, color: profit >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 500 }}>Bénéfice</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {profit >= 0 ? '+' : ''}{profit.toFixed(3)} DT
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
                  Stock après vente: {selectedProduct.stockQuantity - unitsDeducted} unités
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={loading || (selectedProduct?.stockQuantity === 0)}
              style={{ padding: '12px' }}>
              <ShoppingCart size={18} />
              <span>{loading ? 'Enregistrement...' : 'Enregistrer la vente'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Bilan du jour + Ventes Récentes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Card Bilan d'Aujourd'hui */}
        <div className="card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', color: '#fff', border: 'none', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: 6 }}>
                <BarChart3 size={16} />
                Bilan d'Aujourd'hui ({new Date().toLocaleDateString('fr-TN')})
              </span>
              <span className="badge" style={{ fontSize: 11, background: 'rgba(99, 102, 241, 0.3)', color: '#c7d2fe', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
                {todaySalesCount} vente(s)
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Chiffre d'Affaires</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>
                  {formatCurrency(todayTotalCA)}
                </div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Bénéfice Net</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#4ade80', marginTop: 2 }}>
                  +{formatCurrency(todayTotalProfit)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="card" style={{ flex: 1 }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">
            <Clock size={18} className="text-primary" />
            Ventes d'Aujourd'hui
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
            {new Date().toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </span>
        </div>
        <div className="card-body" style={{ padding: 0, maxHeight: '550px', overflowY: 'auto' }}>
          {recentSales.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              <Clock size={36} className="empty-state-icon text-muted" />
              <div style={{ fontSize: 13, marginTop: 8 }}>Aucune vente aujourd'hui — les ventes passées sont dans l'Historique</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recentSales.map((s) => {
                const iPerPack = s.product?.itemsPerPack || 6;
                const isPack = s.note?.includes('pack') || (s.quantity >= iPerPack && s.quantity % iPerPack === 0);
                const packsCount = (s.quantity / iPerPack).toFixed(1).replace('.0', '');
                return (
                  <div key={s._id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{s.product?.name}</span>
                        <span className="badge badge-primary">
                          {isPack ? `×${packsCount} packs (${s.quantity} un.)` : `×${s.quantity} un.`}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
                        <span>CA: {formatCurrency(s.totalSale)}</span>
                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>+{formatCurrency(s.profit)}</span>
                        <span>{new Date(s.date).toLocaleDateString('fr-TN')}</span>
                      </div>
                    </div>
                  <button
                    className="btn btn-danger btn-sm btn-icon"
                    title="Supprimer la vente"
                    style={{ marginLeft: 8 }}
                    onClick={() => setDeleteTarget(s)}
                  >
                    <Trash2 size={15} />
                  </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Supprimer la vente"
        message={`Êtes-vous sûr de vouloir supprimer cette vente pour "${deleteTarget?.product?.name}" ? Le stock (${deleteTarget?.quantity} unité(s)) sera automatiquement restitué.`}
        onConfirm={handleDeleteSale}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default NewSale;
