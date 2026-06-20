import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus,
  Minus,
  ShoppingCart,
  Clock,
  Users,
  CreditCard,
  CheckCircle,
  ArrowLeft,
  Play,
  Receipt,
  Banknote,
  Smartphone,
  CreditCard as CardIcon,
  Trash2,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import {
  ROOM_TYPE_LABELS,
  ROOM_TYPE_ICONS,
  PRODUCT_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
  type Order,
  type OrderItem,
  type PaymentMethod,
  type ProductCategory,
} from '@shared/types';
import {
  formatCurrency,
  calculateDuration,
  formatTime,
  formatDateTime,
} from '@shared/utils';
import Modal from '@/components/Modal';

export default function Checkout() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const {
    rooms,
    products,
    activeOrders,
    createOrder,
    updateOrderItems,
    checkoutOrder,
  } = useStore();

  const [currentOrderId, setCurrentOrderId] = useState<string>(orderId || '');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [customerCount, setCustomerCount] = useState(2);
  const [customerName, setCustomerName] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat');
  const [elapsed, setElapsed] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>('all');
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const currentOrder = activeOrders.find((o) => o.id === currentOrderId);
  const targetRoomId = currentOrder?.roomId || selectedRoom;
  const room = rooms.find((r) => r.id === targetRoomId);

  useEffect(() => {
    if (orderId && orderId !== currentOrderId) {
      setCurrentOrderId(orderId);
    }
  }, [orderId]);

  useEffect(() => {
    if (currentOrder) {
      setOrderItems(currentOrder.items);
      setSelectedRoom(currentOrder.roomId);
      setCustomerCount(currentOrder.customerCount);
      setCustomerName(currentOrder.customerName || '');
    }
  }, [currentOrder?.id]);

  useEffect(() => {
    if (!currentOrder) return;
    const update = () => {
      setElapsed(calculateDuration(currentOrder.startTime, new Date()));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [currentOrder?.id, currentOrder?.startTime]);

  useEffect(() => {
    if (!currentOrder || orderItems.length === 0) return;
    const timer = setTimeout(() => {
      updateOrderItems(currentOrder.id, orderItems);
    }, 500);
    return () => clearTimeout(timer);
  }, [orderItems, currentOrder?.id]);

  const idleRooms = rooms.filter((r) => r.status === 'idle' || r.status === 'reserved');
  const hasOpenOrder = !!currentOrder;

  const hours = Math.floor(elapsed / 60);
  const mins = Math.floor(elapsed % 60);
  const hourlyRate = room?.hourlyRate || 0;
  const baseAmount = Math.ceil(elapsed / 60) * hourlyRate;
  const itemsAmount = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const subtotal = (hasOpenOrder ? baseAmount : 0) + itemsAmount;
  const totalAmount = Math.max(0, subtotal - discount);

  const filteredProducts = products.filter(
    (p) => categoryFilter === 'all' || p.category === categoryFilter
  );

  const addItem = (product: typeof products[0]) => {
    const existing = orderItems.find((i) => i.productId === product.id);
    if (existing) {
      setOrderItems(
        orderItems.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setOrderItems([
        ...orderItems,
        { productId: product.id, name: product.name, price: product.price, quantity: 1 },
      ]);
    }
  };

  const updateItemQty = (productId: string, delta: number) => {
    setOrderItems(
      orderItems
        .map((i) =>
          i.productId === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const handleOpenTable = async () => {
    if (!selectedRoom) return alert('请选择包间');
    if (customerCount < 1) return alert('请输入客人数量');
    try {
      const order = await createOrder({
        roomId: selectedRoom,
        customerName: customerName || undefined,
        customerCount,
        source: 'walkin',
      });
      setCurrentOrderId(order.id);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCheckout = async () => {
    if (!currentOrder) return;
    try {
      const order = await checkoutOrder(currentOrder.id, {
        discount,
        paymentMethod,
      });
      setCheckoutModalOpen(false);
      setCompletedOrder(order);
      setReceiptModalOpen(true);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const selectOrder = (order: Order) => {
    setCurrentOrderId(order.id);
    navigate(`/checkout/${order.id}`, { replace: true });
  };

  const paymentOptions: { value: PaymentMethod; label: string; icon: any; color: string }[] = [
    { value: 'wechat', label: '微信支付', icon: Smartphone, color: 'from-green-500 to-emerald-500' },
    { value: 'alipay', label: '支付宝', icon: CreditCard, color: 'from-sky-500 to-blue-500' },
    { value: 'cash', label: '现金', icon: Banknote, color: 'from-gold to-amber-500' },
    { value: 'card', label: '银行卡', icon: CardIcon, color: 'from-ink-500 to-ink-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {!hasOpenOrder ? (
            <div className="card p-8 animate-fade-in-up">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center shadow-gold">
                  <Play className="w-7 h-7 text-gold" />
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-bold text-primary">即时空降开台</h2>
                  <p className="text-ink-500 mt-1">选择包间并录入客人信息，立即开始计时</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                <div className="md:col-span-2">
                  <label className="label-text">选择包间</label>
                  <select
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    className="select-field"
                  >
                    <option value="">请选择空闲包间</option>
                    {idleRooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {ROOM_TYPE_ICONS[r.type]} {r.roomNumber} - {ROOM_TYPE_LABELS[r.type]}
                        ({r.capacity}人 · {formatCurrency(r.hourlyRate)}/时)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-text">客人数量</label>
                  <input
                    type="number"
                    min={1}
                    value={customerCount}
                    onChange={(e) => setCustomerCount(Number(e.target.value))}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="mb-8">
                <label className="label-text">客户姓名（选填）</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="input-field max-w-md"
                  placeholder="用于账单记录"
                />
              </div>

              <button
                onClick={handleOpenTable}
                disabled={!selectedRoom}
                className="btn-secondary text-lg py-3.5 px-8 flex items-center gap-2.5"
              >
                <Play className="w-5 h-5" />
                确认开台，开始计时
              </button>
            </div>
          ) : (
            <>
              <div className="card p-6 animate-fade-in-up">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-coral-50 to-orange-50 flex items-center justify-center text-3xl shadow-inner-soft border-2 border-coral-200">
                      {room ? ROOM_TYPE_ICONS[room.type] : '🏠'}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1.5">
                        <h2 className="font-serif text-2xl font-bold text-primary">
                          {room?.roomNumber}
                        </h2>
                        <span className="badge bg-coral-100 text-coral-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
                          使用中
                        </span>
                      </div>
                      <p className="text-ink-500">
                        {room ? ROOM_TYPE_LABELS[room.type] : ''} ·
                        <Users className="w-3.5 h-3.5 inline mx-1 text-gold" />
                        {currentOrder.customerCount}人
                        {currentOrder.customerName && ` · ${currentOrder.customerName}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-ink-400 mb-1.5">已用时长</p>
                    <p
                      className="font-mono text-4xl font-bold text-primary animate-tick tabular-nums"
                      key={elapsed}
                    >
                      {String(hours).padStart(2, '0')}:{String(mins).padStart(2, '0')}
                    </p>
                    <p className="text-xs text-ink-400 mt-1">
                      开台于 {formatTime(currentOrder.startTime)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 p-5 rounded-2xl bg-gradient-to-br from-cream-50 to-gold-50 border border-gold-200/50">
                  <div className="text-center">
                    <p className="text-xs text-ink-500 mb-1">包间费用</p>
                    <p className="font-serif text-xl font-bold text-primary">
                      {formatCurrency(baseAmount)}
                    </p>
                    <p className="text-[10px] text-ink-400 mt-0.5">
                      {formatCurrency(hourlyRate)} × {Math.ceil(elapsed / 60) || 1}小时
                    </p>
                  </div>
                  <div className="text-center border-x border-gold-200/50">
                    <p className="text-xs text-ink-500 mb-1">商品消费</p>
                    <p className="font-serif text-xl font-bold text-gold-700">
                      {formatCurrency(itemsAmount)}
                    </p>
                    <p className="text-[10px] text-ink-400 mt-0.5">
                      共{orderItems.reduce((s, i) => s + i.quantity, 0)}件
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-ink-500 mb-1">当前合计</p>
                    <p className="font-serif text-2xl font-bold gold-gradient-text">
                      {formatCurrency(subtotal)}
                    </p>
                    <p className="text-[10px] text-ink-400 mt-0.5">未计优惠</p>
                  </div>
                </div>
              </div>

              <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-serif text-xl font-bold text-primary flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-gold" />
                    茶水零食加购
                  </h3>
                  <div className="flex gap-1.5 p-1 rounded-xl bg-cream-50">
                    <button
                      onClick={() => setCategoryFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        categoryFilter === 'all'
                          ? 'bg-primary text-gold shadow'
                          : 'text-ink-500 hover:text-primary'
                      }`}
                    >
                      全部
                    </button>
                    {(Object.keys(PRODUCT_CATEGORY_LABELS) as ProductCategory[]).map((c) => (
                      <button
                        key={c}
                        onClick={() => setCategoryFilter(c)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          categoryFilter === c
                            ? 'bg-primary text-gold shadow'
                            : 'text-ink-500 hover:text-primary'
                        }`}
                      >
                        {PRODUCT_CATEGORY_LABELS[c]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredProducts.map((product, idx) => {
                    const item = orderItems.find((i) => i.productId === product.id);
                    const disabled = product.stock <= 0;
                    return (
                      <button
                        key={product.id}
                        disabled={disabled}
                        onClick={() => addItem(product)}
                        className={`relative p-4 rounded-xl border-2 transition-all text-left group ${
                          disabled
                            ? 'bg-cream-50 border-cream-200 opacity-60 cursor-not-allowed'
                            : item
                            ? 'bg-gold-50 border-gold-300 shadow-gold'
                            : 'bg-white border-cream-200 hover:border-gold-300 hover:shadow-card hover:-translate-y-0.5'
                        }`}
                        style={{ animationDelay: `${idx * 0.02}s` }}
                      >
                        {item && (
                          <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-coral to-orange-500 text-white text-xs font-bold flex items-center justify-center shadow-lg">
                            {item.quantity}
                          </span>
                        )}
                        {disabled && (
                          <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-ink-100 text-ink-500">
                            售罄
                          </span>
                        )}
                        <p className="font-semibold text-primary mb-1 truncate">{product.name}</p>
                        <p className="text-xs text-ink-400 mb-2">
                          {PRODUCT_CATEGORY_LABELS[product.category]} · 库存{product.stock}
                        </p>
                        <p className="font-serif font-bold text-gold-700">
                          {formatCurrency(product.price)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {activeOrders.length > 0 && (
            <div className="card p-5">
              <h4 className="font-serif text-lg font-bold text-primary mb-4 flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-gold" />
                进行中的订单
                <span className="ml-auto text-sm font-normal text-ink-400">
                  {activeOrders.length}单
                </span>
              </h4>
              <div className="space-y-2">
                {activeOrders.map((o) => {
                  const r = rooms.find((x) => x.id === o.roomId);
                  const active = o.id === currentOrderId;
                  return (
                    <button
                      key={o.id}
                      onClick={() => selectOrder(o)}
                      className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                        active
                          ? 'bg-gradient-to-r from-primary to-primary-700 text-gold shadow-gold'
                          : 'bg-cream-50 hover:bg-gold-50 text-ink-600'
                      }`}
                    >
                      <span className="text-xl">{r ? ROOM_TYPE_ICONS[r.type] : '🏠'}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold ${active ? 'text-gold' : 'text-primary'}`}>
                          {r?.roomNumber}
                        </p>
                        <p
                          className={`text-xs ${
                            active ? 'text-gold-200/80' : 'text-ink-400'
                          } truncate`}
                        >
                          {o.customerCount}人 · 开始{formatTime(o.startTime)}
                        </p>
                      </div>
                      <span
                        className={`font-serif font-bold ${
                          active ? 'text-gold' : 'text-gold-700'
                        }`}
                      >
                        {formatCurrency(o.totalAmount || o.itemsAmount)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="card p-6 sticky top-6 animate-fade-in-up">
            <h3 className="font-serif text-xl font-bold text-primary mb-5 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-gold" />
              账单明细
            </h3>

            <div className="space-y-4 mb-5">
              {hasOpenOrder && (
                <div className="flex justify-between items-start pb-3 border-b border-cream-200">
                  <div>
                    <p className="font-medium text-ink-700">包间使用费</p>
                    <p className="text-xs text-ink-400 mt-0.5">
                      {Math.ceil(elapsed / 60) || 1}小时 × {formatCurrency(hourlyRate)}
                    </p>
                  </div>
                  <span className="font-serif font-bold text-lg text-primary">
                    {formatCurrency(baseAmount)}
                  </span>
                </div>
              )}

              {orderItems.length > 0 && (
                <div className="space-y-2.5 pb-3 border-b border-cream-200">
                  <p className="text-sm font-medium text-ink-500 mb-2">商品消费</p>
                  {orderItems.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateItemQty(item.productId, -1)}
                            className="w-6 h-6 rounded-lg bg-cream-100 hover:bg-coral-100 text-ink-500 hover:text-coral flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center text-sm font-semibold text-primary">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateItemQty(item.productId, 1)}
                            className="w-6 h-6 rounded-lg bg-cream-100 hover:bg-primary-100 text-ink-500 hover:text-primary flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-sm text-ink-600">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-primary">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                        <button
                          onClick={() =>
                            setOrderItems(orderItems.filter((i) => i.productId !== item.productId))
                          }
                          className="w-6 h-6 rounded-lg text-ink-300 hover:bg-coral-100 hover:text-coral flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!hasOpenOrder && orderItems.length === 0 && (
                <div className="py-8 text-center text-ink-400">
                  <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">选择包间开台后可添加商品</p>
                </div>
              )}
            </div>

            {hasOpenOrder && (
              <>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-ink-500">小计</span>
                    <span className="font-semibold text-ink-700">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-ink-500">优惠折扣</span>
                    <div className="flex items-center gap-2">
                      <span className="text-coral font-medium">-</span>
                      <input
                        type="number"
                        min={0}
                        value={discount}
                        onChange={(e) => setDiscount(Number(e.target.value))}
                        className="w-24 input-field py-1.5 text-right text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-primary to-primary-700 shadow-gold">
                    <span className="text-gold font-medium">应付总额</span>
                    <span className="font-serif text-2xl font-bold gold-gradient-text">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setCheckoutModalOpen(true)}
                  className="w-full btn-secondary text-lg py-3.5 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  立即结算
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        title="确认结算"
        size="md"
      >
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-cream-50 to-gold-50 border border-gold-200/50">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-gold-200/50">
              <span className="text-ink-500">包间 + 商品</span>
              <span className="font-semibold text-primary">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-gold-200/50">
                <span className="text-ink-500">优惠折扣</span>
                <span className="font-semibold text-coral">-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-primary">应付总额</span>
              <span className="font-serif text-3xl font-bold gold-gradient-text">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          <div>
            <p className="label-text mb-3">选择支付方式</p>
            <div className="grid grid-cols-2 gap-3">
              {paymentOptions.map((opt) => {
                const Icon = opt.icon;
                const active = paymentMethod === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setPaymentMethod(opt.value)}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      active
                        ? 'border-primary shadow-gold bg-primary-50'
                        : 'border-cream-200 hover:border-gold-300 bg-white'
                    }`}
                  >
                    {active && (
                      <CheckCircle className="absolute top-2.5 right-2.5 w-5 h-5 text-primary" />
                    )}
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${opt.color} flex items-center justify-center mb-2 shadow`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className={`font-semibold ${active ? 'text-primary' : 'text-ink-700'}`}>
                      {opt.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setCheckoutModalOpen(false)} className="flex-1 btn-ghost">
              取消
            </button>
            <button onClick={handleCheckout} className="flex-1 btn-primary">
              确认收款 {formatCurrency(totalAmount)}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false);
          setCurrentOrderId('');
          navigate('/checkout');
        }}
        title="结算成功"
        size="sm"
      >
        {completedOrder && room && (
          <div className="space-y-5">
            <div className="flex flex-col items-center py-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4 animate-float">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-primary mb-1">收款成功</h3>
              <p className="text-ink-500">
                {PAYMENT_METHOD_LABELS[completedOrder.paymentMethod || 'cash']} · {formatCurrency(completedOrder.paidAmount || 0)}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-500">订单编号</span>
                <span className="font-mono font-semibold text-ink-700">
                  {completedOrder.id.slice(-8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">包间</span>
                <span className="font-semibold text-primary">
                  {ROOM_TYPE_ICONS[room.type]} {room.roomNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">使用时长</span>
                <span className="font-semibold text-ink-700">
                  {completedOrder.durationHours}小时
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">开台时间</span>
                <span className="font-semibold text-ink-700">
                  {formatDateTime(completedOrder.startTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">结账时间</span>
                <span className="font-semibold text-ink-700">
                  {formatDateTime(completedOrder.completedAt || new Date())}
                </span>
              </div>
              <div className="pt-2 mt-2 border-t border-cream-300 flex justify-between items-center">
                <span className="font-semibold text-primary">实收金额</span>
                <span className="font-serif text-2xl font-bold gold-gradient-text">
                  {formatCurrency(completedOrder.paidAmount || 0)}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setReceiptModalOpen(false);
                setCurrentOrderId('');
                navigate('/checkout');
              }}
              className="w-full btn-secondary flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
              返回开台
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
