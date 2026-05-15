import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Search, Plus, CreditCard, Trash2, X, FileText, Droplets, Zap, Receipt, CalendarDays, Users, List } from 'lucide-react';

const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const MONTHS_S = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const STATUS_TH = { pending:'รอชำระ', paid:'ชำระแล้ว', overdue:'เกินกำหนด' };
const INIT_FORM = { tenant_id:'', room_id:'', bill_month: new Date().getMonth()+1, bill_year: new Date().getFullYear(), water_units:'', electricity_units:'', other_fees:'0', notes:'' };

function PreviewBox({ preview }) {
  if (!preview) return null;
  const rows = [['ค่าเช่า', preview.rent], ['ค่าน้ำ', preview.water], ['ค่าไฟ', preview.elec], ['ค่าอื่นๆ', preview.other]];
  return (
    <div style={{ background:'var(--bg-3)', border:'1px solid var(--border-2)', borderRadius:8, padding:14, marginTop:12 }}>
      <div style={{ fontSize:11.5, fontWeight:600, color:'var(--txt-3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:10 }}>สรุปค่าใช้จ่าย</div>
      {rows.map(([l,v]) => (
        <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:5 }}>
          <span style={{ color:'var(--txt-2)' }}>{l}</span>
          <span>฿{v.toLocaleString()}</span>
        </div>
      ))}
      <div style={{ borderTop:'1px solid var(--border)', marginTop:8, paddingTop:8, display:'flex', justifyContent:'space-between', fontWeight:700, fontSize:15 }}>
        <span>ยอดรวม</span>
        <span style={{ color:'var(--violet-light)' }}>฿{preview.total.toLocaleString()}</span>
      </div>
    </div>
  );
}

function BillRow({ b, i, onStatus, onDelete }) {
  return (
    <tr key={b.id}>
      <td style={{ color:'var(--txt-3)',fontSize:12 }}>{i+1}</td>
      <td style={{ fontWeight:600 }}>{b.first_name} {b.last_name}</td>
      <td><span className="badge badge-occupied">ห้อง {b.room_number}</span></td>
      <td style={{ color:'var(--txt-2)',fontSize:12.5 }}>{MONTHS_S[b.bill_month-1]} {b.bill_year}</td>
      <td style={{ color:'var(--txt-2)' }}>฿{Number(b.monthly_rent).toLocaleString()}</td>
      <td style={{ color:'var(--txt-2)',fontSize:12.5 }}>฿{(Number(b.water_amount)+Number(b.electricity_amount)).toLocaleString()}</td>
      <td style={{ fontWeight:700, color:'var(--violet-light)' }}>฿{Number(b.total_amount).toLocaleString()}</td>
      <td style={{ fontSize:12.5, color:'var(--txt-2)' }}>{b.due_date ? new Date(b.due_date).toLocaleDateString('th-TH') : '-'}</td>
      <td><span className={`badge badge-${b.status}`}>{STATUS_TH[b.status]}</span></td>
      <td>
        <div style={{ display:'flex', gap:4 }}>
          <button className="btn btn-sm btn-secondary" onClick={() => onStatus(b)} title="เปลี่ยนสถานะ"><CreditCard size={12} /></button>
          <button className="btn btn-sm btn-danger" onClick={() => onDelete(b)} title="ลบ"><Trash2 size={12} /></button>
        </div>
      </td>
    </tr>
  );
}

