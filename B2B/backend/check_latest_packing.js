import mongoose from 'mongoose';
import Packing from './models/Packing.js';
import Order from './models/Order.js';

mongoose.connect('mongodb://localhost:27017/B2B');

const lastPackings = await Packing.find().sort({ createdAt: -1 }).limit(10).populate('PO_NO');
console.log('=== LATEST PACKING RECORDS ===');
lastPackings.forEach(p => {
  console.log(`PO: ${p.PO_NO?.PO_NO}, SKU: ${p.PO_NO?.SKU}, Dispatched: ${p.Dispatched_Qty}, Shortage: ${p.Unfulfilled_Qty}, Short_SKU: ${p.Unfulfilled_SKU}`);
});

mongoose.disconnect();
