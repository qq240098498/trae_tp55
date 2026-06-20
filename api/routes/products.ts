import { Router } from 'express';
import { store } from '../store.js';
import type { Product } from '../../shared/types.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(store.getProducts());
});

router.get('/:id', (req, res) => {
  const product = store.getProductById(req.params.id);
  if (!product) return res.status(404).json({ error: '商品不存在' });
  res.json(product);
});

router.post('/', (req, res) => {
  const { name, category, price, stock, image } = req.body;
  if (!name || !category || price === undefined || stock === undefined) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  const product = store.createProduct({
    name,
    category,
    price: Number(price),
    stock: Number(stock),
    image,
  });
  res.status(201).json(product);
});

router.put('/:id', (req, res) => {
  const data: Partial<Omit<Product, 'id' | 'createdAt'>> = req.body;
  if (data.price) data.price = Number(data.price);
  if (data.stock !== undefined) data.stock = Number(data.stock);
  const product = store.updateProduct(req.params.id, data);
  if (!product) return res.status(404).json({ error: '商品不存在' });
  res.json(product);
});

router.delete('/:id', (req, res) => {
  const ok = store.deleteProduct(req.params.id);
  if (!ok) return res.status(404).json({ error: '商品不存在' });
  res.json({ success: true });
});

export default router;
