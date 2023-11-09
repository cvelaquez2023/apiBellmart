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

    let _envio = [];
    const _cliente = await clienteModel.findAll({
      attributes: ["CLIENTE", "DETALLE_DIRECCION"],
      where: { CLIENTE: cliente.CLIENTE },
      raw: true,
    });
    nuevo = JSON.stringify(_cliente[0]);
    nuevo = JSON.parse(nuevo);

    //CONSULTAMOS LA DIRECCION DE EMBARQUE
    if (_cliente[0].DETALLE_DIRECCION) {
      const _direEmbarque = await direccEmbarqueModel.findAll({
        attributes: ["DETALLE_DIRECCION"],
        where: { CLIENTE: cliente.CLIENTE },
      });

      if (_direEmbarque.length > 0) {
        nuevo3 = JSON.stringify(_direEmbarque[0]);
        nuevo3 = JSON.parse(nuevo3);
        for (let x = 0; x < _direEmbarque.length; x++) {
          const element = _direEmbarque[x];
          const _dirEmbarqueCliente = await sequelize.query(
            `SELECT  DE.DIRECCION AS DIRE_ENVIO, DT.DETALLE_DIRECCION,DT.DIRECCION, DT.CAMPO_1,DT.CAMPO_2,DT.CAMPO_3,DT.CAMPO_4,DT.CAMPO_5,DT.CAMPO_6,DT.CAMPO_7 FROM bellmart.DETALLE_DIRECCION dt,bellmart.DIRECC_EMBARQUE de where dt.DETALLE_DIRECCION=de.DETALLE_DIRECCION  and dt.DETALLE_DIRECCION=${element.DETALLE_DIRECCION}`,
            {
              type: QueryTypes.SELECT,
            }
          );

          nuevo4 = JSON.stringify(_dirEmbarqueCliente[0]);
          nuevo4 = JSON.parse(nuevo4);
          _envio.push(nuevo4);
        }
      }

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
        envio: _envio,
      };
      res.send({ results: direccionesCliente, result: true, total: 1 });
    } else {
      return res.send({
        results: "CLIENTE NO TIENE DIRECCION ASIGNADA",
        result: true,
        total: 0,
      });
    }
  } catch (error) {
    console.log(error);
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
    const standar = "ESTANDAR";
    const cliente = req.cliente;

    //SI ES NULL la direccion

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
    /*
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
        let direccionCore = 2;
        let direccionCore1 = direccionCore + 1;
        let direccionCore2 = "0" + direccionCore1;
        const dirEnvio = {
          CLIENTE: cliente.CLIENTE,
          DIRECCION: direccionCore2,
          DETALLE_DIRECCION: _ultimo2,
          DESCRIPCION: element.direccion,
        };

        console.log("envio", dirEnvio);
        const direcc = await direccEmbarqueModel.create(dirEnvio);
        console.log(direcc);
      }
      */

    await clienteModel.update(
      { DETALLE_DIRECCION: _ultimo, DIRECCION: direccion },
      { where: { CLIENTE: cliente.CLIENTE } }
    );

    res.send({ results: "data", result: true, total: 1 });
  } catch (error) {
    res.send({ results: "error", result: false, message: error.message });
  }
};
const postDirEnvio = async (req, res) => {
  try {
    const pais = req.body.pais;
    const departamento = req.body.departamento;
    const municipio = req.body.municipio;
    const calle = req.body.calle;
    const direccion = req.body.direccion;
    const destinatario = req.body.destinatario;
    const standar = "ESTANDAR";
    const cliente = req.cliente;

    //SI ES NULL la direccion

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
    //1) consultamos la ultima direccion  para aumentar uno

    const ultimoDirEmb = await sequelize.query(
      "select  DIRECCION from bellmart.DIRECC_EMBARQUE WHERE DETALLE_DIRECCION in (select max(DETALLE_DIRECCION) from bellmart.DIRECC_EMBARQUE where CLIENTE=(:cli) )",
      { replacements: { cli: cliente.CLIENTE } },
      { type: QueryTypes.SELECT }
    );

    let _ultimoDirEmb = "";

    if (ultimoDirEmb[0].length > 0) {
      _ultimoDirEmb = parseInt(ultimoDirEmb[0][0].DIRECCION) + 1;
    } else {
      _ultimoDirEmb = "";
    }

    let _nuwDireEmb = "";
    if (_ultimoDirEmb !== "") {
      _nuwDireEmb = "0" + _ultimoDirEmb.toString();
    } else {
      _nuwDireEmb = "01";
    }

    //Insertamos en la tabla direccion de embarque

    const dirEnvio = {
      CLIENTE: cliente.CLIENTE,
      DIRECCION: _nuwDireEmb,
      DETALLE_DIRECCION: _ultimo,
      DESCRIPCION: direccion,
    };

    const direcc = await direccEmbarqueModel.create(dirEnvio);

    res.send({ results: dirEnvio, result: true, total: 1 });
  } catch (error) {
    res.send({ results: "error", result: false, message: error.message });
  }
};

const putDireccion = async (req, res) => {
  try {
    const cliente = req.cliente;
    const detDire = req.query.id;
    const pais = req.body.pais;
    const departamento = req.body.departamento;
    const municipio = req.body.municipio;
    const calle = req.body.calle;
    const direccion = req.body.direccion;
    const destinatario = req.body.destinatario;

    if (detDire) {
      const _update = await detalleDireccionModel.update(
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
          where: { DETALLE_DIRECCION: detDire },
        }
      );
      res.send({ results: _update, result: true, total: 1 });
    } else {
      res.send({ results: "No existe el Id", result: true, total: 1 });
    }
  } catch (error) {
    res.send({ results: "error", result: false, message: error });
  }
};

const deleteDirEnvio = async (req, res) => {
  try {
    const _idDire = req.query.id;

    // borramos la direccion
    const _deleteDire = await direccEmbarqueModel.destroy({
      where: { DETALLE_DIRECCION: _idDire },
    });
    console.log("Se boora la direccion", _deleteDire);
    res.send({ results: "Se realizo eliminacion", result: true, total: 1 });
  } catch (error) {
    res.send({ results: "error", result: false, message: error.message });
  }
};
module.exports = {
  getDireccion,
  postDireccion,
  postDirEnvio,
  putDireccion,
  deleteDirEnvio,
};
