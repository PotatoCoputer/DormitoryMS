import { useEffect, useState } from 'react';
import api from '../services/api';
import { FileText, CheckCircle, Clock, Droplets, Zap, CalendarDays } from 'lucide-react';

const MONTHS_S = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const STATUS_TH = { pending:'รอชำระ', paid:'ชำระแล้ว', overdue:'เกินกำหนด' };

export default function MyBillsPage() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/bills').then(r => setBills(r.data.data)).finally(() => setLoading(false));
  }, []);

  const paid = bills.filter(b => b.status === 'paid').reduce((s,b) => s+Number(b.total_amount), 0);
  const outstanding = bills.filter(b => b.status !== 'paid').reduce((s,b) => s+Number(b.total_amount), 0);

  if (loading) return <div className="loading-wrap"><span className="spin" /> กำลังโหลด...</div>;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { icon:FileText, label:'บิลทั้งหมด', value:bills.length, color:'#7c3aed' },
          { icon:CheckCircle, label:'ชำระแล้ว', value:`฿${paid.toLocaleString()}`, color:'#22c55e' },
          { icon:Clock, label:'ค้างชำระ', value:`฿${outstanding.toLocaleString()}`, color:'#ef4444' },
        ].map(({ icon:Icon, label, value, color }) => (
          <div key={label} className="stat-card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div className="stat-label">{label}</div>
              <div style={{ width:28,height:28,borderRadius:8,background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center' }}>
                <Icon size={13} color={color} />
              </div>
            </div>
            <div className="stat-value">{value}</div>
          </div>
        ))}
      </div>

      {/* Bill list */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div className="card-title">ประวัติใบแจ้งหนี้</div>
          <span style={{ fontSize:12, color:'var(--txt-3)' }}>{bills.length} รายการ</span>
        </div>
        {bills.length === 0 ? (
          <div className="empty-state">
            <FileText size={32} className="empty-icon" style={{ color:'var(--txt-3)' }} />
            <div className="empty-title">ยังไม่มีบิล</div>
          </div>
        ) : (
          <div>
            {bills.map((b, i) => (
              <div key={b.id} style={{ display:'flex',alignItems:'center',gap:14,padding:'14px 18px',borderBottom: i<bills.length-1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width:38,height:38,borderRadius:10,background:'var(--bg-3)',border:'1px solid var(--border-2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <FileText size={16} color="var(--txt-2)" />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, marginBottom:3 }}>{MONTHS_S[b.bill_month-1]} {b.bill_year}</div>
                  <div style={{ display:'flex', gap:12, fontSize:12, color:'var(--txt-3)', flexWrap:'wrap' }}>
                    <span>ค่าเช่า ฿{Number(b.monthly_rent).toLocaleString()}</span>
                    <span style={{ display:'flex',alignItems:'center',gap:3 }}><Droplets size={10} />฿{Number(b.water_amount).toLocaleString()}</span>
                    <span style={{ display:'flex',alignItems:'center',gap:3 }}><Zap size={10} />฿{Number(b.electricity_amount).toLocaleString()}</span>
                  </div>
                  <div style={{ display:'flex',gap:8,fontSize:11.5,color:'var(--txt-3)',marginTop:3 }}>
                    <span style={{ display:'flex',alignItems:'center',gap:3 }}><CalendarDays size={10} />กำหนด {b.due_date ? new Date(b.due_date).toLocaleDateString('th-TH') : '-'}</span>
                    {b.paid_date && <span style={{ color:'#4ade80' }}>· ชำระ {new Date(b.paid_date).toLocaleDateString('th-TH')}</span>}
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:17,fontWeight:700,color:'var(--violet-light)',marginBottom:4 }}>฿{Number(b.total_amount).toLocaleString()}</div>
                  <span className={`badge badge-${b.status}`}>{STATUS_TH[b.status]}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
