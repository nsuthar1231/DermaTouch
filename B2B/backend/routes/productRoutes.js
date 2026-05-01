import express from 'express';
import { createProduct, getProducts } from '../controllers/productController.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Get all products
router.route('/').get(getProducts);

// Create product (expects form-data with 'image' field)
router.route('/').post(upload.single('image'), createProduct);

export default router;
