const Product = require('../models/Product');
const Sale = require('../models/Sale');
const StockMovement = require('../models/StockMovement');
const {
  successResponse,
  errorResponse,
  startOfDay,
  endOfDay,
  startOfMonth,
  startOfWeek,
} = require('../utils/helpers');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Public
const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const monthStart = startOfMonth(today);

    // Products stats
    const totalProducts = await Product.countDocuments();
    const totalStockQuantity = await Product.aggregate([
      { $group: { _id: null, total: { $sum: '$stockQuantity' } } },
    ]);
    const lowStockProducts = await Product.countDocuments({
      $expr: { $lte: ['$stockQuantity', '$minimumStock'] },
    });

    // Today's sales
    const todaySalesResult = await Sale.aggregate([
      { $match: { date: { $gte: todayStart, $lte: todayEnd } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          revenue: { $sum: '$totalSale' },
          cost: { $sum: '$totalCost' },
          profit: { $sum: '$profit' },
        },
      },
    ]);

    // Monthly sales
    const monthlySalesResult = await Sale.aggregate([
      { $match: { date: { $gte: monthStart, $lte: todayEnd } } },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalSale' },
          cost: { $sum: '$totalCost' },
          profit: { $sum: '$profit' },
        },
      },
    ]);

    const todayStats = todaySalesResult[0] || { count: 0, revenue: 0, cost: 0, profit: 0 };
    const monthStats = monthlySalesResult[0] || { revenue: 0, cost: 0, profit: 0 };

    return successResponse(res, {
      totalProducts,
      totalStockQuantity: totalStockQuantity[0]?.total || 0,
      lowStockProducts,
      today: {
        salesCount: todayStats.count,
        revenue: todayStats.revenue,
        cost: todayStats.cost,
        profit: todayStats.profit,
      },
      monthly: {
        revenue: monthStats.revenue,
        cost: monthStats.cost,
        profit: monthStats.profit,
      },
    }, 'Statistiques du tableau de bord');
  } catch (error) {
    next(error);
  }
};

// @desc    Get sales chart data (last 30 days)
// @route   GET /api/dashboard/sales-chart
// @access  Public
const getSalesChart = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const daysInt = Math.min(parseInt(days) || 30, 365);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysInt);
    startDate.setHours(0, 0, 0, 0);

    const salesData = await Sale.aggregate([
      { $match: { date: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' },
          },
          revenue: { $sum: '$totalSale' },
          cost: { $sum: '$totalCost' },
          profit: { $sum: '$profit' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    const chartData = salesData.map((item) => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      revenue: item.revenue,
      cost: item.cost,
      profit: item.profit,
      count: item.count,
    }));

    return successResponse(res, chartData, 'Données du graphique des ventes');
  } catch (error) {
    next(error);
  }
};

// @desc    Get profit chart data
// @route   GET /api/dashboard/profit-chart
// @access  Public
const getProfitChart = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const daysInt = Math.min(parseInt(days) || 30, 365);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysInt);
    startDate.setHours(0, 0, 0, 0);

    const profitData = await Sale.aggregate([
      { $match: { date: { $gte: startDate } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' }, day: { $dayOfMonth: '$date' } },
          profit: { $sum: '$profit' },
          revenue: { $sum: '$totalSale' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    const chartData = profitData.map((item) => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      profit: item.profit,
      revenue: item.revenue,
    }));

    return successResponse(res, chartData, 'Données du graphique de bénéfices');
  } catch (error) {
    next(error);
  }
};

// @desc    Get stock by category
// @route   GET /api/dashboard/stock-by-category
// @access  Public
const getStockByCategory = async (req, res, next) => {
  try {
    const data = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          totalStock: { $sum: '$stockQuantity' },
          productCount: { $sum: 1 },
        },
      },
      { $sort: { totalStock: -1 } },
    ]);

    const chartData = data.map((item) => ({
      category: item._id,
      totalStock: item.totalStock,
      productCount: item.productCount,
    }));

    return successResponse(res, chartData, 'Stock par catégorie');
  } catch (error) {
    next(error);
  }
};

// @desc    Get top selling products
// @route   GET /api/dashboard/top-products
// @access  Public
const getTopProducts = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;
    const data = await Sale.aggregate([
      {
        $group: {
          _id: '$product',
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: '$totalSale' },
          totalProfit: { $sum: '$profit' },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          category: '$product.category',
          totalQuantity: 1,
          totalRevenue: 1,
          totalProfit: 1,
        },
      },
    ]);

    return successResponse(res, data, 'Produits les plus vendus');
  } catch (error) {
    next(error);
  }
};

// @desc    Get low stock products
// @route   GET /api/dashboard/low-stock
// @access  Public
const getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$stockQuantity', '$minimumStock'] },
    }).sort({ stockQuantity: 1 });

    return successResponse(res, products, 'Produits à stock faible');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getSalesChart,
  getProfitChart,
  getStockByCategory,
  getTopProducts,
  getLowStockProducts,
};
