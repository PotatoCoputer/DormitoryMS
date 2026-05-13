import { useEffect, useState } from 'react';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const MONTH_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const STATUS_LABEL = { pending: 'รอดำเนินการ', in_progress: 'กำลังดำเนินการ', resolved: 'แก้ไขแล้ว', cancelled: 'ยกเลิก' };
const PRIORITY_LABEL = { low: 'ต่ำ', medium: 'ปานกลาง', high: 'สูง', urgent: 'เร่งด่วน' };

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><span className="loading-spin" /> กำลังโหลด...</div>;
  if (!data) return <div className="empty-state"><p>ไม่สามารถโหลดข้อมูลได้</p></div>;

  const { rooms, tenants, revenue, overdue, unpaid, maintenance, recentMaintenance, recentBills, monthlyRevenue } = data;

  const chartData = monthlyRevenue?.map(m => ({
    name: MONTH_TH[m.bill_month - 1],
    รายได้: Number(m.total),
    จัดเก็บแล้ว: Number(m.collected),
  })) || [];

  const occupancyRate = rooms.total_rooms > 0
    ? Math.round((rooms.occupied_rooms / rooms.total_rooms) * 100)
    : 0;

  return (
    <div>
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">🏠</div>
          <div className="stat-info">
            <div className="stat-value">{rooms.total_rooms}</div>
            <div className="stat-label">ห้องทั้งหมด</div>
            <div className="stat-sub">อัตราเข้าพัก {occupancyRate}%</div>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-value">{rooms.available_rooms}</div>
            <div className="stat-label">ห้องว่าง</div>
            <div className="stat-sub">มีผู้เช่า {rooms.occupied_rooms} ห้อง</div>
          </div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-value">{tenants.active_tenants}</div>
            <div className="stat-label">ผู้เช่าปัจจุบัน</div>
            <div className="stat-sub">ปิดซ่อม {rooms.maintenance_rooms} ห้อง</div>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <div className="stat-value">฿{Number(revenue.total_collected).toLocaleString()}</div>
            <div className="stat-label">รายได้เดือนนี้</div>
            <div className="stat-sub">เรียกเก็บ ฿{Number(revenue.total_billed).toLocaleString()}</div>
          </div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <div className="stat-value">{Number(overdue.overdue_bills) + Number(unpaid.unpaid_bills)}</div>
            <div className="stat-label">บิลค้างชำระ</div>
            <div className="stat-sub">ค้างชำระ ฿{Number(revenue.outstanding).toLocaleString()}</div>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">🔧</div>
          <div className="stat-info">
            <div className="stat-value">{maintenance.pending_requests}</div>
            <div className="stat-label">แจ้งซ่อมรอดำเนินการ</div>
            <div className="stat-sub">กำลังดำเนินการ {maintenance.in_progress_requests} รายการ</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Revenue Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">💹 รายได้รายเดือน</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `฿${(v/1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
                formatter={v => [`฿${Number(v).toLocaleString()}`, '']}
              />
              <Bar dataKey="รายได้" fill="#6366f1" radius={[4,4,0,0]} opacity={0.5} />
              <Bar dataKey="จัดเก็บแล้ว" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Maintenance */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🔧 แจ้งซ่อมล่าสุด</div>
          </div>
          {recentMaintenance?.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}><p>ไม่มีรายการแจ้งซ่อม</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentMaintenance?.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{m.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      ห้อง {m.room_number} • {m.first_name} {m.last_name}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span className={`badge badge-${m.status}`}>{STATUS_LABEL[m.status]}</span>
                    <span className={`badge badge-${m.priority} text-xs`}>{PRIORITY_LABEL[m.priority]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Bills */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <div className="card-title">📄 บิลล่าสุด</div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ผู้เช่า</th><th>ห้อง</th><th>ประจำเดือน</th><th>ยอดรวม</th><th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {recentBills?.map(b => (
                  <tr key={b.id}>
                    <td>{b.first_name} {b.last_name}</td>
                    <td>ห้อง {b.room_number}</td>
                    <td>{MONTH_TH[b.bill_month - 1]} {b.bill_year}</td>
                    <td className="text-primary font-bold">฿{Number(b.total_amount).toLocaleString()}</td>
                    <td><span className={`badge badge-${b.status}`}>
                      {b.status === 'paid' ? 'ชำระแล้ว' : b.status === 'overdue' ? 'เกินกำหนด' : 'รอชำระ'}
                    </span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
