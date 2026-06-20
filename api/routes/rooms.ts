import { Router } from 'express';
import { store } from '../store.js';
import type { Room } from '../../shared/types.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(store.getRooms());
});

router.get('/:id', (req, res) => {
  const room = store.getRoomById(req.params.id);
  if (!room) return res.status(404).json({ error: '包间不存在' });
  res.json(room);
});

router.post('/', (req, res) => {
  const { roomNumber, type, capacity, hourlyRate, packageRate } = req.body;
  if (!roomNumber || !type || !capacity || !hourlyRate) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  const room = store.createRoom({
    roomNumber,
    type,
    capacity: Number(capacity),
    hourlyRate: Number(hourlyRate),
    packageRate,
  });
  res.status(201).json(room);
});

router.put('/:id', (req, res) => {
  const data: Partial<Omit<Room, 'id' | 'createdAt'>> = req.body;
  if (data.capacity) data.capacity = Number(data.capacity);
  if (data.hourlyRate) data.hourlyRate = Number(data.hourlyRate);
  const room = store.updateRoom(req.params.id, data);
  if (!room) return res.status(404).json({ error: '包间不存在' });
  res.json(room);
});

router.delete('/:id', (req, res) => {
  const ok = store.deleteRoom(req.params.id);
  if (!ok) return res.status(404).json({ error: '包间不存在' });
  res.json({ success: true });
});

export default router;
