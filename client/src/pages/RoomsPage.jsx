import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Search, Plus, Pencil, Trash2, BedDouble, User, Droplets, Zap, X } from 'lucide-react';

const STATUS_LABELS = { available: 'ว่าง', occupied: 'มีผู้เช่า', maintenance: 'ปิดซ่อม' };
const TYPE_LABELS = { standard: 'Standard', deluxe: 'Deluxe', suite: 'Suite' };
const INITIAL = { room_number: '', floor: '', room_type: 'standard', monthly_rent: '', water_rate: '18', electricity_rate: '8', status: 'available', description: '' };

const statusColor = { available: '#22c55e', occupied: '#7c3aed', maintenance: '#eab308' };

function RoomCard({ room, onEdit, onDelete }) {
  return (
    <div className="room-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div className="room-num">ห้อง {room.room_number}</div>
          <div className="room-type-label">ชั้น {room.floor} · {TYPE_LABELS[room.room_type] || room.room_type}</div>
        </div>
        <span className={`badge badge-${room.status}`}>
          <span className="badge-dot" />
          {STATUS_LABELS[room.status]}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
        <div className="room-price">฿{Number(room.monthly_rent).toLocaleString()}<span style={{ fontSize: 11, color: 'var(--txt-3)', fontWeight: 400, marginLeft: 2 }}>/เดือน</span></div>
        <div style={{ display: 'flex', gap: 10, fontSize: 11.5, color: 'var(--txt-3)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Droplets size={10} /> ฿{room.water_rate}/หน่วย</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Zap size={10} /> ฿{room.electricity_rate}/หน่วย</span>
        </div>
      </div>

      {room.status === 'occupied' && room.first_name && (
        <div className="room-tenant-name">
          <User size={11} />
          {room.first_name} {room.last_name}
        </div>
      )}

      <div className="room-actions">
        <button className="btn btn-sm btn-secondary" style={{ flex: 1 }} onClick={() => onEdit(room)}>
          <Pencil size={12} /> แก้ไข
        </button>
        <button className="btn btn-sm btn-danger" onClick={() => onDelete(room)}>
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/rooms').then(r => setRooms(r.data.data)).catch(() => toast.error('โหลดข้อมูลล้มเหลว')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(INITIAL); setSelected(null); setModal('add'); };
  const openEdit = (r) => { setSelected(r); setForm({ room_number: r.room_number, floor: r.floor, room_type: r.room_type, monthly_rent: r.monthly_rent, water_rate: r.water_rate, electricity_rate: r.electricity_rate, status: r.status, description: r.description || '' }); setModal('edit'); };
  const openDelete = (r) => { setSelected(r); setModal('delete'); };
  const close = () => { setModal(null); setSelected(null); };

  const handleSave = async () => {
    if (!form.room_number || !form.floor || !form.monthly_rent) return toast.error('กรุณากรอกข้อมูลที่จำเป็น');
    setSaving(true);
    try {
      if (modal === 'add') { await api.post('/rooms', form); toast.success('เพิ่มห้องพักสำเร็จ'); }
      else { await api.put(`/rooms/${selected.id}`, form); toast.success('แก้ไขสำเร็จ'); }
      load(); close();
    } catch (err) { toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try { await api.delete(`/rooms/${selected.id}`); toast.success('ลบสำเร็จ'); load(); close(); }
    catch (err) { toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด'); }
    finally { setSaving(false); }
  };

  const filtered = rooms.filter(r => {
    const matchS = !filterStatus || r.status === filterStatus;
    const matchQ = !search || r.room_number.includes(search) || `${r.first_name || ''} ${r.last_name || ''}`.toLowerCase().includes(search.toLowerCase());
    return matchS && matchQ;
  });

  const counts = {
    all: rooms.length,
    available: rooms.filter(r => r.status === 'available').length,
    occupied: rooms.filter(r => r.status === 'occupied').length,
    maintenance: rooms.filter(r => r.status === 'maintenance').length,
  };

  const inp = (field) => ({ className: 'form-input', value: form[field], onChange: e => setForm(p => ({ ...p, [field]: e.target.value })) });
  const sel = (field) => ({ className: 'form-select', value: form[field], onChange: e => setForm(p => ({ ...p, [field]: e.target.value })) });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="search-wrap" style={{ maxWidth: 260 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-3)' }} />
          <input className="search-input" placeholder="ค้นหาห้องหรือผู้เช่า..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[['', 'ทั้งหมด', counts.all], ['available', 'ว่าง', counts.available], ['occupied', 'มีผู้เช่า', counts.occupied], ['maintenance', 'ปิดซ่อม', counts.maintenance]].map(([val, lbl, count]) => (
            <button key={val} className={`filter-btn ${filterStatus === val ? 'active' : ''}`} onClick={() => setFilterStatus(val)}>
              {lbl} <span style={{ background: 'var(--bg-4)', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>{count}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={openAdd}><Plus size={14} /> เพิ่มห้องพัก</button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="loading-wrap"><span className="spin" /> กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <BedDouble size={36} className="empty-icon" style={{ color: 'var(--txt-3)' }} />
          <div className="empty-title">ไม่พบห้องพัก</div>
          <div className="empty-desc">ลองเปลี่ยนตัวกรองหรือเพิ่มห้องพักใหม่</div>
        </div>
      ) : (
        <div className="room-grid">
          {filtered.map(room => <RoomCard key={room.id} room={room} onEdit={openEdit} onDelete={openDelete} />)}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modal === 'add' ? 'เพิ่มห้องพัก' : 'แก้ไขห้องพัก'}</div>
              <button className="modal-close" onClick={close}><X size={14} /></button>
            </div>
            <div className="modal-divider" />
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">หมายเลขห้อง <span className="form-required">*</span></label>
                  <input {...inp('room_number')} placeholder="101" />
                </div>
                <div className="form-group">
                  <label className="form-label">ชั้น <span className="form-required">*</span></label>
                  <input type="number" {...inp('floor')} placeholder="1" />
                </div>
                <div className="form-group">
                  <label className="form-label">ประเภทห้อง</label>
                  <select {...sel('room_type')}>
                    <option value="standard">Standard</option>
                    <option value="deluxe">Deluxe</option>
                    <option value="suite">Suite</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">ค่าเช่า/เดือน (฿) <span className="form-required">*</span></label>
                  <input type="number" {...inp('monthly_rent')} placeholder="3500" />
                </div>
                <div className="form-group">
                  <label className="form-label">ค่าน้ำ/หน่วย (฿)</label>
                  <input type="number" {...inp('water_rate')} />
                </div>
                <div className="form-group">
                  <label className="form-label">ค่าไฟ/หน่วย (฿)</label>
                  <input type="number" {...inp('electricity_rate')} />
                </div>
                <div className="form-group">
                  <label className="form-label">สถานะ</label>
                  <select {...sel('status')}>
                    <option value="available">ว่าง</option>
                    <option value="occupied">มีผู้เช่า</option>
                    <option value="maintenance">ปิดซ่อม</option>
                  </select>
                </div>
                <div className="form-group form-full">
                  <label className="form-label">รายละเอียด</label>
                  <textarea className="form-textarea" {...{ value: form.description, onChange: e => setForm(p => ({ ...p, description: e.target.value })) }} placeholder="รายละเอียดเพิ่มเติม..." />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={close}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spin" /> บันทึก...</> : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal === 'delete' && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">ยืนยันการลบ</div>
              <button className="modal-close" onClick={close}><X size={14} /></button>
            </div>
            <div className="modal-divider" />
            <div className="modal-body" style={{ textAlign: 'center', padding: '24px 20px' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(239,68,68,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Trash2 size={20} color="#f87171" />
              </div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>ลบห้อง {selected?.room_number}?</div>
              <div style={{ fontSize: 13, color: 'var(--txt-3)' }}>การดำเนินการนี้ไม่สามารถย้อนกลับได้</div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={close}>ยกเลิก</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                {saving ? <span className="spin" /> : <><Trash2 size={12} /> ลบ</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
