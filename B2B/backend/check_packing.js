import mongoose from 'mongoose';
import Packing from './models/Packing.js';
import Order from './models/Order.js';

mongoose.connect('mongodb://localhost:27017/B2B');

// Check what packing records exist for PO 2273910057944
const po = '2273910057944';
const orders = await Order.find({ PO_NO: po });
console.log('\n=== ORDER LINES ===');
orders.forEach(o => console.log(`SKU: ${o.SKU}, PO_Qty: ${o.PO_Qty}, Status: ${o.Status}, _id: ${o._id}`));

const orderIds = orders.map(o => o._id);
const packings = await Packing.find({ PO_NO: { $in: orderIds } });
console.log('\n=== PACKING RECORDS ===');
packings.forEach(p => console.log(JSON.stringify({
  PO_NO: p.PO_NO,
  Dispatched_Qty: p.Dispatched_Qty,
  Unfulfilled_Qty: p.Unfulfilled_Qty,
  Unfulfilled_SKU: p.Unfulfilled_SKU,
  Reason: p.Reason
}, null, 2)));

mongoose.disconnect();
