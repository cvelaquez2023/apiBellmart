const { sequelize } = require("../config/mssql");
const { DataTypes } = require("sequelize");

const DireccEmbarque = sequelize.define(
  "DIRECC_EMBARQUE",
  {
    CLIENTE: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    DIRECCION: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    DETALLE_DIRECCION: {
      type: DataTypes.INTEGER,
    },
    DESCRIPCION: {
      type: DataTypes.STRING,
    },
  },
  { timestamps: false, hasTrigger: true }
);

module.exports = DireccEmbarque;
