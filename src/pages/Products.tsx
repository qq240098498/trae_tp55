import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  Package,
  Coffee,
  UtensilsCrossed,
  GlassWater,
  MoreHorizontal,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import {
  PRODUCT_CATEGORY_LABELS,
  type Product,
  type ProductCategory,
} from '@shared/types';
import { formatCurrency } from '@shared/utils';
import Modal from '@/components/Modal';

const categoryIcons: Record<ProductCategory, any> = {
  tea: Coffee,
  snack: UtensilsCrossed,
  drink: GlassWater,
  other: Package,
};

const categoryColors: Record<ProductCategory, string> = {
  tea: 'from-amber-100 to-yellow-50 text-amber-700 border-amber-200',
  snack: 'from-orange-100 to-coral-50 text-coral-700 border-coral-200',
  drink: 'from-sky-100 to-blue-50 text-sky-700 border-sky-200',
  other: 'from-purple-100 to-violet-50 text-purple-700 border-purple-200',
};

export default function Products() {
  const { products, createProduct, updateProduct, deleteProduct } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<ProductCategory | 'all'>('all');

  const [form, setForm] = useState({
    name: '',
    category: 'tea' as ProductCategory,
    price: 10,
    stock: 50,
  });

  const filtered = products.filter((p) => {
    const matchSearch = p.name.includes(search);
    const matchCategory = filterCategory === 'all' || p.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const totalValue = products.reduce((s, p) => s + p.stock * p.price, 0);
  const lowStock = products.filter((p) => p.stock <= 10).length;

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', category: 'tea', price: 10, stock: 50 });
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return alert('请输入商品名称');
    if (form.price < 0) return alert('价格不能为负数');
    if (form.stock < 0) return alert('库存不能为负数');
    try {
      if (editing) {
        await updateProduct(editing.id, form);
      } else {
        await createProduct(form);
      }
      setModalOpen(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`确定删除商品「${product.name}」？`)) return;
    await deleteProduct(product.id);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="stat-card animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-primary/15 to-primary-500/5" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm text-ink-500 mb-1">商品总数</p>
              <p className="font-serif text-3xl font-bold text-primary">{products.length}</p>
              <p className="text-xs text-ink-400 mt-2">种商品在售</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center shadow-gold">
              <Package className="w-6 h-6 text-gold" />
            </div>
          </div>
        </div>

        <div className="stat-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-sky-400/20 to-blue-500/5" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm text-ink-500 mb-1">库存总量</p>
              <p className="font-serif text-3xl font-bold text-sky-600">{totalStock}</p>
              <p className="text-xs text-ink-400 mt-2">件商品库存</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
              <GlassWater className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="stat-card animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-gold/20 to-amber-500/5" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm text-ink-500 mb-1">库存价值</p>
              <p className="font-serif text-3xl font-bold gold-gradient-text">
                {formatCurrency(totalValue)}
              </p>
              <p className="text-xs text-ink-400 mt-2">按成本估算</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center shadow-gold">
              <Coffee className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="stat-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-coral/20 to-orange-500/5" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm text-ink-500 mb-1">库存预警</p>
              <p className="font-serif text-3xl font-bold text-coral">{lowStock}</p>
              <p className="text-xs text-ink-400 mt-2">低于10件需补货</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-coral to-orange-500 flex items-center justify-center shadow-lg shadow-coral/30">
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5 flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索商品名称..."
              className="input-field pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as ProductCategory | 'all')}
              className="select-field pl-10 pr-10 min-w-[140px]"
            >
              <option value="all">全部分类</option>
              {(Object.keys(PRODUCT_CATEGORY_LABELS) as ProductCategory[]).map((c) => (
                <option key={c} value={c}>
                  {PRODUCT_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4.5 h-4.5" />
          新增商品
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map((product, idx) => {
          const Icon = categoryIcons[product.category];
          const colors = categoryColors[product.category];
          const isLow = product.stock <= 10;
          return (
            <div
              key={product.id}
              className="card card-hover p-0 overflow-hidden group animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.03}s` }}
            >
              <div className={`h-32 bg-gradient-to-br ${colors} border-b-2 flex items-center justify-center relative`}>
                <Icon className="w-14 h-14 opacity-40" strokeWidth={1.5} />
                <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(product)}
                    className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur flex items-center justify-center text-ink-500 hover:text-primary hover:bg-white transition-all shadow"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur flex items-center justify-center text-ink-500 hover:text-coral hover:bg-white transition-all shadow"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {isLow && (
                  <span className="absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded-full bg-coral text-white shadow-lg shadow-coral/30 animate-pulse-slow">
                    ⚠ 库存低
                  </span>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-primary mb-1">
                      {product.name}
                    </h3>
                    <span className="text-xs text-ink-400">
                      {PRODUCT_CATEGORY_LABELS[product.category]}
                    </span>
                  </div>
                  <MoreHorizontal className="w-5 h-5 text-ink-300" />
                </div>
                <div className="flex items-end justify-between pt-3 border-t border-cream-200">
                  <div>
                    <p className="text-[10px] text-ink-400 mb-1">库存数量</p>
                    <p
                      className={`font-mono text-xl font-bold ${
                        isLow ? 'text-coral' : 'text-ink-700'
                      }`}
                    >
                      {product.stock}
                      <span className="text-xs font-normal text-ink-400 ml-1">件</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-ink-400 mb-1">售价</p>
                    <p className="font-serif text-xl font-bold gold-gradient-text">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-ink-400">
            <div className="flex flex-col items-center gap-2">
              <div className="text-5xl opacity-40">📦</div>
              <p>暂无商品数据</p>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? '编辑商品' : '新增商品'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="label-text">商品名称</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
              placeholder="如：铁观音、可乐..."
            />
          </div>
          <div>
            <label className="label-text">商品分类</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as ProductCategory })}
              className="select-field"
            >
              {(Object.keys(PRODUCT_CATEGORY_LABELS) as ProductCategory[]).map((c) => (
                <option key={c} value={c}>
                  {PRODUCT_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">售价 (元)</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-text">库存数量</label>
              <input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                className="input-field"
              />
            </div>
          </div>

          <div className={`p-4 rounded-2xl bg-gradient-to-br ${categoryColors[form.category]}`}>
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = categoryIcons[form.category];
                return <Icon className="w-8 h-8" strokeWidth={1.5} />;
              })()}
              <div className="flex-1">
                <p className="font-bold">{form.name || '商品名称'}</p>
                <p className="text-xs opacity-70 mt-0.5">
                  {PRODUCT_CATEGORY_LABELS[form.category]} · 库存{form.stock}件 · {formatCurrency(form.price)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 btn-ghost">
              取消
            </button>
            <button onClick={handleSubmit} className="flex-1 btn-primary">
              {editing ? '保存修改' : '创建商品'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
