import { Router } from 'express';
import { store } from '../store.js';
import type { Booking } from '../../shared/types.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(store.getBookings());
});

router.get('/:id', (req, res) => {
  const booking = store.getBookingById(req.params.id);
  if (!booking) return res.status(404).json({ error: '预约不存在' });
  res.json(booking);
});

router.post('/', (req, res) => {
  const { roomId, customerName, customerPhone, date, startTime, endTime, deposit, notes } = req.body;
  if (!roomId || !customerName || !customerPhone || !date || !startTime || !endTime) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  let finalNotes = notes || '';
  const pref = store.getCustomerPreferenceByPhone(customerPhone);
  if (pref) {
    const autoNotes: string[] = [];
    if (pref.preferredTea) {
      autoNotes.push(`茶水偏好: ${pref.preferredTea}`);
    }
    if (pref.seatPreference) {
      autoNotes.push(`座椅偏好: ${pref.seatPreference}`);
    }
    if (autoNotes.length > 0) {
      finalNotes = finalNotes ? `${finalNotes}\n${autoNotes.join('\n')}` : autoNotes.join('\n');
    }
  }
  const booking = store.createBooking({
    roomId,
    customerName,
    customerPhone,
    date,
    startTime,
    endTime,
    deposit: Number(deposit) || 0,
    notes: finalNotes,
  });
  const room = store.getRoomById(roomId);
  if (room && room.status === 'idle') {
    const bookingDate = new Date(date);
    const today = new Date();
    const isTodayBooking =
      bookingDate.getFullYear() === today.getFullYear() &&
      bookingDate.getMonth() === today.getMonth() &&
      bookingDate.getDate() === today.getDate();
    if (isTodayBooking) {
      store.updateRoom(roomId, { status: 'reserved' });
    }
  }
  res.status(201).json(booking);
});

router.put('/:id', (req, res) => {
  const data: Partial<Omit<Booking, 'id' | 'createdAt'>> = req.body;
  if (data.deposit) data.deposit = Number(data.deposit);
  const booking = store.updateBooking(req.params.id, data);
  if (!booking) return res.status(404).json({ error: '预约不存在' });
  res.json(booking);
});

router.delete('/:id', (req, res) => {
  const booking = store.getBookingById(req.params.id);
  if (!booking) return res.status(404).json({ error: '预约不存在' });
  const ok = store.deleteBooking(req.params.id);
  if (ok) {
    const room = store.getRoomById(booking.roomId);
    if (room && room.status === 'reserved') {
      store.updateRoom(booking.roomId, { status: 'idle' });
    }
  }
  res.json({ success: ok });
});

export default router;
