import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/Order.js';
import Dispatch from './models/Dispatch.js';

dotenv.config();

const cleanSlate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to Database safely');
    
    // 1. Delete ALL Dispatch entries
    const dispatchDel = await Dispatch.deleteMany({});
    console.log(`Cleared ALL ${dispatchDel.deletedCount} Dispatch tracking logs.`);
    
    // 2. Revert Dispatched Orders back to Packed
    const orderRevert = await Order.updateMany(
      { Status: 'Dispatched' },
      { $set: { Status: 'Packed' } }
    );
    console.log(`Reverted ${orderRevert.modifiedCount} Orders back to Packed status.`);
    
    process.exit(0);
  } catch (error) {
    console.error('Migration Error:', error);
    process.exit(1);
  }
};

cleanSlate();
