const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../../uploads');
const reportsDir = path.join(uploadDir, 'reports');
const importsDir = path.join(uploadDir, 'imports');

[uploadDir, reportsDir, importsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage for report files
const reportStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, reportsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `report-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Storage for import files
const importStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, importsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `import-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter for reports
const reportFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Định dạng file không được hỗ trợ. Chấp nhận: PDF, DOC, DOCX, TXT, XLSX'), false);
  }
};

// File filter for imports
const importFilter = (req, file, cb) => {
  const allowedTypes = ['.xlsx', '.xls', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc CSV (.csv)'), false);
  }
};

const uploadReport = multer({
  storage: reportStorage,
  fileFilter: reportFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const uploadImport = multer({
  storage: importStorage,
  fileFilter: importFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = { uploadReport, uploadImport };
