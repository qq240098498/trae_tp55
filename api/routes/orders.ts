import { Router } from 'express';
import { store } from '../store.js';
import type { Order, OrderItem, PaymentMethod } from '../../shared/types.js';
import { calculateBaseAmount, calculateDuration } from '../../shared/utils.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(store.getOrders());
});

router.get('/active', (_req, res) => {
  res.json(store.getActiveOrders());
});

router.get('/:id', (req, res) => {
  const order = store.getOrderById(req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  res.json(order);
});

router.post('/', (req, res) => {
  const { roomId, customerName, customerCount, source, bookingId } = req.body;
  if (!roomId || !customerCount) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  const room = store.getRoomById(roomId);
  if (!room) return res.status(404).json({ error: '包间不存在' });
  if (room.status !== 'idle' && room.status !== 'reserved') {
    return res.status(400).json({ error: '包间不可用' });
  }
  const startTime = new Date().toISOString();
  const order = store.createOrder({
    roomId,
    customerName,
    customerCount: Number(customerCount),
    startTime,
    baseAmount: 0,
    items: [],
    itemsAmount: 0,
    totalAmount: 0,
    source: source || 'walkin',
    bookingId,
  });
  store.updateRoom(roomId, { status: 'occupied' });
  if (bookingId) {
    store.updateBooking(bookingId, { status: 'completed' });
  }
  res.status(201).json(order);
});

router.put('/:id', (req, res) => {
  const order = store.getOrderById(req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  if (order.status !== 'active') {
    return res.status(400).json({ error: '订单已结束，无法修改' });
  }
  const { items } = req.body;
  if (items) {
    const itemsAmount = items.reduce(
      (sum: number, item: OrderItem) => sum + item.price * item.quantity,
      0
    );
    const now = new Date();
    const minutes = calculateDuration(order.startTime, now);
    const room = store.getRoomById(order.roomId);
    const hourlyRate = room?.hourlyRate || 0;
    const baseAmount = calculateBaseAmount(hourlyRate, minutes);
    const totalAmount = baseAmount + itemsAmount - (order.discount || 0);
    const updated = store.updateOrder(req.params.id, {
      items,
      itemsAmount,
      baseAmount,
      totalAmount,
    });
    return res.json(updated);
  }
  const updated = store.updateOrder(req.params.id, req.body);
  res.json(updated);
});

router.post('/:id/checkout', (req, res) => {
  const order = store.getOrderById(req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  if (order.status !== 'active') {
    return res.status(400).json({ error: '订单已结束' });
  }
  const { discount, paymentMethod } = req.body;
  const now = new Date();
  const endTime = now.toISOString();
  const minutes = calculateDuration(order.startTime, endTime);
  const durationHours = Math.ceil(minutes / 60);
  const room = store.getRoomById(order.roomId);
  const hourlyRate = room?.hourlyRate || 0;
  const baseAmount = calculateBaseAmount(hourlyRate, minutes);
  const itemsAmount = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discountAmount = Number(discount) || 0;
  const totalAmount = Math.max(0, baseAmount + itemsAmount - discountAmount);
  order.items.forEach((item) => {
    const product = store.getProductById(item.productId);
    if (product) {
      store.updateProduct(item.productId, {
        stock: Math.max(0, product.stock - item.quantity),
      });
    }
  });
  const paidAmount = totalAmount;
  const updated = store.updateOrder(req.params.id, {
    endTime,
    durationHours,
    baseAmount,
    itemsAmount,
    discount: discountAmount,
    totalAmount,
    paidAmount,
    paymentMethod: (paymentMethod as PaymentMethod) || 'cash',
    status: 'completed',
    completedAt: endTime,
  });
  store.updateRoom(order.roomId, { status: 'cleaning' });
  res.json(updated);
});

export default router;
