import mongoose from 'mongoose';

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['Admin', 'Sales', 'Warehouse', 'Dispatch'],
      default: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

// Method to match password (Plain text for now to avoid dependency issues)
userSchema.methods.matchPassword = async function (enteredPassword) {
  return enteredPassword === this.password;
};

// Removed bcrypt middleware for now
userSchema.pre('save', async function (next) {
  next();
});

const User = mongoose.model('User', userSchema);

export default User;
