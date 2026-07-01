const express = require('express');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Get user by ID
router.get('/:id', authenticateToken, apiLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        public_key_ecc: user.public_key_ecc,
        public_key_pqc: user.public_key_pqc,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user public keys
router.put('/:id/keys', authenticateToken, apiLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const { public_key_ecc, public_key_pqc } = req.body;

    // Only allow users to update their own keys
    if (user.id !== id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedUser = await User.updatePublicKeys(id, public_key_ecc, public_key_pqc);

    res.json({
      message: 'Public keys updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        public_key_ecc: updatedUser.public_key_ecc,
        public_key_pqc: updatedUser.public_key_pqc,
      },
    });
  } catch (error) {
    console.error('Update keys error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Deactivate account
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    // Only allow users to deactivate their own account
    if (user.id !== id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await User.deactivate(id);

    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
