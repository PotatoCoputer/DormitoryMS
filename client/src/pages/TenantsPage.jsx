import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Search, Plus, Pencil, Trash2, LogOut, X, Users } from 'lucide-react';

const INIT = { first_name:'',last_name:'',national_id:'',phone:'',email:'',emergency_contact:'',emergency_phone:'',room_id:'',move_in_date:'',create_user:false,username:'',password:'' };

function ConfirmModal({ title, icon: Icon, iconColor='#f87171', iconBg='rgba(239,68,68,.1)', children, onConfirm, onClose, confirmLabel='ยืนยัน', confirmClass='btn-danger', saving }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="modal-divider" />
        <div className="modal-body" style={{ textAlign: 'center', padding: '24px 20px' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Icon size={20} color={iconColor} />
          </div>
          {children}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>ยกเลิก</button>
          <button className={`btn ${confirmClass}`} onClick={onConfirm} disabled={saving}>
            {saving ? <span className="spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(INIT);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/tenants'), api.get('/rooms')])
      .then(([tr, rr]) => { setTenants(tr.data.data); setRooms(rr.data.data); })
      .catch(() => toast.error('โหลดข้อมูลล้มเหลว'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const availableRooms = rooms.filter(r => r.status === 'available');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const close = () => { setModal(null); setSelected(null); };

  const openAdd = () => { setForm(INIT); setSelected(null); setModal('add'); };
  const openEdit = t => { setSelected(t); setForm({ first_name:t.first_name,last_name:t.last_name,national_id:t.national_id,phone:t.phone,email:t.email||'',emergency_contact:t.emergency_contact||'',emergency_phone:t.emergency_phone||'',room_id:t.room_id||'',move_in_date:t.move_in_date?.split('T')[0]||'',create_user:false,username:'',password:'' }); setModal('edit'); };

  const handleSave = async () => {
    if (!form.first_name || !form.last_name || !form.national_id || !form.phone || !form.move_in_date) return toast.error('กรุณากรอกข้อมูลที่จำเป็น');
    if (modal === 'add' && !form.room_id) return toast.error('กรุณาเลือกห้องพัก');
    setSaving(true);
    try {
      if (modal === 'add') { await api.post('/tenants', form); toast.success('เพิ่มผู้เช่าสำเร็จ'); }
      else { await api.put(`/tenants/${selected.id}`, form); toast.success('แก้ไขสำเร็จ'); }
      load(); close();
    } catch (err) { toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด'); }
    finally { setSaving(false); }
  };

  const handleCheckout = async () => {
    setSaving(true);
    try { await api.put(`/tenants/${selected.id}`, { is_active:false, move_out_date:new Date().toISOString().split('T')[0] }); toast.success('บันทึกการย้ายออกสำเร็จ'); load(); close(); }
    catch (err) { toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try { await api.delete(`/tenants/${selected.id}`); toast.success('ลบสำเร็จ'); load(); close(); }
    catch (err) { toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด'); }
    finally { setSaving(false); }
  };

  const filtered = tenants.filter(t => !search || `${t.first_name} ${t.last_name} ${t.national_id} ${t.room_number}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div className="search-wrap" style={{ maxWidth: 300 }}>
          <Search size={14} style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--txt-3)' }} />
          <input className="search-input" placeholder="ค้นหาชื่อ / เลขบัตร / ห้อง" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ flex:1 }} />
        <button className="btn btn-primary" onClick={openAdd}><Plus size={14} /> เพิ่มผู้เช่า</button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-wrap"><span className="spin" /> กำลังโหลด...</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th>ห้องพัก</th>
                  <th>เลขบัตรประชาชน</th>
                  <th>เบอร์โทร</th>
                  <th>วันเข้าพัก</th>
                  <th>ค่าเช่า</th>
                  <th style={{ width: 110 }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign:'center', padding:48, color:'var(--txt-3)' }}>
                    <Users size={28} style={{ display:'block', margin:'0 auto 8px', opacity:.4 }} />
                    ไม่พบผู้เช่า
                  </td></tr>
                ) : filtered.map((t, i) => (
                  <tr key={t.id}>
                    <td style={{ color:'var(--txt-3)', fontSize:12 }}>{i+1}</td>
                    <td>
                      <div style={{ fontWeight:600 }}>{t.first_name} {t.last_name}</div>
                      {t.email && <div style={{ fontSize:11.5, color:'var(--txt-3)' }}>{t.email}</div>}
                    </td>
                    <td><span className="badge badge-occupied">ห้อง {t.room_number}</span></td>
                    <td style={{ fontSize:12.5, fontFamily:'monospace', color:'var(--txt-2)' }}>{t.national_id}</td>
                    <td style={{ fontSize:13, color:'var(--txt-2)' }}>{t.phone}</td>
                    <td style={{ fontSize:12.5, color:'var(--txt-2)' }}>{t.move_in_date ? new Date(t.move_in_date).toLocaleDateString('th-TH') : '-'}</td>
                    <td style={{ fontWeight:600, color:'var(--violet-light)' }}>฿{Number(t.monthly_rent||0).toLocaleString()}</td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(t)} title="แก้ไข"><Pencil size={12} /></button>
                        <button className="btn btn-sm btn-ghost" onClick={() => { setSelected(t); setModal('checkout'); }} title="ย้ายออก" style={{ color:'#facc15' }}><LogOut size={12} /></button>
                        <button className="btn btn-sm btn-danger" onClick={() => { setSelected(t); setModal('delete'); }} title="ลบ"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modal === 'add' ? 'เพิ่มผู้เช่าใหม่' : 'แก้ไขข้อมูลผู้เช่า'}</div>
              <button className="modal-close" onClick={close}><X size={14} /></button>
            </div>
            <div className="modal-divider" />
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label className="form-label">ชื่อ <span className="form-required">*</span></label><input className="form-input" value={form.first_name} onChange={e => set('first_name',e.target.value)} placeholder="ชื่อจริง" /></div>
                <div className="form-group"><label className="form-label">นามสกุล <span className="form-required">*</span></label><input className="form-input" value={form.last_name} onChange={e => set('last_name',e.target.value)} placeholder="นามสกุล" /></div>
                <div className="form-group"><label className="form-label">เลขบัตรประชาชน <span className="form-required">*</span></label><input className="form-input" value={form.national_id} onChange={e => set('national_id',e.target.value)} placeholder="13 หลัก" maxLength={13} /></div>
                <div className="form-group"><label className="form-label">เบอร์โทร <span className="form-required">*</span></label><input className="form-input" value={form.phone} onChange={e => set('phone',e.target.value)} placeholder="08X-XXX-XXXX" /></div>
                <div className="form-group"><label className="form-label">อีเมล</label><input type="email" className="form-input" value={form.email} onChange={e => set('email',e.target.value)} placeholder="email@example.com" /></div>
                <div className="form-group"><label className="form-label">วันเข้าพัก <span className="form-required">*</span></label><input type="date" className="form-input" value={form.move_in_date} onChange={e => set('move_in_date',e.target.value)} /></div>
                {modal === 'add' && (
                  <div className="form-group form-full"><label className="form-label">ห้องพัก <span className="form-required">*</span></label>
                    <select className="form-select" value={form.room_id} onChange={e => set('room_id',e.target.value)}>
                      <option value="">-- เลือกห้องที่ว่าง --</option>
                      {availableRooms.map(r => <option key={r.id} value={r.id}>ห้อง {r.room_number} (ชั้น {r.floor}) — ฿{Number(r.monthly_rent).toLocaleString()}/เดือน</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group"><label className="form-label">ผู้ติดต่อฉุกเฉิน</label><input className="form-input" value={form.emergency_contact} onChange={e => set('emergency_contact',e.target.value)} /></div>
                <div className="form-group"><label className="form-label">เบอร์ฉุกเฉิน</label><input className="form-input" value={form.emergency_phone} onChange={e => set('emergency_phone',e.target.value)} /></div>
                {modal === 'add' && (
                  <div className="form-group form-full">
                    <label style={{ display:'flex',alignItems:'center',gap:8,cursor:'pointer' }}>
                      <input type="checkbox" checked={form.create_user} onChange={e => set('create_user',e.target.checked)} />
                      <span className="form-label" style={{ marginBottom:0 }}>สร้างบัญชีผู้ใช้ให้ผู้เช่า</span>
                    </label>
                  </div>
                )}
                {modal === 'add' && form.create_user && (<>
                  <div className="form-group"><label className="form-label">Username <span className="form-required">*</span></label><input className="form-input" value={form.username} onChange={e => set('username',e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Password <span className="form-required">*</span></label><input type="password" className="form-input" value={form.password} onChange={e => set('password',e.target.value)} /></div>
                </>)}
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

      {modal === 'checkout' && (
        <ConfirmModal title="ย้ายออก" icon={LogOut} iconColor="#facc15" iconBg="rgba(234,179,8,.1)" onConfirm={handleCheckout} onClose={close} confirmLabel="ยืนยันย้ายออก" confirmClass="btn-warning" saving={saving}>
          <div style={{ fontWeight:600, marginBottom:6 }}>{selected?.first_name} {selected?.last_name}</div>
          <div style={{ fontSize:13, color:'var(--txt-3)' }}>ห้อง {selected?.room_number} จะถูกเปลี่ยนเป็น "ว่าง"</div>
        </ConfirmModal>
      )}

      {modal === 'delete' && (
        <ConfirmModal title="ลบผู้เช่า" icon={Trash2} onConfirm={handleDelete} onClose={close} confirmLabel="ลบ" saving={saving}>
          <div style={{ fontWeight:600, marginBottom:6 }}>{selected?.first_name} {selected?.last_name}</div>
          <div style={{ fontSize:13, color:'var(--txt-3)' }}>การดำเนินการนี้ไม่สามารถย้อนกลับได้</div>
        </ConfirmModal>
      )}
    </div>
  );
}
