const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom du produit est requis'],
      trim: true,
      unique: true,
      maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères'],
    },
    category: {
      type: String,
      required: [true, 'La catégorie est requise'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    purchasePrice: {
      type: Number,
      required: [true, "Le prix d'achat est requis"],
      min: [0, "Le prix d'achat ne peut pas être négatif"],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Le prix de vente est requis'],
      min: [0, 'Le prix de vente ne peut pas être négatif'],
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: [0, 'La quantité en stock ne peut pas être négative'],
    },
    minimumStock: {
      type: Number,
      default: 5,
      min: [0, 'Le stock minimum ne peut pas être négatif'],
    },
    supplier: {
      type: String,
      trim: true,
      default: '',
    },
    itemsPerPack: {
      type: Number,
      default: 6,
      min: [1, 'Un pack doit contenir au moins 1 unité'],
    },
    packSellingPrice: {
      type: Number,
      default: 0,
      min: [0, 'Le prix du pack ne peut pas être négatif'],
    },
  },
  {
    timestamps: true,
  }
);

productSchema.virtual('isLowStock').get(function () {
  return this.stockQuantity <= this.minimumStock;
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
