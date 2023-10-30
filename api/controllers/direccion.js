const { QueryTypes } = require("sequelize");
const { sequelize } = require("../config/mssql");
const {
  detalleDireccionModel,
  direccEmbarqueModel,
  clienteModel,
} = require("../models");

const getDireccion = async (req, res) => {
  try {
    const cliente = req.cliente;

    const _cliente = await clienteModel.findAll({
      attributes: ["CLIENTE", "DETALLE_DIRECCION"],
      where: { CLIENTE: cliente.CLIENTE },
    });
    nuevo = JSON.stringify(_cliente[0]);
    nuevo = JSON.parse(nuevo);

    //CONSULTAMOS LA DIRECCION DE EMBARQUE
    const _direEmbarque = await direccEmbarqueModel.findAll({
      attributes: ["DETALLE_DIRECCION"],
      where: { CLIENTE: cliente.CLIENTE },
    });

    nuevo3 = JSON.stringify(_direEmbarque[0]);
    nuevo3 = JSON.parse(nuevo3);

    const _dirEmbarqueCliente = await detalleDireccionModel.findAll({
      attributes: [
        "DETALLE_DIRECCION",
        "DIRECCION",
        "CAMPO_1",
        "CAMPO_2",
        "CAMPO_3",
        "CAMPO_4",
        "CAMPO_5",
        "CAMPO_6",
        "CAMPO_7",
      ],
      where: { DETALLE_DIRECCION: nuevo3.DETALLE_DIRECCION },
    });

    nuevo4 = JSON.stringify(_dirEmbarqueCliente[0]);
    nuevo4 = JSON.parse(nuevo4);

    const _IdDetaDire = nuevo.DETALLE_DIRECCION;
    const _dirDetalleCliente = await detalleDireccionModel.findAll({
      attributes: [
        "DETALLE_DIRECCION",
        "DIRECCION",
        "CAMPO_1",
        "CAMPO_2",
        "CAMPO_3",
        "CAMPO_4",
        "CAMPO_5",
        "CAMPO_6",
        "CAMPO_7",
      ],
      where: { DETALLE_DIRECCION: _IdDetaDire },
    });
    nuevo2 = JSON.stringify(_dirDetalleCliente[0]);
    nuevo2 = JSON.parse(nuevo2);
    const direccionesCliente = {
      direccion: nuevo2,
      envio: nuevo4,
    };
    res.send({ results: direccionesCliente, result: true, total: 1 });
  } catch (error) {
    res.send({ results: "error", result: false, message: error });
  }
};

const postDireccion = async (req, res) => {
  try {
    const pais = req.body.pais;
    const departamento = req.body.departamento;
    const municipio = req.body.municipio;
    const calle = req.body.calle;
    const direccion = req.body.direccion;
    const destinatario = req.body.destinatario;
    const direEnvio = req.body.direEnvio;
    const standar = "ESTANDAR";
    const cliente = req.cliente;

    //Buscamos si ya existe la direccion
    const existeDetalleDireccion = await clienteModel.findOne({
      where: { CLIENTE: cliente.CLIENTE },
    });

    //SI ES NULL la direccion
    if (!existeDetalleDireccion.DETALLE_DIRECCION) {
      const ultimo = await sequelize.query(
        "select max(DETALLE_DIRECCION) as ultimo from bellmart.DETALLE_DIRECCION",
        { type: QueryTypes.SELECT }
      );

      const _ultimo = ultimo[0].ultimo + 1;

      const dir = {
        DETALLE_DIRECCION: _ultimo.toString(),
        DIRECCION: standar,
        CAMPO_1: direccion,
        CAMPO_2: pais,
        CAMPO_3: departamento,
        CAMPO_4: municipio,
        CAMPO_5: calle,
        CAMPO_6: direccion,
        CAMPO_7: destinatario,
      };

      await detalleDireccionModel.create(dir);
      // insertamos al direciion de envio
      //1) recorremos el array direccion de envio
      for (let x = 0; x < direEnvio.length; x++) {
        const element = direEnvio[x];

        const _ultimo2 = _ultimo + 1;
        const dir2 = {
          DETALLE_DIRECCION: _ultimo2.toString(),
          DIRECCION: standar,
          CAMPO_1: element.direccion,
          CAMPO_2: "ESA",
          CAMPO_3: element.departamento,
          CAMPO_4: element.municipio,
          CAMPO_5: element.calle,
          CAMPO_6: element.direccion,
          CAMPO_7: element.destinatario,
        };
        await detalleDireccionModel.create(dir2);
        //Insertamos en la tabla direccion de embarque

        const dirEnvio = {
          CLIENTE: cliente.CLIENTE,
          DIRECCION: "02",
          DETALLE_DIRECCION: _ultimo2,
          DESCRIPCION: element.direccion,
        };

        console.log("envio", dirEnvio);
        const direcc = await direccEmbarqueModel.create(dirEnvio);
        console.log(direcc);
      }

      await clienteModel.update(
        { DETALLE_DIRECCION: _ultimo, DIRECCION: direccion },
        { where: { CLIENTE: cliente.CLIENTE } }
      );
    } else {
      await detalleDireccionModel.update(
        {
          CAMPO_1: direccion,
          CAMPO_2: pais,
          CAMPO_3: departamento,
          CAMPO_4: municipio,
          CAMPO_5: calle,
          CAMPO_6: direccion,
          CAMPO_7: destinatario,
        },
        {
          where: {
            DETALLE_DIRECCION: existeDetalleDireccion.DETALLE_DIRECCION,
          },
        }
      );

      // consultamos la tabla de direccion de embarque

      const clienteDirEmbarque = await sequelize.query(
        "select DETALLE_DIRECCION from bellmart.direcc_embarque where cliente=(:_1)",
        {
          replacements: { _1: cliente.CLIENTE },
        },
        { type: QueryTypes.SELECT }
      );

      nuevo = JSON.stringify(clienteDirEmbarque[0][0]);
      nuevo = JSON.parse(nuevo);
      const idDireEmbarque = nuevo;

      for (let x = 0; x < direEnvio.length; x++) {
        const element = direEnvio[x];
        await detalleDireccionModel.update(
          {
            CAMPO_1: element.direccion,
            CAMPO_2: "ESA",
            CAMPO_3: element.departamento,
            CAMPO_4: element.municipio,
            CAMPO_5: element.calle,
            CAMPO_6: element.direccion,
            CAMPO_7: element.destinatario,
          },
          {
            where: {
              DETALLE_DIRECCION: idDireEmbarque.DETALLE_DIRECCION,
            },
          }
        );
      }
      await clienteModel.update(
        { DIRECCION: direccion },
        { where: { CLIENTE: cliente.CLIENTE } }
      );
    }
    res.send({ results: "data", result: true, total: 1 });
  } catch (error) {
    res.send({ results: "error", result: false, message: error.message });
  }
};
const putDireccion = async (req, res) => {
  try {
    const cliente = req.cliente;
    console.log(cliente);
    res.send({ results: "data", result: true, total: 1 });
  } catch (error) {
    res.send({ results: "error", result: false, message: error });
  }
};

module.exports = {
  getDireccion,
  postDireccion,
  putDireccion,
};
