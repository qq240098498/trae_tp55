import { useState, useEffect } from 'react';
import {
  Calculator,
  Calendar,
  DollarSign,
  Banknote,
  Smartphone,
  Receipt,
  ShoppingBag,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Package,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import {
  ROOM_TYPE_LABELS,
  ROOM_TYPE_ICONS,
  PAYMENT_METHOD_LABELS,
  PRODUCT_CATEGORY_LABELS,
  type DailySettlementRoomItem,
  type DailySettlementItem,
} from '@shared/types';
import { formatCurrency, formatTime, formatDate } from '@shared/utils';

export default function DailySettlementPage() {
  const {
    settlements,
    currentSettlement,
    activeOrders,
    fetchSettlements,
    fetchSettlementByDate,
    createDailySettlement,
    clearCurrentSettlement,
  } = useStore();

  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'rooms' | 'items' | 'summary'>('rooms');

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  useEffect(() => {
    if (selectedDate) {
      fetchSettlementByDate(selectedDate);
    } else {
      clearCurrentSettlement();
    }
  }, [selectedDate, fetchSettlementByDate, clearCurrentSettlement]);

  const handleCreateSettlement = async () => {
    if (activeOrders.length > 0) {
      if (!confirm(`当前有 ${activeOrders.length} 个订单进行中，是否继续扎账？未结账订单将不计入今日营收。`)) {
        return;
      }
    }
    setCreating(true);
    try {
      await createDailySettlement(selectedDate);
    } catch (e) {
      alert(e instanceof Error ? e.message : '扎账失败');
    } finally {
      setCreating(false);
    }
  };

  const toggleRoom = (orderId: string) => {
    const newExpanded = new Set(expandedRooms);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedRooms(newExpanded);
  };

  const paymentOptions = [
    { method: 'cash' as const, label: '现金', icon: Banknote, color: 'from-gold to-amber-500' },
    { method: 'wechat' as const, label: '微信支付', icon: Smartphone, color: 'from-green-500 to-emerald-500' },
    { method: 'alipay' as const, label: '支付宝', icon: Smartphone, color: 'from-sky-500 to-blue-500' },
    { method: 'card' as const, label: '银行卡', icon: DollarSign, color: 'from-ink-500 to-ink-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="card p-6 animate-fade-in-up">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center shadow-gold">
              <Calculator className="w-7 h-7 text-gold" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-primary">日结扎账</h2>
              <p className="text-ink-500 mt-1">每日营业结束一键扎账，核对当日营收</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gold" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input-field py-2 px-3"
              />
            </div>
            <button
              onClick={handleCreateSettlement}
              disabled={creating}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50"
            >
              {creating ? (
                <>
                  <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                  扎账中...
                </>
              ) : (
                <>
                  <Receipt className="w-4.5 h-4.5" />
                  一键扎账
                </>
              )}
            </button>
          </div>
        </div>

        {!currentSettlement && (
          <div className="py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-ink-300" />
            </div>
            <h3 className="font-serif text-xl font-bold text-ink-600 mb-2">暂无当日扎账记录</h3>
            <p className="text-ink-400 mb-6">点击「一键扎账」生成当日营业报表</p>
            {activeOrders.length > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">当前有 {activeOrders.length} 个订单进行中</span>
              </div>
            )}
          </div>
        )}

        {currentSettlement && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200">
                <p className="text-xs text-ink-500 mb-1">结账包间</p>
                <p className="font-serif text-2xl font-bold text-primary">{currentSettlement.totalRooms}</p>
                <p className="text-[10px] text-ink-400 mt-0.5">间</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                <p className="text-xs text-ink-500 mb-1">包间费用</p>
                <p className="font-serif text-2xl font-bold text-blue-600">{formatCurrency(currentSettlement.totalBaseAmount)}</p>
                <p className="text-[10px] text-ink-400 mt-0.5">基础营收</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                <p className="text-xs text-ink-500 mb-1">商品消费</p>
                <p className="font-serif text-2xl font-bold text-purple-600">{formatCurrency(currentSettlement.totalItemsAmount)}</p>
                <p className="text-[10px] text-ink-400 mt-0.5">加购收入</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-coral-50 to-orange-100 border border-coral-200">
                <p className="text-xs text-ink-500 mb-1">优惠折扣</p>
                <p className="font-serif text-2xl font-bold text-coral">{formatCurrency(currentSettlement.totalDiscount)}</p>
                <p className="text-[10px] text-ink-400 mt-0.5">减免总额</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-gold-50 to-amber-100 border border-gold-200">
                <p className="text-xs text-ink-500 mb-1">现金收入</p>
                <p className="font-serif text-2xl font-bold text-gold-700">{formatCurrency(currentSettlement.cashAmount)}</p>
                <p className="text-[10px] text-ink-400 mt-0.5">实收现金</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200">
                <p className="text-xs text-ink-500 mb-1">扫码收入</p>
                <p className="font-serif text-2xl font-bold text-emerald-600">{formatCurrency(currentSettlement.scanAmount)}</p>
                <p className="text-[10px] text-ink-400 mt-0.5">微信+支付宝</p>
              </div>
            </div>

            <div className="flex gap-2 p-1 rounded-xl bg-cream-50 mb-6">
              <button
                onClick={() => setActiveTab('rooms')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'rooms'
                    ? 'bg-primary text-gold shadow'
                    : 'text-ink-500 hover:text-primary'
                }`}
              >
                <Users className="w-4 h-4" />
                包间流水
              </button>
              <button
                onClick={() => setActiveTab('items')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'items'
                    ? 'bg-primary text-gold shadow'
                    : 'text-ink-500 hover:text-primary'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                加购明细
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'summary'
                    ? 'bg-primary text-gold shadow'
                    : 'text-ink-500 hover:text-primary'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                营收对账
              </button>
            </div>

            {activeTab === 'rooms' && (
              <div className="space-y-3">
                {currentSettlement.orders.length === 0 ? (
                  <div className="py-12 text-center text-ink-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p>当日无结账包间</p>
                  </div>
                ) : (
                  currentSettlement.orders.map((order, idx) => (
                    <RoomOrderCard
                      key={order.orderId}
                      order={order}
                      expanded={expandedRooms.has(order.orderId)}
                      onToggle={() => toggleRoom(order.orderId)}
                      index={idx}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'items' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cream-200">
                      <th className="text-left py-3 px-4 font-semibold text-ink-600 text-sm">商品名称</th>
                      <th className="text-center py-3 px-4 font-semibold text-ink-600 text-sm">分类</th>
                      <th className="text-right py-3 px-4 font-semibold text-ink-600 text-sm">单价</th>
                      <th className="text-right py-3 px-4 font-semibold text-ink-600 text-sm">数量</th>
                      <th className="text-right py-3 px-4 font-semibold text-ink-600 text-sm">金额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSettlement.items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-ink-400">
                          <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
                          <p>当日无商品消费</p>
                        </td>
                      </tr>
                    ) : (
                      currentSettlement.items.map((item, idx) => (
                        <ItemRow key={item.productId} item={item} index={idx} />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'summary' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-6">
                  <h4 className="font-serif text-lg font-bold text-primary mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-gold" />
                    收入构成
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-cream-200">
                      <span className="text-ink-600">包间费用合计</span>
                      <span className="font-semibold text-primary">{formatCurrency(currentSettlement.totalBaseAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-cream-200">
                      <span className="text-ink-600">商品消费合计</span>
                      <span className="font-semibold text-purple-600">{formatCurrency(currentSettlement.totalItemsAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-cream-200">
                      <span className="text-ink-600">优惠折扣合计</span>
                      <span className="font-semibold text-coral">-{formatCurrency(currentSettlement.totalDiscount)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-semibold text-lg text-primary">当日总营收</span>
                      <span className="font-serif text-2xl font-bold gold-gradient-text">
                        {formatCurrency(currentSettlement.totalRevenue)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <h4 className="font-serif text-lg font-bold text-primary mb-4 flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-gold" />
                    收款方式对账
                  </h4>
                  <div className="space-y-3">
                    {paymentOptions.map((opt) => {
                      const payment = currentSettlement.payments.find((p) => p.method === opt.method);
                      const Icon = opt.icon;
                      return (
                        <div
                          key={opt.method}
                          className="flex items-center justify-between p-3 rounded-xl bg-cream-50"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${opt.color} flex items-center justify-center shadow`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-ink-700">{opt.label}</p>
                              <p className="text-xs text-ink-400">{payment?.count || 0} 笔</p>
                            </div>
                          </div>
                          <span className="font-serif text-lg font-bold text-primary">
                            {formatCurrency(payment?.amount || 0)}
                          </span>
                        </div>
                      );
                    })}
                    <div className="mt-4 pt-4 border-t border-cream-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-ink-600">现金合计</span>
                        <span className="font-semibold text-gold-700">{formatCurrency(currentSettlement.cashAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-ink-600">扫码合计 (微信+支付宝)</span>
                        <span className="font-semibold text-emerald-600">{formatCurrency(currentSettlement.scanAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-dashed border-cream-200">
                        <span className="font-semibold text-primary">对账总计</span>
                        <span className="font-serif text-xl font-bold text-primary">
                          {formatCurrency(currentSettlement.cashAmount + currentSettlement.scanAmount +
                            currentSettlement.payments.filter(p => p.method === 'card').reduce((s, p) => s + p.amount, 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-emerald-700">扎账完成</p>
                <p className="text-sm text-emerald-600">
                  扎账时间：{new Date(currentSettlement.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {settlements.length > 0 && (
        <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <h3 className="font-serif text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gold" />
            历史扎账记录
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cream-200">
                  <th className="text-left py-3 px-4 font-semibold text-ink-600 text-sm">日期</th>
                  <th className="text-center py-3 px-4 font-semibold text-ink-600 text-sm">包间数</th>
                  <th className="text-right py-3 px-4 font-semibold text-ink-600 text-sm">总营收</th>
                  <th className="text-right py-3 px-4 font-semibold text-ink-600 text-sm">现金</th>
                  <th className="text-right py-3 px-4 font-semibold text-ink-600 text-sm">扫码</th>
                  <th className="text-right py-3 px-4 font-semibold text-ink-600 text-sm">扎账时间</th>
                </tr>
              </thead>
              <tbody>
                {[...settlements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((s) => (
                  <tr
                    key={s.date}
                    onClick={() => setSelectedDate(s.date)}
                    className={`border-b border-cream-100 hover:bg-cream-50 cursor-pointer transition-colors ${
                      selectedDate === s.date ? 'bg-gold-50' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-medium text-primary">{s.date}</td>
                    <td className="py-3 px-4 text-center text-ink-600">{s.totalRooms} 间</td>
                    <td className="py-3 px-4 text-right font-semibold text-gold-700">{formatCurrency(s.totalRevenue)}</td>
                    <td className="py-3 px-4 text-right text-ink-600">{formatCurrency(s.cashAmount)}</td>
                    <td className="py-3 px-4 text-right text-ink-600">{formatCurrency(s.scanAmount)}</td>
                    <td className="py-3 px-4 text-right text-sm text-ink-400">
                      {new Date(s.createdAt).toLocaleString('zh-CN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function RoomOrderCard({
  order,
  expanded,
  onToggle,
  index,
}: {
  order: DailySettlementRoomItem;
  expanded: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <div
      className="card overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${index * 0.02}s` }}
    >
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-cream-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cream-50 to-gold-50 flex items-center justify-center text-2xl border border-gold-200">
            {ROOM_TYPE_ICONS[order.roomType]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-primary">{order.roomNumber}</h4>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cream-100 text-ink-500">
                {ROOM_TYPE_LABELS[order.roomType]}
              </span>
            </div>
            <p className="text-sm text-ink-500 mt-0.5">
              {order.customerName || '散客'} · {order.customerCount}人
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-ink-400">时长</p>
            <p className="font-mono font-semibold text-ink-600">
              <Clock className="w-3 h-3 inline mr-1 text-gold" />
              {order.durationHours}小时
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-400">时间</p>
            <p className="font-mono text-sm text-ink-600">
              {formatTime(order.startTime)} - {formatTime(order.endTime)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-400">实收</p>
            <p className="font-serif text-xl font-bold gold-gradient-text">
              {formatCurrency(order.paidAmount)}
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm text-ink-400 px-2">
            {PAYMENT_METHOD_LABELS[order.paymentMethod]}
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-ink-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-ink-400" />
          )}
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-t border-cream-100 bg-cream-50/50">
          <div className="grid grid-cols-4 gap-4 pt-4 mb-4">
            <div className="text-center p-3 rounded-xl bg-white">
              <p className="text-xs text-ink-400 mb-1">包间费</p>
              <p className="font-semibold text-primary">{formatCurrency(order.baseAmount)}</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-white">
              <p className="text-xs text-ink-400 mb-1">商品费</p>
              <p className="font-semibold text-purple-600">{formatCurrency(order.itemsAmount)}</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-white">
              <p className="text-xs text-ink-400 mb-1">折扣</p>
              <p className="font-semibold text-coral">-{formatCurrency(order.discount)}</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-gradient-to-br from-primary to-primary-700 shadow-gold">
              <p className="text-xs text-gold-200 mb-1">总计</p>
              <p className="font-serif text-lg font-bold text-gold">{formatCurrency(order.totalAmount)}</p>
            </div>
          </div>
          {order.items.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-ink-600 mb-2">消费商品：</p>
              <div className="flex flex-wrap gap-2">
                {order.items.map((item) => (
                  <span
                    key={item.productId}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white text-sm text-ink-600 border border-cream-200"
                  >
                    {item.name} × {item.quantity}
                    <span className="text-gold-600 font-medium ml-1">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ItemRow({ item, index }: { item: DailySettlementItem; index: number }) {
  return (
    <tr
      className="border-b border-cream-100 hover:bg-cream-50 transition-colors animate-fade-in-up"
      style={{ animationDelay: `${index * 0.02}s` }}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
            <Package className="w-5 h-5 text-purple-500" />
          </div>
          <span className="font-medium text-primary">{item.name}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="inline-block px-2 py-1 rounded-lg bg-cream-100 text-xs text-ink-600">
          {PRODUCT_CATEGORY_LABELS[item.category]}
        </span>
      </td>
      <td className="py-3 px-4 text-right font-mono text-ink-600">{formatCurrency(item.price)}</td>
      <td className="py-3 px-4 text-right font-mono text-ink-600">{item.quantity}</td>
      <td className="py-3 px-4 text-right font-semibold text-gold-700">{formatCurrency(item.totalAmount)}</td>
    </tr>
  );
}
