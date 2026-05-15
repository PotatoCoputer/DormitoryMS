import { useEffect, useState } from 'react';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { BedDouble, Users, TrendingUp, AlertCircle, Wrench, CheckSquare } from 'lucide-react';

const MONTH_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const STATUS_LABEL = { pending: 'รอดำเนินการ', in_progress: 'กำลังดำเนินการ', resolved: 'แก้ไขแล้ว', cancelled: 'ยกเลิก' };
const PRIORITY_LABEL = { low: 'ต่ำ', medium: 'ปานกลาง', high: 'สูง', urgent: 'เร่งด่วน' };
const BILL_LABEL = { paid: 'ชำระแล้ว', overdue: 'เกินกำหนด', pending: 'รอชำระ' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 8, padding: '10px 14px', fontSize: 12.5 }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--txt-2)' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          {p.name}: ฿{Number(p.value).toLocaleString()}
        </div>
      ))}
    </div>
  );
};

function StatCard({ icon: Icon, value, label, sub, color = '#7c3aed', trend }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="stat-label">
          <span>{label}</span>
        </div>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={color} />
        </div>
      </div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-wrap">
      <span className="spin" />
      กำลังโหลดข้อมูล...
    </div>
  );
  if (!data) return <div className="empty-state"><p>ไม่สามารถโหลดข้อมูลได้</p></div>;

  const { rooms, tenants, revenue, overdue, unpaid, maintenance, recentMaintenance, recentBills, monthlyRevenue } = data;
  const occupancyRate = rooms.total_rooms > 0 ? Math.round((rooms.occupied_rooms / rooms.total_rooms) * 100) : 0;

  const chartData = monthlyRevenue?.map(m => ({
    name: MONTH_TH[m.bill_month - 1],
    'รายได้ทั้งหมด': Number(m.total),
    'จัดเก็บแล้ว': Number(m.collected),
  })) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon={BedDouble} value={rooms.total_rooms} label="ห้องทั้งหมด" sub={`อัตราเข้าพัก ${occupancyRate}%`} color="#7c3aed" />
        <StatCard icon={CheckSquare} value={rooms.available_rooms} label="ห้องว่าง" sub={`มีผู้เช่า ${rooms.occupied_rooms} ห้อง`} color="#22c55e" />
        <StatCard icon={Users} value={tenants.active_tenants} label="ผู้เช่าปัจจุบัน" sub={`ปิดซ่อม ${rooms.maintenance_rooms} ห้อง`} color="#3b82f6" />
        <StatCard icon={TrendingUp} value={`฿${Number(revenue.total_collected).toLocaleString()}`} label="รายได้เดือนนี้" sub={`เรียกเก็บ ฿${Number(revenue.total_billed).toLocaleString()}`} color="#eab308" />
        <StatCard icon={AlertCircle} value={Number(overdue.overdue_bills) + Number(unpaid.unpaid_bills)} label="บิลค้างชำระ" sub={`฿${Number(revenue.outstanding).toLocaleString()}`} color="#ef4444" />
        <StatCard icon={Wrench} value={maintenance.pending_requests} label="รอดำเนินการซ่อม" sub={`กำลังดำเนินการ ${maintenance.in_progress_requests} รายการ`} color="#f59e0b" />
      </div>

      {/* Chart + Maintenance */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">รายได้รายเดือน</div>
              <div style={{ fontSize: 12, color: 'var(--txt-3)', marginTop: 2 }}>เปรียบเทียบรายได้ที่เรียกเก็บและจัดเก็บได้จริง</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--txt-3)', fontSize: 11.5 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--txt-3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `฿${(v/1000).toFixed(0)}K`} width={48} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="รายได้ทั้งหมด" fill="#7c3aed" fillOpacity={0.35} radius={[4,4,0,0]} maxBarSize={28} />
              <Bar dataKey="จัดเก็บแล้ว" fill="#22c55e" radius={[4,4,0,0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            {[['#7c3aed', 'รายได้ทั้งหมด'], ['#22c55e', 'จัดเก็บแล้ว']].map(([color, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--txt-3)' }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">แจ้งซ่อมล่าสุด</div>
            <span style={{ fontSize: 11.5, color: 'var(--txt-3)' }}>{recentMaintenance?.length} รายการ</span>
          </div>
          {recentMaintenance?.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <div style={{ fontSize: 13, color: 'var(--txt-3)' }}>ไม่มีรายการแจ้งซ่อม</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {recentMaintenance?.map((m, i) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: i < recentMaintenance.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--txt-3)' }}>ห้อง {m.room_number} · {m.first_name}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end', flexShrink: 0 }}>
                    <span className={`badge badge-${m.status}`} style={{ fontSize: 10.5 }}>{STATUS_LABEL[m.status]}</span>
                    <span className={`badge badge-${m.priority}`} style={{ fontSize: 10.5 }}>{PRIORITY_LABEL[m.priority]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Bills */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">บิลล่าสุด</div>
          <span style={{ fontSize: 11.5, color: 'var(--txt-3)' }}>{recentBills?.length} รายการ</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ผู้เช่า</th>
                <th>ห้อง</th>
                <th>ประจำเดือน</th>
                <th>ค่าเช่า</th>
                <th>ค่าน้ำ+ไฟ</th>
                <th>ยอดรวม</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {recentBills?.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 500 }}>{b.first_name} {b.last_name}</td>
                  <td><span className="badge badge-occupied">ห้อง {b.room_number}</span></td>
                  <td style={{ color: 'var(--txt-2)' }}>{MONTH_TH[b.bill_month - 1]} {b.bill_year}</td>
                  <td>฿{Number(b.monthly_rent).toLocaleString()}</td>
                  <td style={{ color: 'var(--txt-2)' }}>฿{(Number(b.water_amount) + Number(b.electricity_amount)).toLocaleString()}</td>
                  <td style={{ fontWeight: 600, color: 'var(--violet-light)' }}>฿{Number(b.total_amount).toLocaleString()}</td>
                  <td><span className={`badge badge-${b.status}`}>{BILL_LABEL[b.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
