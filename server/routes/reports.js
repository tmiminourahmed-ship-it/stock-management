const express = require('express');
const router = express.Router();
const { getProfitReport, getSalesReport } = require('../controllers/reportController');

router.get('/profit', getProfitReport);
router.get('/sales', getSalesReport);

module.exports = router;
