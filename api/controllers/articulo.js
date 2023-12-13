const { QueryTypes } = require("sequelize");
const { articuloModel } = require("../models");
const { handleHttpError } = require("../utils/handleError");
const { sequelize } = require("../config/mssql");
const { matchedData } = require("express-validator");

const getItemsCat = async (req, res) => {
  try {
    const data = await sequelize.query(
      //"SELECT ART.ARTICULO, ART.DESCRIPCION, ART.CLASIFICACION_1, ART.CLASIFICACION_2, ART.CLASIFICACION_3, ART.CLASIFICACION_4, ART.CLASIFICACION_5, ART.CLASIFICACION_6, ART.PESO_NETO, ART.PESO_BRUTO, ART.VOLUMEN,ROUND((pre.PRECIO*1.13),2) AS PRECIO, ex.CANT_DISPONIBLE,ART.ACTIVO, ART.ESTILO, ART.TALLA, ART.COLOR, ART.GALERIA_IMAGENES,ART.IMAGEN_VERTICAL, ART.IMAGEN_HORIZONTAL, ART.IMAGEN, ART.ESPECIFICACIONES, ART.VISTAS FROM bellmart.ARTICULO AS ART , bellmart.ARTICULO_PRECIO PRE , bellmart.EXISTENCIA_BODEGA ex WHERE VER_TIENDA=1 and ART.ARTICULO=PRE.ARTICULO AND art.ARTICULO=ex.ARTICULO and ex.BODEGA=(:bodega) and PRE.NIVEL_PRECIO=(:nivelPrecio) AND ART.CLASIFICACION_2 =(:clas) ",
      "SELECT  bellmart.ARTICULO.ARTICULO AS ARTICULO,bellmart.ARTICULO.DESCRIPCION,bellmart.ARTICULO.CLASIFICACION_1,bellmart.ARTICULO.CLASIFICACION_2, bellmart.ARTICULO.CLASIFICACION_3, bellmart.ARTICULO.CLASIFICACION_4, bellmart.ARTICULO.CLASIFICACION_5, bellmart.ARTICULO.CLASIFICACION_6,bellmart.ARTICULO.PESO_NETO,bellmart.ARTICULO.PESO_BRUTO,bellmart.ARTICULO.VOLUMEN,ROUND((bellmart.ARTICULO_PRECIO.PRECIO*1.13),2) AS PRECIO,ISNULL(bellmart.ESCALA_DCTO.PORC_DCTO,0) AS PorcDes,bellmart.EXISTENCIA_BODEGA.CANT_DISPONIBLE,bellmart.ARTICULO.ACTIVO,bellmart.ARTICULO.ESTILO, bellmart.ARTICULO.TALLA, bellmart.ARTICULO.COLOR, bellmart.ARTICULO.GALERIA_IMAGENES, bellmart.ARTICULO.IMAGEN_VERTICAL, bellmart.ARTICULO.IMAGEN_HORIZONTAL, bellmart.ARTICULO.IMAGEN, bellmart.ARTICULO.ESPECIFICACIONES, bellmart.ARTICULO.VISTAS,bellmart.ARTICULO.VER_TIENDA FROM bellmart.ARTICULO INNER JOIN bellmart.ARTICULO_PRECIO ON bellmart.ARTICULO.ARTICULO = bellmart.ARTICULO_PRECIO.ARTICULO INNER JOIN bellmart.EXISTENCIA_BODEGA ON bellmart.ARTICULO.ARTICULO = bellmart.EXISTENCIA_BODEGA.ARTICULO LEFT JOIN bellmart.ESCALA_DCTO ON bellmart.ARTICULO.ARTICULO=bellmart.ESCALA_DCTO.ARTICULO  WHERE (bellmart.ARTICULO.VER_TIENDA = 1) AND (bellmart.EXISTENCIA_BODEGA.BODEGA = (:bodega)) AND (bellmart.ARTICULO_PRECIO.NIVEL_PRECIO = (:nivelPrecio)) AND  (bellmart.ARTICULO.CLASIFICACION_2 = (:clas)) ",
      {
        replacements: {
          clas: req.query.cat,
          nivelPrecio: req.query.nivelprecio,
          bodega: req.query.bodega,
        },
      },
      { type: QueryTypes.SELECT }
    );

    dataNew = JSON.stringify(data[0]);
    dataNew = JSON.parse(dataNew);

    res.send({ results: dataNew, result: "true", total: data[1] });
  } catch (error) {
    console.log(error);
    handleHttpError(res, "ERROR_GETITEMS");
  }
};
const getItemsMarca = async (req, res) => {
  try {
    const data = await sequelize.query(
      //"SELECT ART.ARTICULO, ART.DESCRIPCION, ART.CLASIFICACION_1, ART.CLASIFICACION_2, ART.CLASIFICACION_3, ART.CLASIFICACION_4, ART.CLASIFICACION_5, ART.CLASIFICACION_6, ART.PESO_NETO, ART.PESO_BRUTO, ART.VOLUMEN,ROUND((pre.PRECIO*1.13),2) AS PRECIO, ex.CANT_DISPONIBLE,ART.ACTIVO, ART.ESTILO, ART.TALLA, ART.COLOR, ART.GALERIA_IMAGENES,ART.IMAGEN_VERTICAL, ART.IMAGEN_HORIZONTAL, ART.IMAGEN, ART.ESPECIFICACIONES, ART.VISTAS FROM bellmart.ARTICULO AS ART , bellmart.ARTICULO_PRECIO PRE , bellmart.EXISTENCIA_BODEGA ex WHERE VER_TIENDA=1 and ART.ARTICULO=PRE.ARTICULO AND art.ARTICULO=ex.ARTICULO and ex.BODEGA=(:bodega) and PRE.NIVEL_PRECIO=(:nivelPrecio) AND ART.CLASIFICACION_2 =(:clas) ",
      "SELECT  bellmart.ARTICULO.ARTICULO AS ARTICULO,bellmart.ARTICULO.DESCRIPCION,bellmart.ARTICULO.CLASIFICACION_1,bellmart.ARTICULO.CLASIFICACION_2, bellmart.ARTICULO.CLASIFICACION_3, bellmart.ARTICULO.CLASIFICACION_4, bellmart.ARTICULO.CLASIFICACION_5, bellmart.ARTICULO.CLASIFICACION_6,bellmart.ARTICULO.PESO_NETO,bellmart.ARTICULO.PESO_BRUTO,bellmart.ARTICULO.VOLUMEN,ROUND((bellmart.ARTICULO_PRECIO.PRECIO*1.13),2) AS PRECIO,ISNULL(bellmart.ESCALA_DCTO.PORC_DCTO,0) AS PorcDes,bellmart.EXISTENCIA_BODEGA.CANT_DISPONIBLE,bellmart.ARTICULO.ACTIVO,bellmart.ARTICULO.ESTILO, bellmart.ARTICULO.TALLA, bellmart.ARTICULO.COLOR, bellmart.ARTICULO.GALERIA_IMAGENES, bellmart.ARTICULO.IMAGEN_VERTICAL, bellmart.ARTICULO.IMAGEN_HORIZONTAL, bellmart.ARTICULO.IMAGEN, bellmart.ARTICULO.ESPECIFICACIONES, bellmart.ARTICULO.VISTAS,bellmart.ARTICULO.VER_TIENDA FROM bellmart.ARTICULO INNER JOIN bellmart.ARTICULO_PRECIO ON bellmart.ARTICULO.ARTICULO = bellmart.ARTICULO_PRECIO.ARTICULO INNER JOIN bellmart.EXISTENCIA_BODEGA ON bellmart.ARTICULO.ARTICULO = bellmart.EXISTENCIA_BODEGA.ARTICULO LEFT JOIN bellmart.ESCALA_DCTO ON bellmart.ARTICULO.ARTICULO=bellmart.ESCALA_DCTO.ARTICULO  WHERE (bellmart.ARTICULO.VER_TIENDA = 1) AND (bellmart.EXISTENCIA_BODEGA.BODEGA = (:bodega)) AND (bellmart.ARTICULO_PRECIO.NIVEL_PRECIO = (:nivelPrecio)) AND  (bellmart.ARTICULO.CLASIFICACION_1 = (:clas)) ",
      {
        replacements: {
          clas: req.query.marca,
          nivelPrecio: req.query.nivelprecio,
          bodega: req.query.bodega,
        },
      },
      { type: QueryTypes.SELECT }
    );

    dataNew = JSON.stringify(data[0]);
    dataNew = JSON.parse(dataNew);

    res.send({ results: dataNew, result: "true", total: data[1] });
  } catch (error) {
    console.log(error);
    handleHttpError(res, "ERROR_GETITEMS");
  }
};
const getItemsSubCat = async (req, res) => {
  try {
    const data = await sequelize.query(
      //"SELECT ART.ARTICULO, ART.DESCRIPCION, ART.CLASIFICACION_1, ART.CLASIFICACION_2, ART.CLASIFICACION_3, ART.CLASIFICACION_4, ART.CLASIFICACION_5, ART.CLASIFICACION_6, ART.PESO_NETO, ART.PESO_BRUTO, ART.VOLUMEN,ROUND((pre.PRECIO*1.13),2) AS PRECIO, ex.CANT_DISPONIBLE,ART.ACTIVO, ART.ESTILO, ART.TALLA, ART.COLOR, ART.GALERIA_IMAGENES,ART.IMAGEN_VERTICAL, ART.IMAGEN_HORIZONTAL, ART.IMAGEN, ART.ESPECIFICACIONES, ART.VISTAS FROM bellmart.ARTICULO AS ART , bellmart.ARTICULO_PRECIO PRE , bellmart.EXISTENCIA_BODEGA ex WHERE VER_TIENDA=1 and ART.ARTICULO=PRE.ARTICULO AND art.ARTICULO=ex.ARTICULO and ex.BODEGA=(:bodega) and PRE.NIVEL_PRECIO=(:nivelPrecio) AND ART.CLASIFICACION_3 =(:clas) ",
      "SELECT  bellmart.ARTICULO.ARTICULO AS ARTICULO,bellmart.ARTICULO.DESCRIPCION,bellmart.ARTICULO.CLASIFICACION_1,bellmart.ARTICULO.CLASIFICACION_2, bellmart.ARTICULO.CLASIFICACION_3, bellmart.ARTICULO.CLASIFICACION_4, bellmart.ARTICULO.CLASIFICACION_5, bellmart.ARTICULO.CLASIFICACION_6,bellmart.ARTICULO.PESO_NETO,bellmart.ARTICULO.PESO_BRUTO,bellmart.ARTICULO.VOLUMEN,ROUND((bellmart.ARTICULO_PRECIO.PRECIO*1.13),2) AS PRECIO,ISNULL(bellmart.ESCALA_DCTO.PORC_DCTO,0) AS PorcDes,bellmart.EXISTENCIA_BODEGA.CANT_DISPONIBLE,bellmart.ARTICULO.ACTIVO,bellmart.ARTICULO.ESTILO, bellmart.ARTICULO.TALLA, bellmart.ARTICULO.COLOR, bellmart.ARTICULO.GALERIA_IMAGENES, bellmart.ARTICULO.IMAGEN_VERTICAL, bellmart.ARTICULO.IMAGEN_HORIZONTAL, bellmart.ARTICULO.IMAGEN, bellmart.ARTICULO.ESPECIFICACIONES, bellmart.ARTICULO.VISTAS,bellmart.ARTICULO.VER_TIENDA FROM bellmart.ARTICULO INNER JOIN bellmart.ARTICULO_PRECIO ON bellmart.ARTICULO.ARTICULO = bellmart.ARTICULO_PRECIO.ARTICULO INNER JOIN bellmart.EXISTENCIA_BODEGA ON bellmart.ARTICULO.ARTICULO = bellmart.EXISTENCIA_BODEGA.ARTICULO LEFT JOIN bellmart.ESCALA_DCTO ON bellmart.ARTICULO.ARTICULO=bellmart.ESCALA_DCTO.ARTICULO  WHERE (bellmart.ARTICULO.VER_TIENDA = 1) AND (bellmart.EXISTENCIA_BODEGA.BODEGA = (:bodega)) AND (bellmart.ARTICULO_PRECIO.NIVEL_PRECIO = (:nivelPrecio)) AND  (bellmart.ARTICULO.CLASIFICACION_3 = (:clas)) ",
      {
        replacements: {
          clas: req.query.cat,
          nivelPrecio: req.query.nivelprecio,
          bodega: req.query.bodega,
        },
      },
      { type: QueryTypes.SELECT }
    );
    dataNew = JSON.stringify(data[0]);
    dataNew = JSON.parse(dataNew);

    res.send({ results: dataNew, result: "true", total: data[1] });
  } catch (error) {
    console.log(error);
    handleHttpError(res, "ERROR_GETITEMS");
  }
};
const getItemsTipo = async (req, res) => {
  try {
    const agru = req.params.clas;
    const data = await sequelize.query(
      //"SELECT ART.ARTICULO, ART.DESCRIPCION, ART.CLASIFICACION_1, ART.CLASIFICACION_2, ART.CLASIFICACION_3, ART.CLASIFICACION_4, ART.CLASIFICACION_5, ART.CLASIFICACION_6, ART.PESO_NETO, ART.PESO_BRUTO, ART.VOLUMEN,ROUND((pre.PRECIO*1.13),2) AS PRECIO, ex.CANT_DISPONIBLE,ART.ACTIVO, ART.ESTILO, ART.TALLA, ART.COLOR, ART.GALERIA_IMAGENES,ART.IMAGEN_VERTICAL, ART.IMAGEN_HORIZONTAL, ART.IMAGEN, ART.ESPECIFICACIONES, ART.VISTAS FROM bellmart.ARTICULO AS ART , bellmart.ARTICULO_PRECIO PRE , bellmart.EXISTENCIA_BODEGA ex WHERE VER_TIENDA=1 and ART.ARTICULO=PRE.ARTICULO AND art.ARTICULO=ex.ARTICULO and ex.BODEGA=(:bodega) and PRE.NIVEL_PRECIO=(:nivelPrecio) AND ART.CLASIFICACION_5 =(:clas) ",
      "SELECT  bellmart.ARTICULO.ARTICULO AS ARTICULO,bellmart.ARTICULO.DESCRIPCION,bellmart.ARTICULO.CLASIFICACION_1,bellmart.ARTICULO.CLASIFICACION_2, bellmart.ARTICULO.CLASIFICACION_3, bellmart.ARTICULO.CLASIFICACION_4, bellmart.ARTICULO.CLASIFICACION_5, bellmart.ARTICULO.CLASIFICACION_6,bellmart.ARTICULO.PESO_NETO,bellmart.ARTICULO.PESO_BRUTO,bellmart.ARTICULO.VOLUMEN,ROUND((bellmart.ARTICULO_PRECIO.PRECIO*1.13),2) AS PRECIO,ISNULL(bellmart.ESCALA_DCTO.PORC_DCTO,0) AS PorcDes,bellmart.EXISTENCIA_BODEGA.CANT_DISPONIBLE,bellmart.ARTICULO.ACTIVO,bellmart.ARTICULO.ESTILO, bellmart.ARTICULO.TALLA, bellmart.ARTICULO.COLOR, bellmart.ARTICULO.GALERIA_IMAGENES, bellmart.ARTICULO.IMAGEN_VERTICAL, bellmart.ARTICULO.IMAGEN_HORIZONTAL, bellmart.ARTICULO.IMAGEN, bellmart.ARTICULO.ESPECIFICACIONES, bellmart.ARTICULO.VISTAS,bellmart.ARTICULO.VER_TIENDA FROM bellmart.ARTICULO INNER JOIN bellmart.ARTICULO_PRECIO ON bellmart.ARTICULO.ARTICULO = bellmart.ARTICULO_PRECIO.ARTICULO INNER JOIN bellmart.EXISTENCIA_BODEGA ON bellmart.ARTICULO.ARTICULO = bellmart.EXISTENCIA_BODEGA.ARTICULO LEFT JOIN bellmart.ESCALA_DCTO ON bellmart.ARTICULO.ARTICULO=bellmart.ESCALA_DCTO.ARTICULO  WHERE (bellmart.ARTICULO.VER_TIENDA = 1) AND (bellmart.EXISTENCIA_BODEGA.BODEGA = (:bodega)) AND (bellmart.ARTICULO_PRECIO.NIVEL_PRECIO = (:nivelPrecio)) AND  (bellmart.ARTICULO.CLASIFICACION_5 = (:clas)) ",
      {
        replacements: {
          clas: req.query.cat,
          nivelPrecio: req.query.nivelprecio,
          bodega: req.query.bodega,
        },
      },
      { type: QueryTypes.SELECT }
    );

    dataNew = JSON.stringify(data[0]);
    dataNew = JSON.parse(dataNew);

    res.send({ results: dataNew, result: "true", total: data[1] });
  } catch (error) {
    handleHttpError(res, "ERROR_GETITEMS");
  }
};
const getItem = async (req, res) => {
  try {
    console.log("entramos a ver getItem");
    const agru = req.params.clas;
    const bodega = req.query.bodega;
    const nivelPrecio = req.query.nivelPrecio;

    //req = matchedData(req);

    const data = await sequelize.query(
      // "SELECT ART.ARTICULO, ART.DESCRIPCION, ART.CLASIFICACION_1, ART.CLASIFICACION_2, ART.CLASIFICACION_3, ART.CLASIFICACION_4, ART.CLASIFICACION_5, ART.CLASIFICACION_6, ART.PESO_NETO,ART.PESO_BRUTO, ART.VOLUMEN,ART.ACTIVO, ART.ESTILO, ART.TALLA, ART.COLOR, ART.GALERIA_IMAGENES, ART.IMAGEN_VERTICAL, ART.IMAGEN_HORIZONTAL, ART.IMAGEN, ART.ESPECIFICACIONES, ART.VISTAS , ROUND((pre.PRECIO*1.13),2) AS PRECIO , ex.CANT_DISPONIBLE FROM bellmart.ARTICULO AS ART ,bellmart.ARTICULO_PRECIO pre ,bellmart.EXISTENCIA_BODEGA ex WHERE VER_TIENDA=1 and pre.ARTICULO=ART.ARTICULO and ex.ARTICULO=ART.ARTICULO and ART.ARTICULO =(:clas) and ex.BODEGA=(:bodega) and ex.ARTICULO=ART.ARTICULO and pre.NIVEL_PRECIO=(:nivelPrecio) and pre.ARTICULO=art.ARTICULO",
      "SELECT  bellmart.ARTICULO.ARTICULO AS ARTICULO,bellmart.ARTICULO.DESCRIPCION,bellmart.ARTICULO.CLASIFICACION_1,bellmart.ARTICULO.CLASIFICACION_2, bellmart.ARTICULO.CLASIFICACION_3, bellmart.ARTICULO.CLASIFICACION_4, bellmart.ARTICULO.CLASIFICACION_5, bellmart.ARTICULO.CLASIFICACION_6,bellmart.ARTICULO.PESO_NETO,bellmart.ARTICULO.PESO_BRUTO,bellmart.ARTICULO.VOLUMEN,ROUND((bellmart.ARTICULO_PRECIO.PRECIO*1.13),2) AS PRECIO,ISNULL(bellmart.ESCALA_DCTO.PORC_DCTO,0) AS PorcDes,bellmart.EXISTENCIA_BODEGA.CANT_DISPONIBLE,bellmart.ARTICULO.ACTIVO,bellmart.ARTICULO.ESTILO, bellmart.ARTICULO.TALLA, bellmart.ARTICULO.COLOR, bellmart.ARTICULO.GALERIA_IMAGENES, bellmart.ARTICULO.IMAGEN_VERTICAL, bellmart.ARTICULO.IMAGEN_HORIZONTAL, bellmart.ARTICULO.IMAGEN, bellmart.ARTICULO.ESPECIFICACIONES, bellmart.ARTICULO.VISTAS FROM bellmart.ARTICULO INNER JOIN bellmart.ARTICULO_PRECIO ON bellmart.ARTICULO.ARTICULO = bellmart.ARTICULO_PRECIO.ARTICULO INNER JOIN bellmart.EXISTENCIA_BODEGA ON bellmart.ARTICULO.ARTICULO = bellmart.EXISTENCIA_BODEGA.ARTICULO LEFT JOIN bellmart.ESCALA_DCTO ON bellmart.ARTICULO.ARTICULO=bellmart.ESCALA_DCTO.ARTICULO  WHERE (bellmart.ARTICULO.VER_TIENDA = 1) AND (bellmart.EXISTENCIA_BODEGA.BODEGA = (:bodega)) AND (bellmart.ARTICULO_PRECIO.NIVEL_PRECIO = (:nivelPrecio)) AND  (bellmart.ARTICULO.ARTICULO = (:clas)) ",
      {
        replacements: { clas: agru, bodega: bodega, nivelPrecio: nivelPrecio },
      },
      { type: QueryTypes.SELECT }
    );
    dataNew = JSON.stringify(data[0]);
    dataNew = JSON.parse(dataNew);

    res.send({ results: dataNew, result: "true", total: data[1] });
  } catch (error) {
    console.log(error);
    handleHttpError(res, "ERROR_GETITEMS");
  }
};

