const express = require('express');
const router = express.Router();
const { createSale, getSales, getSale, deleteSale } = require('../controllers/saleController');

router.post('/', createSale);
router.get('/', getSales);
router.get('/:id', getSale);
router.delete('/:id', deleteSale);

module.exports = router;
