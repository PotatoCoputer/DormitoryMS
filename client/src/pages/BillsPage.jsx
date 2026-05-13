import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const STATUS_TH = { pending: 'รอชำระ', paid: 'ชำระแล้ว', overdue: 'เกินกำหนด' };

export default function BillsPage() {
  const [bills, setBills] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ tenant_id: '', room_id: '', bill_month: new Date().getMonth() + 1, bill_year: new Date().getFullYear(), water_units: '', electricity_units: '', other_fees: '0', notes: '' });
  const [statusForm, setStatusForm] = useState({ status: '', paid_date: '' });
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/bills'), api.get('/tenants')])
      .then(([br, tr]) => { setBills(br.data.data); setTenants(tr.data.data); })
      .catch(() => toast.error('โหลดข้อมูลล้มเหลว'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const getSelectedTenant = () => tenants.find(t => String(t.id) === String(form.tenant_id));

  const calcPreview = () => {
    const t = getSelectedTenant();
    if (!t) return null;
    const rent = Number(t.monthly_rent) || 0;
    const water = (Number(form.water_units) || 0) * (Number(t.water_rate) || 18);
    const elec = (Number(form.electricity_units) || 0) * (Number(t.electricity_rate) || 8);
    const other = Number(form.other_fees) || 0;
    return { rent, water, elec, other, total: rent + water + elec + other };
  };

  useEffect(() => { setPreview(calcPreview()); }, [form.tenant_id, form.water_units, form.electricity_units, form.other_fees, tenants]);

  const openAdd = () => { setForm({ tenant_id: '', room_id: '', bill_month: new Date().getMonth() + 1, bill_year: new Date().getFullYear(), water_units: '', electricity_units: '', other_fees: '0', notes: '' }); setModal('add'); };
  const openStatus = (b) => { setSelected(b); setStatusForm({ status: b.status, paid_date: b.paid_date ? b.paid_date.split('T')[0] : new Date().toISOString().split('T')[0] }); setModal('status'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleTenantChange = (id) => {
    const t = tenants.find(t => String(t.id) === String(id));
    setForm(p => ({ ...p, tenant_id: id, room_id: t?.room_id || '' }));
  };

  const handleCreate = async () => {
    if (!form.tenant_id || !form.bill_month || !form.bill_year) return toast.error('กรุณากรอกข้อมูลที่จำเป็น');
    setSaving(true);
    try {
      await api.post('/bills', form);
      toast.success('สร้างบิลสำเร็จ');
      load(); closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally { setSaving(false); }
  };

  const handleUpdateStatus = async () => {
    setSaving(true);
    try {
      await api.put(`/bills/${selected.id}/status`, statusForm);
      toast.success('อัพเดตสถานะสำเร็จ');
      load(); closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally { setSaving(false); }
  };

  const handleDelete = async (b) => {
    if (!confirm(`ลบบิลของ ${b.first_name} ${b.last_name} (${MONTHS[b.bill_month-1]} ${b.bill_year})?`)) return;
    try {
      await api.delete(`/bills/${b.id}`);
      toast.success('ลบบิลสำเร็จ');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด'); }
  };

  const filtered = bills.filter(b => {
    const matchStatus = !filterStatus || b.status === filterStatus;
    const matchSearch = !search || `${b.first_name} ${b.last_name} ${b.room_number}`.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div>
      <div className="filters-bar">
        <div className="search-input-wrap" style={{ maxWidth: 280 }}>
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="ค้นหาชื่อ / ห้อง" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['', 'pending', 'paid', 'overdue'].map(s => (
          <button key={s} className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterStatus(s)}>
            {s === '' ? 'ทั้งหมด' : STATUS_TH[s]}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={openAdd}>+ สร้างบิล</button>
      </div>

      {loading ? (
        <div className="page-loading"><span className="loading-spin" /> กำลังโหลด...</div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>ผู้เช่า</th><th>ห้อง</th><th>ประจำเดือน</th>
                  <th>ค่าเช่า</th><th>ค่าน้ำ</th><th>ค่าไฟ</th><th>รวม</th>
                  <th>กำหนดชำระ</th><th>สถานะ</th><th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={11} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>ไม่พบบิล</td></tr>
                ) : filtered.map((b, i) => (
                  <tr key={b.id}>
                    <td className="text-muted text-sm">{i+1}</td>
                    <td style={{ fontWeight: 500 }}>{b.first_name} {b.last_name}</td>
                    <td><span className="badge badge-occupied">ห้อง {b.room_number}</span></td>
                    <td>{MONTHS[b.bill_month-1]} {b.bill_year}</td>
                    <td>฿{Number(b.monthly_rent).toLocaleString()}</td>
                    <td>฿{Number(b.water_amount).toLocaleString()}</td>
                    <td>฿{Number(b.electricity_amount).toLocaleString()}</td>
                    <td className="text-primary font-bold">฿{Number(b.total_amount).toLocaleString()}</td>
                    <td className="text-sm">{b.due_date ? new Date(b.due_date).toLocaleDateString('th-TH') : '-'}</td>
                    <td><span className={`badge badge-${b.status}`}>{STATUS_TH[b.status]}</span></td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => openStatus(b)} title="เปลี่ยนสถานะ">💳</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(b)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Bill Modal */}
      {modal === 'add' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">📄 สร้างบิลรายเดือน</div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group form-full">
                  <label className="form-label">ผู้เช่า <span className="form-required">*</span></label>
                  <select className="form-select" value={form.tenant_id} onChange={e => handleTenantChange(e.target.value)}>
                    <option value="">-- เลือกผู้เช่า --</option>
                    {tenants.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name} (ห้อง {t.room_number})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">เดือน <span className="form-required">*</span></label>
                  <select className="form-select" value={form.bill_month} onChange={e => setForm(p => ({...p, bill_month: e.target.value}))}>
                    {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">ปี <span className="form-required">*</span></label>
                  <input type="number" className="form-input" value={form.bill_year} onChange={e => setForm(p => ({...p, bill_year: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">หน่วยน้ำ</label>
                  <input type="number" className="form-input" value={form.water_units} onChange={e => setForm(p => ({...p, water_units: e.target.value}))} placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">หน่วยไฟ</label>
                  <input type="number" className="form-input" value={form.electricity_units} onChange={e => setForm(p => ({...p, electricity_units: e.target.value}))} placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">ค่าอื่นๆ (฿)</label>
                  <input type="number" className="form-input" value={form.other_fees} onChange={e => setForm(p => ({...p, other_fees: e.target.value}))} placeholder="0" />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">หมายเหตุ</label>
                  <textarea className="form-textarea" value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} placeholder="หมายเหตุ..." style={{ minHeight: 60 }} />
                </div>
              </div>

              {preview && (
                <div style={{ background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:16, marginTop:8 }}>
                  <div style={{ fontWeight:600, marginBottom:10, color:'var(--text-secondary)' }}>💰 สรุปค่าใช้จ่าย</div>
                  {[
                    { l:'ค่าเช่า', v: preview.rent },
                    { l:'ค่าน้ำ', v: preview.water },
                    { l:'ค่าไฟ', v: preview.elec },
                    { l:'ค่าอื่นๆ', v: preview.other },
                  ].map(r => (
                    <div key={r.l} style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:14 }}>
                      <span style={{ color:'var(--text-secondary)' }}>{r.l}</span>
                      <span>฿{r.v.toLocaleString()}</span>
                    </div>
                  ))}
                  <hr className="divider" style={{ margin:'10px 0' }} />
                  <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700, fontSize:16 }}>
                    <span>ยอดรวม</span>
                    <span style={{ color:'var(--primary-light)' }}>฿{preview.total.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? <><span className="loading-spin" /> กำลังสร้าง...</> : '📄 สร้างบิล'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {modal === 'status' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth:420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">💳 เปลี่ยนสถานะการชำระ</div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="info-box">
                บิลของ <strong>{selected?.first_name} {selected?.last_name}</strong> ห้อง {selected?.room_number}<br/>
                ยอด: <strong style={{ color:'var(--primary-light)' }}>฿{Number(selected?.total_amount||0).toLocaleString()}</strong>
              </div>
              <div className="form-group" style={{ marginBottom:16 }}>
                <label className="form-label">สถานะ</label>
                <select className="form-select" value={statusForm.status} onChange={e => setStatusForm(p => ({...p, status: e.target.value}))}>
                  <option value="pending">รอชำระ</option>
                  <option value="paid">ชำระแล้ว</option>
                  <option value="overdue">เกินกำหนด</option>
                </select>
              </div>
              {statusForm.status === 'paid' && (
                <div className="form-group">
                  <label className="form-label">วันที่ชำระ</label>
                  <input type="date" className="form-input" value={statusForm.paid_date} onChange={e => setStatusForm(p => ({...p, paid_date: e.target.value}))} />
                </div>
              )}
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
