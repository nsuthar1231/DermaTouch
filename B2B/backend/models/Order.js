import mongoose from 'mongoose';

const orderSchema = mongoose.Schema(
  {
    PO_NO: {
      type: String,
      required: true,
    },
    Portal: {
      type: String,
      required: true,
    },
    PO_Date: {
      type: Date,
      required: true,
    },
    SKU: {
      type: String,
      required: true,
    },
    PO_Qty: {
      type: Number,
      required: true,
      default: 0,
    },
    Status: {
      type: String,
      required: true,
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;
