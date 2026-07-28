require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { sequelize } = require('./src/models');
const routes = require('./src/routes');
const errorHandler = require('./src/middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      callback(new Error(`CORS policy does not allow origin: ${origin}`));
    },
    credentials: true,
  })
);

// ── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ── Static Files ──────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── File Preview (inline) ─────────────────────────────────────────────────────
app.get('/preview/:folder/:filename', (req, res) => {
  const { folder, filename } = req.params;
  // Only allow specific folders
  if (!['reports', 'imports'].includes(folder)) {
    return res.status(400).json({ message: 'Invalid folder' });
  }
  const filePath = path.join(__dirname, 'uploads', folder, filename);
  const ext = path.extname(filename).toLowerCase();
  
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('File preview error:', err.message);
      if (!res.headersSent) {
        res.status(404).json({ message: 'File không tồn tại' });
      }
    }
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '4.0.0',
    });
  } catch (err) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: err.message,
    });
  }
});

// ── Error Handling ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully');

    // ── Manual migration for ENUM + new columns ──
    try {
      // 1. Tách full_name -> ho_ten_lot + ten trong bảng students
      await sequelize.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name='students' AND column_name='full_name'
          ) THEN
            -- Thêm cột ho_ten_lot và ten nếu chưa có
            ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "ho_ten_lot" VARCHAR(200) NOT NULL DEFAULT '';
            ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "ten" VARCHAR(100) NOT NULL DEFAULT '';
            
            -- Tách tên bằng mảng
            UPDATE "students" 
            SET 
              "ten" = (string_to_array(trim("full_name"), ' '))[array_length(string_to_array(trim("full_name"), ' '), 1)],
              "ho_ten_lot" = array_to_string((string_to_array(trim("full_name"), ' '))[1:array_length(string_to_array(trim("full_name"), ' '), 1)-1], ' ')
            WHERE "full_name" IS NOT NULL AND "full_name" <> '';
            
            -- Trường hợp tên chỉ có 1 từ
            UPDATE "students"
            SET "ten" = trim("full_name"), "ho_ten_lot" = ''
            WHERE "ten" = '' OR "ten" IS NULL;

            -- Xóa cột full_name cũ
            ALTER TABLE "students" DROP COLUMN "full_name";
          END IF;
        END $$;
      `);
      console.log('✅ Student full_name migration check completed');

      // 2. Đổi tên contact_person -> nguoi_tiep_nhan trong bảng companies
      await sequelize.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name='companies' AND column_name='contact_person'
          ) THEN
            ALTER TABLE "companies" RENAME COLUMN "contact_person" TO "nguoi_tiep_nhan";
          END IF;
        END $$;
      `);
      console.log('✅ Company contact_person migration check completed');

      // Create internship_type ENUM if not exists
      await sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "public"."enum_students_internship_type" AS ENUM('THUC_TAP', 'DO_AN');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);

      // Add internship_type column if not exists
      await sequelize.query(`
        ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "internship_type" "public"."enum_students_internship_type" NOT NULL DEFAULT 'THUC_TAP';
      `);

      // Create score_type ENUM if not exists
      await sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "public"."enum_scores_score_type" AS ENUM('TEACHER', 'COMPANY');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);

      // Safe check: drop scores table ONLY if it contains old columns (like progress_score)
      const [oldCols] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'scores' AND column_name = 'progress_score';
      `);
      if (oldCols && oldCols.length > 0) {
        await sequelize.query(`DROP TABLE IF EXISTS "scores" CASCADE;`);
        console.log('✅ Dropped old scores table to apply new schema');
      }
      console.log('✅ Migration check completed');
    } catch (migErr) {
      console.log('⚠️ Migration note:', migErr.message);
    }

    // Sync models
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced');

    app.listen(PORT, () => {
      console.log(`🚀 SIMS 4.0 Server running on http://localhost:${PORT}`);
      console.log(`📝 API info: http://localhost:${PORT}/api`);
      console.log(`❤️  Health:   http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error.message);
    console.error('❌ Full error:', error);
    console.error('❌ DATABASE_URL set:', !!process.env.DATABASE_URL);
    console.error('❌ DB_HOST:', process.env.DB_HOST || 'not set');
    process.exit(1);
  }
}

startServer();

