import mongoose from 'mongoose';

const packingSchema = mongoose.Schema(
  {
    PO_NO: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    Packing_Date: {
      type: Date,
      required: true,
    },
    Dispatched_Qty: {
      type: Number,
      required: true,
      default: 0,
    },
    Unfulfilled_Qty: {
      type: Number,
      required: true,
      default: 0,
    },
    Reason: {
      type: String,
    },
    Unfulfilled_SKU: {
      type: String,
    },
    Remarks: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Packing = mongoose.model('Packing', packingSchema);

export default Packing;
