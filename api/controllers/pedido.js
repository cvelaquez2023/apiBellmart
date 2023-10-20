const { QueryTypes } = require("sequelize");
const { sequelize } = require("../config/mssql");
const {
  consecutivoFaModel,
  clienteModel,
  pedidoModel,
  pedidoLineaModel,
  nitModel,
} = require("../models");

const getPedido = async (req, res) => {
  try {
    const user = req.cliente;
    //Consultamos datos del cliente
    const datosCliente = await clienteModel.findOne({
      attributes: [
        "CLIENTE",
        "NOMBRE",
        "CONTRIBUYENTE",
        "RUBRO1_CLI",
        "RUBRO2_CLI",
        "Telefono1",
        "E_Mail",
      ],
      where: { CLIENTE: user.CLIENTE },
    });
    //const ClienteContribuyente = datosCliente.CONTRIBUYENTE;
    //const ClienteNRC = datosCliente.RUBRO1_CLI;
    //const ClienteGiro = datosCliente.RUBRO2_CLI;

    //Validamos que tipo de documento quiere el cliente
    //Si es 1 =Credito Fiscal y si es 2= es Consumidor Final
    //Si es Credito Fiscal necesito validar si existe los documentos necesarios
    //que son el NIT,NRC y GIRO
    //Procedmos a validacion
    if (req.body.tipoDoc == 1) {
      //Solicita Credito Fiscal
      //Validamos si los que envia esta en la base de datos registrada al cliente
      const existNit = await nitModel.findOne({
        where: { NIT: req.body.Nit },
      });

      if (existNit == null) {
        //si no existe el numero de nit procedemos a crearlo en la tabla NIT
        const NIT = {
          NIT: req.body.Nit,
          RAZON_SOCIAL: datosCliente.NOMBRE,
          ALIAS: datosCliente.NOMBRE,
          TIPO: "ND",
          ORIGEN: "O",
          NUMERO_DOC_NIT: req.body.Nit,
          EXTERIOR: 0,
          NATURALEZA: "N",
          ACTIVO: "S",
          TIPO_CONTRIBUYENTE: "F",
          NRC: req.body.Nrc,
          GIRO: req.body.Giro,
          CATEGORIA: req.body.Categoria,
          TIPO_REGIMEN: "S",
          INF_LEGAL: "N",
          DETALLAR_KITS: "N",
          ACEPTA_DOC_ELECTRONICO: "N",
          USA_REPORTE_D151: "N",
        };
        const CreateNit = await nitModel.create(NIT);
        if (CreateNit != null) {
          //actualizamos los datos del cliente
          const actualizaCliente = await clienteModel.update(
            {
              CONTRIBUYENTE: req.body.Nit,
              RUBRO1_CLI: req.body.Nrc,
              RUBRO2_CLI: req.body.Giro,
              RUBRO3_CLI: req.body.Categoria,
            },
            { where: { CLIENTE: req.body.cliente } }
          );
        }
      }
    }

    //Consultamos el numero de pedido que nos toca asignar.
    const ConsPedido = await consecutivoFaModel.findOne({
      where: { CODIGO_CONSECUTIVO: req.query.Conse },
    });

    const ultimoValor = ConsPedido.VALOR_CONSECUTIVO;
    const valor = ultimoValor.split("-");
    const valor0 = valor[0];
    const valor1 = valor[1];
    const cara = valor1.length;
    const consecutivo = Math.floor(valor1);
    const fill = (number, len) =>
      "0".repeat(len - number.toString().length) + number.toString();

    //Nuevo correlativo
    const nuevoCorrelativo = valor0 + "-" + fill(consecutivo + 1, cara);

    //traemos informacion de Cliente y monto
    //Consultamos al cliente
    const Cliente = await clienteModel.findOne({
      where: { CLIENTE: req.body.cliente },
    });

    //    console.log(Cliente);
    //Montamos datos para el encabezado de pedido

    var fecha_utc = formatDate(new Date());
    const encabezado = {
      PEDIDO: nuevoCorrelativo,
      ESTADO: "N",
      FECHA_PEDIDO: fecha_utc,
      FECHA_PROMETIDA: fecha_utc,
      FECHA_PROX_EMBARQU: fecha_utc,
      FECHA_ULT_EMBARQUE: "01-01-1980",
      FECHA_ULT_CANCELAC: "01-01-1980",
      FECHA_ORDEN: fecha_utc,
      EMBARCAR_A: Cliente.NOMBRE,
      DIREC_EMBARQUE: "ND",
      DIRECCION_FACTURA: req.body.direccion,
      OBSERVACIONES: req.body.observaciones,
      TOTAL_MERCADERIA: parseFloat((req.body.total / 1.13).toFixed(2)),
      MONTO_ANTICIPO: 0,
      MONTO_FLETE: 0,
      MONTO_SEGURO: 0,
      MONTO_DOCUMENTACIO: 0,
      TIPO_DESCUENTO1: "P",
      TIPO_DESCUENTO2: "P",
      MONTO_DESCUENTO1: 0,
      MONTO_DESCUENTO2: 0,
      PORC_DESCUENTO1: 0,
      PORC_DESCUENTO2: 0,
      TOTAL_IMPUESTO1: parseFloat(
        (req.body.total - req.body.total / 1.13).toFixed(2)
      ),
      TOTAL_IMPUESTO2: 0,
      TOTAL_A_FACTURAR: parseFloat(req.body.total.toFixed(2)),
      PORC_COMI_VENDEDOR: 0,
      PORC_COMI_COBRADOR: 0,
      TOTAL_CANCELADO: 0,
      TOTAL_UNIDADES: req.body.totalUnidades,
      IMPRESO: "N",
      FECHA_HORA: fecha_utc,
      DESCUENTO_VOLUMEN: 0,
      TIPO_PEDIDO: "N",
      MONEDA_PEDIDO: "L",
      VERSION_NP: 1,
      AUTORIZADO: "N",
      DOC_A_GENERAR: "F",
      CLASE_PEDIDO: "N",
      MONEDA: "L",
      NIVEL_PRECIO: Cliente.Nivel_Precio,
      COBRADOR: Cliente.Cobrador,
      RUTA: Cliente.Ruta,
      USUARIO: "SA",
      CONDICION_PAGO: Cliente.Condicion_Pago,
      BODEGA: req.body.bodega,
      ZONA: Cliente.Zona,
      VENDEDOR: Cliente.Vendedor,
      CLIENTE: req.body.cliente,
      CLIENTE_DIRECCION: req.body.cliente,
      CLIENTE_CORPORAC: req.body.cliente,
      CLIENTE_ORIGEN: req.body.cliente,
      PAIS: Cliente.Pais,
      SUBTIPO_DOC_CXC: req.body.tipoDoc,
      TIPO_DOC_CXC: "FAC",
      BACKORDER: "N",
      PORC_INTCTE: 0.0,
      DESCUENTO_CASCADA: "N",
      FIJAR_TIPO_CAMBIO: "N",
      ORIGEN_PEDIDO: "F",
      BASE_IMPUESTO1: req.body.total,
      BASE_IMPUESTO2: 0.0,
      NOMBRE_CLIENTE: Cliente.NOMBRE,
      FECHA_PROYECTADA: fecha_utc,
      TIPO_DOCUMENTO: "P",
      TASA_IMPOSITIVA_PORC: 0.0,
      TASA_CREE1_PORC: 0.0,
      TASA_CREE2_PORC: 0.0,
      TASA_GAN_OCASIONAL_PORC: 0.0,
      CONTRATO_REVENTA: "N",
    };

    const detalle = req.body.detalle;

    //  console.log(encabezado);
    //Insertamos pedido en Softaland
    const nuevoPedido = await pedidoModel.create(encabezado);
    //actualizmos correlativo

    const results = await consecutivoFaModel.update(
      {
        VALOR_CONSECUTIVO: nuevoCorrelativo,
      },
      { where: { CODIGO_CONSECUTIVO: req.query.Conse } }
    );

    if (results > 0) {
      //GUARDAMOS LINEAS DE PEDIDO.
      var Consec = 0;
      for (var value of detalle) {
        Consec = Consec + 1;
        const pedidoLinea = {
          PEDIDO: nuevoCorrelativo,
          PEDIDO_LINEA: Consec,
          BODEGA: req.body.bodega,
          ARTICULO: value.producto,
          ESTADO: "N",
          FECHA_ENTREGA: fecha_utc,
          LINEA_USUARIO: Consec,
          PRECIO_UNITARIO: parseFloat((value.precio / 1.13).toFixed(2)),
          CANTIDAD_PEDIDA: value.cantidad,
          CANTIDAD_A_FACTURA: value.cantidad,
          CANTIDAD_FACTURADA: 0,
          CANTIDAD_RESERVADA: 0,
          CANTIDAD_BONIFICAD: 0,
          CANTIDAD_CANCELADA: 0,
          TIPO_DESCUENTO: "P",
          MONTO_DESCUENTO: 0,
          PORC_DESCUENTO: 0,
          FECHA_PROMETIDA: fecha_utc,
          CENTRO_COSTO: "1-1-01-001",
          CUENTA_CONTABLE: "4-1-01-01-01-01-00",
          TIPO_DESC: 0,
          PORC_EXONERACION: 0,
          PORC_IMPUESTO1: 13,
          PORC_IMPUESTO2: 0,
          ES_OTRO_CARGO: "N",
          ES_CANASTA_BASICA: "N",
        };

        const pedidoLineaNew = await pedidoLineaModel.create(pedidoLinea);
      }
    }

    const data3 = await sequelize.query(
      `EXEC bellmart.sP_Factura_API '${nuevoCorrelativo}','${req.body.ConsecutivoFA}',${req.body.tipoDoc},'${req.body.CondicionPago}'`,
      { type: QueryTypes.SELECT }
    );

    const factura = await sequelize.query(
      "SELECT FACTURA FROM bellmart.FACTURA  WHERE PEDIDO=(:pedido) ",
      {
        replacements: { pedido: nuevoCorrelativo },
      },
      { type: QueryTypes.SELECT }
    );

    dataNew = JSON.stringify(factura[0]);
    dataNew = JSON.parse(dataNew);

    //console.log(dataNew)
    //Procedemos a realizar la factura por medio de un procedimiento almacenado
    res.send({ results: dataNew, result: "true" });
  } catch (error) {
    console.log(error);
  }
};
const getFactura = async (req, res) => {
  const factura = req.params.factura;
  if (!factura) {
    return res.status(400).send({ messaje: "Es requerida Numero Factura" });
  }
  const data = await sequelize.query(
    "select IIF( fa.SUBTIPO_DOC_CXC=1,'CREDITO FISCAL','FACTURA') AS DOCUMENTO, fl.ARTICULO,art.DESCRIPCION, fl.CANTIDAD, fl.PRECIO_UNITARIO,fl.TOTAL_IMPUESTO1,PRECIO_TOTAL,(FL.PRECIO_TOTAL+FL.TOTAL_IMPUESTO1) AS TOTAL  from bellmart.FACTURA_LINEA fl,bellmart.FACTURA fa ,bellmart.ARTICULO art where fa.FACTURA=fl.FACTURA and fa.FACTURA=(:doc) and fl.ARTICULO=art.ARTICULO",
    {
      replacements: {
        doc: factura,
      },
    },
    { type: QueryTypes.SELECT }
  );

  dataNew = JSON.stringify(data[0]);
  dataNew = JSON.parse(dataNew);

  res.send({ results: dataNew, result: true });
};
function padTo2Digits(num) {
  return num.toString().padStart(2, "0");
}

function formatDate(date) {
  return (
    [
      date.getFullYear(),
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate()),
    ].join("-") +
    " " +
    [
      padTo2Digits(date.getHours()),
      padTo2Digits(date.getMinutes()),
      padTo2Digits(date.getSeconds()),
    ].join(":")
  );
}
module.exports = { getPedido, getFactura };
