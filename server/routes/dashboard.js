const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getSalesChart,
  getProfitChart,
  getStockByCategory,
  getTopProducts,
  getLowStockProducts,
} = require('../controllers/dashboardController');

router.get('/stats', getDashboardStats);
router.get('/sales-chart', getSalesChart);
router.get('/profit-chart', getProfitChart);
router.get('/stock-by-category', getStockByCategory);
router.get('/top-products', getTopProducts);
router.get('/low-stock', getLowStockProducts);

module.exports = router;
