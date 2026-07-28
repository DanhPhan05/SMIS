const XLSX = require('xlsx');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { Company, Student, Teacher, User, ImportLog } = require('../models');
const { AppError } = require('../utils/helpers');

const VALID_BATCH_PATTERN = /^K\d{2}$/i;

// Hàm strip BOM và chuẩn hóa key của row
function normalizeRow(row) {
  const normalized = {};
  for (const key of Object.keys(row)) {
    // Xóa BOM (\uFEFF) và khoảng trắng thừa khỏi tên cột
    const cleanKey = key.replace(/^\uFEFF/, '').trim();
    normalized[cleanKey] = row[key];
  }
  return normalized;
}

class ImportService {
  async importFile(filePath, importType, userId) {
    const ext = path.extname(filePath).toLowerCase();
    let rows = [];

    if (ext === '.csv') {
      rows = await this.parseCSV(filePath);
    } else {
      rows = this.parseExcel(filePath);
    }

    if (rows.length === 0) {
      throw new AppError('File không có dữ liệu', 400);
    }

    let result;
    switch (importType) {
      case 'company':
        result = await this.importCompanies(rows);
        break;
      case 'student':
        result = await this.importStudents(rows);
        break;
      case 'teacher':
        result = await this.importTeachers(rows);
        break;
      default:
        throw new AppError('Loại import không hợp lệ', 400);
    }

    await ImportLog.create({
      imported_by: userId,
      import_type: importType,
      file_name: path.basename(filePath),
      total_rows: rows.length,
      success_count: result.success,
      error_count: result.errors.length,
      error_details: result.errors.length > 0 ? result.errors : null,
    });

    return result;
  }

  parseExcel(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    // SheetJS tự xử lý BOM, nhưng vẫn normalize cho chắc
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    return rows.map(normalizeRow);
  }

  parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return reject(err);
        
        const firstLine = data.split('\n')[0] || '';
        const commaCount = (firstLine.match(/,/g) || []).length;
        const semicolonCount = (firstLine.match(/;/g) || []).length;
        const separator = semicolonCount > commaCount ? ';' : ',';
        
