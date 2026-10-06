// Format number as TND currency
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '0.000 DT';
  return `${Number(amount).toFixed(3)} DT`;
};

// Format date for display
export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-TN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Format datetime
export const formatDateTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('fr-TN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format date for input[type="date"]
export const toInputDate = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

// Today date for input default
export const todayInputDate = () => new Date().toISOString().split('T')[0];

// Truncate text
export const truncate = (str, max = 30) => {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
};

// Get movement type label
export const getMovementTypeLabel = (type) => {
  const labels = { ENTRY: 'Entrée', SALE: 'Vente' };
  return labels[type] || type;
};

// Format stock display without decimals (ex: "16 packs + 4 un. (100 un.)" or "5 packs (30 un.)")
export const formatStockDisplay = (stockQuantity, itemsPerPack = 6) => {
  const qty = Math.max(0, Number(stockQuantity) || 0);
  const items = Number(itemsPerPack) || 6;
  const fullPacks = Math.floor(qty / items);
  const remainderUnits = qty % items;

  if (remainderUnits === 0) {
    return `${fullPacks} pack(s) (${qty} un.)`;
  }
  if (fullPacks === 0) {
    return `${remainderUnits} un.`;
  }
  return `${fullPacks} pack(s) + ${remainderUnits} un. (${qty} un.)`;
};

// Format movement display without decimals (ex: "-15 packs (90 un.)" or "-1 pack + 2 un. (8 un.)")
export const formatPackMovement = (quantity, itemsPerPack = 6, sign = '') => {
  const qty = Math.abs(Number(quantity) || 0);
  const items = Number(itemsPerPack) || 6;
  const fullPacks = Math.floor(qty / items);
  const remainderUnits = qty % items;

  if (remainderUnits === 0) {
    return `${sign}${fullPacks} pack(s) (${qty} un.)`;
  }
  if (fullPacks === 0) {
    return `${sign}${qty} un.`;
  }
  return `${sign}${fullPacks} pack(s) + ${remainderUnits} un. (${qty} un.)`;
};
