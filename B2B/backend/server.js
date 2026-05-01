import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import authRoutes from './routes/authRoutes.js';

// Setup environment variables
dotenv.config();

// Connect to Database
connectDB();

import Order from './models/Order.js';
setTimeout(async () => {
  try {
    await Order.collection.dropIndex('PO_NO_1');
    console.log('Dropped unique PO_NO index successfully');
  } catch (err) {
    // Index might not exist, ignore
    console.log('Unique PO_NO index drop skipped or not found');
  }
}, 2000);

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON data

// To serve the uploaded images statically
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);

// Base route for testing
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
