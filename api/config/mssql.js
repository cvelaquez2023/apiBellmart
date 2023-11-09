const { Sequelize } = require("sequelize");

const database = process.env.SQL_DATABASE;
const username = process.env.SQL_USER;
const password = process.env.SQL_PASSWORD;
const host = process.env.SQL_HOST;
const schema = process.env.SQL_SCHEMA;

const sequelize = new Sequelize(database, username, "4-wilhelmine", {
  //  const sequelize = new Sequelize(database, username, "Master#$2021", {
  host: host,
  dialect: "mssql",
  port: 1433,
  schema: schema,
  define: {
    freezeTableName: true,
    timestamps: false,
  },
  dialectOptions: {
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
  },
});
const dbConnect = async () => {
  try {
    await sequelize.authenticate();
    console.log("conexion correcta");
  } catch (error) {
    console.log("Error de conecion", error);
  }
};

module.exports = { sequelize, dbConnect };
