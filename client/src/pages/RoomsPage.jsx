import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const STATUS_LABELS = { available: 'ว่าง', occupied: 'มีผู้เช่า', maintenance: 'ปิดปรับปรุง' };
const TYPE_LABELS = { standard: 'Standard', deluxe: 'Deluxe', suite: 'Suite' };

const INITIAL_FORM = { room_number: '', floor: '', room_type: 'standard', monthly_rent: '', water_rate: '18', electricity_rate: '8', status: 'available', description: '' };

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | 'edit' | 'delete'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/rooms')
      .then(r => setRooms(r.data.data))
      .catch(() => toast.error('โหลดข้อมูลห้องพักล้มเหลว'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(INITIAL_FORM); setSelected(null); setModal('add'); };
  const openEdit = (room) => {
    setSelected(room);
    setForm({ room_number: room.room_number, floor: room.floor, room_type: room.room_type, monthly_rent: room.monthly_rent, water_rate: room.water_rate, electricity_rate: room.electricity_rate, status: room.status, description: room.description || '' });
    setModal('edit');
  };
  const openDelete = (room) => { setSelected(room); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleSave = async () => {
    if (!form.room_number || !form.floor || !form.monthly_rent) return toast.error('กรุณากรอกข้อมูลที่จำเป็น');
    setSaving(true);
    try {
      if (modal === 'add') {
        await api.post('/rooms', form);
        toast.success('เพิ่มห้องพักสำเร็จ');
      } else {
        await api.put(`/rooms/${selected.id}`, form);
        toast.success('แก้ไขห้องพักสำเร็จ');
      }
      load(); closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/rooms/${selected.id}`);
      toast.success('ลบห้องพักสำเร็จ');
      load(); closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally { setSaving(false); }
  };

  const filtered = rooms.filter(r => {
    const matchStatus = !filterStatus || r.status === filterStatus;
    const matchSearch = !search || r.room_number.includes(search) || (r.first_name && `${r.first_name} ${r.last_name}`.includes(search));
    return matchStatus && matchSearch;
  });

  return (
    <div>
      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input-wrap" style={{ maxWidth: 280 }}>
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="ค้นหาห้อง / ผู้เช่า" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['', 'available', 'occupied', 'maintenance'].map(s => (
          <button key={s} className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterStatus(s)}>
            {s === '' ? 'ทั้งหมด' : STATUS_LABELS[s]}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={openAdd}>+ เพิ่มห้องพัก</button>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'ทั้งหมด', count: rooms.length, cls: '' },
          { label: 'ว่าง', count: rooms.filter(r => r.status === 'available').length, cls: 'text-success' },
          { label: 'มีผู้เช่า', count: rooms.filter(r => r.status === 'occupied').length, cls: 'text-primary' },
          { label: 'ปิดซ่อม', count: rooms.filter(r => r.status === 'maintenance').length, cls: 'text-warning' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 20px', flex: 1, textAlign: 'center' }}>
            <div className={`stat-value ${s.cls}`} style={{ fontSize: 22 }}>{s.count}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="page-loading"><span className="loading-spin" /> กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🏠</div><p>ไม่พบห้องพัก</p></div>
      ) : (
        <div className="room-grid">
          {filtered.map(room => (
            <div key={room.id} className="room-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div className="room-number">ห้อง {room.room_number}</div>
                <span className={`badge badge-${room.status}`}>{STATUS_LABELS[room.status]}</span>
              </div>
              <div className="room-type">ชั้น {room.floor} • {TYPE_LABELS[room.room_type] || room.room_type}</div>
              <div className="room-rent">฿{Number(room.monthly_rent).toLocaleString()} <span>/เดือน</span></div>
              <div className="text-sm text-muted">น้ำ ฿{room.water_rate}/หน่วย • ไฟ ฿{room.electricity_rate}/หน่วย</div>
              {room.status === 'occupied' && room.first_name && (
                <div className="room-tenant">👤 {room.first_name} {room.last_name}</div>
              )}
              {room.description && (
                <div className="text-xs text-muted" style={{ marginTop: 6 }}>{room.description}</div>
              )}
              <div className="room-actions">
                <button className="btn btn-sm btn-secondary" style={{ flex: 1 }} onClick={() => openEdit(room)}>✏️ แก้ไข</button>
                <button className="btn btn-sm btn-danger" onClick={() => openDelete(room)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modal === 'add' ? '➕ เพิ่มห้องพัก' : '✏️ แก้ไขห้องพัก'}</div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">หมายเลขห้อง <span className="form-required">*</span></label>
                  <input className="form-input" value={form.room_number} onChange={e => setForm(p => ({...p, room_number: e.target.value}))} placeholder="เช่น 101" />
                </div>
                <div className="form-group">
                  <label className="form-label">ชั้น <span className="form-required">*</span></label>
                  <input type="number" className="form-input" value={form.floor} onChange={e => setForm(p => ({...p, floor: e.target.value}))} placeholder="1" />
                </div>
                <div className="form-group">
                  <label className="form-label">ประเภทห้อง</label>
                  <select className="form-select" value={form.room_type} onChange={e => setForm(p => ({...p, room_type: e.target.value}))}>
                    <option value="standard">Standard</option>
                    <option value="deluxe">Deluxe</option>
                    <option value="suite">Suite</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">ค่าเช่า/เดือน (฿) <span className="form-required">*</span></label>
                  <input type="number" className="form-input" value={form.monthly_rent} onChange={e => setForm(p => ({...p, monthly_rent: e.target.value}))} placeholder="3500" />
                </div>
                <div className="form-group">
                  <label className="form-label">ค่าน้ำ/หน่วย (฿)</label>
                  <input type="number" className="form-input" value={form.water_rate} onChange={e => setForm(p => ({...p, water_rate: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">ค่าไฟ/หน่วย (฿)</label>
                  <input type="number" className="form-input" value={form.electricity_rate} onChange={e => setForm(p => ({...p, electricity_rate: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">สถานะ</label>
                  <select className="form-select" value={form.status} onChange={e => setForm(p => ({...p, status: e.target.value}))}>
                    <option value="available">ว่าง</option>
                    <option value="occupied">มีผู้เช่า</option>
                    <option value="maintenance">ปิดปรับปรุง</option>
                  </select>
                </div>
                <div className="form-group form-full">
                  <label className="form-label">รายละเอียด</label>
                  <textarea className="form-textarea" value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="รายละเอียดห้องพัก..." />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="loading-spin" /> กำลังบันทึก...</> : '💾 บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {modal === 'delete' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">ยืนยันการลบ</div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="confirm-icon">🗑️</div>
              <p className="confirm-message">ต้องการลบห้อง <strong>{selected?.room_number}</strong> ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>ยกเลิก</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                {saving ? <span className="loading-spin" /> : '🗑️ ลบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
