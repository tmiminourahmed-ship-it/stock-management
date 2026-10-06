require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Sale = require('../models/Sale');

const seedProducts = [
  {
    name: 'Eau Safia 1.5L',
    category: 'Boissons',
    description: 'Eau minérale naturelle Safia 1.5L',
    purchasePrice: 0.5,
    sellingPrice: 0.8,
    stockQuantity: 120,
    minimumStock: 20,
    supplier: 'Safia Distribution',
  },
  {
    name: 'Eau Safia 0.5L',
    category: 'Boissons',
    description: 'Eau minérale naturelle Safia 0.5L',
    purchasePrice: 0.3,
    sellingPrice: 0.5,
    stockQuantity: 200,
    minimumStock: 30,
    supplier: 'Safia Distribution',
  },
  {
    name: 'Coca Cola 33cl',
    category: 'Boissons',
    description: 'Coca Cola canette 33cl',
    purchasePrice: 0.8,
    sellingPrice: 1.2,
    stockQuantity: 96,
    minimumStock: 24,
    supplier: 'SFBT',
  },
  {
    name: 'Fanta Orange 33cl',
    category: 'Boissons',
    description: 'Fanta Orange canette 33cl',
    purchasePrice: 0.8,
    sellingPrice: 1.2,
    stockQuantity: 72,
    minimumStock: 24,
    supplier: 'SFBT',
  },
  {
    name: 'Jus Rania Orange 1L',
    category: 'Jus',
    description: 'Jus de fruit Rania orange 1L',
    purchasePrice: 1.2,
    sellingPrice: 1.8,
    stockQuantity: 60,
    minimumStock: 12,
    supplier: 'Rania',
  },
  {
    name: 'Jus Rania Pomme 1L',
    category: 'Jus',
    description: 'Jus de fruit Rania pomme 1L',
    purchasePrice: 1.2,
    sellingPrice: 1.8,
    stockQuantity: 48,
    minimumStock: 12,
    supplier: 'Rania',
  },
  {
    name: 'Biscuit Bahlsen',
    category: 'Biscuits',
    description: 'Biscuits Bahlsen assortis',
    purchasePrice: 2.5,
    sellingPrice: 3.5,
    stockQuantity: 40,
    minimumStock: 10,
    supplier: 'General Distribution',
  },
  {
    name: 'Chips Pringles Original',
    category: 'Snacks',
    description: 'Chips Pringles goût original 165g',
    purchasePrice: 4.5,
    sellingPrice: 6.0,
    stockQuantity: 30,
    minimumStock: 8,
    supplier: 'General Distribution',
  },
  {
    name: 'Chips Lay\'s Classic',
    category: 'Snacks',
    description: "Chips Lay's classic 100g",
    purchasePrice: 1.8,
    sellingPrice: 2.5,
    stockQuantity: 60,
    minimumStock: 15,
    supplier: 'PepsiCo Tunisia',
  },
  {
    name: 'Café Carte Noire 250g',
    category: 'Café',
    description: 'Café moulu Carte Noire 250g',
    purchasePrice: 8.5,
    sellingPrice: 11.0,
    stockQuantity: 20,
    minimumStock: 5,
    supplier: 'Carte Noire Tunisia',
  },
  {
    name: 'Café Bonjour 200g',
    category: 'Café',
    description: 'Café soluble Bonjour 200g',
    purchasePrice: 5.5,
    sellingPrice: 7.5,
    stockQuantity: 3,
    minimumStock: 5,
    supplier: 'Bonjour Tunisie',
  },
  {
    name: 'Lait Gloria 1L',
    category: 'Produits laitiers',
    description: 'Lait stérilisé Gloria 1L',
    purchasePrice: 1.5,
    sellingPrice: 2.0,
    stockQuantity: 80,
    minimumStock: 20,
    supplier: 'SOTULAIT',
  },
  {
    name: 'Sucre Cristal 1Kg',
    category: 'Épicerie',
    description: 'Sucre cristal blanc 1Kg',
    purchasePrice: 1.8,
    sellingPrice: 2.3,
    stockQuantity: 50,
    minimumStock: 15,
    supplier: 'COTS',
  },
  {
    name: 'Thon Saupiquet 160g',
    category: 'Conserves',
    description: 'Thon à l\'huile Saupiquet 160g',
    purchasePrice: 3.5,
    sellingPrice: 4.8,
    stockQuantity: 4,
    minimumStock: 10,
    supplier: 'General Distribution',
  },
];

const seedDatabase = async () => {
  try {
    if (!process.env.MONGODB_URI || process.env.MONGODB_URI === 'YOUR_MONGODB_ATLAS_CONNECTION_STRING') {
      console.error('❌ Please configure MONGODB_URI in your .env file before seeding.');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Product.deleteMany({});
    await StockMovement.deleteMany({});
    await Sale.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Insert products
    const products = await Product.insertMany(seedProducts);
    console.log(`✅ Inserted ${products.length} products`);

    // Create some sample stock entries
    const movements = [];
    for (const product of products) {
      movements.push({
        product: product._id,
        type: 'ENTRY',
        quantity: product.stockQuantity,
        unitPrice: product.purchasePrice,
        totalAmount: product.stockQuantity * product.purchasePrice,
        profit: 0,
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        note: 'Stock initial',
      });
    }
    await StockMovement.insertMany(movements);
    console.log(`✅ Created ${movements.length} stock entry movements`);

    // Create some sample sales
    const sampleSales = [
      { productIndex: 0, quantity: 12, daysAgo: 1 },
      { productIndex: 2, quantity: 6, daysAgo: 1 },
      { productIndex: 7, quantity: 3, daysAgo: 2 },
      { productIndex: 4, quantity: 8, daysAgo: 2 },
      { productIndex: 0, quantity: 24, daysAgo: 3 },
      { productIndex: 11, quantity: 10, daysAgo: 3 },
      { productIndex: 6, quantity: 5, daysAgo: 4 },
      { productIndex: 9, quantity: 2, daysAgo: 5 },
      { productIndex: 12, quantity: 15, daysAgo: 5 },
      { productIndex: 3, quantity: 8, daysAgo: 7 },
    ];

    const saleDocs = [];
    const saleMovements = [];
    for (const s of sampleSales) {
      const product = products[s.productIndex];
      const totalSale = s.quantity * product.sellingPrice;
      const totalCost = s.quantity * product.purchasePrice;
      const profit = totalSale - totalCost;
      const date = new Date(Date.now() - s.daysAgo * 24 * 60 * 60 * 1000);

      saleDocs.push({
        product: product._id,
        quantity: s.quantity,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        totalSale,
        totalCost,
        profit,
        date,
        note: 'Vente test',
      });
      saleMovements.push({
        product: product._id,
        type: 'SALE',
        quantity: s.quantity,
        unitPrice: product.sellingPrice,
        totalAmount: totalSale,
        profit,
        date,
        note: 'Vente test',
      });
    }

    await Sale.insertMany(saleDocs);
    await StockMovement.insertMany(saleMovements);
    console.log(`✅ Created ${saleDocs.length} sample sales`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('You can now start the server: npm run dev');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seedDatabase();