const getArticulos = async (req, res) => {
  try {
    const agru = req.params.clas;
    const bodega = req.query.bodega;
    const nivelPrecio = req.query.nivelPrecio;

    //req = matchedData(req);

    const data = await sequelize.query(
      //"SELECT ART.ARTICULO, ART.DESCRIPCION, ART.CLASIFICACION_1, ART.CLASIFICACION_2, ART.CLASIFICACION_3, ART.CLASIFICACION_4, ART.CLASIFICACION_5, ART.CLASIFICACION_6, ART.PESO_NETO,ART.PESO_BRUTO, ART.VOLUMEN,ART.ACTIVO, ART.ESTILO, ART.TALLA, ART.COLOR, ART.GALERIA_IMAGENES, ART.IMAGEN_VERTICAL, ART.IMAGEN_HORIZONTAL, ART.IMAGEN, ART.ESPECIFICACIONES, ART.VISTAS , ROUND((pre.PRECIO*1.13),2) AS PRECIO , ex.CANT_DISPONIBLE FROM bellmart.ARTICULO AS ART ,bellmart.ARTICULO_PRECIO pre ,bellmart.EXISTENCIA_BODEGA ex WHERE VER_TIENDA=1 and pre.ARTICULO=ART.ARTICULO and ex.ARTICULO=ART.ARTICULO and ex.BODEGA=(:bodega) and ex.ARTICULO=ART.ARTICULO and pre.NIVEL_PRECIO=(:nivelPrecio) and pre.ARTICULO=art.ARTICULO",
      "SELECT  bellmart.ARTICULO.ARTICULO AS ARTICULO,bellmart.ARTICULO.DESCRIPCION,bellmart.ARTICULO.CLASIFICACION_1,bellmart.ARTICULO.CLASIFICACION_2, bellmart.ARTICULO.CLASIFICACION_3, bellmart.ARTICULO.CLASIFICACION_4, bellmart.ARTICULO.CLASIFICACION_5, bellmart.ARTICULO.CLASIFICACION_6,bellmart.ARTICULO.PESO_NETO,bellmart.ARTICULO.PESO_BRUTO,bellmart.ARTICULO.VOLUMEN,ROUND((bellmart.ARTICULO_PRECIO.PRECIO*1.13),2) AS PRECIO,ISNULL(bellmart.ESCALA_DCTO.PORC_DCTO,0) AS PorcDes,bellmart.EXISTENCIA_BODEGA.CANT_DISPONIBLE,bellmart.ARTICULO.ACTIVO,bellmart.ARTICULO.ESTILO, bellmart.ARTICULO.TALLA, bellmart.ARTICULO.COLOR, bellmart.ARTICULO.GALERIA_IMAGENES, bellmart.ARTICULO.IMAGEN_VERTICAL, bellmart.ARTICULO.IMAGEN_HORIZONTAL, bellmart.ARTICULO.IMAGEN, bellmart.ARTICULO.ESPECIFICACIONES, bellmart.ARTICULO.VISTAS,bellmart.ARTICULO.VER_TIENDA FROM bellmart.ARTICULO INNER JOIN bellmart.ARTICULO_PRECIO ON bellmart.ARTICULO.ARTICULO = bellmart.ARTICULO_PRECIO.ARTICULO INNER JOIN bellmart.EXISTENCIA_BODEGA ON bellmart.ARTICULO.ARTICULO = bellmart.EXISTENCIA_BODEGA.ARTICULO LEFT JOIN bellmart.ESCALA_DCTO ON bellmart.ARTICULO.ARTICULO=bellmart.ESCALA_DCTO.ARTICULO  WHERE (bellmart.ARTICULO.VER_TIENDA = 1) AND (bellmart.EXISTENCIA_BODEGA.BODEGA = (:bodega)) AND (bellmart.ARTICULO_PRECIO.NIVEL_PRECIO = (:nivelPrecio)) ",
      {
        replacements: { bodega: bodega, nivelPrecio: nivelPrecio },
      },
      { type: QueryTypes.SELECT }
    );
    dataNew = JSON.stringify(data[0]);
    dataNew = JSON.parse(dataNew);
    res.send({ results: dataNew, result: "true", total: data[1] });
  } catch (error) {
    console.log(error);
    handleHttpError(res, "ERROR_GETARTICULOSS");
  }
};

