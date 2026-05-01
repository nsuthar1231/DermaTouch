import mongoose from 'mongoose';
import Packing from './models/Packing.js';
import Order from './models/Order.js';

mongoose.connect('mongodb://localhost:27017/B2B');

const po = '2273910057944';
const orders = await Order.find({ PO_NO: po });
const orderIds = orders.map(o => o._id);

// Delete all packing records for this PO
const deleted = await Packing.deleteMany({ PO_NO: { $in: orderIds } });
console.log(`Deleted ${deleted.deletedCount} packing records`);

// Reset order status to Pending
const updated = await Order.updateMany({ PO_NO: po }, { $set: { Status: 'Pending' } });
console.log(`Reset ${updated.modifiedCount} orders back to Pending`);

console.log('\nDone! Now go to Warehouse page and re-pack this PO properly.');
mongoose.disconnect();
