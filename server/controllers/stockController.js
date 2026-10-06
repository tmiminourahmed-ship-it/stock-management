const mongoose = require('mongoose');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const { isValidObjectId, successResponse, errorResponse } = require('../utils/helpers');

// @desc    Record a stock entry
// @route   POST /api/stock/entry
// @access  Public
const createStockEntry = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId, quantity, unitPrice, supplier, date, note } = req.body;

    if (!productId || !quantity || !unitPrice) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 'Produit, quantité et prix unitaire sont requis', 400);
    }

    if (!isValidObjectId(productId)) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 'Identifiant de produit invalide', 400);
    }

    if (quantity <= 0) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 'La quantité doit être supérieure à 0', 400);
    }

    if (unitPrice < 0) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 'Le prix unitaire ne peut pas être négatif', 400);
    }

    const product = await Product.findById(productId).session(session);
    if (!product) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 'Produit non trouvé', 404);
    }

    // Update product stock quantity
    product.stockQuantity += quantity;
    if (supplier) product.supplier = supplier;
    await product.save({ session });

    // Create stock movement
    const totalAmount = quantity * unitPrice;
    const movement = await StockMovement.create(
      [
        {
          product: productId,
          type: 'ENTRY',
          quantity,
          unitPrice,
          totalAmount,
          profit: 0,
          date: date ? new Date(date) : new Date(),
          note: note || '',
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    const populatedMovement = await StockMovement.findById(movement[0]._id).populate('product', 'name category');

    return successResponse(res, { movement: populatedMovement, updatedProduct: product }, 'Entrée de stock enregistrée avec succès', 201);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Get all stock movements
// @route   GET /api/stock/movements
// @access  Public
const getMovements = async (req, res, next) => {
  try {
    const { startDate, endDate, productId, type, page = 1, limit = 50 } = req.query;
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

    if (productId && isValidObjectId(productId)) {
      filter.product = productId;
    }

    if (type && ['ENTRY', 'SALE'].includes(type)) {
      filter.type = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await StockMovement.countDocuments(filter);
    const movements = await StockMovement.find(filter)
      .populate('product', 'name category itemsPerPack')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return successResponse(res, {
      movements,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    }, 'Mouvements récupérés avec succès');
  } catch (error) {
    next(error);
  }
};

// @desc    Get single stock movement
// @route   GET /api/stock/movements/:id
// @access  Public
const getMovement = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return errorResponse(res, 'Identifiant invalide', 400);
    }

    const movement = await StockMovement.findById(id).populate('product', 'name category itemsPerPack');
    if (!movement) {
      return errorResponse(res, 'Mouvement non trouvé', 404);
    }

    return successResponse(res, movement, 'Mouvement récupéré avec succès');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a stock entry and adjust product stock
// @route   DELETE /api/stock/movements/:id
// @access  Public
const deleteStockEntry = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 'Identifiant invalide', 400);
    }

    const movement = await StockMovement.findById(id).session(session);
    if (!movement) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 'Entrée non trouvée', 404);
    }

    if (movement.type !== 'ENTRY') {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 'Seules les entrées de stock peuvent être supprimées', 400);
    }

    // Revert product stock
    const product = await Product.findById(movement.product).session(session);
    if (product) {
      product.stockQuantity = Math.max(0, product.stockQuantity - movement.quantity);
      await product.save({ session });
    }

    // Delete movement
    await StockMovement.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    session.endSession();

    return successResponse(res, null, 'Entrée de stock supprimée avec succès et stock réajusté.');
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

module.exports = { createStockEntry, getMovements, getMovement, deleteStockEntry };