        const results = [];
        fs.createReadStream(filePath)
          .pipe(
            csv({
              separator: separator,
              bom: true,
              mapHeaders: ({ header }) => header.replace(/^\uFEFF/, '').trim(),
              mapValues: ({ value }) => (typeof value === 'string' ? value.trim() : value),
            })
          )
          .on('data', (data) => results.push(data))
          .on('end', () => resolve(results))
          .on('error', reject);
      });
    });
  }

  // ── Helper: lấy giá trị từ row, hỗ trợ nhiều tên cột và không phân biệt chữ hoa/thường ──
  _getField(row, ...keys) {
    // 1. Tìm khớp chính xác trước
    for (const k of keys) {
      if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
        return String(row[k]).trim();
      }
    }
    
    // 2. Tìm khớp không phân biệt hoa thường, dấu cách hay gạch dưới
    const rowKeys = Object.keys(row);
    const normalize = (s) => String(s).toLowerCase().replace(/[\s_-]/g, '');
    const normalizedTargetKeys = keys.map(normalize);
    
    for (const rowKey of rowKeys) {
      const normRowKey = normalize(rowKey);
      if (normalizedTargetKeys.includes(normRowKey)) {
        if (row[rowKey] !== undefined && row[rowKey] !== null && String(row[rowKey]).trim() !== '') {
          return String(row[rowKey]).trim();
        }
      }
    }
    return '';
  }

  async importCompanies(rows) {
    let success = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        const name = this._getField(row, 'TEN_CONG_TY', 'ten_cong_ty', 'ten_doanh_nghiep', 'name', 'Tên doanh nghiệp', 'Tên công ty');
        if (!name) {
          errors.push({ row: i + 2, error: 'Thiếu tên doanh nghiệp' });
          continue;
        }

        await Company.create({
          name,
          address: this._getField(row, 'DIA_CHI_CONG_TY', 'dia_chi_cong_ty', 'dia_chi', 'address', 'Địa chỉ công ty', 'Địa chỉ') || null,
          email: this._getField(row, 'EMAIL_CONG_TY', 'email_cong_ty', 'email', 'Email công ty', 'Email') || null,
          phone: this._getField(row, 'SDT_CONG_TY', 'sdt_cong_ty', 'so_dien_thoai', 'phone', 'SĐT công ty', 'Số điện thoại') || null,
          nguoi_tiep_nhan: this._getField(row, 'NGUOI_TIEP_NHAN', 'nguoi_tiep_nhan', 'nguoi_lien_he', 'contact_person', 'Người tiếp nhận', 'Người liên hệ'),
          chuc_vu_nguoi_tiep_nhan: this._getField(row, 'CHUC_VU_NGUOI_TIEP_NHAN', 'chuc_vu_nguoi_tiep_nhan', 'Chức vụ người tiếp nhận'),
          sdt_nguoi_tiep_nhan: this._getField(row, 'SDT_NGUOI_TIEP_NHAN', 'sdt_nguoi_tiep_nhan', 'SĐT người tiếp nhận'),
          email_nguoi_tiep_nhan: this._getField(row, 'EMAIL_NGUOI_TIEP_NHAN', 'email_nguoi_tiep_nhan', 'Email người tiếp nhận'),
          nguoi_huong_dan: this._getField(row, 'NGUOI_HUONG_DAN', 'nguoi_huong_dan', 'Người hướng dẫn'),
          chuc_vu_nguoi_huong_dan: this._getField(row, 'CHUC_VU_NGUOI_HUONG_DAN', 'chuc_vu_nguoi_huong_dan', 'Chức vụ người hướng dẫn'),
          sdt_nguoi_huong_dan: this._getField(row, 'SDT_NGUOI_HUONG_DAN', 'sdt_nguoi_huong_dan', 'SĐT người hướng dẫn'),
          email_nguoi_huong_dan: this._getField(row, 'EMAIL_NGUOI_HUONG_DAN', 'email_nguoi_huong_dan', 'Email người hướng dẫn'),
          notes: this._getField(row, 'ghi_chu', 'notes', 'Ghi chú'),
        });
        success++;
      } catch (err) {
        errors.push({ row: i + 2, error: err.message });
      }
    }

    return { success, errors, total: rows.length };
  }

  async importStudents(rows) {
    let success = 0;
    const errors = [];
    const seenCodes = new Set();
    const seenEmails = new Set();

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        const rowNum = i + 2;

        // ── Đọc thông tin sinh viên ──
        const studentCode = this._getField(row, 'MSSV', 'mssv', 'student_code', 'ma_sinh_vien', 'Mã SV');
        const hoTenLot = this._getField(row, 'HO_TEN_LOT', 'ho_ten_lot', 'Họ và tên lót');
        const ten = this._getField(row, 'TEN', 'ten', 'Tên');
        // Fallback: nếu dùng full_name cũ
        const fullNameLegacy = this._getField(row, 'full_name', 'ho_ten', 'Họ tên');
        const className = this._getField(row, 'LOP', 'lop', 'class_name', 'Lớp');
        const phone = this._getField(row, 'SDT_SINH_VIEN', 'sdt_sinh_vien', 'phone', 'so_dien_thoai', 'SĐT');
        const emailVal = this._getField(row, 'email', 'Email', 'EMAIL', 'email_sinh_vien', 'EMAIL_SINH_VIEN', 'Email sinh viên', 'Địa chỉ email', 'dia_chi_email');
        const email = emailVal ? emailVal.toLowerCase() : '';
        const batch = this._getField(row, 'batch', 'khoa', 'Khóa').toUpperCase();
        const rawStatus = this._getField(row, 'status', 'academic_status', 'Trạng thái').toUpperCase() || 'ACTIVE';
        const major = this._getField(row, 'major', 'nganh', 'Ngành');

        // ── Xử lý tên ──
        let finalHoTenLot = hoTenLot;
        let finalTen = ten;
        if (!hoTenLot && !ten && fullNameLegacy) {
          // Tách full_name legacy → ho_ten_lot + ten
          const parts = fullNameLegacy.trim().split(/\s+/);
          if (parts.length > 1) {
            finalTen = parts.pop();
            finalHoTenLot = parts.join(' ');
          } else {
            finalHoTenLot = '';
            finalTen = fullNameLegacy.trim();
          }
        }

        if (!studentCode) {
          errors.push({ row: rowNum, field: 'MSSV', error: 'Thiếu mã sinh viên' });
          continue;
        }
        if (!finalTen) {
          errors.push({ row: rowNum, field: 'TEN', error: 'Thiếu tên sinh viên' });
          continue;
        }

        if (seenCodes.has(studentCode)) {
          errors.push({ row: rowNum, field: 'MSSV', error: `Mã sinh viên ${studentCode} trùng lặp trong file` });
          continue;
        }
        seenCodes.add(studentCode);

        if (email && seenEmails.has(email)) {
          errors.push({ row: rowNum, field: 'email', error: `Email ${email} trùng lặp trong file` });
          continue;
        }
        if (email) seenEmails.add(email);

        if (batch && !VALID_BATCH_PATTERN.test(batch)) {
          errors.push({ row: rowNum, field: 'batch', error: `Batch "${batch}" không hợp lệ (phải dạng K21, K22...)` });
          continue;
        }

        const validStatuses = ['ACTIVE', 'GRADUATED', 'INACTIVE'];
        const academicStatus = validStatuses.includes(rawStatus) ? rawStatus : 'ACTIVE';

        const existingStudent = await Student.findOne({ where: { student_code: studentCode } });
        if (existingStudent) {
          errors.push({ row: rowNum, field: 'MSSV', error: `Mã SV ${studentCode} đã tồn tại trong hệ thống` });
          continue;
        }

        if (email) {
          const existingEmailStudent = await Student.findOne({ where: { email } });
          if (existingEmailStudent) {
            errors.push({ row: rowNum, field: 'email', error: `Email ${email} đã được sử dụng bởi SV khác` });
            continue;
          }
        }

        // ── Đọc thông tin công ty & tìm/tạo Company ──
        const companyName = this._getField(row, 'TEN_CONG_TY', 'ten_cong_ty', 'Tên công ty');
        let companyId = null;
        if (companyName) {
          let company = await Company.findOne({ where: { name: companyName } });
          if (!company) {
            company = await Company.create({
              name: companyName,
              address: this._getField(row, 'DIA_CHI_CONG_TY', 'dia_chi_cong_ty', 'Địa chỉ công ty'),
              phone: this._getField(row, 'SDT_CONG_TY', 'sdt_cong_ty', 'SĐT công ty'),
              email: this._getField(row, 'EMAIL_CONG_TY', 'email_cong_ty', 'Email công ty'),
            });
          }
          companyId = company.id;
        }

        // ── Đọc thông tin GVHD & tìm Teacher ──
        const maGVHD = this._getField(row, 'MA_GVHD', 'ma_gvhd', 'Mã GVHD');
        let teacherId = null;
        if (maGVHD) {
          const teacher = await Teacher.findOne({ where: { teacher_code: maGVHD } });
          if (teacher) {
            teacherId = teacher.id;
          }
          // Nếu không tìm thấy GV, không tạo lỗi — chỉ bỏ qua gán GV
        }

        // ── Tạo User account nếu có email ──
        const displayName = `${finalHoTenLot} ${finalTen}`.trim();
        let userId = null;
        if (email) {
          const existingUser = await User.findOne({ where: { email } });
          if (!existingUser) {
            const user = await User.create({
              email,
              password: 'Student@123',
              full_name: displayName,
              role: 'student',
            });
            userId = user.id;
          } else {
            userId = existingUser.id;
          }
        }

        // ── Đọc thông tin người tiếp nhận & người hướng dẫn tại DN ──
        const nguoiTiepNhan = this._getField(row, 'NGUOI_TIEP_NHAN', 'nguoi_tiep_nhan', 'Người tiếp nhận');
        const chucVuNguoiTiepNhan = this._getField(row, 'CHUC_VU_NGUOI_TIEP_NHAN', 'chuc_vu_nguoi_tiep_nhan', 'Chức vụ người tiếp nhận');
        const sdtNguoiTiepNhan = this._getField(row, 'SDT_NGUOI_TIEP_NHAN', 'sdt_nguoi_tiep_nhan', 'SĐT người tiếp nhận');
        const emailNguoiTiepNhan = this._getField(row, 'EMAIL_NGUOI_TIEP_NHAN', 'email_nguoi_tiep_nhan', 'Email người tiếp nhận');

        const nguoiHuongDan = this._getField(row, 'NGUOI_HUONG_DAN', 'nguoi_huong_dan', 'Người hướng dẫn');
        const chucVuNguoiHuongDan = this._getField(row, 'CHUC_VU_NGUOI_HUONG_DAN', 'chuc_vu_nguoi_huong_dan', 'Chức vụ người hướng dẫn');
        const sdtNguoiHuongDan = this._getField(row, 'SDT_NGUOI_HUONG_DAN', 'sdt_nguoi_huong_dan', 'SĐT người hướng dẫn');
        const emailNguoiHuongDan = this._getField(row, 'EMAIL_NGUOI_HUONG_DAN', 'email_nguoi_huong_dan', 'Email người hướng dẫn');

        await Student.create({
          student_code: studentCode,
          ho_ten_lot: finalHoTenLot,
          ten: finalTen,
          email: email || null,
          batch: batch || null,
          academic_status: academicStatus,
          user_id: userId,
          class_name: className || '',
          major: major || '',
          phone: phone || '',
          company_id: companyId,
          teacher_id: teacherId,
          // Thông tin người tiếp nhận & hướng dẫn tại DN
          nguoi_tiep_nhan: nguoiTiepNhan || null,
          chuc_vu_nguoi_tiep_nhan: chucVuNguoiTiepNhan || null,
          sdt_nguoi_tiep_nhan: sdtNguoiTiepNhan || null,
          email_nguoi_tiep_nhan: emailNguoiTiepNhan || null,
          nguoi_huong_dan: nguoiHuongDan || null,
          chuc_vu_nguoi_huong_dan: chucVuNguoiHuongDan || null,
          sdt_nguoi_huong_dan: sdtNguoiHuongDan || null,
          email_nguoi_huong_dan: emailNguoiHuongDan || null,
        });
        success++;
      } catch (err) {
        errors.push({ row: i + 2, error: err.message });
      }
    }
    return { success, errors, total: rows.length };
  }

  async importTeachers(rows) {
    let success = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        const teacherCode = this._getField(row, 'MA_GVHD', 'ma_gvhd', 'ma_giang_vien', 'teacher_code', 'Mã GV', 'Mã GVHD');
        const fullName = this._getField(row, 'TEN_GVHD', 'ten_gvhd', 'ho_ten', 'full_name', 'Họ tên', 'Tên GVHD');
        if (!teacherCode || !fullName) {
          errors.push({ row: i + 2, error: 'Thiếu mã GV hoặc họ tên' });
          continue;
        }

        const existing = await Teacher.findOne({ where: { teacher_code: teacherCode } });
        if (existing) {
          errors.push({ row: i + 2, error: `Mã GV ${teacherCode} đã tồn tại` });
          continue;
        }

        const emailVal = this._getField(row, 'EMAIL_GVHD', 'email_gvhd', 'email', 'Email', 'Email GVHD');
        const email = emailVal ? emailVal.toLowerCase() : null;

        let userId = null;
        if (email) {
          const existingUser = await User.findOne({ where: { email } });
          if (!existingUser) {
            const user = await User.create({
              email,
              password: 'Teacher@123',
              full_name: fullName,
              role: 'teacher',
            });
            userId = user.id;
          } else {
            userId = existingUser.id;
          }
        }

        await Teacher.create({
          teacher_code: teacherCode,
          full_name: fullName,
          user_id: userId,
          email: email,
          department: this._getField(row, 'khoa', 'department', 'Khoa') || null,
          phone: this._getField(row, 'SDT_GVHD', 'sdt_gvhd', 'so_dien_thoai', 'phone', 'SĐT', 'SĐT GVHD') || null,
        });
        success++;
      } catch (err) {
        errors.push({ row: i + 2, error: err.message });
      }
    }
    return { success, errors, total: rows.length };
  }
}

module.exports = new ImportService();