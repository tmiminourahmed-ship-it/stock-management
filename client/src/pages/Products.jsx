import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { productService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatCurrency, formatStockDisplay } from '../utils/format';
import { Plus, Search, Edit2, Trash2, X, Package, Boxes, Check, AlertTriangle } from 'lucide-react';

const INITIAL_FORM = {
  name: '', category: '', description: '',
  purchasePrice: '', sellingPrice: '', stockQuantity: '',
  minimumStock: '5', supplier: '',
  itemsPerPack: '6', packSellingPrice: '',
  stockInputType: 'PACK', // 'PACK' ou 'UNIT'
};

const ProductModal = ({ isOpen, product, onClose, onSaved }) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (isOpen) {
      if (product) {
        const itemsPerPack = product.itemsPerPack || 6;
        setForm({
          name: product.name || '',
          category: product.category || '',
          description: product.description || '',
          purchasePrice: product.purchasePrice != null ? Math.round(product.purchasePrice * 1000) : '',
          sellingPrice: product.sellingPrice != null ? Math.round(product.sellingPrice * 1000) : '',
          stockQuantity: product.stockQuantity != null ? (product.stockQuantity / itemsPerPack) : '',
          minimumStock: product.minimumStock ?? '5',
          supplier: product.supplier || '',
          itemsPerPack: itemsPerPack,
          packSellingPrice: product.packSellingPrice != null ? Math.round(product.packSellingPrice * 1000) : '',
          stockInputType: 'PACK',
        });
      } else {
        setForm(INITIAL_FORM);
      }
    }
  }, [isOpen, product]);

  useEffect(() => {
    productService.getCategories().then((res) => setCategories(res.data.data || [])).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const itemsPerPack = Number(form.itemsPerPack) || 6;
  const rawStockInput = Number(form.stockQuantity) || 0;
  const calculatedUnits = form.stockInputType === 'PACK' ? rawStockInput * itemsPerPack : rawStockInput;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category.trim()) {
      toast.error('Nom et catégorie sont requis');
      return;
    }
    if (Number(form.purchasePrice) < 0 || Number(form.sellingPrice) < 0) {
      toast.error('Les prix ne peuvent pas être négatifs');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        category: form.category,
        description: form.description,
        purchasePrice: Number(form.purchasePrice) / 1000,
        sellingPrice: Number(form.sellingPrice) / 1000,
        stockQuantity: calculatedUnits,
        minimumStock: Number(form.minimumStock) || 5,
        supplier: form.supplier,
        itemsPerPack: itemsPerPack,
        packSellingPrice: form.packSellingPrice ? Number(form.packSellingPrice) / 1000 : 0,
      };
      if (product) {
        await productService.update(product._id, payload);
        toast.success('Produit mis à jour avec succès.');
      } else {
        await productService.create(payload);
        toast.success('Produit ajouté avec succès.');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{product ? '✏️ Modifier le produit' : '➕ Ajouter un produit'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid-2">
              <div className="form-group">
                <label>Nom du produit *</label>
                <input className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="Ex: Eau Safia 1.5L" required />
              </div>
              <div className="form-group">
                <label>Catégorie *</label>
                <input className="form-control" name="category" value={form.category} onChange={handleChange}
                  list="categories-list" placeholder="Ex: Boissons" required />
                <datalist id="categories-list">
                  {categories.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" name="description" value={form.description} onChange={handleChange}
                placeholder="Description optionnelle..." rows={2} />
            </div>

            {/* Configuration du Pack */}
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', marginBottom: 8 }}>
                📦 Configuration du Pack (Stika)
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Nombre de bouteilles / boissons par pack *</label>
                <input className="form-control" type="number" min="1" name="itemsPerPack"
                  value={form.itemsPerPack} onChange={handleChange} placeholder="6 par défaut" required />
              </div>
            </div>

            {/* Tarification Block */}
            <div style={{ background: '#f0f9ff', padding: 14, borderRadius: 'var(--radius)', border: '1px solid #bae6fd', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0369a1', marginBottom: 10 }}>
                💰 Tarification (Prix en Millimes - ex: 3200 = 3.200 DT)
              </div>
              <div className="form-grid-3">
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, color: '#0369a1' }}>🛒 Prix d'Achat PACK *</label>
                  <input className="form-control" type="number" step="1" min="0" name="purchasePrice"
                    value={form.purchasePrice} onChange={handleChange} placeholder="Ex: 3200" required />
                  {form.purchasePrice ? (
                    <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginTop: 2 }}>
                      = {(Number(form.purchasePrice) / 1000).toFixed(3)} DT / pack
                    </div>
                  ) : <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Prix payé au fournisseur</div>}
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, color: '#0369a1' }}>📦 Prix Vente PACK *</label>
                  <input className="form-control" type="number" step="1" min="0" name="packSellingPrice"
                    value={form.packSellingPrice} onChange={handleChange} placeholder="Ex: 4000" />
                  {form.packSellingPrice ? (
                    <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600, marginTop: 2 }}>
                      = {(Number(form.packSellingPrice) / 1000).toFixed(3)} DT / pack
                    </div>
                  ) : <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Prix de vente d'un pack</div>}
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, color: '#0369a1' }}>🥤 Prix Vente DÉTAIL *</label>
                  <input className="form-control" type="number" step="1" min="0" name="sellingPrice"
                    value={form.sellingPrice} onChange={handleChange} placeholder="Ex: 1000" required />
                  {form.sellingPrice ? (
                    <div style={{ fontSize: 11, color: '#0284c7', fontWeight: 600, marginTop: 2 }}>
                      = {(Number(form.sellingPrice) / 1000).toFixed(3)} DT / bouteille
                    </div>
                  ) : <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Prix d'une seule unité</div>}
                </div>
              </div>
            </div>

            <div className="form-grid-3" style={{ marginTop: 16 }}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ margin: 0 }}>Stock initial *</label>
                  <div style={{ fontSize: 11 }}>
                    <button type="button" className={`btn btn-sm ${form.stockInputType === 'PACK' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setForm(p => ({ ...p, stockInputType: 'PACK' }))} style={{ padding: '2px 6px', fontSize: 11 }}>Packs</button>
                    <button type="button" className={`btn btn-sm ${form.stockInputType === 'UNIT' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setForm(p => ({ ...p, stockInputType: 'UNIT' }))} style={{ padding: '2px 6px', fontSize: 11, marginLeft: 4 }}>Unités</button>
                  </div>
                </div>
                <input className="form-control" type="number" min="0" name="stockQuantity"
                  value={form.stockQuantity} onChange={handleChange} placeholder={form.stockInputType === 'PACK' ? 'Ex: 52 (packs)' : 'Ex: 312 (unités)'} />
                {rawStockInput > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginTop: 4 }}>
                    {form.stockInputType === 'PACK'
                      ? `= ${calculatedUnits} unités au total (${rawStockInput} packs × ${itemsPerPack})`
                      : `= ${(rawStockInput / itemsPerPack).toFixed(1)} packs (${rawStockInput} unités)`}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Stock minimum (unités)</label>
                <input className="form-control" type="number" min="0" name="minimumStock"
                  value={form.minimumStock} onChange={handleChange} placeholder="5" />
              </div>
              <div className="form-group">
                <label>Fournisseur</label>
                <input className="form-control" name="supplier" value={form.supplier} onChange={handleChange}
                  placeholder="Nom du fournisseur" />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳ Enregistrement...' : product ? '💾 Mettre à jour' : '➕ Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterCategory) params.category = filterCategory;
      const res = await productService.getAll(params);
      setProducts(res.data.data || []);
    } catch (err) {
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  }, [search, filterCategory]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  useEffect(() => {
    productService.getCategories().then((res) => setCategories(res.data.data || [])).catch(() => {});
  }, []);

  const handleDelete = async () => {
    try {
      await productService.delete(deleteTarget._id);
      toast.success('Produit supprimé avec succès.');
      setDeleteTarget(null);
      loadProducts();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">Produits & Catalogue</div>
          <div className="page-header-subtitle">{products.length} produit(s) dans le catalogue</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditProduct(null); setModalOpen(true); }}>
          <Plus size={18} />
          <span>Ajouter un produit</span>
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="filters-bar">
            <div className="search-input-wrapper">
              <span className="search-icon"><Search size={16} /></span>
              <input className="form-control" placeholder="Rechercher un produit..."
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="form-control" style={{ width: 180 }} value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">Toutes les catégories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {(search || filterCategory) && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterCategory(''); }}>
                <X size={14} /> Réinitialiser
              </button>
            )}
          </div>

          {loading ? (
            <LoadingSpinner message="Chargement des produits..." />
          ) : products.length === 0 ? (
            <EmptyState icon={<Package size={48} className="text-muted" />} title="Aucun produit trouvé"
              message="Ajoutez votre premier produit pour commencer."
              action={
                <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
                  <Plus size={16} /> Ajouter un produit
                </button>
              } />
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Catégorie</th>
                    <th>Prix d'Achat (Pack)</th>
                    <th>Prix Vente Pack</th>
                    <th>Prix Vente Détail</th>
                    <th>Stock actuel</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const itemsPerPack = p.itemsPerPack || 6;
                    const stockText = formatStockDisplay(p.stockQuantity, itemsPerPack);
                    const isLow = p.stockQuantity <= p.minimumStock;
                    const isOut = p.stockQuantity === 0;
                    return (
                      <tr key={p._id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pack de {itemsPerPack} un. {p.supplier ? `· ${p.supplier}` : ''}</div>
                        </td>
                        <td><span className="badge badge-gray">{p.category}</span></td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {formatCurrency(p.purchasePrice)}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                          {p.packSellingPrice ? formatCurrency(p.packSellingPrice) : '-'}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                          {formatCurrency(p.sellingPrice)}
                        </td>
                        <td>
                          <span className={`badge ${isOut ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: 13, padding: '6px 10px' }}>
                            {stockText}
                          </span>
                        </td>
                        <td>
                          {isOut ? (
                            <span className="badge badge-danger">Rupture</span>
                          ) : isLow ? (
                            <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <AlertTriangle size={12} /> Faible
                            </span>
                          ) : (
                            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Check size={12} /> OK
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-outline btn-sm btn-icon" title="Modifier"
                              onClick={() => { setEditProduct(p); setModalOpen(true); }}>
                              <Edit2 size={15} />
                            </button>
                            <button className="btn btn-danger btn-sm btn-icon" title="Supprimer"
                              onClick={() => setDeleteTarget(p)}>
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ProductModal
        isOpen={modalOpen}
        product={editProduct}
        onClose={() => { setModalOpen(false); setEditProduct(null); }}
        onSaved={loadProducts}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Supprimer le produit"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteTarget?.name}" ? Cette action est irréversible.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default Products;
