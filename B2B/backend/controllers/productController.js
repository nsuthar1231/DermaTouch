import Product from '../models/Product.js';

// @desc    Create a new product with image
// @route   POST /api/products
// @access  Public
export const createProduct = async (req, res) => {
  try {
    const { name, price, description, brand, category, countInStock } = req.body;

    // The image path comes from multer
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!image) {
      return res.status(400).json({ message: 'Please upload an image' });
    }

    const product = new Product({
      name,
      price,
      description,
      image,
      brand,
      category,
      countInStock,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
