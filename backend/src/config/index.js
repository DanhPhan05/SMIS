module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET || 'sims4_default_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  },
  pagination: {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 100,
  },
  roles: {
    ADMIN: 'admin',
    TEACHER: 'teacher',
    STUDENT: 'student',
  },
  internshipStatus: {
    NOT_STARTED: 'not_started',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    SUSPENDED: 'suspended',
  },
  academicStatus: {
    ACTIVE: 'ACTIVE',
    GRADUATED: 'GRADUATED',
    INACTIVE: 'INACTIVE',
  },
  supervisionRequestStatus: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
  },
  reportStatus: {
    SUBMITTED: 'submitted',
    VIEWED: 'viewed',
    NEEDS_REVISION: 'needs_revision',
    APPROVED: 'approved',
  },
};
