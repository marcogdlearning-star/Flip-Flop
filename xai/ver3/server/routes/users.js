import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../config/database.js';
import { ethers } from 'ethers';
import { Op } from 'sequelize';

const router = express.Router();

const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, walletAddress, referrerCode } = req.body;
    console.log(`[REGISTER] Attempting registration for username: ${username}, email: ${email}`);

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email },
          { username },
          walletAddress ? { walletAddress } : null
        ].filter(Boolean)
      }
    });

    if (existingUser) {
      console.log(`[REGISTER] User already exists: ${username}/${email}`);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Find referrer if provided
    let referrerId = null;
    if (referrerCode) {
      const referrer = await User.findOne({ where: { username: referrerCode } });
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    // Create user in database
    const user = await User.create({
      username,
      email,
      password,
      walletAddress,
      referrerId
    });

    console.log(`[REGISTER] User created successfully: ID ${user.id}, username: ${username}`);

    // TODO: Register user on-chain via UserRegistry contract
    // This would be done after wallet connection

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        tokens: user.tokens,
        referrerId: user.referrerId
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[LOGIN] Attempting login for email: ${email}`);

    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log(`[LOGIN] User not found: ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      console.log(`[LOGIN] Invalid password for user: ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret');
    console.log(`[LOGIN] Login successful for user ID: ${user.id}, username: ${user.username}`);

    res.json({ token, user: { id: user.id, username: user.username, tokens: user.tokens } });
  } catch (err) {
    console.error('[LOGIN] Login error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Connect wallet
router.post('/connect-wallet', authenticate, async (req, res) => {
  try {
    const { walletAddress, signature } = req.body;
    // Verify signature
    const message = `Connect wallet to ${req.user.id}`;
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(400).json({ message: 'Invalid signature' });
    }
    await User.update({ walletAddress }, { where: { id: req.user.id } });
    res.json({ message: 'Wallet connected' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    res.json({ id: user.id, username: user.username, tokens: user.tokens, walletAddress: user.walletAddress });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
