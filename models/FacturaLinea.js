const { sequelize } = require("../config/mssql");
const { DataTypes } = require("sequelize");
const FacturaLinea = sequelize.define(
  "FACTURA_LINEA",
  {
    FACTURA: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    CLIENTE: {
      type: DataTypes.STRING,
    },
    COMENTARIO_CXC: {
      type: DataTypes.STRING,
    },
  },
  { timestamps: false, hasTrigger: true }
);

module.exports = FacturaLinea;