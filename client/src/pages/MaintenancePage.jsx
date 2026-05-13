import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_TH = { pending: 'รอดำเนินการ', in_progress: 'กำลังดำเนินการ', resolved: 'แก้ไขแล้ว', cancelled: 'ยกเลิก' };
const PRIORITY_TH = { low: 'ต่ำ', medium: 'ปานกลาง', high: 'สูง', urgent: 'เร่งด่วน' };

export default function MaintenancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' });
  const [statusForm, setStatusForm] = useState({ status: '', admin_notes: '' });
  const [saving, setSaving] = useState(false);

  const apiPath = isAdmin ? '/maintenance' : '/maintenance';

  const load = () => {
    setLoading(true);
    api.get(apiPath)
      .then(r => setRequests(r.data.data))
      .catch(() => toast.error('โหลดข้อมูลล้มเหลว'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ title: '', description: '', priority: 'medium' }); setModal('add'); };
  const openStatus = (r) => { setSelected(r); setStatusForm({ status: r.status, admin_notes: r.admin_notes || '' }); setModal('status'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleCreate = async () => {
    if (!form.title || !form.description) return toast.error('กรุณากรอกชื่อเรื่องและรายละเอียด');
    setSaving(true);
    try {
      await api.post('/maintenance', form);
      toast.success('ส่งแจ้งซ่อมสำเร็จ');
      load(); closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally { setSaving(false); }
  };

  const handleUpdateStatus = async () => {
    setSaving(true);
    try {
      await api.put(`/maintenance/${selected.id}/status`, statusForm);
      toast.success('อัพเดตสถานะสำเร็จ');
      load(); closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally { setSaving(false); }
  };

  const filtered = requests.filter(r => {
    const matchStatus = !filterStatus || r.status === filterStatus;
    const matchSearch = !search || `${r.title} ${r.first_name} ${r.last_name} ${r.room_number}`.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div>
      <div className="filters-bar">
        <div className="search-input-wrap" style={{ maxWidth: 280 }}>
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="ค้นหา..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['', 'pending', 'in_progress', 'resolved', 'cancelled'].map(s => (
          <button key={s} className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterStatus(s)}>
            {s === '' ? 'ทั้งหมด' : STATUS_TH[s]}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {!isAdmin && <button className="btn btn-primary" onClick={openAdd}>+ แจ้งซ่อม</button>}
      </div>

      {loading ? (
        <div className="page-loading"><span className="loading-spin" /> กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🔧</div><p>ไม่พบรายการแจ้งซ่อม</p></div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {filtered.map(r => (
            <div key={r.id} className="card" style={{ padding:20 }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:6 }}>
                    <span style={{ fontWeight:600, fontSize:15 }}>{r.title}</span>
                    <span className={`badge badge-${r.priority}`}>{PRIORITY_TH[r.priority]}</span>
                    <span className={`badge badge-${r.status}`}>{STATUS_TH[r.status]}</span>
                  </div>
                  <div className="text-sm text-muted" style={{ marginBottom:8 }}>
                    {isAdmin && <><span>👤 {r.first_name} {r.last_name}</span> · <span>🏠 ห้อง {r.room_number}</span> · </>}
                    <span>📅 {new Date(r.created_at).toLocaleDateString('th-TH')}</span>
                    {r.resolved_at && <span> · ✅ แก้ไข {new Date(r.resolved_at).toLocaleDateString('th-TH')}</span>}
                  </div>
                  <p style={{ fontSize:14, color:'var(--text-secondary)', lineHeight:1.6 }}>{r.description}</p>
                  {r.admin_notes && (
                    <div style={{ background:'rgba(6,182,212,0.08)', border:'1px solid rgba(6,182,212,0.2)', borderRadius:'var(--radius-sm)', padding:'10px 14px', marginTop:10 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:'#67e8f9', marginBottom:4 }}>📝 หมายเหตุจาก Admin</div>
                      <div style={{ fontSize:13, color:'var(--text-secondary)' }}>{r.admin_notes}</div>
                    </div>
                  )}
                </div>
                {isAdmin && r.status !== 'resolved' && r.status !== 'cancelled' && (
                  <button className="btn btn-sm btn-secondary" onClick={() => openStatus(r)}>⚙️ อัพเดต</button>
                )}
                {isAdmin && (
                  <button className="btn btn-sm btn-secondary" onClick={() => openStatus(r)}>⚙️ สถานะ</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Request Modal */}
      {modal === 'add' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">🔧 แจ้งซ่อม</div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom:14 }}>
                <label className="form-label">หัวข้อ <span className="form-required">*</span></label>
                <input className="form-input" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="สรุปปัญหาสั้นๆ" />
              </div>
              <div className="form-group" style={{ marginBottom:14 }}>
                <label className="form-label">รายละเอียด <span className="form-required">*</span></label>
                <textarea className="form-textarea" value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="อธิบายปัญหาให้ละเอียด..." />
              </div>
              <div className="form-group">
                <label className="form-label">ระดับความเร่งด่วน</label>
                <select className="form-select" value={form.priority} onChange={e => setForm(p => ({...p, priority: e.target.value}))}>
                  <option value="low">🟢 ต่ำ</option>
                  <option value="medium">🟡 ปานกลาง</option>
                  <option value="high">🔴 สูง</option>
                  <option value="urgent">🚨 เร่งด่วน</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? <><span className="loading-spin" /> กำลังส่ง...</> : '📨 ส่งแจ้งซ่อม'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal (Admin) */}
      {modal === 'status' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth:460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">⚙️ อัพเดตสถานะการซ่อม</div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="info-box" style={{ marginBottom:16 }}>
                <strong>{selected?.title}</strong><br/>
                <span style={{ fontSize:13 }}>ห้อง {selected?.room_number} • {selected?.first_name} {selected?.last_name}</span>
              </div>
              <div className="form-group" style={{ marginBottom:14 }}>
                <label className="form-label">สถานะ</label>
                <select className="form-select" value={statusForm.status} onChange={e => setStatusForm(p => ({...p, status: e.target.value}))}>
                  <option value="pending">รอดำเนินการ</option>
                  <option value="in_progress">กำลังดำเนินการ</option>
                  <option value="resolved">แก้ไขแล้ว</option>
                  <option value="cancelled">ยกเลิก</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">หมายเหตุ</label>
                <textarea className="form-textarea" value={statusForm.admin_notes} onChange={e => setStatusForm(p => ({...p, admin_notes: e.target.value}))} placeholder="บันทึกการดำเนินงาน..." style={{ minHeight:80 }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleUpdateStatus} disabled={saving}>
                {saving ? <span className="loading-spin" /> : '✅ บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
