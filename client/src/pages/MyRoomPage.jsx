import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MyRoomPage() {
  const { tenant } = useAuth();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tenants/me')
      .then(r => setInfo(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><span className="loading-spin" /> กำลังโหลด...</div>;
  if (!info) return <div className="empty-state"><div className="empty-icon">🏠</div><p>ไม่พบข้อมูลห้องพัก</p></div>;

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">🏠 ข้อมูลห้องพัก</div>
          <span className="badge badge-occupied">ห้อง {info.room_number}</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {[
            { l:'ห้องเลขที่', v:`ห้อง ${info.room_number}` },
            { l:'ชั้น', v:`ชั้น ${info.floor}` },
            { l:'ประเภทห้อง', v:info.room_type },
            { l:'ค่าเช่า/เดือน', v:`฿${Number(info.monthly_rent).toLocaleString()}` },
            { l:'ค่าน้ำ/หน่วย', v:`฿${info.water_rate}` },
            { l:'ค่าไฟ/หน่วย', v:`฿${info.electricity_rate}` },
          ].map(r => (
            <div key={r.l}>
              <div className="text-xs text-muted" style={{ marginBottom:2 }}>{r.l}</div>
              <div style={{ fontWeight:600 }}>{r.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">👤 ข้อมูลส่วนตัว</div></div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {[
            { l:'ชื่อ-นามสกุล', v:`${info.first_name} ${info.last_name}` },
            { l:'เลขบัตรประชาชน', v:info.national_id },
            { l:'เบอร์โทรศัพท์', v:info.phone },
            { l:'อีเมล', v:info.email || '-' },
            { l:'วันเข้าพัก', v:info.move_in_date ? new Date(info.move_in_date).toLocaleDateString('th-TH') : '-' },
            { l:'ผู้ติดต่อฉุกเฉิน', v:`${info.emergency_contact || '-'} ${info.emergency_phone ? `(${info.emergency_phone})` : ''}` },
          ].map(r => (
            <div key={r.l}>
              <div className="text-xs text-muted" style={{ marginBottom:2 }}>{r.l}</div>
              <div style={{ fontWeight:500 }}>{r.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
