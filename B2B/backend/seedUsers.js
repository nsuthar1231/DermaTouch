import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import connectDB from './config/db.js';

dotenv.config();
connectDB();

const seedAdmin = async () => {
  try {
    // Clear existing users
    await User.deleteMany();

    const users = [
      {
        name: 'Dhruv Admin',
        username: 'admin',
        password: 'admin123',
        role: 'Admin'
      },
      {
        name: 'Warehouse Team',
        username: 'warehouse',
        password: 'warehouse123',
        role: 'Warehouse'
      },
      {
        name: 'Sales Team',
        username: 'sales',
        password: 'sales123',
        role: 'Sales'
      },
      {
        name: 'Dispatch Team',
        username: 'dispatch',
        password: 'dispatch123',
        role: 'Dispatch'
      }
    ];

    await User.insertMany(users);
    console.log('Users seeded successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedAdmin();
