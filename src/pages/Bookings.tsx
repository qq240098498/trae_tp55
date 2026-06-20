import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle,
  Phone,
  User,
  Clock,
  Star,
  Coffee,
  Armchair,
  Crown,
  Sparkles,
  Save,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { customerPreferencesApi } from '@/lib/api';
import {
  ROOM_TYPE_LABELS,
  ROOM_TYPE_ICONS,
  CUSTOMER_PREFERENCE_TEA_OPTIONS,
  type Booking,
  type BookingStatus,
} from '@shared/types';
import { formatCurrency, formatDate } from '@shared/utils';
import Modal from '@/components/Modal';

const statusStyles: Record<BookingStatus, string> = {
  pending: 'bg-sky-100 text-sky-700',
  confirmed: 'bg-gold-100 text-gold-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-ink-100 text-ink-500',
};

const statusLabels: Record<BookingStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  completed: '已开台',
  cancelled: '已取消',
};

export default function Bookings() {
  const navigate = useNavigate();
  const {
    bookings,
    rooms,
    createBooking,
    updateBooking,
    deleteBooking,
    createOrder,
    customerPreferences,
    currentCustomerPreference,
    recommendedRooms,
    fetchCustomerPreferences,
    fetchCustomerPreferenceByPhone,
    fetchRecommendedRooms,
    updateCustomerPreferenceByPhone,
    createCustomerPreference,
    clearCurrentCustomerPreference,
  } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'all'>('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [prefTea, setPrefTea] = useState('');
  const [prefSeat, setPrefSeat] = useState('');

  const todayStr = formatDate(new Date());
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const daysInMonth = monthEnd.getDate();
  const firstDayWeekday = monthStart.getDay();

  const today = () => formatDate(new Date());

  const formInitial = {
    roomId: rooms[0]?.id || '',
    customerName: '',
    customerPhone: '',
    date: todayStr,
    startTime: '14:00',
    endTime: '18:00',
    deposit: 100,
    notes: '',
  };

  const [form, setForm] = useState(formInitial);

  useEffect(() => {
    fetchCustomerPreferences();
  }, [fetchCustomerPreferences]);

  const getCustomerPref = (phone: string) => {
    return customerPreferences.find((cp) => cp.customerPhone === phone);
  };

  const isRegularCustomer = (phone: string) => {
    const pref = getCustomerPref(phone);
    return pref && pref.visitCount >= 2;
  };

  useEffect(() => {
    const phone = form.customerPhone.trim();
    if (phone.length >= 7) {
      (async () => {
        const pref = await fetchCustomerPreferenceByPhone(phone);
        if (pref) {
          setPrefTea(pref.preferredTea || '');
          setPrefSeat(pref.seatPreference || '');
          const recs = await customerPreferencesApi.getRecommendations(phone);
          if (recs.length > 0 && !editing) {
            const bestRoom = rooms.find((r) => r.id === recs[0].roomId && r.status === 'idle');
            if (bestRoom) {
              setForm((f) => ({ ...f, roomId: bestRoom.id }));
            }
          }
          if (pref.customerName && !form.customerName.trim()) {
            setForm((f) => ({ ...f, customerName: pref.customerName }));
          }
        }
      })();
    } else {
      clearCurrentCustomerPreference();
      setPrefTea('');
      setPrefSeat('');
    }
  }, [form.customerPhone, fetchCustomerPreferenceByPhone, clearCurrentCustomerPreference, rooms, editing, form.customerName]);

  const handleSavePreferences = async () => {
    const phone = form.customerPhone.trim();
    const name = form.customerName.trim();
    if (!phone || !name) {
      alert('请先填写客户姓名和电话');
      return;
    }
    const existing = getCustomerPref(phone);
    try {
      if (existing) {
        await updateCustomerPreferenceByPhone(phone, {
          preferredTea: prefTea,
          seatPreference: prefSeat,
        });
      } else {
        await createCustomerPreference({
          customerPhone: phone,
          customerName: name,
          preferredTea: prefTea,
          seatPreference: prefSeat,
        });
      }
      alert('偏好已保存');
    } catch (e) {
      alert(e instanceof Error ? e.message : '保存失败');
    }
  };

  const sortedRoomsForSelect = useMemo(() => {
    const availableRooms = rooms.filter((r) => r.status === 'idle' || r.id === editing?.roomId);
    if (recommendedRooms.length === 0) return availableRooms;
    const recMap = new Map(recommendedRooms.map((r) => [r.roomId, r.score]));
    return [...availableRooms].sort((a, b) => {
      const scoreA = recMap.get(a.id) || 0;
      const scoreB = recMap.get(b.id) || 0;
      return scoreB - scoreA;
    });
  }, [rooms, recommendedRooms, editing]);

  const getRoomBadge = (roomId: string) => {
    const rec = recommendedRooms.find((r) => r.roomId === roomId);
    if (!rec) return null;
    if (rec.score >= 10) return { label: '常坐包间', color: 'bg-amber-100 text-amber-700' };
    if (rec.score >= 3) return { label: '偏好推荐', color: 'bg-sky-100 text-sky-700' };
    return null;
  };

  const sortedBookings = useMemo(
    () =>
      [...bookings]
        .filter((b) => {
          const match =
            b.customerName.includes(search) ||
            b.customerPhone.includes(search) ||
            rooms.find((r) => r.id === b.roomId)?.roomNumber.includes(search);
          const matchStatus = filterStatus === 'all' || b.status === filterStatus;
          return match && matchStatus;
        })
        .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)),
    [bookings, rooms, search, filterStatus]
  );

  const getBookingsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return bookings.filter((b) => b.date === dateStr && b.status !== 'cancelled');
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...formInitial, roomId: rooms[0]?.id || '' });
    setModalOpen(true);
  };

  const openEdit = (booking: Booking) => {
    setEditing(booking);
    setForm({
      roomId: booking.roomId,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      deposit: booking.deposit,
      notes: booking.notes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.customerName.trim()) return alert('请输入客户姓名');
    if (!form.customerPhone.trim()) return alert('请输入联系电话');
    if (!form.roomId) return alert('请选择包间');
    try {
      if (editing) {
        await updateBooking(editing.id, form);
      } else {
        await createBooking(form);
      }
      setModalOpen(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : '操作失败');
    }
  };

  const handleCheckIn = async (booking: Booking) => {
    try {
      const order = await createOrder({
        roomId: booking.roomId,
        customerName: booking.customerName,
        customerCount: 4,
        source: 'booking',
        bookingId: booking.id,
      });
      navigate(`/checkout/${order.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : '开台失败');
    }
  };

  const renderDay = (day: number, weekday: number) => {
    if (day === 0) {
      return (
        <div key={`empty-${weekday}`} className="h-28 bg-cream-50/30 rounded-xl border border-dashed border-cream-200" />
      );
    }
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = formatDate(date);
    const dayBookings = getBookingsForDate(date);
    const isToday = dateStr === today();

    return (
      <div
        key={day}
        className={`h-28 rounded-xl border-2 transition-all p-2 overflow-hidden ${
          isToday
            ? 'bg-gradient-to-br from-gold-50 to-amber-50 border-gold-300 shadow-gold'
            : 'bg-white/60 border-cream-200 hover:border-gold-200 hover:shadow-card'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span
            className={`font-serif font-bold text-sm ${
              isToday ? 'text-primary' : 'text-ink-600'
            }`}
          >
            {day}
          </span>
          {dayBookings.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-coral-100 text-coral-700">
              {dayBookings.length}
            </span>
          )}
        </div>
        <div className="space-y-1">
          {dayBookings.slice(0, 2).map((b) => {
            const room = rooms.find((r) => r.id === b.roomId);
            return (
              <div
                key={b.id}
                className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary-50 text-primary truncate cursor-pointer hover:bg-primary hover:text-gold transition-colors"
                title={`${room?.roomNumber} ${b.customerName} ${b.startTime}-${b.endTime}`}
                onClick={() => openEdit(b)}
              >
                {b.startTime} {room?.roomNumber}
              </div>
            );
          })}
          {dayBookings.length > 2 && (
            <div className="text-[10px] text-ink-400 pl-1">+{dayBookings.length - 2} 更多</div>
          )}
        </div>
      </div>
    );
  };

  const calendarDays = [];
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(renderDay(0, i));
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(renderDay(d, (firstDayWeekday + d - 1) % 7));
  }

  return (
    <div className="space-y-6">
      <div className="card p-5 flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索客户姓名/电话/包间号..."
              className="input-field pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as BookingStatus | 'all')}
            className="select-field min-w-[140px]"
          >
            <option value="all">全部状态</option>
            {(Object.keys(statusLabels) as BookingStatus[]).map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </select>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4.5 h-4.5" />
          新增预约
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="card p-6 xl:col-span-3">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-600 flex items-center justify-center shadow-gold">
                <CalendarIcon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-serif text-xl font-bold text-primary">
                {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-cream text-ink-500 hover:text-primary transition-colors"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-cream text-ink-500 hover:text-primary transition-colors"
              >
                今天
              </button>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-cream text-ink-500 hover:text-primary transition-colors"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-ink-400 py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">{calendarDays}</div>
        </div>

        <div className="card p-6 xl:col-span-2">
          <h3 className="font-serif text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gold" />
            预约列表
            <span className="ml-auto text-sm font-normal text-ink-400">
              共 {sortedBookings.length} 条
            </span>
          </h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {sortedBookings.map((booking, idx) => {
              const room = rooms.find((r) => r.id === booking.roomId);
              return (
                <div
                  key={booking.id}
                  className="p-4 rounded-2xl bg-gradient-to-br from-white to-cream-50 border border-cream-200 hover:shadow-card transition-all animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.03}s` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-50 to-cream flex items-center justify-center text-lg">
                        {room ? ROOM_TYPE_ICONS[room.type] : '🏠'}
                      </div>
                      <div>
                        <p className="font-serif font-bold text-primary">
                          {room?.roomNumber || '未知包间'}
                        </p>
                        <p className="text-xs text-ink-400">
                          {room ? ROOM_TYPE_LABELS[room.type] : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`badge ${statusStyles[booking.status]}`}>
                      {statusLabels[booking.status]}
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-ink-600">
                      <User className="w-3.5 h-3.5 text-gold" />
                      <span className="font-medium">{booking.customerName}</span>
                      {isRegularCustomer(booking.customerPhone) && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold">
                          <Crown className="w-3 h-3" />
                          老客
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-ink-600">
                      <Phone className="w-3.5 h-3.5 text-gold" />
                      {booking.customerPhone}
                    </div>
                    <div className="flex items-center gap-2 text-ink-600">
                      <CalendarIcon className="w-3.5 h-3.5 text-gold" />
                      {booking.date} {booking.startTime} - {booking.endTime}
                    </div>
                    {(() => {
                      const pref = getCustomerPref(booking.customerPhone);
                      if (pref && (pref.preferredTea || pref.seatPreference)) {
                        return (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {pref.preferredTea && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px]">
                                <Coffee className="w-2.5 h-2.5" />
                                {pref.preferredTea}
                              </span>
                            )}
                            {pref.seatPreference && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-600 text-[10px]">
                                <Armchair className="w-2.5 h-2.5" />
                                {pref.seatPreference}
                              </span>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-cream-200">
                    <span className="font-serif font-bold text-gold-700">
                      定金 {formatCurrency(booking.deposit)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleCheckIn(booking)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          到店开台
                        </button>
                      )}
                      {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                        <>
                          <button
                            onClick={() => openEdit(booking)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-gold-100 hover:text-gold-700 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm('确定取消此预约？')) return;
                              await deleteBooking(booking.id);
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-coral-100 hover:text-coral transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {sortedBookings.length === 0 && (
              <div className="py-16 text-center text-ink-400">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-5xl opacity-40">📅</div>
                  <p>暂无预约记录</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? '编辑预约' : '新增预约'}
        size="lg"
      >
        <div className="space-y-4">
          {currentCustomerPreference && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-gold-50 border-2 border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-amber-600" />
                <span className="font-serif font-bold text-amber-700">
                  老客常客 · 第 {currentCustomerPreference.visitCount} 次到店
                </span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex flex-wrap gap-2">
                {currentCustomerPreference.preferredRoomTypes.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/70 text-sm text-ink-600">
                    <Star className="w-3.5 h-3.5 text-gold" />
                    偏好: {currentCustomerPreference.preferredRoomTypes.map((t) => ROOM_TYPE_LABELS[t.type]).join('、')}
                  </span>
                )}
                {currentCustomerPreference.preferredTea && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/70 text-sm text-ink-600">
                    <Coffee className="w-3.5 h-3.5 text-emerald-500" />
                    {currentCustomerPreference.preferredTea}
                  </span>
                )}
                {currentCustomerPreference.seatPreference && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/70 text-sm text-ink-600">
                    <Armchair className="w-3.5 h-3.5 text-sky-500" />
                    {currentCustomerPreference.seatPreference}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">选择包间 {recommendedRooms.length > 0 && <span className="text-xs text-sky-600 ml-1">(已按偏好排序)</span>}</label>
              <select
                value={form.roomId}
                onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                className="select-field"
              >
                {sortedRoomsForSelect.map((r) => {
                  const badge = getRoomBadge(r.id);
                  return (
                    <option key={r.id} value={r.id}>
                      {ROOM_TYPE_ICONS[r.type]} {r.roomNumber} - {ROOM_TYPE_LABELS[r.type]} ({formatCurrency(r.hourlyRate)}/时){badge ? ` [${badge.label}]` : ''}
                    </option>
                  );
                })}
              </select>
              {recommendedRooms.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {recommendedRooms.slice(0, 3).map((rec) => {
                    const room = rooms.find((r) => r.id === rec.roomId);
                    const badge = getRoomBadge(rec.roomId);
                    if (!room || !badge) return null;
                    return (
                      <span key={rec.roomId} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium ${badge.color}`}>
                        {room.roomNumber} {badge.label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <label className="label-text">定金 (元)</label>
              <input
                type="number"
                min={0}
                value={form.deposit}
                onChange={(e) => setForm({ ...form, deposit: Number(e.target.value) })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">客户姓名</label>
              <input
                type="text"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className="input-field"
                placeholder="请输入姓名"
              />
            </div>
            <div>
              <label className="label-text">联系电话</label>
              <input
                type="tel"
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                className="input-field"
                placeholder="请输入手机号，自动识别老客"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-serif font-bold text-primary flex items-center gap-2">
                <Star className="w-4 h-4 text-gold" />
                客户偏好设置
              </h4>
              <button
                onClick={handleSavePreferences}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gold-100 text-gold-700 hover:bg-gold-200 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                保存偏好
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-text flex items-center gap-1">
                  <Coffee className="w-3.5 h-3.5 text-emerald-500" />
                  茶水偏好
                </label>
                <select
                  value={prefTea}
                  onChange={(e) => setPrefTea(e.target.value)}
                  className="select-field"
                >
                  <option value="">请选择茶水偏好</option>
                  {CUSTOMER_PREFERENCE_TEA_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-text flex items-center gap-1">
                  <Armchair className="w-3.5 h-3.5 text-sky-500" />
                  座椅偏好
                </label>
                <input
                  type="text"
                  value={prefSeat}
                  onChange={(e) => setPrefSeat(e.target.value)}
                  className="input-field"
                  placeholder="如:靠窗位、靠门位等"
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-ink-400">
              保存后，下次预约将自动备注茶水和座椅偏好
            </p>
          </div>

          <div>
            <label className="label-text">预约日期</label>
            <input
              type="date"
              value={form.date}
              min={todayStr}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">开始时间</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-text">结束时间</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="label-text">备注</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input-field resize-none"
              rows={2}
              placeholder="特殊要求等... (茶水和座椅偏好将在创建时自动追加)"
            />
            {currentCustomerPreference && (currentCustomerPreference.preferredTea || currentCustomerPreference.seatPreference) && (
              <p className="mt-1.5 text-xs text-emerald-600">
                ✓ 将自动追加: {[currentCustomerPreference.preferredTea && `茶水偏好: ${currentCustomerPreference.preferredTea}`, currentCustomerPreference.seatPreference && `座椅偏好: ${currentCustomerPreference.seatPreference}`].filter(Boolean).join('，')}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 btn-ghost">
              取消
            </button>
            <button onClick={handleSubmit} className="flex-1 btn-primary">
              {editing ? '保存修改' : '创建预约'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
