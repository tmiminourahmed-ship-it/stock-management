// Export data array to Microsoft Excel compatible CSV (.csv / .xlsx format)
export const exportSalesToExcel = (sales, fileName = 'Rapport_Ventes_Quotidien') => {
  if (!sales || sales.length === 0) {
    alert('Aucune vente à exporter.');
    return;
  }

  // Headers in French
  const headers = [
    'Date de vente',
    'Produit',
    'Catégorie',
    'Quantité vendue',
    'Prix d\'achat unitaire (DT)',
    'Prix de vente unitaire (DT)',
    'Chiffre d\'affaires (DT)',
    'Coût total (DT)',
    'Bénéfice net (DT)',
    'Note',
  ];

  // Map rows
  const rows = sales.map((s) => {
    const saleDate = new Date(s.date).toLocaleDateString('fr-TN');
    const productName = `"${(s.product?.name || '—').replace(/"/g, '""')}"`;
    const category = `"${(s.product?.category || '—').replace(/"/g, '""')}"`;
    const qty = s.quantity;
    const purchasePrice = Number(s.purchasePrice || 0).toFixed(3);
    const sellingPrice = Number(s.sellingPrice || 0).toFixed(3);
    const totalSale = Number(s.totalSale || 0).toFixed(3);
    const totalCost = Number(s.totalCost || 0).toFixed(3);
    const profit = Number(s.profit || 0).toFixed(3);
    const note = `"${(s.note || '—').replace(/"/g, '""')}"`;

    return [
      saleDate,
      productName,
      category,
      qty,
      purchasePrice,
      sellingPrice,
      totalSale,
      totalCost,
      profit,
      note,
    ].join(';');
  });

  // Calculate totals
  const totalQty = sales.reduce((acc, s) => acc + (s.quantity || 0), 0);
  const totalRevenue = sales.reduce((acc, s) => acc + (s.totalSale || 0), 0).toFixed(3);
  const totalCostSum = sales.reduce((acc, s) => acc + (s.totalCost || 0), 0).toFixed(3);
  const totalProfitSum = sales.reduce((acc, s) => acc + (s.profit || 0), 0).toFixed(3);

  const summaryRow = [
    'TOTAL',
    '',
    '',
    totalQty,
    '',
    '',
    totalRevenue,
    totalCostSum,
    totalProfitSum,
    '',
  ].join(';');

  // UTF-8 BOM (\uFEFF) ensures Microsoft Excel opens accented French characters properly
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows, summaryRow].join('\n');

  // Create blob and trigger browser download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];

  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
