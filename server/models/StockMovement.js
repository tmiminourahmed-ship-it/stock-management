const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Le produit est requis'],
    },
    type: {
      type: String,
      enum: {
        values: ['ENTRY', 'SALE'],
        message: 'Le type doit être ENTRY ou SALE',
      },
      required: [true, 'Le type de mouvement est requis'],
    },
    quantity: {
      type: Number,
      required: [true, 'La quantité est requise'],
      min: [1, 'La quantité doit être au moins 1'],
    },
    unitPrice: {
      type: Number,
      required: [true, 'Le prix unitaire est requis'],
      min: [0, 'Le prix unitaire ne peut pas être négatif'],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Le montant total ne peut pas être négatif'],
    },
    profit: {
      type: Number,
      default: 0,
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

module.exports = mongoose.model('StockMovement', stockMovementSchema);
