import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../services/api';
import { Award, Users, Building, GraduationCap } from 'lucide-react';

const TYPE_LABEL = {
  THUC_TAP: { label: 'Thực tập', cls: 'badge-success' },
  DO_AN: { label: 'Đồ án', cls: 'badge-info' },
};

export default function StudentScores() {
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await api.get('/auth/me');
        const studentProfile = profileRes.data.profile;
        setProfile(studentProfile);

        if (studentProfile?.id) {
          const scoreRes = await api.get(`/scores/student/${studentProfile.id}/final`);
          setScoreData(scoreRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const ScoreCard = ({ title, icon: Icon, iconColor, score }) => (
    <div style={{
      background: 'var(--background)',
      borderRadius: 'var(--radius)',
      padding: '1.25rem',
      border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: 'var(--radius-full)',
          backgroundColor: `${iconColor}15`, color: iconColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} />
        </div>
        <h3 style={{ fontWeight: '600', fontSize: '1rem' }}>{title}</h3>
      </div>

      {score ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Chuyên cần</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: iconColor }}>
              {score.attendance_score != null ? parseFloat(score.attendance_score).toFixed(1) : '-'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Chuyên môn</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: iconColor }}>
              {score.professional_score != null ? parseFloat(score.professional_score).toFixed(1) : '-'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Trung bình</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
              {score.average_score != null ? parseFloat(score.average_score).toFixed(2) : '-'}
            </div>
          </div>
        </div>
      ) : (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
          Chưa có điểm
        </p>
      )}

      {score?.notes && (
        <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--surface)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}>
          <strong>Ghi chú:</strong> {score.notes}
        </div>
      )}

      {score?.teacher && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Người chấm: {score.teacher.full_name}
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Award size={24} /> Xem điểm
      </h1>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Đang tải...</p>
        </div>
      ) : !scoreData ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Chưa có dữ liệu điểm.</p>
        </div>
      ) : (
        <>
          {/* Thông tin loại hình */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: 'var(--radius-full)',
                backgroundColor: scoreData.student.internship_type === 'THUC_TAP' ? '#10b98120' : '#3b82f620',
                color: scoreData.student.internship_type === 'THUC_TAP' ? '#10b981' : '#3b82f6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {scoreData.student.internship_type === 'THUC_TAP' ? <Building size={24} /> : <GraduationCap size={24} />}
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '1.125rem' }}>
                  {scoreData.student.full_name} — {scoreData.student.student_code}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                  <span className={`badge ${TYPE_LABEL[scoreData.student.internship_type]?.cls || 'badge-info'}`}>
                    {TYPE_LABEL[scoreData.student.internship_type]?.label || scoreData.student.internship_type}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {scoreData.student.internship_type === 'THUC_TAP'
                      ? 'Điểm = 50% Giảng viên + 50% Doanh nghiệp'
                      : 'Điểm = 100% Giảng viên'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Điểm chi tiết */}
          <div style={{ display: 'grid', gridTemplateColumns: scoreData.student.internship_type === 'THUC_TAP' ? '1fr 1fr' : '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <ScoreCard
              title="Điểm Giảng viên"
              icon={Users}
              iconColor="#3b82f6"
              score={scoreData.teacherScore}
            />
            {scoreData.student.internship_type === 'THUC_TAP' && (
              <ScoreCard
                title="Điểm Doanh nghiệp"
                icon={Building}
                iconColor="#10b981"
                score={scoreData.companyScore}
              />
            )}
          </div>

          {/* Điểm tổng kết */}
          <div className="card" style={{
            textAlign: 'center',
            background: 'linear-gradient(135deg, #667eea10, #764ba210)',
            border: '2px solid var(--primary)',
          }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              ĐIỂM TỔNG KẾT
              {scoreData.student.internship_type === 'THUC_TAP' ? ' (50% GV + 50% CT)' : ' (100% GV)'}
            </div>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)' }}>
              {scoreData.finalScore != null ? scoreData.finalScore.toFixed(2) : 'Chưa đủ điểm'}
            </div>
            {scoreData.finalScore != null && (
              <div style={{ marginTop: '0.5rem' }}>
                <span className={`badge ${scoreData.finalScore >= 5 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.9rem', padding: '0.25rem 0.75rem' }}>
                  {scoreData.finalScore >= 8.5 ? 'Giỏi' :
                    scoreData.finalScore >= 7 ? 'Khá' :
                      scoreData.finalScore >= 5 ? 'Trung bình' : 'Không đạt'}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
