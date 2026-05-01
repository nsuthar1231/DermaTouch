import mongoose from 'mongoose';
import Order from './models/Order.js';

const checkDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/B2B');
    const count = await Order.countDocuments();
    console.log('Total Orders in DB:', count);
    const portals = await Order.aggregate([
      {
        $group: {
          _id: "$Portal",
          count: { $sum: 1 },
          totalQty: { $sum: "$PO_Qty" }
        }
      }
    ]);
    console.log('Portal Stats:', JSON.stringify(portals, null, 2));
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkDB();
