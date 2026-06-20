import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import {
  ROOM_TYPE_LABELS,
  ROOM_TYPE_ICONS,
  ROOM_STATUS_LABELS,
  type Room,
  type RoomType,
  type RoomStatus,
} from '@shared/types';
import { formatCurrency } from '@shared/utils';
import Modal from '@/components/Modal';

const statusStyles: Record<RoomStatus, string> = {
  idle: 'bg-emerald-100 text-emerald-700',
  occupied: 'bg-coral-100 text-coral-700',
  reserved: 'bg-gold-100 text-gold-700',
  cleaning: 'bg-sky-100 text-sky-700',
};

export default function Rooms() {
  const { rooms, createRoom, updateRoom, deleteRoom } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<RoomType | 'all'>('all');

  const [form, setForm] = useState({
    roomNumber: '',
    type: 'mahjong' as RoomType,
    capacity: 4,
    hourlyRate: 48,
  });

  const filtered = rooms.filter((r) => {
    const matchSearch =
      r.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
      ROOM_TYPE_LABELS[r.type].includes(search);
    const matchType = filterType === 'all' || r.type === filterType;
    return matchSearch && matchType;
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ roomNumber: '', type: 'mahjong', capacity: 4, hourlyRate: 48 });
    setModalOpen(true);
  };

  const openEdit = (room: Room) => {
    setEditing(room);
    setForm({
      roomNumber: room.roomNumber,
      type: room.type,
      capacity: room.capacity,
      hourlyRate: room.hourlyRate,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.roomNumber.trim()) return alert('请输入包间号');
    try {
      if (editing) {
        await updateRoom(editing.id, form);
      } else {
        await createRoom(form);
      }
      setModalOpen(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (room: Room) => {
    if (room.status !== 'idle') {
      return alert('当前包间状态不可删除');
    }
    if (!confirm(`确定删除包间 ${room.roomNumber}？`)) return;
    await deleteRoom(room.id);
  };

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
              placeholder="搜索包间号或类型..."
              className="input-field pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as RoomType | 'all')}
              className="select-field pl-10 pr-10 min-w-[140px]"
            >
              <option value="all">全部类型</option>
              {(Object.keys(ROOM_TYPE_LABELS) as RoomType[]).map((t) => (
                <option key={t} value={t}>
                  {ROOM_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4.5 h-4.5" />
          新增包间
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-cream-50 to-cream-100">
                <th className="text-left px-6 py-4 font-semibold text-primary">包间信息</th>
                <th className="text-left px-6 py-4 font-semibold text-primary">类型</th>
                <th className="text-left px-6 py-4 font-semibold text-primary">容纳人数</th>
                <th className="text-left px-6 py-4 font-semibold text-primary">小时单价</th>
                <th className="text-left px-6 py-4 font-semibold text-primary">状态</th>
                <th className="text-left px-6 py-4 font-semibold text-primary">创建时间</th>
                <th className="text-right px-6 py-4 font-semibold text-primary">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {filtered.map((room, idx) => (
                <tr
                  key={room.id}
                  className="hover:bg-cream-50/60 transition-colors animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.03}s` }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-50 to-cream flex items-center justify-center text-xl shadow-inner-soft">
                        {ROOM_TYPE_ICONS[room.type]}
                      </div>
                      <div>
                        <p className="font-serif font-bold text-primary text-lg">{room.roomNumber}</p>
                        <p className="text-xs text-ink-400">ID: {room.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-ink-700">{ROOM_TYPE_LABELS[room.type]}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary text-sm font-semibold">
                      👥 {room.capacity}人
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-serif font-bold text-gold-700 text-lg">
                      {formatCurrency(room.hourlyRate)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${statusStyles[room.status]}`}>
                      {ROOM_STATUS_LABELS[room.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-ink-500">
                    {new Date(room.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => openEdit(room)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-500 hover:bg-gold-100 hover:text-gold-700 transition-all"
                        title="编辑"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(room)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-500 hover:bg-coral-100 hover:text-coral transition-all"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-ink-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-5xl opacity-40">🀄</div>
                      <p>暂无包间数据</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? '编辑包间' : '新增包间'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="label-text">包间号</label>
            <input
              type="text"
              value={form.roomNumber}
              onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
              className="input-field"
              placeholder="如：A101"
            />
          </div>
          <div>
            <label className="label-text">包间类型</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as RoomType })}
              className="select-field"
            >
              {(Object.keys(ROOM_TYPE_LABELS) as RoomType[]).map((t) => (
                <option key={t} value={t}>
                  {ROOM_TYPE_ICONS[t]} {ROOM_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">容纳人数</label>
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-text">小时单价 (元)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.hourlyRate}
                onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })}
                className="input-field"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-cream-50 to-gold-50 border border-gold-200/50">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{ROOM_TYPE_ICONS[form.type]}</span>
              <div className="flex-1">
                <p className="font-medium text-primary">
                  {form.roomNumber || '包间号'} · {ROOM_TYPE_LABELS[form.type]}
                </p>
                <p className="text-sm text-ink-500">
                  容纳{form.capacity}人 · {formatCurrency(form.hourlyRate)}/小时
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 btn-ghost">
              取消
            </button>
            <button onClick={handleSubmit} className="flex-1 btn-primary">
              {editing ? '保存修改' : '创建包间'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
