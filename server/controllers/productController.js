const Product = require('../models/Product');
const { isValidObjectId, successResponse, errorResponse } = require('../utils/helpers');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      filter.category = { $regex: category, $options: 'i' };
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    return successResponse(res, products, 'Produits récupérés avec succès');
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return errorResponse(res, 'Identifiant de produit invalide', 400);
    }

    const product = await Product.findById(id);
    if (!product) {
      return errorResponse(res, 'Produit non trouvé', 404);
    }

    return successResponse(res, product, 'Produit récupéré avec succès');
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Public
const createProduct = async (req, res, next) => {
  try {
    const { name, category, description, purchasePrice, sellingPrice, stockQuantity, minimumStock, supplier, itemsPerPack, packSellingPrice } = req.body;

    if (!name || !category || purchasePrice === undefined || sellingPrice === undefined) {
      return errorResponse(res, 'Nom, catégorie, prix d\'achat et prix de vente sont requis', 400);
    }

    if (purchasePrice < 0 || sellingPrice < 0) {
      return errorResponse(res, 'Les prix ne peuvent pas être négatifs', 400);
    }

    if (stockQuantity !== undefined && stockQuantity < 0) {
      return errorResponse(res, 'La quantité en stock ne peut pas être négative', 400);
    }

    const product = await Product.create({
      name,
      category,
      description,
      purchasePrice,
      sellingPrice,
      stockQuantity: stockQuantity || 0,
      minimumStock: minimumStock !== undefined ? minimumStock : 5,
      supplier,
      itemsPerPack: itemsPerPack || 6,
      packSellingPrice: packSellingPrice || 0,
    });

    return successResponse(res, product, 'Produit créé avec succès', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Public
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return errorResponse(res, 'Identifiant de produit invalide', 400);
    }

    const { purchasePrice, sellingPrice, stockQuantity, minimumStock } = req.body;

    if (purchasePrice !== undefined && purchasePrice < 0) {
      return errorResponse(res, "Le prix d'achat ne peut pas être négatif", 400);
    }
    if (sellingPrice !== undefined && sellingPrice < 0) {
      return errorResponse(res, 'Le prix de vente ne peut pas être négatif', 400);
    }
    if (stockQuantity !== undefined && stockQuantity < 0) {
      return errorResponse(res, 'La quantité en stock ne peut pas être négative', 400);
    }
    if (minimumStock !== undefined && minimumStock < 0) {
      return errorResponse(res, 'Le stock minimum ne peut pas être négatif', 400);
    }

    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return errorResponse(res, 'Produit non trouvé', 404);
    }

    return successResponse(res, product, 'Produit mis à jour avec succès');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Public
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return errorResponse(res, 'Identifiant de produit invalide', 400);
    }

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return errorResponse(res, 'Produit non trouvé', 404);
    }

    return successResponse(res, null, 'Produit supprimé avec succès');
  } catch (error) {
    next(error);
  }
};

// @desc    Get all categories
// @route   GET /api/products/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category');
    return successResponse(res, categories, 'Catégories récupérées avec succès');
  } catch (error) {
    next(error);
  }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getCategories };
