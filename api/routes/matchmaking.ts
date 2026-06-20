import { Router } from 'express';
import { store } from '../store.js';
import type { RoomType, MatchmakingApplicant } from '../../shared/types.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(store.getMatchmakings());
});

router.get('/:id', (req, res) => {
  const matchmaking = store.getMatchmakingById(req.params.id);
  if (!matchmaking) return res.status(404).json({ error: '拼桌信息不存在' });
  res.json(matchmaking);
});

router.post('/', (req, res) => {
  const { roomType, hostName, hostPhone, totalPeopleNeeded, note } = req.body;
  if (!roomType || !hostName || !hostPhone || !totalPeopleNeeded) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  const validRoomTypes: RoomType[] = ['mahjong', 'poker', 'werewolf', 'script', 'ps5'];
  if (!validRoomTypes.includes(roomType)) {
    return res.status(400).json({ error: '无效的包间类型' });
  }
  const count = Number(totalPeopleNeeded);
  if (count < 2) {
    return res.status(400).json({ error: '总人数至少为2人' });
  }
  if (count > 20) {
    return res.status(400).json({ error: '总人数不能超过20人' });
  }
  const matchmaking = store.createMatchmaking({
    roomType,
    hostName,
    hostPhone,
    totalPeopleNeeded: count,
    note,
  });
  res.status(201).json(matchmaking);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const matchmaking = store.getMatchmakingById(id);
  if (!matchmaking) return res.status(404).json({ error: '拼桌信息不存在' });
  if (matchmaking.status === 'confirmed' || matchmaking.status === 'cancelled') {
    return res.status(400).json({ error: '当前状态无法修改' });
  }
  const updated = store.updateMatchmaking(id, req.body);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const matchmaking = store.getMatchmakingById(id);
  if (!matchmaking) return res.status(404).json({ error: '拼桌信息不存在' });
  if (matchmaking.status === 'confirmed') {
    return res.status(400).json({ error: '已成局的拼桌无法删除' });
  }
  const ok = store.deleteMatchmaking(id);
  if (!ok) return res.status(500).json({ error: '删除失败' });
  res.json({ success: true });
});

router.post('/:id/apply', (req, res) => {
  const { id } = req.params;
  const { name, phone, peopleCount } = req.body;
  if (!name || !phone || !peopleCount) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  const count = Number(peopleCount);
  if (count < 1) {
    return res.status(400).json({ error: '加入人数至少为1人' });
  }
  const matchmaking = store.getMatchmakingById(id);
  if (!matchmaking) return res.status(404).json({ error: '拼桌信息不存在' });
  if (matchmaking.status !== 'recruiting') {
    return res.status(400).json({ error: '当前状态不可申请加入' });
  }
  const remaining = matchmaking.totalPeopleNeeded - matchmaking.currentPeople;
  if (remaining <= 0) {
    return res.status(400).json({ error: '拼桌人数已满，暂不接受申请' });
  }
  if (count > remaining) {
    return res.status(400).json({ error: `最多还可加入 ${remaining} 人` });
  }
  const updated = store.addApplicant(id, {
    name,
    phone,
    peopleCount: count,
  });
  res.json(updated);
});

router.put('/:id/applicants/:applicantId', (req, res) => {
  const { id, applicantId } = req.params;
  const { status } = req.body;
  if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: '无效的审核状态' });
  }
  const matchmaking = store.getMatchmakingById(id);
  if (!matchmaking) return res.status(404).json({ error: '拼桌信息不存在' });
  if (matchmaking.status === 'confirmed' || matchmaking.status === 'cancelled') {
    return res.status(400).json({ error: '当前状态无法审核' });
  }
  const applicant = matchmaking.applicants.find((a) => a.id === applicantId);
  if (!applicant) return res.status(404).json({ error: '申请人不存在' });
  if (status === 'approved' && applicant.status !== 'approved') {
    const remaining = matchmaking.totalPeopleNeeded - matchmaking.currentPeople;
    if (applicant.peopleCount > remaining) {
      return res.status(400).json({ error: `人数不足，最多还可加入 ${remaining} 人` });
    }
  }
  const updated = store.updateApplicantStatus(id, applicantId, status as MatchmakingApplicant['status']);
  res.json(updated);
});

router.post('/:id/confirm', (req, res) => {
  const { id } = req.params;
  const { roomId } = req.body;
  if (!roomId) {
    return res.status(400).json({ error: '请选择包间' });
  }
  const matchmaking = store.getMatchmakingById(id);
  if (!matchmaking) return res.status(404).json({ error: '拼桌信息不存在' });
  if (matchmaking.status !== 'full') {
    return res.status(400).json({ error: '人数未满，不可成局' });
  }
  const room = store.getRoomById(roomId);
  if (!room) return res.status(404).json({ error: '包间不存在' });
  if (room.status !== 'idle') {
    return res.status(400).json({ error: '包间不可用' });
  }
  const updated = store.confirmMatchmaking(id, roomId);
  store.updateRoom(roomId, { status: 'reserved' });
  res.json(updated);
});

router.post('/:id/cancel', (req, res) => {
  const { id } = req.params;
  const matchmaking = store.getMatchmakingById(id);
  if (!matchmaking) return res.status(404).json({ error: '拼桌信息不存在' });
  if (matchmaking.status === 'confirmed') {
    return res.status(400).json({ error: '已成局的拼桌无法取消' });
  }
  const updated = store.updateMatchmaking(id, { status: 'cancelled' });
  res.json(updated);
});

export default router;
