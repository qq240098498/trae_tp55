import { Router } from 'express';
import { store } from '../store.js';
import { todayStart, todayEnd } from '../../shared/utils.js';

const router = Router();

router.get('/', (_req, res) => {
  const rooms = store.getRooms();
  const orders = store.getOrders();
  const start = todayStart().getTime();
  const end = todayEnd().getTime();
  const todayOrders = orders.filter((o) => {
    const createdAt = new Date(o.createdAt).getTime();
    return createdAt >= start && createdAt <= end;
  });
  const todayRevenue = todayOrders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + (o.paidAmount || o.totalAmount), 0);
  const stats = {
    todayRevenue,
    todayOrders: todayOrders.length,
    occupiedRooms: rooms.filter((r) => r.status === 'occupied').length,
    idleRooms: rooms.filter((r) => r.status === 'idle').length,
    reservedRooms: rooms.filter((r) => r.status === 'reserved').length,
    cleaningRooms: rooms.filter((r) => r.status === 'cleaning').length,
  };
  res.json(stats);
});

export default router;
