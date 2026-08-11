import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../services/api';
import { Award, Save, X, Users, Building, GraduationCap } from 'lucide-react';

const TYPE_LABEL = {
  THUC_TAP: { label: 'Thực tập', cls: 'badge-success', icon: Building },
  DO_AN: { label: 'Đồ án', cls: 'badge-info', icon: GraduationCap },
};

export default function TeacherGrading() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [scoreData, setScoreData] = useState(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form state cho điểm GV
  const [teacherForm, setTeacherForm] = useState({ attendance: '', professional: '', notes: '' });
  // Form state cho điểm CT
  const [companyForm, setCompanyForm] = useState({ attendance: '', professional: '', notes: '' });

  useEffect(() => {
    api.get('/students?limit=100').then(res => {
      setStudents(res.data.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const selectStudent = async (student) => {
    setSelected(student);
    setMessage({ type: '', text: '' });
    setLoadingScore(true);

    try {
      const res = await api.get(`/scores/student/${student.id}/final`);
      setScoreData(res.data);

      // Populate forms từ dữ liệu đã có
      const ts = res.data.teacherScore;
      const cs = res.data.companyScore;
      setTeacherForm({
        attendance: ts?.attendance_score ?? '',
        professional: ts?.professional_score ?? '',
        notes: ts?.notes ?? '',
      });
      setCompanyForm({
        attendance: cs?.attendance_score ?? '',
        professional: cs?.professional_score ?? '',
        notes: cs?.notes ?? '',
      });
    } catch (err) {
      console.error(err);
      setScoreData(null);
      setTeacherForm({ attendance: '', professional: '', notes: '' });
      setCompanyForm({ attendance: '', professional: '', notes: '' });
    } finally {
      setLoadingScore(false);
    }
  };

  const calcAvg = (a, b) => {
    const va = parseFloat(a);
    const vb = parseFloat(b);
    if (!isNaN(va) && !isNaN(vb)) return ((va + vb) / 2).toFixed(2);
    return '-';
  };

  const calcFinal = () => {
    if (!selected) return '-';
    const tAvg = parseFloat(calcAvg(teacherForm.attendance, teacherForm.professional));
    if (selected.internship_type === 'DO_AN') {
      return isNaN(tAvg) ? '-' : tAvg.toFixed(2);
    }
    const cAvg = parseFloat(calcAvg(companyForm.attendance, companyForm.professional));
    if (!isNaN(tAvg) && !isNaN(cAvg)) {
      return (tAvg * 0.5 + cAvg * 0.5).toFixed(2);
    }
    return '-';
  };

  const saveScore = async (scoreType, form, existingScore) => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = {
        attendance_score: parseFloat(form.attendance),
        professional_score: parseFloat(form.professional),
        notes: form.notes,
      };

      if (existingScore) {
        await api.put(`/scores/${existingScore.id}`, payload);
      } else {
        await api.post('/scores', {
          student_id: selected.id,
          score_type: scoreType,
          ...payload,
        });
      }

      setMessage({ type: 'success', text: `Lưu điểm ${scoreType === 'TEACHER' ? 'giảng viên' : 'công ty'} thành công!` });
      // Refresh score data
      const res = await api.get(`/scores/student/${selected.id}/final`);
      setScoreData(res.data);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Có lỗi xảy ra' });
    } finally {
      setSaving(false);
    }
  };

  const SCORE_OPTIONS = Array.from({ length: 21 }, (_, i) => i * 0.5);

  const ScoreSelect = ({ value, onChange, disabled, options }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div style={{ position: 'relative', width: '100%' }}>
        {/* Trigger button */}
        <button
          type="button"
          className="input"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            fontSize: '1.125rem',
            fontWeight: '600',
            textAlign: 'center',
            height: '42px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            background: 'var(--background)',
            borderColor: 'var(--border)',
            padding: '0 1rem',
          }}
        >
          <span style={{ margin: '0 auto' }}>
            {value !== '' && value != null ? parseFloat(value).toFixed(1) : '-- Chọn --'}
          </span>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>▼</span>
        </button>

        {/* Options list */}
        {isOpen && !disabled && (
          <>
            {/* Overlay to close when clicking outside */}
            <div 
              onClick={() => setIsOpen(false)} 
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} 
            />
            <div style={{
              position: 'absolute',
              top: '46px',
              left: 0,
              right: 0,
              background: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-md)',
              maxHeight: '160px', // height of ~4 options
              overflowY: 'auto',
              zIndex: 1000,
            }}>
              <div
                onClick={() => { onChange(''); setIsOpen(false); }}
                style={{
                  padding: '0.5rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  background: value === '' || value == null ? 'var(--primary-light)' : 'transparent',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                -- Chọn --
              </div>
              {options.map(val => (
                <div
                  key={val}
                  onClick={() => { onChange(String(val)); setIsOpen(false); }}
                  style={{
                    padding: '0.5rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontWeight: '600',
                    background: parseFloat(value) === val ? 'var(--primary-light)' : 'transparent',
                  }}
                >
                  {val.toFixed(1)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  const ScoreSection = ({ title, icon: Icon, iconColor, form, setForm, scoreType, existingScore, disabled }) => (
    <div style={{
      background: 'var(--background)',
      borderRadius: 'var(--radius)',
      padding: '1.25rem',
      marginBottom: '1rem',
      border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: 'var(--radius-full)',
          backgroundColor: `${iconColor}15`, color: iconColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} />
        </div>
        <h3 style={{ fontWeight: '600', fontSize: '1rem' }}>{title}</h3>
        {existingScore && <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Đã chấm</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: '0.8rem' }}>Chuyên cần (0-10)</label>
          <ScoreSelect
            value={form.attendance}
            onChange={val => setForm(p => ({ ...p, attendance: val }))}
            disabled={disabled}
            options={SCORE_OPTIONS}
          />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: '0.8rem' }}>Chuyên môn (0-10)</label>
          <ScoreSelect
            value={form.professional}
            onChange={val => setForm(p => ({ ...p, professional: val }))}
            disabled={disabled}
            options={SCORE_OPTIONS}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Trung bình: <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>{calcAvg(form.attendance, form.professional)}</strong>
        </span>
      </div>

      <div className="form-group" style={{ margin: 0, marginBottom: '0.75rem' }}>
        <label className="form-label" style={{ fontSize: '0.8rem' }}>Ghi chú</label>
        <textarea className="input" placeholder="Nhận xét (tùy chọn)..." value={form.notes} disabled={disabled}
          onChange={e => {
            if (e.target.value.length <= 200) {
              setForm(p => ({ ...p, notes: e.target.value }));
            }
          }}
          rows={3}
          style={{ resize: 'vertical', minHeight: '60px' }}
        />
        {!disabled && (
          <div style={{ textAlign: 'right', fontSize: '0.7rem', color: (form.notes || '').length >= 200 ? 'var(--danger)' : 'var(--text-muted)', marginTop: '0.2rem' }}>
            {(form.notes || '').length}/200
          </div>
        )}
      </div>

      {!disabled && (
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={saving || form.attendance === '' || form.professional === ''}
          onClick={() => saveScore(scoreType, form, existingScore)}>
          <Save size={14} /> {saving ? 'Đang lưu...' : (existingScore ? 'Cập nhật điểm' : 'Lưu điểm')}
        </button>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Award size={24} /> Chấm điểm sinh viên
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
        {/* Danh sách sinh viên */}
        <div>
          <div className="card" style={{ padding: '0' }}>
            <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã SV</th>
                    <th>Họ tên</th>
                    <th>Loại hình</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center' }}>Đang tải...</td></tr>
                  ) : students.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center' }}>Chưa có sinh viên nào</td></tr>
                  ) : (
                    students.map(s => {
                      const type = TYPE_LABEL[s.internship_type] || { label: s.internship_type, cls: 'badge-info' };
                      return (
                        <tr key={s.id}
                          style={{ cursor: 'pointer', background: selected?.id === s.id ? 'var(--primary-light)' : '' }}
                          onClick={() => selectStudent(s)}>
                          <td><strong>{s.student_code}</strong></td>
                          <td>{s.full_name || `${s.ho_ten_lot || ''} ${s.ten || ''}`.trim()}</td>
                          <td><span className={`badge ${type.cls}`}>{type.label}</span></td>
                          <td>
                            {s.internship_status === 'in_progress'
                              ? <span className="badge badge-success">Đang TT</span>
                              : <span className="badge badge-warning">{s.internship_status}</span>}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Panel chấm điểm */}
        {selected && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>{selected.full_name || `${selected.ho_ten_lot || ''} ${selected.ten || ''}`.trim()}</h2>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {selected.student_code} • {TYPE_LABEL[selected.internship_type]?.label || selected.internship_type}
                </span>
              </div>
              <button onClick={() => { setSelected(null); setScoreData(null); }} style={{ color: 'var(--text-muted)', padding: '0.25rem' }}>
                <X size={20} />
              </button>
            </div>

            {message.text && (
              <div className={`badge ${message.type === 'success' ? 'badge-success' : 'badge-danger'}`}
                style={{ display: 'block', padding: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>
                {message.text}
              </div>
            )}

            {loadingScore ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải điểm...</p>
            ) : (
              <>
                {/* Điểm Giảng viên — luôn hiển thị */}
                <ScoreSection
                  title="Điểm Giảng viên"
                  icon={Users}
                  iconColor="#3b82f6"
                  form={teacherForm}
                  setForm={setTeacherForm}
                  scoreType="TEACHER"
                  existingScore={scoreData?.teacherScore}
                />

                {/* Điểm Công ty — chỉ hiện khi THUC_TAP */}
                {selected.internship_type === 'THUC_TAP' && (
                  <ScoreSection
                    title="Điểm Doanh nghiệp"
                    icon={Building}
                    iconColor="#10b981"
                    form={companyForm}
                    setForm={setCompanyForm}
                    scoreType="COMPANY"
                    existingScore={scoreData?.companyScore}
                  />
                )}

                {/* Điểm tổng kết */}
                <div style={{
                  background: 'linear-gradient(135deg, #667eea15, #764ba215)',
                  borderRadius: 'var(--radius)',
                  padding: '1.25rem',
                  textAlign: 'center',
                  border: '2px solid var(--primary)',
                }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    Điểm tổng kết
                    {selected.internship_type === 'THUC_TAP' ? ' (50% GV + 50% CT)' : ' (100% GV)'}
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                    {calcFinal()}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
