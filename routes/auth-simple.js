import express from 'express';

const router = express.Router();

// Simple test routes without middleware
router.post('/dealer/register', (req, res) => {
  res.json({ message: 'Register endpoint working' });
});

router.post('/dealer/login', (req, res) => {
  res.json({ message: 'Login endpoint working' });
});

router.get('/profile', (req, res) => {
  res.json({ message: 'Profile endpoint working' });
});

export default router;
