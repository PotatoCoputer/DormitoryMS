import { useEffect, useState } from 'react';
import api from '../services/api';
import { BedDouble, User, Phone, Mail, CalendarDays, ShieldAlert, Droplets, Zap, Building2 } from 'lucide-react';

function InfoRow({ label, value, icon: Icon }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
      <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11.5, color:'var(--txt-3)', fontWeight:500 }}>
        {Icon && <Icon size={10} />}{label}
      </div>
      <div style={{ fontSize:13.5, fontWeight:500 }}>{value || '-'}</div>
    </div>
  );
}

export default function MyRoomPage() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tenants/me').then(r => setInfo(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-wrap"><span className="spin" /> กำลังโหลด...</div>;
  if (!info) return (
    <div className="empty-state">
      <BedDouble size={32} className="empty-icon" style={{ color:'var(--txt-3)' }} />
      <div className="empty-title">ไม่พบข้อมูลห้องพัก</div>
    </div>
  );

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
      {/* Room info */}
      <div className="card">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:10,background:'rgba(124,58,237,.12)',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <BedDouble size={16} color="var(--violet-light)" />
            </div>
            <div>
              <div className="card-title">ข้อมูลห้องพัก</div>
              <div style={{ fontSize:11.5, color:'var(--txt-3)' }}>รายละเอียดห้องที่คุณพักอาศัย</div>
            </div>
          </div>
          <span className="badge badge-occupied"><span className="badge-dot" />ห้อง {info.room_number}</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <InfoRow label="ห้องเลขที่" value={`ห้อง ${info.room_number}`} icon={Building2} />
          <InfoRow label="ชั้น" value={`ชั้น ${info.floor}`} />
          <InfoRow label="ประเภทห้อง" value={info.room_type} />
          <InfoRow label="ค่าเช่า/เดือน" value={`฿${Number(info.monthly_rent).toLocaleString()}`} />
          <InfoRow label="ค่าน้ำ/หน่วย" value={`฿${info.water_rate}`} icon={Droplets} />
          <InfoRow label="ค่าไฟ/หน่วย" value={`฿${info.electricity_rate}`} icon={Zap} />
        </div>
      </div>

      {/* Personal info */}
      <div className="card">
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <div style={{ width:36,height:36,borderRadius:10,background:'rgba(59,130,246,.1)',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <User size={16} color="#60a5fa" />
          </div>
          <div>
            <div className="card-title">ข้อมูลส่วนตัว</div>
            <div style={{ fontSize:11.5, color:'var(--txt-3)' }}>ข้อมูลผู้เช่าที่ลงทะเบียนไว้</div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <InfoRow label="ชื่อ-นามสกุล" value={`${info.first_name} ${info.last_name}`} icon={User} />
          <InfoRow label="เลขบัตรประชาชน" value={info.national_id} />
          <InfoRow label="เบอร์โทรศัพท์" value={info.phone} icon={Phone} />
          <InfoRow label="อีเมล" value={info.email} icon={Mail} />
          <InfoRow label="วันเข้าพัก" value={info.move_in_date ? new Date(info.move_in_date).toLocaleDateString('th-TH') : '-'} icon={CalendarDays} />
          <InfoRow label="ผู้ติดต่อฉุกเฉิน" value={`${info.emergency_contact || '-'}${info.emergency_phone ? ` (${info.emergency_phone})` : ''}`} icon={ShieldAlert} />
        </div>
      </div>
    </div>
  );
}
