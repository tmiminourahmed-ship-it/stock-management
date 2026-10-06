import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { productService, stockService } from '../services/api';
import { formatCurrency, todayInputDate, formatStockDisplay } from '../utils/format';
import ConfirmDialog from '../components/ConfirmDialog';
import { ArrowDownLeft, Trash2, Clock, Package, Plus } from 'lucide-react';

const StockEntry = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [entryMode, setEntryMode] = useState('PACK'); // 'PACK' ou 'UNIT'
  const [form, setForm] = useState({
    productId: '', quantity: '', unitPrice: '', supplier: '', date: todayInputDate(), note: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [recentEntries, setRecentEntries] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    loadProducts();
    loadRecentEntries();
  }, []);

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await productService.getAll();
      setProducts(res.data.data || []);
    } catch {} finally {
      setLoadingProducts(false);
    }
  };

  const loadRecentEntries = async () => {
    try {
      const res = await stockService.getMovements({ type: 'ENTRY', limit: 50 });
      setRecentEntries(res.data.data?.movements || []);
    } catch {}
  };

  const handleDeleteEntry = async () => {
    if (!deleteTarget) return;
    try {
      await stockService.deleteMovement(deleteTarget._id);
      toast.success('Entrée de stock supprimée avec succès et stock réajusté.');
      setDeleteTarget(null);
      loadProducts();
      loadRecentEntries();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleProductChange = (e) => {
    const id = e.target.value;
    const product = products.find((p) => p._id === id);
    setSelectedProduct(product || null);
    setForm((prev) => ({
      ...prev,
      productId: id,
      unitPrice: product ? Math.round(product.purchasePrice * 1000) : '',
      supplier: product?.supplier || '',
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const itemsPerPack = selectedProduct?.itemsPerPack || 6;
  const inputQty = Number(form.quantity) || 0;
  // En mode PACK: on convertit les packs en unités individuelles pour le stockage
  const unitsToAdd = entryMode === 'PACK' ? inputQty * itemsPerPack : inputQty;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productId) { toast.error('Veuillez sélectionner un produit'); return; }
    if (!form.quantity || inputQty <= 0) { toast.error('La quantité doit être supérieure à 0'); return; }
    if (!form.unitPrice || Number(form.unitPrice) < 0) { toast.error("Le prix d'achat est invalide"); return; }

    setLoading(true);
    try {
      const priceInDT = Number(form.unitPrice) / 1000;
      const entryNote = form.note || (entryMode === 'PACK' ? `Entrée en packs (${inputQty} pack(s) = ${unitsToAdd} unités)` : '');

      await stockService.createEntry({
        productId: form.productId,
        quantity: unitsToAdd, // Toujours envoyer en UNITÉS au backend
        unitPrice: entryMode === 'PACK' ? priceInDT / itemsPerPack : priceInDT, // prix par unité
        supplier: form.supplier,
        date: form.date,
        note: entryNote,
      });
      toast.success(entryMode === 'PACK'
        ? `Entrée de ${inputQty} pack(s) (${unitsToAdd} unités) enregistrée avec succès.`
        : 'Entrée de stock enregistrée avec succès.');
      setForm({ productId: '', quantity: '', unitPrice: '', supplier: '', date: todayInputDate(), note: '' });
      setSelectedProduct(null);
      loadProducts();
      loadRecentEntries();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const priceInDT = (Number(form.unitPrice) || 0) / 1000;
  const totalAmount = inputQty > 0 && priceInDT > 0
    ? (inputQty * priceInDT).toFixed(3)
    : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
      {/* Form */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">📥 Nouvelle Entrée de Stock</span>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Entry Mode Selector */}
            <div className="form-group">
              <label>Mode d'entrée</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className={`btn ${entryMode === 'PACK' ? 'btn-success' : 'btn-outline'}`}
                  style={{ flex: 1, padding: '10px' }}
                  onClick={() => setEntryMode('PACK')}
                >
                  📦 En Packs
                </button>
                <button
                  type="button"
                  className={`btn ${entryMode === 'UNIT' ? 'btn-success' : 'btn-outline'}`}
                  style={{ flex: 1, padding: '10px' }}
                  onClick={() => setEntryMode('UNIT')}
                >
                  🥤 En Unités
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Produit *</label>
              <select className="form-control" name="productId" value={form.productId} onChange={handleProductChange} required>
                <option value="">-- Sélectionner un produit --</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} (Stock: {formatStockDisplay(p.stockQuantity, p.itemsPerPack)})
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div className="alert alert-info" style={{ marginBottom: 16 }}>
                <span>📦</span>
                <span>
                  <strong>{selectedProduct.name}</strong> · Stock actuel: <strong>{formatStockDisplay(selectedProduct.stockQuantity, itemsPerPack)}</strong> ·
                  Prix d'achat (pack): <strong>{formatCurrency(selectedProduct.purchasePrice)}</strong>
                </span>
              </div>
            )}

            <div className="form-grid-2">
              <div className="form-group">
                <label>{entryMode === 'PACK' ? 'Nombre de packs *' : 'Quantité (unités) *'}</label>
                <input className="form-control" type="number" min="1" name="quantity"
                  value={form.quantity} onChange={handleChange} placeholder="0" required />
                {entryMode === 'PACK' && inputQty > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600, marginTop: 4 }}>
                    = {unitsToAdd} unités ajoutées au stock
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>{entryMode === 'PACK' ? "Prix d'achat du pack (millimes) *" : "Prix d'achat unitaire (millimes) *"}</label>
                <input className="form-control" type="number" step="1" min="0" name="unitPrice"
                  value={form.unitPrice} onChange={handleChange} placeholder="Ex: 3200" required />
                {form.unitPrice && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>= {priceInDT.toFixed(3)} DT</div>}
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Fournisseur</label>
                <input className="form-control" name="supplier" value={form.supplier} onChange={handleChange}
                  placeholder="Nom du fournisseur" />
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input className="form-control" type="date" name="date" value={form.date} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label>Note</label>
              <textarea className="form-control" name="note" value={form.note} onChange={handleChange}
                placeholder="Note optionnelle..." rows={3} />
            </div>

            {totalAmount && (
              <div style={{ background: 'var(--primary-light)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
                  💰 Montant total: <strong>{totalAmount} DT</strong>
                  {entryMode === 'PACK' && <span> ({inputQty} pack(s) × {priceInDT.toFixed(3)} DT)</span>}
                </div>
                {selectedProduct && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Stock après entrée: {selectedProduct.stockQuantity + unitsToAdd} unités ({((selectedProduct.stockQuantity + unitsToAdd) / itemsPerPack).toFixed(1)} packs)
                  </div>
                )}
              </div>
            )}

            <button type="submit" className="btn btn-success w-full" disabled={loading} style={{ padding: '12px' }}>
              <ArrowDownLeft size={18} />
              <span>{loading ? 'Enregistrement...' : 'Enregistrer l\'entrée'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <Clock size={18} className="text-primary" />
            Entrées Récentes
          </span>
        </div>
        <div className="card-body" style={{ padding: 0, maxHeight: '550px', overflowY: 'auto' }}>
          {recentEntries.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              <Clock size={36} className="empty-state-icon text-muted" />
              <div style={{ fontSize: 13, marginTop: 8 }}>Aucune entrée récente</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recentEntries.map((m) => {
                const iPerPack = m.product?.itemsPerPack || 6;
                const packsCount = (m.quantity / iPerPack).toFixed(1).replace('.0', '');
                return (
                  <div key={m._id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{m.product?.name}</span>
                        <span className="badge badge-success">+{packsCount} packs ({m.quantity} un.)</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
                        <span>Total: {formatCurrency(m.totalAmount)}</span>
                        <span>{new Date(m.date).toLocaleDateString('fr-TN')}</span>
                      </div>
                    </div>
                    <button
                      className="btn btn-danger btn-sm btn-icon"
                      title="Supprimer l'entrée"
                      style={{ marginLeft: 8 }}
                      onClick={() => setDeleteTarget(m)}
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

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Supprimer l'entrée de stock"
        message={`Êtes-vous sûr de vouloir supprimer cette entrée de stock pour "${deleteTarget?.product?.name}" ? Le stock de la quantité entrée (${deleteTarget?.quantity} unités / ${(deleteTarget?.quantity / (deleteTarget?.product?.itemsPerPack || 6)).toFixed(1)} packs) sera automatiquement retiré.`}
        onConfirm={handleDeleteEntry}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default StockEntry;
