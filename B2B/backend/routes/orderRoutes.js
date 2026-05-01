import express from 'express';
import multer from 'multer';
import {
  createOrder,
  getPendingOrders,
  updatePacking,
  getPackedOrders,
  updateDispatch,
  getDashboardStats,
  getLatestOrders,
  getAllOrders,
  bulkUploadSales,
  bulkUploadWarehouse,
  deletePO,
  getPOJourney,
  getAnalytics,
  getLatestOrderDate,
} from '../controllers/orderController.js';

const router = express.Router();

// Setup multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.route('/create-order').post(createOrder);
router.route('/pending-orders').get(getPendingOrders);
router.route('/update-packing').put(updatePacking);
router.route('/packed-orders').get(getPackedOrders);
router.route('/update-dispatch').put(upload.single('manifestPhoto'), updateDispatch);
router.route('/stats').get(getDashboardStats);
router.route('/analytics').get(getAnalytics);
router.route('/latest').get(getLatestOrders);
router.route('/all').get(getAllOrders);
router.route('/bulk-sales').post(upload.single('file'), bulkUploadSales);
router.route('/bulk-warehouse').post(upload.single('file'), bulkUploadWarehouse);
router.route('/by-po/:poNo').delete(deletePO);
router.route('/journey/:poNo').get(getPOJourney);
router.route('/latest-date').get(getLatestOrderDate);

export default router;
