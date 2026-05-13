import { useEffect, useState } from 'react';
import api from '../services/api';

const MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const STATUS_TH = { pending: 'รอชำระ', paid: 'ชำระแล้ว', overdue: 'เกินกำหนด' };

export default function MyBillsPage() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/bills')
      .then(r => setBills(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  const total = bills.reduce((s, b) => s + Number(b.total_amount), 0);
  const paid = bills.filter(b => b.status === 'paid').reduce((s, b) => s + Number(b.total_amount), 0);
  const outstanding = bills.filter(b => b.status !== 'paid').reduce((s, b) => s + Number(b.total_amount), 0);

  if (loading) return <div className="page-loading"><span className="loading-spin" /> กำลังโหลด...</div>;

  return (
    <div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        <div className="stat-card primary">
          <div className="stat-icon">📄</div>
          <div className="stat-info">
            <div className="stat-value">{bills.length}</div>
            <div className="stat-label">บิลทั้งหมด</div>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-value">฿{paid.toLocaleString()}</div>
            <div className="stat-label">ชำระแล้ว</div>
          </div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <div className="stat-value">฿{outstanding.toLocaleString()}</div>
            <div className="stat-label">ค้างชำระ</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">📋 ประวัติบิล</div></div>
        {bills.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📄</div><p>ยังไม่มีบิล</p></div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {bills.map(b => (
              <div key={b.id} style={{ background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:16, display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, marginBottom:4 }}>{MONTHS[b.bill_month-1]} {b.bill_year}</div>
                  <div className="text-sm text-muted">
                    ค่าเช่า ฿{Number(b.monthly_rent).toLocaleString()} · น้ำ ฿{Number(b.water_amount).toLocaleString()} · ไฟ ฿{Number(b.electricity_amount).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted" style={{ marginTop:4 }}>
                    กำหนดชำระ: {b.due_date ? new Date(b.due_date).toLocaleDateString('th-TH') : '-'}
                    {b.paid_date && ` · ชำระ: ${new Date(b.paid_date).toLocaleDateString('th-TH')}`}
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:20, fontWeight:700, color:'var(--primary-light)', marginBottom:4 }}>฿{Number(b.total_amount).toLocaleString()}</div>
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
