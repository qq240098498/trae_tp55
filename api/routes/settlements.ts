import { Router } from 'express';
import { store } from '../store.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(store.getSettlements());
});

router.get('/date/:date', (req, res) => {
  const settlement = store.getSettlementByDate(req.params.date);
  if (!settlement) return res.status(404).json({ error: '当日扎账记录不存在' });
  res.json(settlement);
});

router.get('/:id', (req, res) => {
  const settlement = store.getSettlementById(req.params.id);
  if (!settlement) return res.status(404).json({ error: '扎账记录不存在' });
  res.json(settlement);
});

router.post('/', (req, res) => {
  const { date } = req.body;
  try {
    const settlement = store.createDailySettlement(date);
    res.status(201).json(settlement);
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : '扎账失败' });
  }
});

export default router;
