import express from 'express';
import { authUser, registerUser, seedUsers } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', authUser);
router.post('/register', registerUser);
router.get('/seed', seedUsers);

export default router;
