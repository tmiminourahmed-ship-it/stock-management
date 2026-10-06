const mongoose = require('mongoose');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const StockMovement = require('../models/StockMovement');
const { isValidObjectId, successResponse, errorResponse } = require('../utils/helpers');

// @desc    Create a sale
// @route   POST /api/sales
// @access  Public
const createSale = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId, quantity, sellingPrice, date, note } = req.body;

    if (!productId || !quantity || sellingPrice === undefined) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 'Produit, quantité et prix de vente sont requis', 400);
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

    if (sellingPrice < 0) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 'Le prix de vente ne peut pas être négatif', 400);
    }

    const product = await Product.findById(productId).session(session);
    if (!product) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 'Produit non trouvé', 404);
    }

    // Check sufficient stock
    if (product.stockQuantity < quantity) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(
        res,
        `Stock insuffisant. Quantité disponible : ${product.stockQuantity}.`,
        400
      );
    }

    // Calculate financials
    // purchasePrice = prix d'achat par PACK (pas par unité)
    const purchasePrice = product.purchasePrice;
    const itemsPerPack = product.itemsPerPack || 6;
    const { saleType, numPacks } = req.body;
    const totalSale = quantity * sellingPrice;
    // PACK mode: coût = numPacks × purchasePrice (prix d'achat du pack)
    // UNIT mode: coût = quantity × (purchasePrice / itemsPerPack)
    const totalCost = saleType === 'PACK' && numPacks
      ? numPacks * purchasePrice
      : quantity * (purchasePrice / itemsPerPack);
    const profit = totalSale - totalCost;
    const saleDate = date ? new Date(date) : new Date();

    // Decrease stock
    product.stockQuantity -= quantity;
    await product.save({ session });

    // Create sale record
    const sale = await Sale.create(
      [
        {
          product: productId,
          quantity,
          purchasePrice,
          sellingPrice,
          totalSale,
          totalCost,
          profit,
          date: saleDate,
          note: note || '',
        },
      ],
      { session }
    );

    // Create stock movement
    await StockMovement.create(
      [
        {
          product: productId,
          type: 'SALE',
          quantity,
          unitPrice: sellingPrice,
          totalAmount: totalSale,
          profit,
          date: saleDate,
          note: note || '',
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    const populatedSale = await Sale.findById(sale[0]._id).populate('product', 'name category itemsPerPack');

    return successResponse(
      res,
      { sale: populatedSale, updatedProduct: product },
      'Vente enregistrée avec succès.',
      201
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Get all sales
// @route   GET /api/sales
// @access  Public
const getSales = async (req, res, next) => {
  try {
    const { startDate, endDate, productId, page = 1, limit = 50 } = req.query;
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

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Sale.countDocuments(filter);
    const sales = await Sale.find(filter)
      .populate('product', 'name category itemsPerPack')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return successResponse(res, {
      sales,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    }, 'Ventes récupérées avec succès');
  } catch (error) {
    next(error);
  }
};

// @desc    Get single sale
// @route   GET /api/sales/:id
// @access  Public
const getSale = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return errorResponse(res, 'Identifiant invalide', 400);
    }

    const sale = await Sale.findById(id).populate('product', 'name category');
    if (!sale) {
      return errorResponse(res, 'Vente non trouvée', 404);
    }

    return successResponse(res, sale, 'Vente récupérée avec succès');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a sale and restore product stock
// @route   DELETE /api/sales/:id
// @access  Public
const deleteSale = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 'Identifiant invalide', 400);
    }

    const sale = await Sale.findById(id).session(session);
    if (!sale) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 'Vente non trouvée', 404);
    }

    // Restore product stock
    const product = await Product.findById(sale.product).session(session);
    if (product) {
      product.stockQuantity += sale.quantity;
      await product.save({ session });
    }

    // Delete corresponding stock movement
    await StockMovement.deleteOne(
      {
        product: sale.product,
        type: 'SALE',
        quantity: sale.quantity,
        date: sale.date,
      },
      { session }
    );

    // Delete sale
    await Sale.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    session.endSession();

    return successResponse(res, null, 'Vente supprimée avec succès et stock réapprovisionné.');
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

module.exports = { createSale, getSales, getSale, deleteSale };
