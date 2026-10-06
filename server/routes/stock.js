const express = require('express');
const router = express.Router();
const { createStockEntry, getMovements, getMovement, deleteStockEntry } = require('../controllers/stockController');

router.post('/entry', createStockEntry);
router.get('/movements', getMovements);
router.get('/movements/:id', getMovement);
router.delete('/movements/:id', deleteStockEntry);

module.exports = router;
