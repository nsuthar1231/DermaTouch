const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/B2B').then(async () => {
  const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
  
  const fy=2026, fm=4, fd=27;
  const start = new Date(fy, fm - 1, fd, 0, 0, 0, 0);
  const end = new Date(fy, fm - 1, fd, 23, 59, 59, 999);
  
  console.log('Querying from:', start, 'to:', end);
  
  const count = await Order.countDocuments({ PO_Date: { $gte: start, $lte: end } });
  console.log('Matching orders (count):', count);

  const agg = await Order.aggregate([{ $match: { PO_Date: { $gte: start, $lte: end } } }, { $count: 'total' }]);
  console.log('Matching orders (agg):', agg);
  
  process.exit(0);
});
