const { errorResponse } = require('../utils/helpers');

// Centralized error handling middleware
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Erreur interne du serveur';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => e.message);
    message = errors.join(', ');
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Un produit avec ce ${field} existe déjà.`;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Identifiant invalide';
  }

  console.error('Error:', err);

  return errorResponse(res, message, statusCode);
};

// 404 handler
const notFound = (req, res, next) => {
  const error = new Error(`Route non trouvée: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = { errorHandler, notFound };
