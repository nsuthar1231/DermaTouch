import mongoose from 'mongoose';
import Packing from './models/Packing.js';
import Order from './models/Order.js';

mongoose.connect('mongodb://localhost:27017/B2B');

// Find records where Unfulfilled_SKU is either missing, null, or empty string
const packings = await Packing.find({
  $or: [
    { Unfulfilled_SKU: { $exists: false } },
    { Unfulfilled_SKU: null },
    { Unfulfilled_SKU: "" }
  ]
}).populate('PO_NO');

console.log(`Found ${packings.length} packing records needing SKU fix`);

for (const p of packings) {
  if (p.PO_NO && p.PO_NO.SKU) {
    p.Unfulfilled_SKU = p.PO_NO.SKU;
    await p.save();
  }
}

console.log('Done!');
mongoose.disconnect();
