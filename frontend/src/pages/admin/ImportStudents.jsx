import { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Upload, AlertCircle, CheckCircle, FileUp, Download } from 'lucide-react';

const IMPORT_TYPES = {
  student: {
    label: 'Sinh viên',
    endpoint: '/students/import',
    templateName: 'Mau_Import_SinhVien.csv',
    templateContent: 
      "STT,HO_TEN_LOT,TEN,MSSV,LOP,SDT_SINH_VIEN,TEN_CONG_TY,DIA_CHI_CONG_TY,SDT_CONG_TY,EMAIL_CONG_TY,NGUOI_TIEP_NHAN,CHUC_VU_NGUOI_TIEP_NHAN,SDT_NGUOI_TIEP_NHAN,EMAIL_NGUOI_TIEP_NHAN,NGUOI_HUONG_DAN,CHUC_VU_NGUOI_HUONG_DAN,SDT_NGUOI_HUONG_DAN,EMAIL_NGUOI_HUONG_DAN,MA_GVHD,TEN_GVHD,SDT_GVHD,EMAIL_GVHD\n" +
      "1,Nguyễn Văn,A,K25001,K25-CNTT,0987654321,Công ty TNHH ABC,123 Đường ABC Quận 1,02838222222,contact@abc.com,Trần Thị Tiếp Nhận,Trưởng phòng HR,0909123456,hr@abc.com,Nguyễn Văn Hướng Dẫn,Kỹ sư phần mềm,0909987654,mentor@abc.com,GV001,Nguyễn Văn Giảng Viên,0911222333,gv001@school.edu.vn",
    notes: [
      "Bắt buộc phải có cột: MSSV (Mã SV) và TEN (Tên sinh viên).",
      "Hệ thống sẽ tự động tách tên từ cột HO_TEN_LOT (Họ và tên lót) và TEN.",
      "Tự động tạo/tìm doanh nghiệp theo cột TEN_CONG_TY và điền thông tin người hướng dẫn, người tiếp nhận.",
      "Liên kết GVHD nếu khớp cột MA_GVHD (Mã giảng viên hướng dẫn)."
    ]
  },
  teacher: {
    label: 'Giảng viên',
    endpoint: '/teachers/import',
    templateName: 'Mau_Import_GiangVien.csv',
    templateContent:
      "STT,MA_GVHD,TEN_GVHD,EMAIL_GVHD,khoa,SDT_GVHD\n" +
      "1,GV001,Nguyễn Văn Giảng Viên,gv001@school.edu.vn,Công nghệ thông tin,0911222333",
    notes: [
      "Bắt buộc phải có cột: MA_GVHD (Mã giảng viên) và TEN_GVHD (Họ tên giảng viên).",
      "Cột EMAIL_GVHD dùng để tự động tạo tài khoản đăng nhập cho giảng viên.",
      "Cột khoa dùng để phân loại Khoa / Khoa đào tạo của giảng viên."
    ]
  },
  company: {
    label: 'Doanh nghiệp',
    endpoint: '/companies/import',
    templateName: 'Mau_Import_DoanhNghiep.csv',
    templateContent:
      "STT,TEN_CONG_TY,DIA_CHI_CONG_TY,EMAIL_CONG_TY,SDT_CONG_TY,NGUOI_TIEP_NHAN,CHUC_VU_NGUOI_TIEP_NHAN,SDT_NGUOI_TIEP_NHAN,EMAIL_NGUOI_TIEP_NHAN,NGUOI_HUONG_DAN,CHUC_VU_NGUOI_HUONG_DAN,SDT_NGUOI_HUONG_DAN,EMAIL_NGUOI_HUONG_DAN,ghi_chu\n" +
      "1,Công ty TNHH ABC,123 Đường ABC Quận 1,contact@abc.com,02838222222,Trần Thị Tiếp Nhận,Trưởng phòng HR,0909123456,hr@abc.com,Nguyễn Văn Hướng Dẫn,Kỹ sư phần mềm,0909987654,mentor@abc.com,Thực tập sinh tiềm năng",
    notes: [
      "Bắt buộc phải có cột: TEN_CONG_TY (Tên doanh nghiệp).",
      "Các cột thông tin người tiếp nhận và người hướng dẫn sẽ được lưu để hiển thị chi tiết khi sinh viên đăng ký.",
      "Ghi chú (ghi_chu) có thể chứa các yêu cầu hoặc thông tin bổ sung về doanh nghiệp."
    ]
  }
};

