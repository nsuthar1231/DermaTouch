import Order from '../models/Order.js';
import Packing from '../models/Packing.js';
import Dispatch from '../models/Dispatch.js';
import dotenv from 'dotenv';
import xlsx from 'xlsx';
import fs from 'fs/promises';
import path from 'path';
import { google } from 'googleapis';
dotenv.config();

// Shared helper: builds a MongoDB matchQuery for PO_Date (jis din PO land hua)
// based on range/from/to query params
const buildMatchQuery = ({ range, from, to } = {}) => {
  const matchQuery = {};
  const now = new Date();

  if (from && to) {
    const [fY, fM, fD] = from.split('-').map(Number);
    const [tY, tM, tD] = to.split('-').map(Number);
    
    // Start of from date (00:00:00)
    const start = new Date(fY, fM - 1, fD, 0, 0, 0, 0);
    // End of to date (23:59:59)
    const end = new Date(tY, tM - 1, tD, 23, 59, 59, 999);
    
    matchQuery.PO_Date = { $gte: start, $lte: end };
  } else if (range && range !== 'all') {
    if (range === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      matchQuery.PO_Date = { $gte: start, $lte: end };
    } else if (range === 'yesterday') {
      const yest  = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const start = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 0, 0, 0, 0);
      const end   = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 23, 59, 59, 999);
      matchQuery.PO_Date = { $gte: start, $lte: end };
    } else if (range === '7') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchQuery.PO_Date = { $gte: start };
    } else if (range === '30') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchQuery.PO_Date = { $gte: start };
    } else if (range === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      matchQuery.PO_Date = { $gte: start };
    }
  }
  return matchQuery;
};