export default function BillsPage() {
  const [bills, setBills] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grouped'
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(INIT_FORM);
  const [statusForm, setStatusForm] = useState({ status:'', paid_date:'' });
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

  const calcPreview = (f, ts) => {
    const t = ts.find(t => String(t.id) === String(f.tenant_id));
    if (!t) return null;
    const rent = Number(t.monthly_rent)||0, water=(Number(f.water_units)||0)*(Number(t.water_rate)||18), elec=(Number(f.electricity_units)||0)*(Number(t.electricity_rate)||8), other=Number(f.other_fees)||0;
    return { rent, water, elec, other, total: rent+water+elec+other };
  };
  useEffect(() => { setPreview(calcPreview(form, tenants)); }, [form.tenant_id, form.water_units, form.electricity_units, form.other_fees, tenants]);

  const close = () => { setModal(null); setSelected(null); };
  const openAdd = () => { setForm(INIT_FORM); setModal('add'); };
  const openStatus = b => { setSelected(b); setStatusForm({ status:b.status, paid_date:b.paid_date?b.paid_date.split('T')[0]:new Date().toISOString().split('T')[0] }); setModal('status'); };
  const handleTenantChange = id => {
    const t = tenants.find(t => String(t.id) === String(id));
    setForm(p => ({ ...p, tenant_id:id, room_id:t?.room_id||'' }));
  };

  const handleCreate = async () => {
    if (!form.tenant_id || !form.bill_month || !form.bill_year) return toast.error('กรุณาเลือกผู้เช่าและระบุเดือน');
    setSaving(true);
    try { await api.post('/bills', form); toast.success('สร้างบิลสำเร็จ'); load(); close(); }
    catch (err) { toast.error(err.response?.data?.message||'เกิดข้อผิดพลาด'); }
    finally { setSaving(false); }
  };

  const handleUpdateStatus = async () => {
    setSaving(true);
    try { await api.put(`/bills/${selected.id}/status`, statusForm); toast.success('อัพเดตสถานะสำเร็จ'); load(); close(); }
    catch (err) { toast.error(err.response?.data?.message||'เกิดข้อผิดพลาด'); }
    finally { setSaving(false); }
  };

  const handleDelete = async b => {
    if (!window.confirm(`ลบบิลของ ${b.first_name} ${b.last_name}?`)) return;
    try { await api.delete(`/bills/${b.id}`); toast.success('ลบบิลสำเร็จ'); load(); }
    catch (err) { toast.error(err.response?.data?.message||'เกิดข้อผิดพลาด'); }
  };

  // ── Filtered list ────────────────────────────────────────────
  const filtered = bills.filter(b => {
    const mS = !filterStatus || b.status === filterStatus;
    const mQ = !search || `${b.first_name} ${b.last_name} ${b.room_number}`.toLowerCase().includes(search.toLowerCase());
    const mM = !filterMonth || String(b.bill_month) === String(filterMonth);
    const mY = !filterYear || String(b.bill_year) === String(filterYear);
    return mS && mQ && mM && mY;
  });

  // ── Grouped by tenant ────────────────────────────────────────
  const grouped = filtered.reduce((acc, b) => {
    const key = `${b.first_name} ${b.last_name}`;
    if (!acc[key]) acc[key] = { name: key, room: b.room_number, bills: [] };
    acc[key].bills.push(b);
    return acc;
  }, {});

  const counts = { all:bills.length, pending:bills.filter(b=>b.status==='pending').length, paid:bills.filter(b=>b.status==='paid').length, overdue:bills.filter(b=>b.status==='overdue').length };
  const set = (k,v) => setForm(p => ({...p,[k]:v}));

  // ── Year options from existing bills ─────────────────────────
  const yearOptions = [...new Set(bills.map(b => b.bill_year))].sort((a,b) => b-a);

  const tableHead = (
    <thead>
      <tr><th>#</th><th>ผู้เช่า</th><th>ห้อง</th><th>เดือน</th><th>ค่าเช่า</th><th>น้ำ+ไฟ</th><th>ยอดรวม</th><th>กำหนดชำระ</th><th>สถานะ</th><th style={{width:80}}>จัดการ</th></tr>
    </thead>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* ── Toolbar ── */}
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>

        {/* Search */}
        <div className="search-wrap" style={{ maxWidth:220 }}>
          <Search size={14} style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--txt-3)' }} />
          <input className="search-input" placeholder="ค้นหาชื่อ / ห้อง" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Month filter */}
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <CalendarDays size={13} color="var(--txt-3)" />
          <select
            className="form-select"
            style={{ padding:'5px 10px', fontSize:12.5, width:'auto' }}
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
          >
            <option value="">ทุกเดือน</option>
            {MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select
            className="form-select"
            style={{ padding:'5px 10px', fontSize:12.5, width:'auto' }}
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
          >
            <option value="">ทุกปี</option>
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Status filter */}
        <div style={{ display:'flex', gap:4 }}>
          {[['','ทั้งหมด',counts.all],['pending','รอชำระ',counts.pending],['paid','ชำระแล้ว',counts.paid],['overdue','เกินกำหนด',counts.overdue]].map(([val,lbl,count]) => (
            <button key={val} className={`filter-btn ${filterStatus===val?'active':''}`} onClick={() => setFilterStatus(val)}>
              {lbl} <span style={{ background:'var(--bg-4)',padding:'1px 6px',borderRadius:4,fontSize:11 }}>{count}</span>
            </button>
          ))}
        </div>

        <div style={{ flex:1 }} />

        {/* View mode toggle */}
        <div style={{ display:'flex', background:'var(--bg-3)', borderRadius:8, border:'1px solid var(--border)', padding:2, gap:2 }}>
          <button
            onClick={() => setViewMode('list')}
            title="แสดงรายการ"
            style={{ padding:'4px 8px', borderRadius:6, border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:12,
              background: viewMode==='list' ? 'var(--bg-4)' : 'transparent',
              color: viewMode==='list' ? 'var(--txt)' : 'var(--txt-3)' }}
          >
            <List size={13} /> รายการ
          </button>
          <button
            onClick={() => setViewMode('grouped')}
            title="จัดกลุ่มตามผู้เช่า"
            style={{ padding:'4px 8px', borderRadius:6, border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:12,
              background: viewMode==='grouped' ? 'var(--bg-4)' : 'transparent',
              color: viewMode==='grouped' ? 'var(--txt)' : 'var(--txt-3)' }}
          >
            <Users size={13} /> แยกรายคน
          </button>
        </div>

        <button className="btn btn-primary" onClick={openAdd}><Plus size={14} /> สร้างบิล</button>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="card"><div className="loading-wrap"><span className="spin" /> กำลังโหลด...</div></div>
      ) : viewMode === 'list' ? (
        /* ── Flat list ── */
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div className="table-wrapper">
            <table>
              {tableHead}
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} style={{ textAlign:'center',padding:48,color:'var(--txt-3)' }}>
                    <FileText size={28} style={{ display:'block',margin:'0 auto 8px',opacity:.4 }} />
                    ไม่พบบิล
                  </td></tr>
                ) : filtered.map((b,i) => (
                  <BillRow key={b.id} b={b} i={i} onStatus={openStatus} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── Grouped by tenant ── */
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {Object.keys(grouped).length === 0 ? (
            <div className="card" style={{ textAlign:'center', padding:48, color:'var(--txt-3)' }}>
              <FileText size={28} style={{ display:'block',margin:'0 auto 8px',opacity:.4 }} />ไม่พบบิล
            </div>
          ) : Object.values(grouped).map(group => {
            const groupPending = group.bills.filter(b=>b.status==='pending').length;
            const groupOverdue = group.bills.filter(b=>b.status==='overdue').length;
            const groupTotal   = group.bills.reduce((s,b)=>s+Number(b.total_amount),0);
            return (
              <div key={group.name} className="card" style={{ padding:0, overflow:'hidden' }}>
                {/* Group header */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg-3)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:'rgba(124,58,237,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'var(--violet-light)' }}>
                      {group.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13.5 }}>{group.name}</div>
                      <div style={{ fontSize:11.5, color:'var(--txt-3)' }}>ห้อง {group.room} · {group.bills.length} รายการ</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    {groupOverdue > 0 && <span className="badge badge-overdue">เกินกำหนด {groupOverdue}</span>}
                    {groupPending > 0 && <span className="badge badge-pending">รอชำระ {groupPending}</span>}
                    <span style={{ fontWeight:700, color:'var(--violet-light)', fontSize:14 }}>฿{groupTotal.toLocaleString()}</span>
                  </div>
                </div>
                {/* Bills table */}
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr><th>#</th><th>เดือน</th><th>ค่าเช่า</th><th>น้ำ+ไฟ</th><th>ยอดรวม</th><th>กำหนดชำระ</th><th>สถานะ</th><th style={{width:80}}>จัดการ</th></tr>
                    </thead>
                    <tbody>
                      {group.bills.sort((a,b) => b.bill_year - a.bill_year || b.bill_month - a.bill_month).map((b,i) => (
                        <tr key={b.id}>
                          <td style={{ color:'var(--txt-3)',fontSize:12 }}>{i+1}</td>
                          <td style={{ fontWeight:600 }}>{MONTHS_S[b.bill_month-1]} {b.bill_year}</td>
                          <td style={{ color:'var(--txt-2)' }}>฿{Number(b.monthly_rent).toLocaleString()}</td>
                          <td style={{ color:'var(--txt-2)',fontSize:12.5 }}>฿{(Number(b.water_amount)+Number(b.electricity_amount)).toLocaleString()}</td>
                          <td style={{ fontWeight:700, color:'var(--violet-light)' }}>฿{Number(b.total_amount).toLocaleString()}</td>
                          <td style={{ fontSize:12.5, color:'var(--txt-2)' }}>{b.due_date ? new Date(b.due_date).toLocaleDateString('th-TH') : '-'}</td>
                          <td><span className={`badge badge-${b.status}`}>{STATUS_TH[b.status]}</span></td>
                          <td>
                            <div style={{ display:'flex', gap:4 }}>
                              <button className="btn btn-sm btn-secondary" onClick={() => openStatus(b)} title="เปลี่ยนสถานะ"><CreditCard size={12} /></button>
                              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(b)} title="ลบ"><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Bill Modal */}
      {modal === 'add' && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">สร้างใบแจ้งหนี้</div>
              <button className="modal-close" onClick={close}><X size={14} /></button>
            </div>
            <div className="modal-divider" />
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
                  <select className="form-select" value={form.bill_month} onChange={e => set('bill_month',e.target.value)}>
                    {MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">ปี <span className="form-required">*</span></label>
                  <input type="number" className="form-input" value={form.bill_year} onChange={e => set('bill_year',e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label"><Droplets size={11} style={{ display:'inline',verticalAlign:'middle' }} /> หน่วยน้ำ</label>
                  <input type="number" className="form-input" value={form.water_units} onChange={e => set('water_units',e.target.value)} placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label"><Zap size={11} style={{ display:'inline',verticalAlign:'middle' }} /> หน่วยไฟ</label>
                  <input type="number" className="form-input" value={form.electricity_units} onChange={e => set('electricity_units',e.target.value)} placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">ค่าอื่นๆ (฿)</label>
                  <input type="number" className="form-input" value={form.other_fees} onChange={e => set('other_fees',e.target.value)} placeholder="0" />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">หมายเหตุ</label>
                  <textarea className="form-textarea" value={form.notes} onChange={e => set('notes',e.target.value)} placeholder="หมายเหตุเพิ่มเติม..." style={{ minHeight:60 }} />
                </div>
              </div>
              <PreviewBox preview={preview} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={close}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? <><span className="spin" /> สร้าง...</> : <><Receipt size={13} /> สร้างบิล</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {modal === 'status' && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal" style={{ maxWidth:400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">อัพเดตสถานะการชำระ</div>
              <button className="modal-close" onClick={close}><X size={14} /></button>
            </div>
            <div className="modal-divider" />
            <div className="modal-body">
              <div style={{ background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:13 }}>
                <span style={{ color:'var(--txt-2)' }}>{selected?.first_name} {selected?.last_name} · ห้อง {selected?.room_number}</span>
                <div style={{ color:'var(--txt-3)', fontSize:12, marginTop:2 }}>{MONTHS_S[(selected?.bill_month||1)-1]} {selected?.bill_year}</div>
                <div style={{ fontWeight:700, fontSize:16, color:'var(--violet-light)', marginTop:4 }}>฿{Number(selected?.total_amount||0).toLocaleString()}</div>
              </div>
              <div className="form-group" style={{ marginBottom:12 }}>
                <label className="form-label">สถานะ</label>
                <select className="form-select" value={statusForm.status} onChange={e => setStatusForm(p => ({...p,status:e.target.value}))}>
                  <option value="pending">รอชำระ</option>
                  <option value="paid">ชำระแล้ว</option>
                  <option value="overdue">เกินกำหนด</option>
                </select>
              </div>
              {statusForm.status === 'paid' && (
                <div className="form-group">
                  <label className="form-label">วันที่ชำระ</label>
                  <input type="date" className="form-input" value={statusForm.paid_date} onChange={e => setStatusForm(p => ({...p,paid_date:e.target.value}))} />
                </div>
              )}
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
