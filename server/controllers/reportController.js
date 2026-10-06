const Sale = require('../models/Sale');
const { successResponse, startOfDay, endOfDay, startOfWeek, startOfMonth } = require('../utils/helpers');

// @desc    Get profit report
// @route   GET /api/reports/profit
// @access  Public
const getProfitReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const today = new Date();

    // Build date filter
    const buildFilter = (start, end) => ({ date: { $gte: start, $lte: end } });

    // Today
    const todayFilter = buildFilter(startOfDay(today), endOfDay(today));
    // This week
    const weekFilter = buildFilter(startOfWeek(today), endOfDay(today));
    // This month
    const monthFilter = buildFilter(startOfMonth(today), endOfDay(today));

    const aggregateSales = async (filter) => {
      const result = await Sale.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$totalSale' },
            cost: { $sum: '$totalCost' },
            profit: { $sum: '$profit' },
            count: { $sum: 1 },
          },
        },
      ]);
      return result[0] || { revenue: 0, cost: 0, profit: 0, count: 0 };
    };

    const [todayStats, weekStats, monthStats] = await Promise.all([
      aggregateSales(todayFilter),
      aggregateSales(weekFilter),
      aggregateSales(monthFilter),
    ]);

    // Custom range
    let customStats = null;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      customStats = await aggregateSales({ date: { $gte: start, $lte: end } });
    }

    // Daily breakdown — last 30 days
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const dailyBreakdown = await Sale.aggregate([
      { $match: { date: { $gte: thirtyDaysAgo, $lte: endOfDay(today) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          revenue: { $sum: '$totalSale' },
          cost: { $sum: '$totalCost' },
          profit: { $sum: '$profit' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    return successResponse(res, {
      today: todayStats,
      week: weekStats,
      month: monthStats,
      custom: customStats,
      dailyBreakdown,
    }, 'Rapport de bénéfices');
  } catch (error) {
    next(error);
  }
};

// @desc    Get sales report
// @route   GET /api/reports/sales
// @access  Public
const getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    let groupId;
    if (groupBy === 'month') {
      groupId = { year: { $year: '$date' }, month: { $month: '$date' } };
    } else if (groupBy === 'week') {
      groupId = { year: { $year: '$date' }, week: { $week: '$date' } };
    } else {
      groupId = { year: { $year: '$date' }, month: { $month: '$date' }, day: { $dayOfMonth: '$date' } };
    }

    const salesData = await Sale.aggregate([
      { $match: filter },
      {
        $group: {
          _id: groupId,
          revenue: { $sum: '$totalSale' },
          cost: { $sum: '$totalCost' },
          profit: { $sum: '$profit' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    return successResponse(res, salesData, 'Rapport des ventes');
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfitReport, getSalesReport };
