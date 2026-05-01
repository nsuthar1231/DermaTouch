import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, username, password, role } = req.body;

  try {
    const userExists = await User.findOne({ username });

    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const user = await User.create({
      name,
      username,
      password,
      role,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Seed initial users
// @route   GET /api/auth/seed
// @access  Public
export const seedUsers = async (req, res) => {
  try {
    await User.deleteMany();
    const users = [
      { name: 'Dhruv Admin', username: 'admin', password: 'admin123', role: 'Admin' },
      { name: 'Warehouse Team', username: 'warehouse', password: 'warehouse123', role: 'Warehouse' },
      { name: 'Sales Team', username: 'sales', password: 'sales123', role: 'Sales' },
      { name: 'Dispatch Team', username: 'dispatch', password: 'dispatch123', role: 'Dispatch' }
    ];
    await User.insertMany(users);
    res.json({ message: 'Users seeded successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
