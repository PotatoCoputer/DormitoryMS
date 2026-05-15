import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Search, Plus, Settings, Wrench, User, CalendarDays, MessageSquare, X } from 'lucide-react';

const STATUS_TH = { pending:'รอดำเนินการ', in_progress:'กำลังดำเนินการ', resolved:'แก้ไขแล้ว', cancelled:'ยกเลิก' };
const PRIORITY_TH = { low:'ต่ำ', medium:'ปานกลาง', high:'สูง', urgent:'เร่งด่วน' };

function RequestCard({ r, isAdmin, onUpdateStatus }) {
  return (
    <div className="card" style={{ padding:16 }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
        <div style={{ width:38,height:38,borderRadius:10,background:'var(--bg-3)',border:'1px solid var(--border-2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
          <Wrench size={16} color="var(--txt-2)" />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
            <span style={{ fontWeight:600, fontSize:14 }}>{r.title}</span>
            <span className={`badge badge-${r.priority}`}><span className="badge-dot" />{PRIORITY_TH[r.priority]}</span>
            <span className={`badge badge-${r.status}`}>{STATUS_TH[r.status]}</span>
          </div>
          <div style={{ display:'flex', gap:12, fontSize:12, color:'var(--txt-3)', marginBottom:8, flexWrap:'wrap' }}>
            {isAdmin && <span style={{ display:'flex',alignItems:'center',gap:4 }}><User size={11} />{r.first_name} {r.last_name} · ห้อง {r.room_number}</span>}
            <span style={{ display:'flex',alignItems:'center',gap:4 }}><CalendarDays size={11} />{new Date(r.created_at).toLocaleDateString('th-TH')}</span>
            {r.resolved_at && <span style={{ display:'flex',alignItems:'center',gap:4,color:'#4ade80' }}>✓ แก้ไข {new Date(r.resolved_at).toLocaleDateString('th-TH')}</span>}
          </div>
          <p style={{ fontSize:13, color:'var(--txt-2)', lineHeight:1.6 }}>{r.description}</p>
          {r.admin_notes && (
            <div style={{ background:'rgba(6,182,212,.06)',border:'1px solid rgba(6,182,212,.15)',borderRadius:7,padding:'9px 12px',marginTop:10 }}>
              <div style={{ display:'flex',alignItems:'center',gap:5,fontSize:11.5,fontWeight:600,color:'#22d3ee',marginBottom:3 }}>
                <MessageSquare size={11} /> หมายเหตุจาก Admin
              </div>
              <div style={{ fontSize:12.5, color:'var(--txt-2)' }}>{r.admin_notes}</div>
            </div>
          )}
        </div>
        {isAdmin && (
          <button className="btn btn-sm btn-secondary" onClick={() => onUpdateStatus(r)} style={{ flexShrink:0 }}>
            <Settings size={12} /> อัพเดต
          </button>
        )}
      </div>
    </div>
  );
}

export default function MaintenancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title:'', description:'', priority:'medium' });
  const [statusForm, setStatusForm] = useState({ status:'', admin_notes:'' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/maintenance').then(r => setRequests(r.data.data)).catch(() => toast.error('โหลดข้อมูลล้มเหลว')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const close = () => { setModal(null); setSelected(null); };
  const openAdd = () => { setForm({ title:'',description:'',priority:'medium' }); setModal('add'); };
  const openStatus = r => { setSelected(r); setStatusForm({ status:r.status, admin_notes:r.admin_notes||'' }); setModal('status'); };

  const handleCreate = async () => {
    if (!form.title || !form.description) return toast.error('กรุณากรอกหัวข้อและรายละเอียด');
    setSaving(true);
    try { await api.post('/maintenance', form); toast.success('ส่งแจ้งซ่อมสำเร็จ'); load(); close(); }
    catch (err) { toast.error(err.response?.data?.message||'เกิดข้อผิดพลาด'); }
    finally { setSaving(false); }
  };

  const handleUpdateStatus = async () => {
    setSaving(true);
    try { await api.put(`/maintenance/${selected.id}/status`, statusForm); toast.success('อัพเดตสำเร็จ'); load(); close(); }
    catch (err) { toast.error(err.response?.data?.message||'เกิดข้อผิดพลาด'); }
    finally { setSaving(false); }
  };

  const filtered = requests.filter(r => {
    const mS = !filterStatus || r.status === filterStatus;
    const mQ = !search || `${r.title} ${r.first_name||''} ${r.last_name||''} ${r.room_number||''}`.toLowerCase().includes(search.toLowerCase());
    return mS && mQ;
  });

  const counts = { all:requests.length, pending:requests.filter(r=>r.status==='pending').length, in_progress:requests.filter(r=>r.status==='in_progress').length, resolved:requests.filter(r=>r.status==='resolved').length };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        <div className="search-wrap" style={{ maxWidth:280 }}>
          <Search size={14} style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--txt-3)' }} />
          <input className="search-input" placeholder="ค้นหา..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {[['','ทั้งหมด',counts.all],['pending','รอดำเนินการ',counts.pending],['in_progress','กำลังดำเนินการ',counts.in_progress],['resolved','แก้ไขแล้ว',counts.resolved]].map(([val,lbl,count]) => (
            <button key={val} className={`filter-btn ${filterStatus===val?'active':''}`} onClick={() => setFilterStatus(val)}>
              {lbl} <span style={{ background:'var(--bg-4)',padding:'1px 6px',borderRadius:4,fontSize:11 }}>{count}</span>
            </button>
          ))}
        </div>
        <div style={{ flex:1 }} />
        {!isAdmin && <button className="btn btn-primary" onClick={openAdd}><Plus size={14} /> แจ้งซ่อม</button>}
      </div>

      {loading ? <div className="loading-wrap"><span className="spin" /> กำลังโหลด...</div>
        : filtered.length === 0 ? (
          <div className="empty-state">
            <Wrench size={32} className="empty-icon" style={{ color:'var(--txt-3)' }} />
            <div className="empty-title">ไม่พบรายการแจ้งซ่อม</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filtered.map(r => <RequestCard key={r.id} r={r} isAdmin={isAdmin} onUpdateStatus={openStatus} />)}
          </div>
        )}

      {/* Add modal */}
      {modal === 'add' && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">แจ้งซ่อม</div>
              <button className="modal-close" onClick={close}><X size={14} /></button>
            </div>
            <div className="modal-divider" />
            <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="form-group">
                <label className="form-label">หัวข้อปัญหา <span className="form-required">*</span></label>
                <input className="form-input" value={form.title} onChange={e => setForm(p => ({...p,title:e.target.value}))} placeholder="สรุปปัญหาสั้นๆ" />
              </div>
              <div className="form-group">
                <label className="form-label">รายละเอียด <span className="form-required">*</span></label>
                <textarea className="form-textarea" value={form.description} onChange={e => setForm(p => ({...p,description:e.target.value}))} placeholder="อธิบายปัญหาให้ละเอียด..." />
              </div>
              <div className="form-group">
                <label className="form-label">ระดับความเร่งด่วน</label>
                <select className="form-select" value={form.priority} onChange={e => setForm(p => ({...p,priority:e.target.value}))}>
                  <option value="low">ต่ำ</option>
                  <option value="medium">ปานกลาง</option>
                  <option value="high">สูง</option>
                  <option value="urgent">เร่งด่วน</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={close}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? <><span className="spin" /> ส่ง...</> : <><Wrench size={13} /> ส่งแจ้งซ่อม</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status modal */}
      {modal === 'status' && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal" style={{ maxWidth:440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">อัพเดตสถานะ</div>
              <button className="modal-close" onClick={close}><X size={14} /></button>
            </div>
            <div className="modal-divider" />
            <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px' }}>
                <div style={{ fontWeight:600, marginBottom:2 }}>{selected?.title}</div>
                <div style={{ fontSize:12.5, color:'var(--txt-3)' }}>ห้อง {selected?.room_number} · {selected?.first_name} {selected?.last_name}</div>
              </div>
              <div className="form-group">
                <label className="form-label">สถานะใหม่</label>
                <select className="form-select" value={statusForm.status} onChange={e => setStatusForm(p => ({...p,status:e.target.value}))}>
                  <option value="pending">รอดำเนินการ</option>
                  <option value="in_progress">กำลังดำเนินการ</option>
                  <option value="resolved">แก้ไขแล้ว</option>
                  <option value="cancelled">ยกเลิก</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">หมายเหตุ / บันทึกการดำเนินงาน</label>
                <textarea className="form-textarea" value={statusForm.admin_notes} onChange={e => setStatusForm(p => ({...p,admin_notes:e.target.value}))} placeholder="บันทึกสิ่งที่ดำเนินการ..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={close}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleUpdateStatus} disabled={saving}>
                {saving ? <span className="spin" /> : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
