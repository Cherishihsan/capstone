require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const { sessionStore } = require('./config/session');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Sync database
    await sequelize.sync({ force: false });
    console.log('Database terhubung dan tersinkronisasi.');

    // Sync session store
    await sessionStore.sync();

    // Start server
    app.listen(PORT, () => {
      console.log(`Server berjalan di port ${PORT}`);
    });
  } catch (error) {
    console.error('Gagal menghubungkan ke database:', error);
    process.exit(1);
  }
}

startServer();