const gettodos = async (req, res) => {
  try {
    const nivelPrecio = req.query.nivelprecio;
    const bodega = req.query.bodega;

    const data = await sequelize.query(
      //"SELECT ART.VER_TIENDA, ART.ARTICULO, ART.DESCRIPCION, ART.CLASIFICACION_1, ART.CLASIFICACION_2, ART.CLASIFICACION_3, ART.CLASIFICACION_4, ART.CLASIFICACION_5, ART.CLASIFICACION_6, ART.PESO_NETO,ART.PESO_BRUTO, ART.VOLUMEN,ART.ACTIVO, ART.ESTILO, ART.TALLA, ART.COLOR, ART.GALERIA_IMAGENES, ART.IMAGEN_VERTICAL, ART.IMAGEN_HORIZONTAL, ART.IMAGEN, ART.ESPECIFICACIONES, ART.VISTAS , ROUND((pre.PRECIO*1.13),2) AS PRECIO , ex.CANT_DISPONIBLE FROM bellmart.ARTICULO AS ART ,bellmart.ARTICULO_PRECIO pre ,bellmart.EXISTENCIA_BODEGA ex WHERE pre.ARTICULO=ART.ARTICULO and ex.ARTICULO=ART.ARTICULO and ex.BODEGA=(:bodega) and ex.ARTICULO=ART.ARTICULO and pre.NIVEL_PRECIO=(:nivelPrecio) and pre.ARTICULO=art.ARTICULO",
      "SELECT  bellmart.ARTICULO.ARTICULO AS ARTICULO,bellmart.ARTICULO.DESCRIPCION,bellmart.ARTICULO.CLASIFICACION_1,bellmart.ARTICULO.CLASIFICACION_2, bellmart.ARTICULO.CLASIFICACION_3, bellmart.ARTICULO.CLASIFICACION_4, bellmart.ARTICULO.CLASIFICACION_5, bellmart.ARTICULO.CLASIFICACION_6,bellmart.ARTICULO.PESO_NETO,bellmart.ARTICULO.PESO_BRUTO,bellmart.ARTICULO.VOLUMEN,ROUND((bellmart.ARTICULO_PRECIO.PRECIO*1.13),2) AS PRECIO,ISNULL(bellmart.ESCALA_DCTO.PORC_DCTO,0) AS PorcDes,bellmart.EXISTENCIA_BODEGA.CANT_DISPONIBLE,bellmart.ARTICULO.ACTIVO,bellmart.ARTICULO.ESTILO, bellmart.ARTICULO.TALLA, bellmart.ARTICULO.COLOR, bellmart.ARTICULO.GALERIA_IMAGENES, bellmart.ARTICULO.IMAGEN_VERTICAL, bellmart.ARTICULO.IMAGEN_HORIZONTAL, bellmart.ARTICULO.IMAGEN, bellmart.ARTICULO.ESPECIFICACIONES, bellmart.ARTICULO.VISTAS,bellmart.ARTICULO.VER_TIENDA  FROM bellmart.ARTICULO INNER JOIN bellmart.ARTICULO_PRECIO ON bellmart.ARTICULO.ARTICULO = bellmart.ARTICULO_PRECIO.ARTICULO INNER JOIN bellmart.EXISTENCIA_BODEGA ON bellmart.ARTICULO.ARTICULO = bellmart.EXISTENCIA_BODEGA.ARTICULO LEFT JOIN bellmart.ESCALA_DCTO ON bellmart.ARTICULO.ARTICULO=bellmart.ESCALA_DCTO.ARTICULO  WHERE  (bellmart.EXISTENCIA_BODEGA.BODEGA = (:bodega)) AND (bellmart.ARTICULO_PRECIO.NIVEL_PRECIO = (:nivelPrecio))  ",
      {
        replacements: { bodega: bodega, nivelPrecio: nivelPrecio },
      },
      { type: QueryTypes.SELECT }
    );
    dataNew = JSON.stringify(data[0]);
    dataNew = JSON.parse(dataNew);

    return res.send({ results: dataNew, result: true, total: dataNew.length });
  } catch (error) {
    return res.send({ results: error, result: false, total: 0 });
  }
  //const articulo = articuloModel.findAll();
};
const putVerTienda = async (req, res) => {
  try {
    const articulo = req.body.articulo;
    const verTienda = req.body.vertienda;
    //Actualizamos en el campo Ver en Tienda

    const updateArticulo = articuloModel.update(
      {
        VER_TIENDA: verTienda,
      },
      { where: { ARTICULO: articulo } }
    );
    return res.send({ results: updateArticulo, result: true, total: 0 });
  } catch (error) {
    console.log(error);
    return res.send({ results: error, result: false, total: 0 });
  }
};
const getsearch = async (req, res) => {
  try {
    res.send("buscando articulo");
  } catch (error) {
    console.log("errr", error);
    console.log(error);
  }
};
const putItem = async (req, res) => {
  try {
    const user = req.cliente;
    const agru = req.params.clas;
    // req = matchedData(req);

    const results = await articuloModel.update(
      {
        GALERIA_IMAGENES: req.body.GALERIA_IMAGENES,
        IMAGEN_VERTICAL: req.body.IMAGEN_VERTICAL,
        IMAGEN_HORIZONTAL: req.body.IMAGEN_HORIZONTAL,
        IMAGEN: req.body.IMAGEN,
        ESPECIFICACIONES: req.body.ESPECIFICACIONES,
      },
      { where: { ARTICULO: agru } }
    );
    res.send({ results, usuario: user });
  } catch (error) {
    console.log(error);
    handleHttpError(res, "ERROR_GETITEMS");
  }
};
const putVisita = async (req, res) => {
  const articulo = req.query.articulo;
  // actualizamos las  visitas
  try {
    //CONSULTAMOS CUANTO TIENE VISITAS
    const vistas = await articuloModel.findOne({
      where: { ARTICULO: articulo },
    });

    if (vistas.VISTAS == null) {
      valor = 1;
    } else {
      valor = vistas.VISTAS + 1;
    }

    const results = await articuloModel.update(
      {
        VISTAS: valor,
      },
      { where: { ARTICULO: articulo } }
    );
    res.send({ results });
  } catch (error) {
    console.log(error);
    handleHttpError(res, "ERROR_PUTVISITAS");
  }
};
const ActualizarPeso = async (req, res) => {
  try {
    const articulo = req.query.articulo;

    const peso = req.body.peso;

    const updateArticulo = await articuloModel.update(
      {
        PESO_BRUTO: peso,
      },
      { where: { ARTICULO: articulo } }
    );

    return res.send({ results: updateArticulo, result: true, total: 0 });
  } catch (error) {
    return res.send({ results: error, result: false, total: 0 });
  }
};
module.exports = {
  getItem,
  gettodos,
  getArticulos,
  getItemsCat,
  getItemsSubCat,
  getItemsTipo,
  putItem,
  getsearch,
  putVisita,
  putVerTienda,
  ActualizarPeso,
  getItemsMarca,
};
