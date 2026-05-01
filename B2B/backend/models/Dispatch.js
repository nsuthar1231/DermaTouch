import mongoose from 'mongoose';

const dispatchSchema = mongoose.Schema(
  {
    PO_NO: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    Date: {
      type: Date,
      required: true,
    },
    Box: {
      type: Number,
      required: true,
    },
    Transporter: {
      type: String,
      required: true,
    },
    Mode: {
      type: String,
      required: true,
    },
    Vehicle_No: {
      type: String,
    },
    Pickup_Time: {
      type: String,
    },
    Pickup_Person: {
      type: String,
    },
    Manifest_Photo_URL: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Dispatch = mongoose.model('Dispatch', dispatchSchema);

export default Dispatch;
