const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Le produit est requis'],
    },
    quantity: {
      type: Number,
      required: [true, 'La quantité est requise'],
      min: [1, 'La quantité doit être au moins 1'],
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
    totalSale: {
      type: Number,
      required: true,
      min: [0, 'Le total de vente ne peut pas être négatif'],
    },
    totalCost: {
      type: Number,
      required: true,
      min: [0, 'Le coût total ne peut pas être négatif'],
    },
    profit: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Sale', saleSchema);