export default function ImportStudents() {
  const [activeType, setActiveType] = useState('student');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const toast = useToast();

  const currentType = IMPORT_TYPES[activeType];

  const handleTypeChange = (type) => {
    setActiveType(type);
    setFile(null);
    setResult(null);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (!selected.name.match(/\.(csv|xlsx|xls)$/)) {
        toast.warning('Vui lòng chọn file định dạng CSV hoặc Excel');
        return;
      }
      setFile(selected);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return toast.warning('Vui lòng chọn file');

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const res = await api.post(currentType.endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
      if (res.data.errors?.length === 0) {
        toast.success(`Import thành công ${res.data.success} ${currentType.label.toLowerCase()}`);
      } else {
        toast.warning(`Import thành công ${res.data.success}, lỗi ${res.data.errors.length} dòng`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi import');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([currentType.templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', currentType.templateName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Import dữ liệu (Hàng loạt)</h1>
          <p style={{ color: 'var(--text-muted)' }}>Sử dụng file CSV hoặc Excel để thêm nhiều {currentType.label.toLowerCase()} cùng lúc.</p>
        </div>

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          background: 'var(--border)',
          padding: '0.25rem',
          borderRadius: 'var(--radius-md)',
          gap: '0.25rem'
        }}>
          {Object.keys(IMPORT_TYPES).map((key) => (
            <button
              key={key}
              onClick={() => handleTypeChange(key)}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                borderRadius: '6px',
                background: activeType === key ? 'var(--surface)' : 'transparent',
                color: activeType === key ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: activeType === key ? 'var(--shadow-sm)' : 'none',
                transition: 'var(--transition)'
              }}
            >
              {IMPORT_TYPES[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
        {/* Upload Section */}
        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Tải file {currentType.label.toLowerCase()} lên
          </h2>

          <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center', backgroundColor: 'var(--background)' }}>
            <FileUp size={48} style={{ color: 'var(--primary)', margin: '0 auto 1rem', opacity: 0.8 }} />
            <div style={{ marginBottom: '1rem', fontWeight: '500' }}>
              {file ? file.name : 'Chưa có file nào được chọn'}
            </div>

            <input
              type="file"
              id="importFile"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              key={activeType} // Force input re-render when switching tabs to clear old selected file
            />

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <label htmlFor="importFile" className="btn btn-outline" style={{ cursor: 'pointer' }}>
                Chọn File...
              </label>
              <button className="btn btn-primary" onClick={handleImport} disabled={!file || loading}>
                <Upload size={16} /> {loading ? 'Đang xử lý...' : 'Bắt đầu Import'}
              </button>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
            <h3 style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} color="var(--primary)" /> Lưu ý định dạng:
            </h3>
            <ul style={{ paddingLeft: '1.5rem', listStyleType: 'disc', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {currentType.notes.map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
            <button className="btn btn-outline" style={{ marginTop: '1rem', fontSize: '0.75rem', padding: '0.35rem 0.65rem' }} onClick={downloadTemplate}>
              <Download size={14} /> Tải file mẫu CSV ({currentType.label})
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>Kết quả Import</h2>

          {!result ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              padding: '3rem 1rem',
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <Upload size={32} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
              <p style={{ fontSize: '0.9rem', textAlign: 'center' }}>Vui lòng tải file lên và nhấn "Bắt đầu Import" để xem kết quả.</p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <CheckCircle size={24} color="#16a34a" style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#166534' }}>{result.success}</div>
                  <div style={{ fontSize: '0.875rem', color: '#15803d' }}>Thành công</div>
                </div>

                <div style={{ flex: 1, padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <AlertCircle size={24} color="#dc2626" style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#991b1b' }}>{result.errors?.length || 0}</div>
                  <div style={{ fontSize: '0.875rem', color: '#b91c1c' }}>Thất bại</div>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div>
                  <h3 style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--danger)' }}>Chi tiết lỗi:</h3>
                  <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                    <table className="table" style={{ fontSize: '0.875rem' }}>
                      <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white' }}>
                        <tr>
                          <th style={{ width: '80px' }}>Dòng</th>
                          <th>Trường</th>
                          <th>Chi tiết lỗi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.errors.map((err, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 'bold', color: 'var(--danger)' }}>{err.row}</td>
                            <td>{err.field || '-'}</td>
                            <td>{err.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
