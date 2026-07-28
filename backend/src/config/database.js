const { Sequelize } = require('sequelize');

let sequelize;

// If DATABASE_URL is provided (e.g. Supabase, Render, Neon, Railway)
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      ssl: process.env.DB_SSL === 'false' ? false : {
        require: true,
        rejectUnauthorized: false,
      },
      // Force IPv4 — Render free tier doesn't support IPv6
      family: 4,
    },
  });
} else {
  // Local environment setup
  sequelize = new Sequelize(
    process.env.DB_NAME || 'sims_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      define: {
        timestamps: true,
        underscored: true,
      },
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions:
        process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production'
          ? { ssl: { require: true, rejectUnauthorized: false } }
          : {},
    }
  );
}

module.exports = sequelize;