// @desc    Create a new order
// @route   POST /api/orders/create-order
// @access  Public
export const createOrder = async (req, res) => {
  try {
    const { PO_NO, Portal, PO_Date, SKU, PO_Qty } = req.body;

    const exists = await Order.findOne({ PO_NO: String(PO_NO), SKU: String(SKU) });
    if (exists) {
      return res.status(400).json({ message: 'Order line item already exists' });
    }

    const dateObj = new Date(PO_Date);
    dateObj.setHours(12, 0, 0, 0);

    let finalQty = Number(PO_Qty);
    const poMatch = SKU.match(/_PO(\d+)$/i);
    if (poMatch) {
      const multiplier = parseInt(poMatch[1]);
      if (multiplier >= 2 && multiplier <= 12) {
        finalQty = finalQty * multiplier;
      }
    }

    const order = new Order({
      PO_NO,
      Portal,
      PO_Date: dateObj,
      SKU,
      PO_Qty: finalQty,
      Status: 'Pending',
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all pending orders
// @route   GET /api/orders/pending-orders
// @access  Public
export const getPendingOrders = async (req, res) => {
  try {
    const orders = await Order.find({ Status: 'Pending' });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order to Packed
// @route   PUT /api/orders/update-packing
// @access  Public
export const updatePacking = async (req, res) => {
  try {
    const { orderId, PO_NO, Packing_Date, Dispatched_Qty, Unfulfilled_Qty, Reason, Remarks, Unfulfilled_SKU } = req.body;

    let ordersToPack = [];
    if (PO_NO) {
      ordersToPack = await Order.find({ PO_NO: String(PO_NO), Status: 'Pending' });
    } else if (orderId) {
      const order = await Order.findById(orderId);
      if (order && order.Status === 'Pending') ordersToPack.push(order);
    }

    if (ordersToPack.length === 0) {
      return res.status(404).json({ message: 'No pending orders found for this PO' });
    }

    for (const order of ordersToPack) {
      // Determine actual packed qty for this specific line item
      let actualDispatched = order.PO_Qty;
      let actualUnfulfilled = 0;

      // If this is the SKU that was marked as unfulfilled
      if (Unfulfilled_SKU && order.SKU === Unfulfilled_SKU) {
        actualUnfulfilled = Number(Unfulfilled_Qty) || 0;
        actualDispatched = Math.max(0, order.PO_Qty - actualUnfulfilled);
      } else if (!Unfulfilled_SKU && Dispatched_Qty !== undefined) {
        // Fallback: If no specific SKU is mentioned, we just use the provided qty (less accurate for multi-line POs)
        // But usually, users will select the SKU in the new UI
        actualDispatched = Number(Dispatched_Qty);
      }

      const packing = new Packing({
        PO_NO: order._id,
        Packing_Date: Packing_Date || new Date(),
        Dispatched_Qty: actualDispatched,
        Unfulfilled_Qty: actualUnfulfilled,
        Reason,
        Unfulfilled_SKU: Unfulfilled_SKU || order.SKU, // Always save the SKU name
        Remarks,
      });
      await packing.save();

      order.Status = 'Packed';
      await order.save();
    }

    res.json({ message: `Successfully packed ${ordersToPack.length} line items for PO ${PO_NO || ordersToPack[0].PO_NO}` });
  } catch (error) {
    console.error('Error in updatePacking:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all packed orders
// @route   GET /api/orders/packed-orders
// @access  Public
export const getPackedOrders = async (req, res) => {
  try {
    const orders = await Order.find({ Status: 'Packed' }).lean();
    const orderIds = orders.map(o => o._id);
    const packingLogs = await Packing.find({ PO_NO: { $in: orderIds } }).lean();
    
    const ordersWithLogs = orders.map(order => {
      // Find packing log by matching PO_NO (order line's _id stored in Packing.PO_NO)
      const packing = packingLogs.find(p => p.PO_NO.toString() === order._id.toString());
      
      let actualQty = order.PO_Qty;
      if (packing && packing.Unfulfilled_SKU && packing.Unfulfilled_SKU === order.SKU) {
        // This SKU was the unfulfilled one — subtract shortage qty
        actualQty = Math.max(0, order.PO_Qty - (packing.Unfulfilled_Qty || 0));
      }
      
      return {
        ...order,
        packingDetails: packing || null,
        Actual_Qty: actualQty
      };
    });
    res.json(ordersWithLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order to Dispatched and upload manifest photo
// @route   PUT /api/orders/update-dispatch
// @access  Public
export const updateDispatch = async (req, res) => {
  try {
    const { orderId, PO_NO, Date, Box, Transporter, Mode, Vehicle_No, Pickup_Time, Pickup_Person } = req.body;

    let ordersToDispatch = [];
    if (PO_NO) {
      ordersToDispatch = await Order.find({ PO_NO: String(PO_NO), Status: 'Packed' });
    } else if (orderId) {
      const order = await Order.findById(orderId);
      if (order && order.Status === 'Packed') ordersToDispatch.push(order);
    }

    if (ordersToDispatch.length === 0) {
      return res.status(404).json({ message: 'No packed orders found for this PO' });
    }

    let Manifest_Photo_URL = '';

    for (const order of ordersToDispatch) {
      const dispatch = new Dispatch({
        PO_NO: order._id,
        Date,
        Box,
        Transporter,
        Mode,
        Vehicle_No,
        Pickup_Time,
        Pickup_Person,
        Manifest_Photo_URL,
      });
      await dispatch.save();

      order.Status = 'Dispatched';
      await order.save();
    }

    res.json({ message: `Successfully dispatched ${ordersToDispatch.length} line items for PO ${PO_NO || ordersToDispatch[0].PO_NO}` });
  } catch (error) {
    console.error('Error in updateDispatch:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/orders/stats
// @access  Public
export const getDashboardStats = async (req, res) => {
  try {
    const { range, from, to } = req.query;
    const matchQuery = buildMatchQuery({ range, from, to });

    const aggregated = await Order.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'packings',
          localField: '_id',
          foreignField: 'PO_NO',
          as: 'packingLog'
        }
      },
      { $unwind: { path: '$packingLog', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$PO_NO",
          statuses: { $push: "$Status" },
          totalActualQty: {
            $sum: {
              $subtract: ["$PO_Qty", { $ifNull: ["$packingLog.Unfulfilled_Qty", 0] }]
            }
          }
        }
      },
      {
        $project: {
          PO_NO: "$_id",
          totalActualQty: 1,
          overallStatus: {
            $cond: {
              if: { $in: ["Pending", "$statuses"] },
              then: "Pending",
              else: {
                $cond: {
                  if: { $in: ["Packed", "$statuses"] },
                  then: "Packed",
                  else: "Dispatched"
                }
              }
            }
          }
        }
      }
    ]);

    const totalPOs = aggregated.length;
    const pendingPOs = aggregated.filter(p => p.overallStatus === 'Pending').length;
    // Only count as Packed (Ready for Dispatch) if they have items > 0
    const packedPOs = aggregated.filter(p => p.overallStatus === 'Packed' && p.totalActualQty > 0).length;
    const dispatchedPOs = aggregated.filter(p => p.overallStatus === 'Dispatched').length;

    // Calculate accurate fulfillment quantities: Fulfilled = Total Ordered - Total Shortage
    const detailedQtyAggregated = await Order.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'packings',
          localField: '_id',
          foreignField: 'PO_NO',
          as: 'packingLog'
        }
      },
      { $unwind: { path: '$packingLog', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          totalOrderedQty: { $sum: "$PO_Qty" },
          totalShortageQty: {
            $sum: {
              $cond: [
                { $in: ["$Status", ["Packed", "Dispatched"]] },
                { $ifNull: ["$packingLog.Unfulfilled_Qty", 0] },
                0
              ]
            }
          },
          totalDispatchedQty: {
            $sum: {
              $cond: [
                { $eq: ["$Status", "Dispatched"] },
                { $subtract: ["$PO_Qty", { $ifNull: ["$packingLog.Unfulfilled_Qty", 0] }] },
                0
              ]
            }
          }
        }
      }
    ]);

    const qtyStats = detailedQtyAggregated[0] || { totalOrderedQty: 0, totalShortageQty: 0, totalDispatchedQty: 0 };
    // Fulfilled should only be what is actually dispatched
    const actualFulfilled = qtyStats.totalDispatchedQty;
    const fulfillmentRate = qtyStats.totalOrderedQty > 0 
      ? ((actualFulfilled / qtyStats.totalOrderedQty) * 100).toFixed(1) 
      : 0;

    res.json({
      totalPOs,
      pendingPOs,
      packedPOs,
      dispatchedPOs,
      totalQty: qtyStats.totalOrderedQty,
      fulfilledQty: actualFulfilled,
      fulfillmentRate: `${fulfillmentRate}%`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get advanced analytics data
// @route   GET /api/orders/analytics
// @access  Public
export const getAnalytics = async (req, res) => {
  try {
    const { range, from, to } = req.query;
    const matchQuery = buildMatchQuery({ range, from, to });

    // Sales over time with shortage subtraction
    const salesOverTime = await Order.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'packings',
          localField: '_id',
          foreignField: 'PO_NO',
          as: 'packing'
        }
      },
      { $unwind: { path: '$packing', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$PO_Date" } },
          totalQty: { 
            $sum: { 
              $cond: [
                { $eq: ["$Status", "Dispatched"] },
                { $subtract: ["$PO_Qty", { $ifNull: ["$packing.Unfulfilled_Qty", 0] }] },
                0
              ]
            } 
          },
          totalPOs: { $addToSet: "$PO_NO" }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: "$_id",
          value: "$totalQty",
          count: { $size: "$totalPOs" }
        }
      }
    ]);

    // Portal breakdown with shortage subtraction
    const portalBreakdownRaw = await Order.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'packings',
          localField: '_id',
          foreignField: 'PO_NO',
          as: 'packing'
        }
      },
      { $unwind: { path: '$packing', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { portal: "$Portal", status: "$Status" },
          qty: { 
            $sum: { 
              $subtract: [
                "$PO_Qty", 
                { $ifNull: ["$packing.Unfulfilled_Qty", 0] }
              ] 
            } 
          }
        }
      }
    ]);

    const portals = {};
    portalBreakdownRaw.forEach(item => {
      const name = item._id.portal || 'Unknown';
      if (!portals[name]) portals[name] = { name, processing: 0, dispatch: 0, value: 0 };
      
      portals[name].value += item.qty;
      if (item._id.status === 'Dispatched') {
        portals[name].dispatch += item.qty;
      } else {
        portals[name].processing += item.qty;
      }
    });

    // 3. Top Performing SKUs
    const topSKUs = await Order.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'packings',
          localField: '_id',
          foreignField: 'PO_NO',
          as: 'packing'
        }
      },
      { $unwind: { path: '$packing', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$SKU",
          totalOrdered: { $sum: "$PO_Qty" },
          totalDispatched: { 
            $sum: { 
              $cond: [
                { $eq: ["$Status", "Dispatched"] },
                { $subtract: ["$PO_Qty", { $ifNull: ["$packing.Unfulfilled_Qty", 0] }] },
                0
              ]
            } 
          },
          pendingPOs: {
            $sum: { $cond: [{ $eq: ["$Status", "Pending"] }, 1, 0] }
          }
        }
      },
      { $sort: { totalDispatched: -1 } },
      { $limit: 10 }
    ]);

    // 4. Detailed Portal Breakdown for Table
    const portalDetailed = await Order.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'packings',
          localField: '_id',
          foreignField: 'PO_NO',
          as: 'packing'
        }
      },
      { $unwind: { path: '$packing', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$Portal",
          poQty: { $sum: "$PO_Qty" },
          dispatched: { 
            $sum: { 
              $cond: [
                { $eq: ["$Status", "Dispatched"] },
                { $subtract: ["$PO_Qty", { $ifNull: ["$packing.Unfulfilled_Qty", 0] }] },
                0
              ]
            } 
          },
          unfulfilled: { $sum: { $ifNull: ["$packing.Unfulfilled_Qty", 0] } }
        }
      },
      {
        $project: {
          name: "$_id",
          poQty: 1,
          dispatched: 1,
          unfulfilled: 1,
          fillRate: {
            $cond: [
              { $gt: ["$poQty", 0] },
              { $multiply: [{ $divide: ["$dispatched", "$poQty"] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { poQty: -1 } }
    ]);

    // Filter unfulfilled logs by verifying linked Order's PO_Date falls in range
    const unfulfilledLogs = await Packing.find({ Unfulfilled_Qty: { $gt: 0 } })
      .populate('PO_NO')
      .sort({ createdAt: -1 })
      .limit(100);

    const unfulfilledData = unfulfilledLogs
      .filter(log => {
        if (!matchQuery.PO_Date || !log.PO_NO?.PO_Date) return true;
        const d = new Date(log.PO_NO.PO_Date);
        const { $gte: gte, $lte: lte } = matchQuery.PO_Date;
        return (!gte || d >= gte) && (!lte || d <= lte);
      })
      .slice(0, 20)
      .map(log => ({
        poNo: log.PO_NO?.PO_NO || 'Unknown',
        sku: log.Unfulfilled_SKU || 'N/A',
        qty: log.Unfulfilled_Qty,
        reason: log.Reason,
        remarks: log.Remarks,
        date: log.Packing_Date
      }));

    res.json({
      salesOverTime,
      portalBreakdown: Object.values(portals),
      portalDetailed,
      topSKUs,
      unfulfilledData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get latest 10 orders
// @route   GET /api/orders/latest
// @access  Public
export const getLatestOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(1000).lean();
    const orderIds = orders.map(o => o._id);
    const packingLogs = await Packing.find({ PO_NO: { $in: orderIds } }).lean();

    const ordersWithLogs = orders.map(order => {
      const packing = packingLogs.find(p => p.PO_NO.toString() === order._id.toString());
      let actualQty = order.PO_Qty;
      if (packing && packing.Unfulfilled_SKU && packing.Unfulfilled_SKU === order.SKU) {
        actualQty = Math.max(0, order.PO_Qty - (packing.Unfulfilled_Qty || 0));
      } else if (packing && !packing.Unfulfilled_SKU && packing.Dispatched_Qty !== undefined) {
        actualQty = packing.Dispatched_Qty;
      }

      return {
        ...order,
        packingDetails: packing || null,
        Actual_Qty: actualQty
      };
    });

    res.json(ordersWithLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders
// @route   GET /api/orders/all
// @access  Public
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    
    // Fetch associated logs to show shortages in Master Sheet
    const orderIds = orders.map(o => o._id);
    const packingLogs = await Packing.find({ PO_NO: { $in: orderIds } }).lean();
    
    const ordersWithLogs = orders.map(order => {
      const packing = packingLogs.find(p => p.PO_NO.toString() === order._id.toString());
      
      let actualQty = order.PO_Qty;
      if (packing && packing.Unfulfilled_SKU && packing.Unfulfilled_SKU === order.SKU) {
        actualQty = Math.max(0, order.PO_Qty - (packing.Unfulfilled_Qty || 0));
      } else if (packing && !packing.Unfulfilled_SKU && packing.Dispatched_Qty !== undefined) {
        // Fallback for old/bulk data where SKU wasn't specified but qty was
        actualQty = packing.Dispatched_Qty;
      }

      return {
        ...order,
        packingDetails: packing || null,
        Actual_Qty: actualQty
      };
    });

    res.json(ordersWithLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk upload sales orders
// @route   POST /api/orders/bulk-sales
// @access  Public
export const bulkUploadSales = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an Excel/CSV file' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    const ordersToCreate = [];
    let skippedCount = 0;
    let duplicateCount = 0;

    for (let i = 0; i < data.length; i++) {
      const rawItem = data[i];
      const item = {};
      for (const key in rawItem) {
        const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        item[cleanKey] = rawItem[key];
      }

      const PO_NO = item.pono || item.po || item.ponumber;
      const Portal = item.portal || item.entity || item.customer;
      const PO_Date = item.podate || item.date || item.orderdate;
      const SKU = item.sku || item.itemcode || item.variant;
      const PO_Qty = item.poqty || item.qty || item.quantity;

      if (!PO_NO || !Portal || !PO_Date || !PO_Qty || !SKU) {
        skippedCount++;
        continue;
      }

      let parsedDate;
      if (PO_Date instanceof Date) {
        const d = new Date(PO_Date.getTime() + (12 * 60 * 60 * 1000));
        parsedDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0);
      } else if (typeof PO_Date === 'number') {
        parsedDate = new Date(Math.round((PO_Date - 25569) * 86400 * 1000));
        parsedDate.setHours(12, 0, 0, 0);
      } else if (typeof PO_Date === 'string') {
        const parts = PO_Date.trim().split(/[-/]/);
        if (parts.length === 3) {
          const p0 = parseInt(parts[0]);
          const p1 = parseInt(parts[1]);
          const p2 = parseInt(parts[2]);
          if (p0 > 31) {
            parsedDate = new Date(p0, p1 - 1, p2, 12, 0, 0);
          } else {
            const year = p2 < 100 ? 2000 + p2 : p2;
            parsedDate = new Date(year, p1 - 1, p0, 12, 0, 0);
          }
        } else {
          parsedDate = new Date(PO_Date);
          parsedDate.setHours(12, 0, 0, 0);
        }
      }

      let parsedQty = Number(PO_Qty);
      if (!parsedDate || isNaN(parsedDate.getTime()) || isNaN(parsedQty) || parsedQty <= 0) {
        skippedCount++;
        continue;
      }

      // PackOf Multiplier Logic (_PO2 to _PO12)
      const poMatch = String(SKU).match(/_PO(\d+)$/i);
      if (poMatch) {
        const multiplier = parseInt(poMatch[1]);
        if (multiplier >= 2 && multiplier <= 12) {
          parsedQty = parsedQty * multiplier;
        }
      }

      // Check if this SKU already exists for this PO in DB or in our current batch
      const existsInDB = await Order.findOne({ PO_NO: String(PO_NO), SKU: String(SKU) });
      const existsInBatch = ordersToCreate.find(o => o.PO_NO === String(PO_NO) && o.SKU === String(SKU));
      
      if (existsInDB || existsInBatch) {
        duplicateCount++;
        continue;
      }

      ordersToCreate.push({
        PO_NO: String(PO_NO),
        Portal: String(Portal),
        PO_Date: parsedDate,
        SKU: String(SKU),
        PO_Qty: parsedQty,
        Status: 'Pending'
      });
    }

    if (ordersToCreate.length > 0) {
      await Order.insertMany(ordersToCreate);
    }

    res.json({ 
      message: `Successfully uploaded ${ordersToCreate.length} new items.`,
      summary: {
        new: ordersToCreate.length,
        duplicates: duplicateCount,
        skipped: skippedCount
      }
    });
  } catch (error) {
    console.error('Bulk Upload Error:', error);
    res.status(500).json({ message: 'Error processing file. Please ensure columns are correct.' });
  }
};

// @desc    Bulk upload warehouse packing updates
// @route   POST /api/orders/bulk-warehouse
// @access  Public
export const bulkUploadWarehouse = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an Excel/CSV file' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const rawItem of data) {
      const item = {};
      for (const key in rawItem) {
        const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        item[cleanKey] = rawItem[key];
      }

      const PO_NO = item.pono || item.po || item.ponumber;
      const Packing_Date = item.packingdate || item.date || item.dateofpacking;
      const Dispatched_Qty = item.dispatchedqty || item.dispatchqty || item.packedqty;
      const Unfulfilled_Qty = item.unfulfilledqty || item.shortqty || item.shortage;

      if (!PO_NO || !Packing_Date || Dispatched_Qty === undefined) {
        skippedCount++;
        continue;
      }

      // Find ALL pending order lines for this PO
      const orders = await Order.find({ PO_NO: String(PO_NO), Status: 'Pending' });
      if (orders.length === 0) {
        skippedCount++;
        continue;
      }

      const dispatchedQty = Number(Dispatched_Qty);
      let parsedDate;
      if (Packing_Date instanceof Date) {
        const d = new Date(Packing_Date.getTime() + (12 * 60 * 60 * 1000));
        parsedDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0);
      } else if (typeof Packing_Date === 'number') {
        parsedDate = new Date(Math.round((Packing_Date - 25569) * 86400 * 1000));
        parsedDate.setHours(12, 0, 0, 0);
      } else if (typeof Packing_Date === 'string') {
        const parts = Packing_Date.trim().split(/[-/]/);
        if (parts.length === 3) {
          const p0 = parseInt(parts[0]);
          const p1 = parseInt(parts[1]);
          const p2 = parseInt(parts[2]);
          if (p0 > 31) {
            parsedDate = new Date(p0, p1 - 1, p2, 12, 0, 0);
          } else {
            const year = p2 < 100 ? 2000 + p2 : p2;
            parsedDate = new Date(year, p1 - 1, p0, 12, 0, 0);
          }
        } else {
          parsedDate = new Date(Packing_Date);
          parsedDate.setHours(12, 0, 0, 0);
        }
      }

      if (!parsedDate || isNaN(parsedDate.getTime()) || isNaN(dispatchedQty) || dispatchedQty < 0) {
        skippedCount++;
        continue;
      }

      // Read Unfulfilled_SKU from Excel
      const Unfulfilled_SKU = item.unfulfilledsku || item.shortsku || item.shortageski || undefined;
      const Reason = item.reason ? String(item.reason) : undefined;
      const Remarks = item.remarks ? String(item.remarks) : undefined;

      // Create packing record per SKU line
      for (const order of orders) {
        let actualDispatched = order.PO_Qty;
        let actualUnfulfilled = 0;

        if (Unfulfilled_SKU && order.SKU === Unfulfilled_SKU) {
          const unfulfilledQty = Unfulfilled_Qty !== undefined ? Number(Unfulfilled_Qty) : Math.max(0, order.PO_Qty - dispatchedQty);
          actualUnfulfilled = unfulfilledQty;
          actualDispatched = Math.max(0, order.PO_Qty - actualUnfulfilled);
        }

        await Packing.create({
          PO_NO: order._id,
          Packing_Date: parsedDate,
          Dispatched_Qty: actualDispatched,
          Unfulfilled_Qty: actualUnfulfilled,
          Unfulfilled_SKU: Unfulfilled_SKU || order.SKU, // Always save the SKU name
          Reason,
          Remarks
        });

        order.Status = 'Packed';
        await order.save();
        updatedCount++;
      }
    }

    res.json({ message: `Successfully packed ${updatedCount} line items. Skipped ${skippedCount} invalid/not-found entries.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a PO and all associated line items
// @route   DELETE /api/orders/by-po/:poNo
// @access  Public
export const deletePO = async (req, res) => {
  try {
    const { poNo } = req.params;
    const result = await Order.deleteMany({ PO_NO: poNo });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No orders found with this PO number' });
    }
    
    res.json({ message: `Successfully deleted PO ${poNo} (${result.deletedCount} line items)` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order tracking journey by PO Number
// @route   GET /api/orders/journey/:poNo
// @access  Public
export const getPOJourney = async (req, res) => {
  try {
    const { poNo } = req.params;
    
    const orders = await Order.find({ PO_NO: poNo });
    if (orders.length === 0) {
      return res.status(404).json({ message: 'PO not found' });
    }
    
    const orderIds = orders.map(o => o._id);
    
    const packingLogs = await Packing.find({ PO_NO: { $in: orderIds } });
    const dispatchLogs = await Dispatch.find({ PO_NO: { $in: orderIds } });
    
    res.json({
      orders,
      packing: packingLogs,
      dispatch: dispatchLogs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get the date of the latest order in the system
// @route   GET /api/orders/latest-date
// @access  Public
export const getLatestOrderDate = async (req, res) => {
  try {
    const latestOrder = await Order.findOne().sort({ PO_Date: -1 });
    if (!latestOrder) {
      return res.json({ latestDate: new Date().toISOString().split('T')[0] });
    }
    // Convert to local date string YYYY-MM-DD
    const d = latestOrder.PO_Date;
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    res.json({ latestDate: dateStr });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

