require('dotenv').config();
const { Sequelize } = require('sequelize');

const dialect = (process.env.DB_DIALECT || 'postgres').toLowerCase();

let sequelize;

if (dialect === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || ':memory:',
    logging: false
  });
} else if (dialect === 'postgres' || dialect === 'postgresql') {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'simnilai',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      dialect: 'postgres',
      logging: false
    }
  );
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'simnilai',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      dialect: 'mysql',
      logging: false,
      timezone: '+07:00'
    }
  );
}

module.exports = sequelize;
