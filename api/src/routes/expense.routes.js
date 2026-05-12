import express from 'express';
import ExpenseModel from '../models/expense.model.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';

const router = express.Router();
router.use(authenticate);
router.use(enforceTenantIsolation);

router.post('/', requireRole('OWNER_ADMIN', 'ACCOUNTS'), async (req, res) => {
  try {
    const num = await ExpenseModel.generateExpenseNumber(req.tenantId);
    const expense = await ExpenseModel.create({
      ...req.body,
      tenant_id: req.tenantId,
      expense_number: num,
      created_by_user_id: req.user.id,
    });
    return res.status(201).json({ success: true, data: expense });
  } catch (err) {
    if (err.code === '23503') return res.status(400).json({ error: 'Referenced vehicle or branch not found' });
    if (err.code === '22P02') return res.status(400).json({ error: 'Invalid value for category or date' });
    console.error('Expense create error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

router.get('/', requireRole('OWNER_ADMIN', 'ACCOUNTS'), async (req, res) => {
  try {
    const filters = {
      category:   req.query.category,
      branch_id:  req.query.branch_id,
      vehicle_id: req.query.vehicle_id,
      date_from:  req.query.date_from,
      date_to:    req.query.date_to,
      limit:      parseInt(req.query.limit) || 50,
      offset:     parseInt(req.query.offset) || 0,
    };
    const expenses = await ExpenseModel.list(req.tenantId, filters);
    return res.json({ success: true, data: expenses });
  } catch (err) {
    console.error('Expense list error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

router.get('/summary', requireRole('OWNER_ADMIN', 'ACCOUNTS'), async (req, res) => {
  try {
    const from = req.query.from || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const to   = req.query.to   || new Date().toISOString().split('T')[0];
    const data = await ExpenseModel.summary(req.tenantId, from, to);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

router.get('/:id', requireRole('OWNER_ADMIN', 'ACCOUNTS'), async (req, res) => {
  try {
    const expense = await ExpenseModel.findById(req.params.id, req.tenantId);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    return res.json({ success: true, data: expense });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

export default router;
