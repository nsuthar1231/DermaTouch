import mongoose from 'mongoose';
import Packing from './models/Packing.js';
import Order from './models/Order.js';

mongoose.connect('mongodb://localhost:27017/B2B');

const packings = await Packing.find({ Unfulfilled_SKU: { $exists: false } }).populate('PO_NO');
console.log(`Found ${packings.length} packing records without Unfulfilled_SKU`);

for (const p of packings) {
  if (p.PO_NO && p.PO_NO.SKU) {
    p.Unfulfilled_SKU = p.PO_NO.SKU;
    await p.save();
  }
}

console.log('Database cleanup complete. All packing records now have Unfulfilled_SKU.');
mongoose.disconnect();
