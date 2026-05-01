import mongoose from 'mongoose';
import Packing from './models/Packing.js';
import Order from './models/Order.js';

mongoose.connect('mongodb://localhost:27017/B2B');

const id = '69f3117c14426d16c1c3a63b';
const packing = await Packing.findById(id).populate('PO_NO');

if (!packing) {
  console.log('Packing record not found');
} else {
  console.log('--- PACKING RECORD ---');
  console.log(JSON.stringify(packing, null, 2));
  
  if (!packing.PO_NO) {
    console.log('\n!!! PO_NO (Order) NOT FOUND in database for this packing record !!!');
    const rawPO = await Packing.findById(id);
    console.log('Raw PO_NO ID in Packing:', rawPO.PO_NO);
    const order = await Order.findById(rawPO.PO_NO);
    console.log('Direct lookup for Order:', order ? 'Found' : 'Not Found');
  } else {
    console.log('\nOrder found! SKU:', packing.PO_NO.SKU);
    packing.Unfulfilled_SKU = packing.PO_NO.SKU;
    await packing.save();
    console.log('Fixed and saved!');
  }
}

mongoose.disconnect();
