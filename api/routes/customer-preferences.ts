import { Router } from 'express';
import { store } from '../store.js';
import type { CustomerPreference } from '../../shared/types.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(store.getCustomerPreferences());
});

router.get('/phone/:phone', (req, res) => {
  const pref = store.getCustomerPreferenceByPhone(req.params.phone);
  if (!pref) return res.status(404).json({ error: '未找到客户偏好记录' });
  res.json(pref);
});

router.get('/:id', (req, res) => {
  const pref = store.getCustomerPreferenceById(req.params.id);
  if (!pref) return res.status(404).json({ error: '客户偏好不存在' });
  res.json(pref);
});

router.get('/:phone/recommend', (req, res) => {
  const recommendations = store.getRecommendedRoomsForCustomer(req.params.phone);
  res.json(recommendations);
});

router.post('/', (req, res) => {
  const { customerPhone, customerName, preferredTea, seatPreference } = req.body;
  if (!customerPhone || !customerName) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  const pref = store.createCustomerPreference({
    customerPhone,
    customerName,
    preferredTea,
    seatPreference,
  });
  res.status(201).json(pref);
});

router.put('/:id', (req, res) => {
  const data: Partial<Omit<CustomerPreference, 'id' | 'createdAt' | 'updatedAt'>> = req.body;
  const pref = store.updateCustomerPreference(req.params.id, data);
  if (!pref) return res.status(404).json({ error: '客户偏好不存在' });
  res.json(pref);
});

router.put('/phone/:phone', (req, res) => {
  const pref = store.getCustomerPreferenceByPhone(req.params.phone);
  if (!pref) return res.status(404).json({ error: '未找到客户偏好记录' });
  const data: Partial<Omit<CustomerPreference, 'id' | 'createdAt' | 'updatedAt'>> = req.body;
  const updated = store.updateCustomerPreference(pref.id, data);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const ok = store.deleteCustomerPreference(req.params.id);
  if (!ok) return res.status(404).json({ error: '客户偏好不存在' });
  res.json({ success: true });
});

export default router;
