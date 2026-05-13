import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const INITIAL_FORM = {
  first_name: '', last_name: '', national_id: '', phone: '', email: '',
  emergency_contact: '', emergency_phone: '', room_id: '', move_in_date: '',
  create_user: false, username: '', password: ''
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
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

  const openAdd = () => { setForm(INITIAL_FORM); setSelected(null); setModal('add'); };
  const openEdit = (t) => {
    setSelected(t);
    setForm({ first_name: t.first_name, last_name: t.last_name, national_id: t.national_id, phone: t.phone, email: t.email || '', emergency_contact: t.emergency_contact || '', emergency_phone: t.emergency_phone || '', room_id: t.room_id || '', move_in_date: t.move_in_date?.split('T')[0] || '', create_user: false, username: '', password: '' });
    setModal('edit');
  };
  const openDelete = (t) => { setSelected(t); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleSave = async () => {
    if (!form.first_name || !form.last_name || !form.national_id || !form.phone || !form.move_in_date) return toast.error('กรุณากรอกข้อมูลที่จำเป็น');
    if (modal === 'add' && !form.room_id) return toast.error('กรุณาเลือกห้องพัก');
    setSaving(true);
    try {
      if (modal === 'add') {
        await api.post('/tenants', form);
        toast.success('เพิ่มผู้เช่าสำเร็จ');
      } else {
        await api.put(`/tenants/${selected.id}`, form);
        toast.success('แก้ไขข้อมูลผู้เช่าสำเร็จ');
      }
      load(); closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally { setSaving(false); }
  };

  const handleCheckout = async () => {
    setSaving(true);
    try {
      await api.put(`/tenants/${selected.id}`, { is_active: false, move_out_date: new Date().toISOString().split('T')[0] });
      toast.success('บันทึกการย้ายออกสำเร็จ');
      load(); closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally { setSaving(false); }
  };

  const filtered = tenants.filter(t => !search || `${t.first_name} ${t.last_name} ${t.national_id} ${t.room_number}`.toLowerCase().includes(search.toLowerCase()));

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="filters-bar">
        <div className="search-input-wrap" style={{ maxWidth: 320 }}>
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="ค้นหาชื่อ / เลขบัตร / ห้อง" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={openAdd}>+ เพิ่มผู้เช่า</button>
      </div>

      {loading ? (
        <div className="page-loading"><span className="loading-spin" /> กำลังโหลด...</div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>ชื่อ-นามสกุล</th><th>ห้อง</th><th>เลขบัตรประชาชน</th>
                  <th>เบอร์โทร</th><th>วันเข้าพัก</th><th>ค่าเช่า</th><th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>ไม่พบผู้เช่า</td></tr>
                ) : filtered.map((t, i) => (
                  <tr key={t.id}>
                    <td className="text-muted text-sm">{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{t.first_name} {t.last_name}</div>
                      {t.email && <div className="text-xs text-muted">{t.email}</div>}
                    </td>
                    <td><span className="badge badge-occupied">ห้อง {t.room_number}</span></td>
                    <td className="text-sm">{t.national_id}</td>
                    <td className="text-sm">{t.phone}</td>
                    <td className="text-sm">{t.move_in_date ? new Date(t.move_in_date).toLocaleDateString('th-TH') : '-'}</td>
                    <td className="text-primary font-bold">฿{Number(t.monthly_rent || 0).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(t)}>✏️</button>
                        <button className="btn btn-sm btn-warning" onClick={() => { setSelected(t); setModal('checkout'); }}>📤</button>
                        <button className="btn btn-sm btn-danger" onClick={() => openDelete(t)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modal === 'add' ? '➕ เพิ่มผู้เช่า' : '✏️ แก้ไขข้อมูลผู้เช่า'}</div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">ชื่อ <span className="form-required">*</span></label>
                  <input className="form-input" value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="ชื่อจริง" />
                </div>
                <div className="form-group">
                  <label className="form-label">นามสกุล <span className="form-required">*</span></label>
                  <input className="form-input" value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="นามสกุล" />
                </div>
                <div className="form-group">
                  <label className="form-label">เลขบัตรประชาชน <span className="form-required">*</span></label>
                  <input className="form-input" value={form.national_id} onChange={e => set('national_id', e.target.value)} placeholder="13 หลัก" maxLength={13} />
                </div>
                <div className="form-group">
                  <label className="form-label">เบอร์โทรศัพท์ <span className="form-required">*</span></label>
                  <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="08X-XXX-XXXX" />
                </div>
                <div className="form-group">
                  <label className="form-label">อีเมล</label>
                  <input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">วันเข้าพัก <span className="form-required">*</span></label>
                  <input type="date" className="form-input" value={form.move_in_date} onChange={e => set('move_in_date', e.target.value)} />
                </div>
                {modal === 'add' && (
                  <div className="form-group form-full">
                    <label className="form-label">ห้องพัก <span className="form-required">*</span></label>
                    <select className="form-select" value={form.room_id} onChange={e => set('room_id', e.target.value)}>
                      <option value="">-- เลือกห้อง --</option>
                      {availableRooms.map(r => (
                        <option key={r.id} value={r.id}>ห้อง {r.room_number} (ชั้น {r.floor}) - ฿{Number(r.monthly_rent).toLocaleString()}/เดือน</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">ผู้ติดต่อฉุกเฉิน</label>
                  <input className="form-input" value={form.emergency_contact} onChange={e => set('emergency_contact', e.target.value)} placeholder="ชื่อผู้ติดต่อ" />
                </div>
                <div className="form-group">
                  <label className="form-label">เบอร์ฉุกเฉิน</label>
                  <input className="form-input" value={form.emergency_phone} onChange={e => set('emergency_phone', e.target.value)} placeholder="08X-XXX-XXXX" />
                </div>
                {modal === 'add' && (
                  <div className="form-group form-full">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.create_user} onChange={e => set('create_user', e.target.checked)} />
                      <span className="form-label" style={{ marginBottom: 0 }}>สร้างบัญชีผู้ใช้สำหรับผู้เช่า</span>
                    </label>
                  </div>
                )}
                {modal === 'add' && form.create_user && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Username <span className="form-required">*</span></label>
                      <input className="form-input" value={form.username} onChange={e => set('username', e.target.value)} placeholder="ชื่อผู้ใช้" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password <span className="form-required">*</span></label>
                      <input type="password" className="form-input" value={form.password} onChange={e => set('password', e.target.value)} placeholder="รหัสผ่าน" />
                    </div>
                  </>
                )}
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

      {/* Checkout confirm */}
      {modal === 'checkout' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">📤 บันทึกการย้ายออก</div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="confirm-icon">🚪</div>
              <p className="confirm-message">บันทึกการย้ายออกของ <strong>{selected?.first_name} {selected?.last_name}</strong> (ห้อง {selected?.room_number}) ใช่หรือไม่? ห้องจะถูกเปลี่ยนเป็น "ว่าง"</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>ยกเลิก</button>
              <button className="btn btn-warning" onClick={handleCheckout} disabled={saving}>
                {saving ? <span className="loading-spin" /> : '✅ ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {modal === 'delete' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">ยืนยันการลบ</div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="confirm-icon">🗑️</div>
              <p className="confirm-message">ต้องการลบข้อมูลผู้เช่า <strong>{selected?.first_name} {selected?.last_name}</strong> ใช่หรือไม่?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>ยกเลิก</button>
              <button className="btn btn-danger" onClick={async () => { setSaving(true); try { await api.delete(`/tenants/${selected.id}`); toast.success('ลบสำเร็จ'); load(); closeModal(); } catch(e){ toast.error(e.response?.data?.message||'เกิดข้อผิดพลาด'); } finally{ setSaving(false); }}} disabled={saving}>
                {saving ? <span className="loading-spin" /> : '🗑️ ลบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
