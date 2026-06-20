import { useState, useMemo } from 'react';
import {
  Plus,
  Users,
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  User,
  Trash2,
  X,
  Search,
  Lock,
  Sparkles,
  Filter,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import {
  ROOM_TYPE_LABELS,
  ROOM_TYPE_ICONS,
  MATCHMAKING_STATUS_LABELS,
  APPLICANT_STATUS_LABELS,
  type RoomType,
  type Matchmaking,
  type MatchmakingStatus,
} from '@shared/types';
import { formatCurrency, formatTime } from '@shared/utils';
import Modal from '@/components/Modal';

const statusStyles: Record<MatchmakingStatus, string> = {
  recruiting: 'bg-emerald-100 text-emerald-700',
  full: 'bg-sky-100 text-sky-700',
  confirmed: 'bg-gold-100 text-gold-700',
  cancelled: 'bg-ink-100 text-ink-500',
};

const applicantStatusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-ink-100 text-ink-500',
};

export default function Matchmaking() {
  const {
    matchmakings,
    rooms,
    createMatchmaking,
    deleteMatchmaking,
    applyMatchmaking,
    updateApplicantStatus,
    confirmMatchmaking,
    cancelMatchmaking,
  } = useStore();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedMatchmaking, setSelectedMatchmaking] = useState<Matchmaking | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<MatchmakingStatus | 'all'>('all');
  const [filterRoomType, setFilterRoomType] = useState<RoomType | 'all'>('all');

  const [createForm, setCreateForm] = useState({
    roomType: 'mahjong' as RoomType,
    hostName: '',
    hostPhone: '',
    totalPeopleNeeded: 4,
    note: '',
  });

  const [applyForm, setApplyForm] = useState({
    name: '',
    phone: '',
    peopleCount: 1,
  });

  const [confirmRoomId, setConfirmRoomId] = useState('');

  const filteredMatchmakings = useMemo(
    () =>
      [...matchmakings]
        .filter((m) => {
          const matchSearch =
            m.hostName.includes(search) ||
            m.hostPhone.includes(search) ||
            m.note?.includes(search);
          const matchStatus = filterStatus === 'all' || m.status === filterStatus;
          const matchRoomType = filterRoomType === 'all' || m.roomType === filterRoomType;
          return matchSearch && matchStatus && matchRoomType;
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [matchmakings, search, filterStatus, filterRoomType]
  );

  const openDetail = (m: Matchmaking) => {
    setSelectedMatchmaking(m);
    setDetailModalOpen(true);
  };

  const openApply = (m: Matchmaking) => {
    setSelectedMatchmaking(m);
    setApplyForm({ name: '', phone: '', peopleCount: 1 });
    setApplyModalOpen(true);
  };

  const openConfirm = (m: Matchmaking) => {
    setSelectedMatchmaking(m);
    const availableRoom = rooms.find((r) => r.status === 'idle' && r.type === m.roomType);
    setConfirmRoomId(availableRoom?.id || '');
    setConfirmModalOpen(true);
  };

  const handleCreate = async () => {
    if (!createForm.hostName.trim()) return alert('请输入发起人姓名');
    if (!createForm.hostPhone.trim()) return alert('请输入联系电话');
    if (createForm.totalPeopleNeeded < 2) return alert('总人数至少为2人');
    try {
      await createMatchmaking(createForm);
      setCreateModalOpen(false);
      setCreateForm({
        roomType: 'mahjong',
        hostName: '',
        hostPhone: '',
        totalPeopleNeeded: 4,
        note: '',
      });
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleApply = async () => {
    if (!selectedMatchmaking) return;
    if (!applyForm.name.trim()) return alert('请输入姓名');
    if (!applyForm.phone.trim()) return alert('请输入联系电话');
    if (applyForm.peopleCount < 1) return alert('人数至少为1人');
    try {
      await applyMatchmaking(selectedMatchmaking.id, applyForm);
      setApplyModalOpen(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleConfirm = async () => {
    if (!selectedMatchmaking || !confirmRoomId) return;
    try {
      await confirmMatchmaking(selectedMatchmaking.id, confirmRoomId);
      setConfirmModalOpen(false);
      setDetailModalOpen(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const availableRoomsForConfirm = rooms.filter(
    (r) => r.status === 'idle' && r.type === selectedMatchmaking?.roomType
  );

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
              placeholder="搜索发起人/电话/备注..."
              className="input-field pl-10"
            />
          </div>
          <select
            value={filterRoomType}
            onChange={(e) => setFilterRoomType(e.target.value as RoomType | 'all')}
            className="select-field min-w-[140px]"
          >
            <option value="all">全部类型</option>
            {(Object.keys(ROOM_TYPE_LABELS) as RoomType[]).map((t) => (
              <option key={t} value={t}>
                {ROOM_TYPE_ICONS[t]} {ROOM_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as MatchmakingStatus | 'all')}
            className="select-field min-w-[140px]"
          >
            <option value="all">全部状态</option>
            {(Object.keys(MATCHMAKING_STATUS_LABELS) as MatchmakingStatus[]).map((s) => (
              <option key={s} value={s}>
                {MATCHMAKING_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4.5 h-4.5" />
          发布拼桌
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredMatchmakings.map((m, idx) => {
          const progress = Math.min(100, (m.currentPeople / m.totalPeopleNeeded) * 100);
          const assignedRoom = rooms.find((r) => r.id === m.roomId);
          return (
            <div
              key={m.id}
              className="card p-5 hover:shadow-gold transition-all animate-fade-in-up cursor-pointer"
              style={{ animationDelay: `${idx * 0.03}s` }}
              onClick={() => openDetail(m)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-50 to-cream flex items-center justify-center text-2xl">
                    {ROOM_TYPE_ICONS[m.roomType]}
                  </div>
                  <div>
                    <p className="font-serif font-bold text-primary text-lg">
                      {ROOM_TYPE_LABELS[m.roomType]}
                    </p>
                    <p className="text-xs text-ink-400">
                      {formatTime(m.createdAt)} 发布
                    </p>
                  </div>
                </div>
                <span className={`badge ${statusStyles[m.status]}`}>
                  {MATCHMAKING_STATUS_LABELS[m.status]}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-ink-600 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-gold" />
                    拼桌进度
                  </span>
                  <span className="font-serif font-bold text-primary">
                    {m.currentPeople}/{m.totalPeopleNeeded}人
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-cream-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      m.status === 'cancelled'
                        ? 'bg-ink-300'
                        : progress >= 100
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                        : 'bg-gradient-to-r from-gold to-amber-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-ink-400 mt-1.5">
                  还差 {Math.max(0, m.totalPeopleNeeded - m.currentPeople)} 人即可成局
                </p>
              </div>

              <div className="space-y-1.5 text-sm text-ink-600 mb-4">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-gold" />
                  发起人：{m.hostName}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gold" />
                  {m.hostPhone}
                </div>
                {assignedRoom && (
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-gold" />
                    已锁定包间：{assignedRoom.roomNumber}
                  </div>
                )}
              </div>

              {m.note && (
                <div className="p-3 rounded-xl bg-cream-50 border border-cream-200 mb-4">
                  <p className="text-xs text-ink-500">
                    <Sparkles className="w-3 h-3 inline text-gold mr-1" />
                    {m.note}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-cream-200" onClick={(e) => e.stopPropagation()}>
                {(m.status === 'recruiting' || m.status === 'full') && (
                  <>
                    <button
                      onClick={() => openApply(m)}
                      className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      申请加入
                    </button>
                    {m.status === 'full' && (
                      <button
                        onClick={() => openConfirm(m)}
                        className="flex-1 btn-primary text-sm py-2 flex items-center justify-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        确认成局
                      </button>
                    )}
                  </>
                )}
                {(m.status === 'recruiting' || m.status === 'full') && (
                  <button
                    onClick={async () => {
                      if (!confirm('确定取消此拼桌？')) return;
                      await cancelMatchmaking(m.id);
                    }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-400 hover:bg-coral-100 hover:text-coral transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {m.status === 'confirmed' && (
                  <div className="flex-1 text-center py-2 text-sm font-medium text-gold-700">
                    🎉 已成局，包间已锁定
                  </div>
                )}
                {m.status === 'cancelled' && (
                  <div className="flex-1 text-center py-2 text-sm font-medium text-ink-400">
                    已取消
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredMatchmakings.length === 0 && (
        <div className="card p-16 text-center">
          <div className="text-6xl opacity-40 mb-4">🤝</div>
          <h3 className="font-serif text-xl font-bold text-primary mb-2">暂无拼桌信息</h3>
          <p className="text-ink-400 mb-6">点击上方按钮发布第一个拼桌信息吧</p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4.5 h-4.5" />
            发布拼桌
          </button>
        </div>
      )}

      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="发布拼桌信息"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">包间类型</label>
              <select
                value={createForm.roomType}
                onChange={(e) => setCreateForm({ ...createForm, roomType: e.target.value as RoomType })}
                className="select-field"
              >
                {(Object.keys(ROOM_TYPE_LABELS) as RoomType[]).map((t) => (
                  <option key={t} value={t}>
                    {ROOM_TYPE_ICONS[t]} {ROOM_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-text">总共需要人数</label>
              <input
                type="number"
                min={2}
                value={createForm.totalPeopleNeeded}
                onChange={(e) => setCreateForm({ ...createForm, totalPeopleNeeded: Number(e.target.value) })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">发起人姓名</label>
              <input
                type="text"
                value={createForm.hostName}
                onChange={(e) => setCreateForm({ ...createForm, hostName: e.target.value })}
                className="input-field"
                placeholder="请输入姓名"
              />
            </div>
            <div>
              <label className="label-text">联系电话</label>
              <input
                type="tel"
                value={createForm.hostPhone}
                onChange={(e) => setCreateForm({ ...createForm, hostPhone: e.target.value })}
                className="input-field"
                placeholder="请输入手机号"
              />
            </div>
          </div>

          <div>
            <label className="label-text">备注（选填）</label>
            <textarea
              value={createForm.note}
              onChange={(e) => setCreateForm({ ...createForm, note: e.target.value })}
              className="input-field resize-none"
              rows={2}
              placeholder="游戏规则、特殊要求等..."
            />
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-gold-50 to-amber-50 border border-gold-200/50">
            <p className="text-sm text-ink-600">
              <span className="font-semibold text-gold-700">💡 温馨提示：</span>
              发布后其他客人可以申请加入，人数达到 {createForm.totalPeopleNeeded} 人后即可确认成局并锁定包间。
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setCreateModalOpen(false)} className="flex-1 btn-ghost">
              取消
            </button>
            <button onClick={handleCreate} className="flex-1 btn-primary">
              发布拼桌
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title="申请加入拼桌"
        size="sm"
      >
        <div className="space-y-4">
          {selectedMatchmaking && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cream-50 to-gold-50 border border-gold-200/50">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{ROOM_TYPE_ICONS[selectedMatchmaking.roomType]}</span>
                <div>
                  <p className="font-serif font-bold text-primary">
                    {ROOM_TYPE_LABELS[selectedMatchmaking.roomType]} 拼桌
                  </p>
                  <p className="text-xs text-ink-500">
                    发起人：{selectedMatchmaking.hostName} · 当前 {selectedMatchmaking.currentPeople}/{selectedMatchmaking.totalPeopleNeeded} 人
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="label-text">您的姓名</label>
            <input
              type="text"
              value={applyForm.name}
              onChange={(e) => setApplyForm({ ...applyForm, name: e.target.value })}
              className="input-field"
              placeholder="请输入姓名"
            />
          </div>
          <div>
            <label className="label-text">联系电话</label>
            <input
              type="tel"
              value={applyForm.phone}
              onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
              className="input-field"
              placeholder="请输入手机号"
            />
          </div>
          <div>
            <label className="label-text">加入人数</label>
            <input
              type="number"
              min={1}
              value={applyForm.peopleCount}
              onChange={(e) => setApplyForm({ ...applyForm, peopleCount: Number(e.target.value) })}
              className="input-field"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setApplyModalOpen(false)} className="flex-1 btn-ghost">
              取消
            </button>
            <button onClick={handleApply} className="flex-1 btn-primary">
              提交申请
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="拼桌详情"
        size="lg"
      >
        {selectedMatchmaking && (
          <div className="space-y-5">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-cream-50 to-gold-50 border border-gold-200/50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-50 to-cream flex items-center justify-center text-3xl">
                    {ROOM_TYPE_ICONS[selectedMatchmaking.roomType]}
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-primary">
                      {ROOM_TYPE_LABELS[selectedMatchmaking.roomType]} 拼桌
                    </h3>
                    <p className="text-sm text-ink-500 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      发布于 {formatTime(selectedMatchmaking.createdAt)}
                    </p>
                  </div>
                </div>
                <span className={`badge ${statusStyles[selectedMatchmaking.status]}`}>
                  {MATCHMAKING_STATUS_LABELS[selectedMatchmaking.status]}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-xl bg-white/70">
                  <p className="text-xs text-ink-500 mb-1">发起人</p>
                  <p className="font-semibold text-primary">{selectedMatchmaking.hostName}</p>
                  <p className="text-xs text-ink-400">{selectedMatchmaking.hostPhone}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/70">
                  <p className="text-xs text-ink-500 mb-1">当前进度</p>
                  <p className="font-serif text-xl font-bold text-primary">
                    {selectedMatchmaking.currentPeople}/{selectedMatchmaking.totalPeopleNeeded}
                  </p>
                  <p className="text-xs text-ink-400">还差 {Math.max(0, selectedMatchmaking.totalPeopleNeeded - selectedMatchmaking.currentPeople)} 人</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/70">
                  <p className="text-xs text-ink-500 mb-1">申请人数</p>
                  <p className="font-serif text-xl font-bold text-gold-700">
                    {selectedMatchmaking.applicants.length}
                  </p>
                  <p className="text-xs text-ink-400">
                    {selectedMatchmaking.applicants.filter((a) => a.status === 'pending').length} 人待审核
                  </p>
                </div>
              </div>
            </div>

            {selectedMatchmaking.note && (
              <div className="p-4 rounded-xl bg-cream-50 border border-cream-200">
                <p className="text-sm text-ink-600">
                  <span className="font-semibold text-primary">备注：</span>
                  {selectedMatchmaking.note}
                </p>
              </div>
            )}

            <div>
              <h4 className="font-serif text-lg font-bold text-primary mb-3 flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-gold" />
                申请人列表
              </h4>
              <div className="space-y-2">
                {selectedMatchmaking.applicants.length === 0 && (
                  <div className="py-8 text-center text-ink-400 text-sm">
                    暂无申请人
                  </div>
                )}
                {selectedMatchmaking.applicants.map((applicant) => (
                  <div
                    key={applicant.id}
                    className="p-4 rounded-xl bg-white/60 border border-cream-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-50 to-cream flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-primary">{applicant.name}</p>
                        <p className="text-xs text-ink-400 flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {applicant.phone}
                          <span className="mx-1">·</span>
                          {applicant.peopleCount}人加入
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${applicantStatusColors[applicant.status]}`}>
                        {APPLICANT_STATUS_LABELS[applicant.status]}
                      </span>
                      {(selectedMatchmaking.status === 'recruiting' || selectedMatchmaking.status === 'full') &&
                        applicant.status === 'pending' && (
                          <>
                            <button
                              onClick={async () => {
                                await updateApplicantStatus(selectedMatchmaking.id, applicant.id, 'approved');
                              }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors"
                              title="通过"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                await updateApplicantStatus(selectedMatchmaking.id, applicant.id, 'rejected');
                              }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-ink-100 transition-colors"
                              title="拒绝"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-cream-200">
              <button onClick={() => setDetailModalOpen(false)} className="flex-1 btn-ghost">
                关闭
              </button>
              {(selectedMatchmaking.status === 'recruiting' || selectedMatchmaking.status === 'full') && (
                <button
                  onClick={() => {
                    setDetailModalOpen(false);
                    openApply(selectedMatchmaking);
                  }}
                  className="btn-secondary flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  添加申请人
                </button>
              )}
              {selectedMatchmaking.status === 'full' && (
                <button
                  onClick={() => {
                    setDetailModalOpen(false);
                    openConfirm(selectedMatchmaking);
                  }}
                  className="btn-primary flex items-center gap-1.5"
                >
                  <Lock className="w-4 h-4" />
                  确认成局
                </button>
              )}
              {(selectedMatchmaking.status === 'recruiting' || selectedMatchmaking.status === 'full') && (
                <button
                  onClick={async () => {
                    if (!confirm('确定取消此拼桌？')) return;
                    await cancelMatchmaking(selectedMatchmaking.id);
                    setDetailModalOpen(false);
                  }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-ink-400 hover:bg-coral-100 hover:text-coral transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="确认成局并锁定包间"
        size="sm"
      >
        {selectedMatchmaking && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-gold-50 to-amber-50 border border-gold-200/50">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{ROOM_TYPE_ICONS[selectedMatchmaking.roomType]}</span>
                <div>
                  <p className="font-serif font-bold text-primary">
                    {ROOM_TYPE_LABELS[selectedMatchmaking.roomType]} 拼桌
                  </p>
                  <p className="text-xs text-ink-500">
                    {selectedMatchmaking.currentPeople}/{selectedMatchmaking.totalPeopleNeeded} 人 · 发起人 {selectedMatchmaking.hostName}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="label-text">选择包间锁定</label>
              <select
                value={confirmRoomId}
                onChange={(e) => setConfirmRoomId(e.target.value)}
                className="select-field"
              >
                <option value="">请选择空闲包间</option>
                {availableRoomsForConfirm.map((r) => (
                  <option key={r.id} value={r.id}>
                    {ROOM_TYPE_ICONS[r.type]} {r.roomNumber} - {ROOM_TYPE_LABELS[r.type]} ({r.capacity}人 · {formatCurrency(r.hourlyRate)}/时)
                  </option>
                ))}
              </select>
              {availableRoomsForConfirm.length === 0 && (
                <p className="text-xs text-coral mt-1.5">暂无可用的{ROOM_TYPE_LABELS[selectedMatchmaking.roomType]}包间</p>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200">
              <p className="text-sm text-ink-600">
                <span className="font-semibold text-gold-700">⚠️ 确认成局后：</span>
              </p>
              <ul className="text-xs text-ink-500 mt-2 space-y-1 list-disc list-inside">
                <li>所选包间将被标记为已预约状态</li>
                <li>拼桌状态将变为"已成局"</li>
                <li>无法再修改申请信息</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setConfirmModalOpen(false)} className="flex-1 btn-ghost">
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={!confirmRoomId}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                确认锁定包间
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
