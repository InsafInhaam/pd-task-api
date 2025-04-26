const express = require('express');
const { getTodayTasks } = require('../controllers/reportController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/today', authMiddleware, getTodayTasks);

module.exports = router;