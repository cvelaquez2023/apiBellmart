const { matchedData } = require("express-validator");
const {
  tokenSign,
  tokenSignReset,
  verifyTokenReset,
  verifyToken,
  tokenLoginCode,
} = require("../utils/handleJwt");
const { handleHttpError } = require("../utils/handleError");
const { clienteModel, consecutivoModel, clieVenModel } = require("../models");
const { compare, encrypt } = require("../utils/handlePassword");
const { sequelize } = require("../config/mssql");
const { QueryTypes, where } = require("sequelize");
const { transporter } = require("./../config/mailer");
const e = require("express");

const host = process.env.HOST;
const ssl = process.env.SSL;
const registerCtrl = async (req, res) => {
  try {
    req = matchedData(req);
    const PASSWORD = await encrypt(req.Password);
    //conseguimos el valor de consecutivo de clientes
    const dataConsecutivo = await consecutivoModel.findOne({
      where: { Documento: "CLI", Consecutivo: req.Consecutivo },
    });
    const ultimoValor = dataConsecutivo.ultimo_valor;
    const valor = ultimoValor.split("-");
    const valor0 = valor[0];
    const valor1 = valor[1];
    const carateres = valor1.length;
    const consecutivo = Math.floor(valor1);

    const fill = (number, len) =>
      "0".repeat(len - number.toString().length) + number.toString();

    const nuevoCorrelativo = valor0 + "-" + fill(consecutivo + 1, carateres);
    const nombre = req.NOMBRE.toUpperCase();

    var today = new Date();
    const Cliente = {
      CLIENTE: dataConsecutivo.ultimo_valor,
      NOMBRE: nombre,
      ALIAS: nombre,
      CONTACTO: "ND",
      CARGO: "ND",
      DIRECCION: req.Direccion,
      TELEFONO1: req.Telefono,
      CONTRIBUYENTE: "ND",
      FECHA_INGRESO: "01-01-1980",
      MULTIMONEDA: "S",
      MONEDA: "USD",
      SALDO: 0.0,
      SALDO_LOCAL: 0.0,
      SALDO_DOLAR: 0.0,
      SALDO_CREDITO: 0.0,
      EXCEDER_LIMITE: "S",
      TASA_INTERES: 0.0,
      Tasa_Interes_Mora: 0.0,
      Fecha_Ult_Mora: "01-01-1980",
      Fecha_Ult_Mov: "01-01-1980",
      Condicion_Pago: "1",
      Nivel_Precio: "PRECIO_LINEA",
      Descuento: 0.0,
      Moneda_Nivel: "L",
      Acepta_Backorder: "S",
      Pais: "SAL",
      Zona: "ND",
      Ruta: "ND",
      Vendedor: "111",
      Cobrador: "ND",
      Acepta_Fracciones: "N",
      Activo: "S",
      Exento_Impuestos: "N",
      Exencion_Imp1: 0.0,
      Exencion_Imp2: 0.0,
      Cobro_Judicial: "N",
      Categoria_Cliente: "CL",
      Clase_ABC: "A",
      Dias_Abastecimien: 0.0,
      Usa_Tarjeta: "N",
      E_Mail: req.E_Mail,
      Requiere_Oc: "N",
      Es_Corporacion: "N",
      RegistrarDocsACorp: "N",
      Usar_Diremb_Corp: "N",
      Aplicac_Abiertas: "N",
      Verif_Limcred_Corp: "N",
      Usar_Desc_Corp: "N",
      Doc_A_Generar: "F",
      Tiene_Convenio: "N",
      Notas: "Creado desde Tienda en Linea",
      Dias_Promed_Atraso: 0.0,
      ASOCOBLIGCONTFACT: "N",
      Usar_Precios_Corp: "N",
      Usar_ExenCimp_Corp: "N",
      Ajuste_Fecha_Cobro: "A",
      Clase_Documento: "N",
      Local: "L",
      Tipo_Contribuyente: "F",
      Acepta_Doc_Electronico: "N",
      Confirma_Doc_Electronico: "N",
      Acepta_Doc_Edi: "N",
      Notificar_Error_Edi: "N",
      Codigo_Impuesto: "IVA",
      Moroso: "N",
      Modif_Nomb_En_Fac: "N",
      Saldo_Trans: 0.0,
      Saldo_Trans_Local: 0.0,
      Saldo_Trans_Dolar: 0.0,
      Permite_Doc_GP: "N",
      Participa_FlujoCaja: "N",
      Detallar_Kits: "N",
      Es_Extanjero: "N",
      Es_Agente_Percepcion: "N",
      Es_Buen_Contribuyente: "N",
      Sujeto_Porce_Sunat: "N",
      Pdb_Exportadores: "N",
      Usa_Monto_Tope: "N",
      Password: PASSWORD,
      Rol: req.Rol,
    };
    // validamos si el correo ya existe

    const existEmail = await clienteModel.findOne({
      where: { E_mail: req.E_Mail },
    });

    if (!existEmail) {
      const dataUser = await clienteModel.create(Cliente);
      dataUser.set("Password", undefined, { strict: false });
      nuevo = JSON.stringify(dataUser);
      nuevo = JSON.parse(nuevo);
      const data = {
        token: await tokenSign(nuevo),
        user: nuevo,
      };
      //Actualizamos el correlativo del dcumento
      const corre = sequelize.query(
        "update bellmart.consecutivo set ultimo_valor=(:valor) where consecutivo=(:consecutivo) and documento=(:doc) ",
        {
          replacements: {
            valor: nuevoCorrelativo,
            consecutivo: req.Consecutivo,
            doc: "CLI",
          },
        },
        { type: QueryTypes.UPDATE }
      );
      // DAMOS LA RELACION CLIENTE VENDEDOR
      const datosCV = {
        CLIENTE: dataConsecutivo.ultimo_valor,
        VENDEDOR: "111",
      };

      const insertClienteVendedor = await clieVenModel.create(datosCV);
      //res.send({ data });
      //enviamos correo para activar cuenta de usuario
      const cliente = {
        cliente: dataConsecutivo.ultimo_valor,
        nombre: nombre,
        email: req.E_Mail,
      };
      const token = await tokenSign(cliente);
      let url;

      if (ssl == "N") {
        url = `http://${host}/email-confirm/${token}`;
      } else {
        url = `https://${host}/email-confirm/${token}`;
      }
      verificactionLink = url;
      //actualizamos token en la base de datos

      const updateToken = await clienteModel.update(
        {
          CONFIRM_TOKEN: token,
          CONFIRN: 0,
        },
        { where: { E_Mail: req.E_Mail } }
      );

      //Envio de eamil
      //no-reply@bellmart.com
      //let emailStatus = "Ok";
      await transporter.sendMail({
        from: '"Soporte Ama Belle " <no-reply@ama-belle.com>', // sender address
        to: req.E_Mail, // list of receivers
        subject: "Activa tu cuenta de Ama Belle", // Subject line
        html: `
        <html
  data-editor-version="2"
  class="sg-campaigns"
  xmlns="http://www.w3.org/1999/xhtml"
>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1"
    />
    <!--[if !mso]><!-->
    <meta http-equiv="X-UA-Compatible" content="IE=Edge" />
    <!--<![endif]-->
    <!--[if (gte mso 9)|(IE)]>
      <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG />
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    <![endif]-->
    <!--[if (gte mso 9)|(IE)]>
      <style type="text/css">
        body {
          width: 600px;
          margin: 0 auto;
        }
        table {
          border-collapse: collapse;
        }
        table,
        td {
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
        }
        img {
          -ms-interpolation-mode: bicubic;
        }
      </style>
    <![endif]-->
    <style type="text/css">
      body,
      p,
      div {
        font-family: inherit;
        font-size: 14px;
      }
      body {
        color: #000000;
      }
      body a {
        color: #1188e6;
        text-decoration: none;
      }
      p {
        margin: 0;
        padding: 0;
      }
      table.wrapper {
        width: 100% !important;
        table-layout: fixed;
        -webkit-font-smoothing: antialiased;
        -webkit-text-size-adjust: 100%;
        -moz-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      img.max-width {
        max-width: 100% !important;
      }
      .column.of-2 {
        width: 50%;
      }
      .column.of-3 {
        width: 33.333%;
      }
      .column.of-4 {
        width: 25%;
      }
      ul ul ul ul {
        list-style-type: disc !important;
      }
      ol ol {
        list-style-type: lower-roman !important;
      }
      ol ol ol {
        list-style-type: lower-latin !important;
      }
      ol ol ol ol {
        list-style-type: decimal !important;
      }
      @media screen and (max-width: 480px) {
        .preheader .rightColumnContent,
        .footer .rightColumnContent {
          text-align: left !important;
        }
        .preheader .rightColumnContent div,
        .preheader .rightColumnContent span,
        .footer .rightColumnContent div,
        .footer .rightColumnContent span {
          text-align: left !important;
        }
        .preheader .rightColumnContent,
        .preheader .leftColumnContent {
          font-size: 80% !important;
          padding: 5px 0;
        }
        table.wrapper-mobile {
          width: 100% !important;
          table-layout: fixed;
        }
        img.max-width {
          height: auto !important;
          max-width: 100% !important;
        }
        a.bulletproof-button {
          display: block !important;
          width: auto !important;
          font-size: 80%;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
        .columns {
          width: 100% !important;
        }
        .column {
          display: block !important;
          width: 100% !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }
        .social-icon-column {
          display: inline-block !important;
        }
      }
    </style>
    <!--user entered Head Start-->
    <link
      href="https://fonts.googleapis.com/css?family=Muli&display=swap"
      rel="stylesheet"
    />
    <style>
      body {
        font-family: "Muli", sans-serif;
      }
    </style>
    <!--End Head user entered-->
  </head>
  <body>
    <center
      class="wrapper"
      data-link-color="#1188E6"
      data-body-style="font-size:14px; font-family:inherit; color:#000000; background-color:#FFFFFF;"
    >
      <div class="webkit">
        <table
          cellpadding="0"
          cellspacing="0"
          border="0"
          width="100%"
          class="wrapper"
          bgcolor="#FFFFFF"
        >
          <tr>
            <td valign="top" bgcolor="#FFFFFF" width="100%">
              <table
                width="100%"
                role="content-container"
                class="outer"
                align="center"
                cellpadding="0"
                cellspacing="0"
                border="0"
              >
                <tr>
                  <td width="100%">
                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                    >
                      <tr>
                        <td>
                          <!--[if mso]>
    <center>
    <table><tr><td width="600">
  <![endif]-->
                          <table
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                            style="width: 100%; max-width: 600px"
                            align="center"
                          >
                            <tr>
                              <td
                                role="modules-container"
                                style="
                                  padding: 0px 0px 0px 0px;
                                  color: #000000;
                                  text-align: left;
                                "
                                bgcolor="#FFFFFF"
                                width="100%"
                                align="left"
                              >
                                <table
                                  class="module preheader preheader-hide"
                                  role="module"
                                  data-type="preheader"
                                  border="0"
                                  cellpadding="0"
                                  cellspacing="0"
                                  width="100%"
                                  style="
                                    display: none !important;
                                    mso-hide: all;
                                    visibility: hidden;
                                    opacity: 0;
                                    color: transparent;
                                    height: 0;
                                    width: 0;
                                  "
                                >
                                  <tr>
                                    <td role="module-content">
                                      <p></p>
                                    </td>
                                  </tr>
                                </table>
                                <table
                                  border="0"
                                  cellpadding="0"
                                  cellspacing="0"
                                  align="center"
                                  width="100%"
                                  role="module"
                                  data-type="columns"
                                  style="padding: 30px 20px 30px 20px"
                                  bgcolor="#fFFFFFFFFFFFFFFFF"
                                  data-distribution="1"
                                >
                                  <tbody>
                                    <tr role="module-content">
                                      <td height="100%" valign="top">
                                        <table
                                          width="540"
                                          style="
                                            width: 540px;
                                            border-spacing: 0;
                                            border-collapse: collapse;
                                            margin: 0px 10px 0px 10px;
                                          "
                                          cellpadding="0"
                                          cellspacing="0"
                                          align="left"
                                          border="0"
                                          bgcolor=""
                                          class="column column-0"
                                        >
                                          <tbody>
                                            <tr>
                                              <td
                                                style="
                                                  padding: 0px;
                                                  margin: 0px;
                                                  border-spacing: 0;
                                                "
                                              >
                                                <table
                                                  class="wrapper"
                                                  role="module"
                                                  data-type="image"
                                                  border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  width="100%"
                                                  style="table-layout: fixed"
                                                  data-muid="d8508015-a2cb-488c-9877-d46adf313282"
                                                >
                                                  <tbody>
                                                    <tr>
                                                      <td
                                                        style="
                                                          font-size: 6px;
                                                          line-height: 10px;
                                                          padding: 18px 0px 18px
                                                            0px;
                                                        "
                                                        valign="top"
                                                        align="center"
                                                      >
                                                        <a href="ama-belle.com"
                                                          ><img
                                                            class="max-width"
                                                            border="0"
                                                            style="
                                                              display: block;
                                                              color: #000000;
                                                              text-decoration: none;
                                                              font-family: Helvetica,
                                                                arial,
                                                                sans-serif;
                                                              font-size: 16px;
                                                              max-width: 100% !important;
                                                              width: 100%;
                                                              height: auto !important;
                                                            "
                                                            width="540"
                                                            alt=""
                                                            data-proportionally-constrained="true"
                                                            data-responsive="true"
                                                            src="https://bellmart.s3.amazonaws.com/ama-belle-logo-big.png"
                                                        /></a>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                                <table
                                                  class="module"
                                                  role="module"
                                                  data-type="text"
                                                  border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  width="100%"
                                                  style="table-layout: fixed"
                                                  data-muid="af2e984f-3bd4-4b6a-ab14-c1c1fad4301a"
                                                  data-mc-module-version="2019-10-22"
                                                >
                                                  <tbody>
                                                    <tr>
                                                      <td
                                                        style="
                                                          padding: 25px 0px 25px
                                                            0px;
                                                          line-height: 25px;
                                                          text-align: inherit;
                                                          background-color: #FFFFFFFFFFFFFFF;
                                                        "
                                                        height="100%"
                                                        valign="top"
                                                        bgcolor="#FFFFFFFFFFFFFFF"
                                                        role="module-content"
                                                      >
                                                        <div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: center;
                                                            "
                                                          >
                                                            &nbsp;<span
                                                              style="
                                                                overflow-wrap: break-word;
                                                              "
                                                              >¡Bienvenido a
                                                              AMA</span
                                                            ><span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                font-size: 8px;
                                                              "
                                                            >
                                                            </span
                                                            ><span
                                                              style="
                                                                overflow-wrap: break-word;
                                                              "
                                                              >BELLE</span
                                                            ><span
                                                              style="
                                                                box-sizing: border-box;
                                                                padding-top: 0px;
                                                                padding-right: 0px;
                                                                padding-bottom: 0px;
                                                                padding-left: 0px;
                                                                margin-top: 0px;
                                                                margin-right: 0px;
                                                                margin-bottom: 0px;
                                                                margin-left: 0px;
                                                                font-style: inherit;
                                                                font-variant-ligatures: inherit;
                                                                font-variant-caps: inherit;
                                                                font-variant-numeric: inherit;
                                                                font-variant-east-asian: inherit;
                                                                font-variant-alternates: inherit;
                                                                font-variant-position: inherit;
                                                                font-weight: inherit;
                                                                font-stretch: inherit;
                                                                line-height: inherit;
                                                                font-family: inherit;
                                                                font-optical-sizing: inherit;
                                                                font-kerning: inherit;
                                                                font-feature-settings: inherit;
                                                                font-variation-settings: inherit;
                                                                font-size: 14px;
                                                                vertical-align: baseline;
                                                                border-top-width: 0px;
                                                                border-right-width: 0px;
                                                                border-bottom-width: 0px;
                                                                border-left-width: 0px;
                                                                border-top-style: initial;
                                                                border-right-style: initial;
                                                                border-bottom-style: initial;
                                                                border-left-style: initial;
                                                                border-top-color: initial;
                                                                border-right-color: initial;
                                                                border-bottom-color: initial;
                                                                border-left-color: initial;
                                                                border-image-source: initial;
                                                                border-image-slice: initial;
                                                                border-image-width: initial;
                                                                border-image-outset: initial;
                                                                border-image-repeat: initial;
                                                                color: #000000;
                                                                letter-spacing: normal;
                                                                orphans: 2;
                                                                text-align: center;
                                                                text-indent: 0px;
                                                                text-transform: none;
                                                                widows: 2;
                                                                word-spacing: 0px;
                                                                -webkit-text-stroke-width: 0px;
                                                                white-space-collapse: preserve;
                                                                text-wrap: wrap;
                                                                background-color: rgb(
                                                                  246,
                                                                  246,
                                                                  246
                                                                );
                                                                text-decoration-thickness: initial;
                                                                text-decoration-style: initial;
                                                                text-decoration-color: initial;
                                                                overflow-wrap: break-word;
                                                              "
                                                              >!</span
                                                            >
                                                            &nbsp;<span
                                                              style="
                                                                overflow-wrap: break-word;
                                                              "
                                                              >&nbsp;</span
                                                            >
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: center;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                overflow-wrap: break-word;
                                                              "
                                                              ><strong
                                                                >“Where Beauty
                                                                meets
                                                                technology”</strong
                                                              ></span
                                                            ><strong>
                                                              &nbsp;</strong
                                                            >
                                                          </div>
                                                          <div></div>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                                <table
                                                  class="module"
                                                  role="module"
                                                  data-type="text"
                                                  border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  width="100%"
                                                  style="table-layout: fixed"
                                                  data-muid="8ea463eb-9361-4dda-8f06-3f95dd696b57"
                                                  data-mc-module-version="2019-10-22"
                                                >
                                                  <tbody>
                                                    <tr>
                                                      <td
                                                        style="
                                                          padding: 25px 20px
                                                            25px 20px;
                                                          line-height: 25px;
                                                          text-align: inherit;
                                                          background-color: #f6f6f6;
                                                        "
                                                        height="100%"
                                                        valign="top"
                                                        bgcolor="#F6F6F6"
                                                        role="module-content"
                                                      >
                                                        <div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: justify;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                overflow-wrap: break-word;
                                                              "
                                                              >Para finalizar tu
                                                              proceso de
                                                              registro, te
                                                              pedimos que
                                                              confirmes tu
                                                              dirección de
                                                              correo electrónico
                                                              haciendo clic en
                                                              el siguiente
                                                              enlace:</span
                                                            >
                                                            &nbsp;
                                                          </div>
                                                          <div></div>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                                <table
                                                  border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  class="module"
                                                  data-role="module-button"
                                                  data-type="button"
                                                  role="module"
                                                  style="table-layout: fixed"
                                                  width="100%"
                                                  data-muid="3c6b1ba6-7302-4e7f-a38f-337e93aa6fdf"
                                                >
                                                  <tbody>
                                                    <tr>
                                                      <td
                                                        align="center"
                                                        bgcolor="#F6F6F6"
                                                        class="outer-td"
                                                        style="
                                                          padding: 0px 0px 0px
                                                            0px;
                                                          background-color: #f6f6f6;
                                                        "
                                                      >
                                                        <table
                                                          border="0"
                                                          cellpadding="0"
                                                          cellspacing="0"
                                                          class="wrapper-mobile"
                                                          style="
                                                            text-align: center;
                                                          "
                                                        >
                                                          <tbody>
                                                            <tr>
                                                              <td
                                                                align="center"
                                                                bgcolor="#FE8C4E"
                                                                class="inner-td"
                                                                style="
                                                                  border-radius: 6px;
                                                                  font-size: 16px;
                                                                  text-align: center;
                                                                  background-color: inherit;
                                                                "
                                                              >
                                                                <a
                                                                  href="${verificactionLink}"
                                                                  style="
                                                                    background-color: #fe8c4e;
                                                                    border: 2px
                                                                      solid
                                                                      #fe8c4e;
                                                                    border-color: #fe8c4e;
                                                                    border-radius: 10px;
                                                                    border-width: 2px;
                                                                    color: #fefdfd;
                                                                    display: inline-block;
                                                                    font-size: 16px;
                                                                    font-weight: normal;
                                                                    letter-spacing: 0px;
                                                                    line-height: normal;
                                                                    padding: 12px
                                                                      18px 12px
                                                                      18px;
                                                                    text-align: center;
                                                                    text-decoration: none;
                                                                    border-style: solid;
                                                                  "
                                                                  target="_blank"
                                                                  >Verify Email
                                                                  Now</a
                                                                >
                                                              </td>
                                                            </tr>
                                                          </tbody>
                                                        </table>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                                <table
                                                  class="module"
                                                  role="module"
                                                  data-type="text"
                                                  border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  width="100%"
                                                  style="table-layout: fixed"
                                                  data-muid="8ea463eb-9361-4dda-8f06-3f95dd696b57.1"
                                                  data-mc-module-version="2019-10-22"
                                                >
                                                  <tbody>
                                                    <tr>
                                                      <td
                                                        style="
                                                          padding: 25px 20px
                                                            25px 20px;
                                                          line-height: 17px;
                                                          text-align: inherit;
                                                          background-color: #f6f6f6;
                                                        "
                                                        height="100%"
                                                        valign="top"
                                                        bgcolor="#F6F6F6"
                                                        role="module-content"
                                                      >
                                                        <div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: justify;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                line-height: 107%;
                                                                font-family: inherit;
                                                                font-size: 14px;
                                                              "
                                                              >Recuerda que este
                                                              enlace </span
                                                            ><span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                line-height: 107%;
                                                                color: #fa940a;
                                                                font-family: inherit;
                                                                font-size: 14px;
                                                              "
                                                              ><strong
                                                                >caducará en 24
                                                                horas</strong
                                                              ></span
                                                            ><span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                line-height: 107%;
                                                                font-family: inherit;
                                                                font-size: 14px;
                                                              "
                                                              >, así que no
                                                              demores en
                                                              confirmar tu
                                                              Email.</span
                                                            ><span
                                                              style="
                                                                font-family: inherit;
                                                                font-size: 14px;
                                                              "
                                                            >
                                                              &nbsp;</span
                                                            >
                                                          </div>
                                                          <div></div>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                                <table
                                                  class="module"
                                                  role="module"
                                                  data-type="text"
                                                  border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  width="100%"
                                                  style="table-layout: fixed"
                                                  data-muid="a265ebb9-ab9c-43e8-9009-54d6151b1600"
                                                  data-mc-module-version="2019-10-22"
                                                >
                                                  <tbody>
                                                    <tr>
                                                      <td
                                                        style="
                                                          padding: 30px 20px
                                                            20px 20px;
                                                          line-height: 19px;
                                                          text-align: inherit;
                                                          background-color: #FFFFFFFFFFFFFFFFFFF;
                                                        "
                                                        height="100%"
                                                        valign="top"
                                                        bgcolor="#FFFFFFFFFFFFFFFFFFF"
                                                        role="module-content"
                                                      >
                                                        <div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: center;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                font-family: inherit;
                                                                color: #0a0a0a;
                                                                font-size: 18px;
                                                              "
                                                              ><strong
                                                                >¡Agradecemos
                                                                &nbsp;tu&nbsp;</strong
                                                              ></span
                                                            >
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: center;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                font-family: inherit;
                                                                color: #0a0a0a;
                                                                font-size: 18px;
                                                              "
                                                              ><strong
                                                                >confianza en
                                                                nosotros!</strong
                                                              ></span
                                                            >
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: justify;
                                                            "
                                                          >
                                                            <br />
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: justify;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                font-size: 14px;
                                                                font-family: inherit;
                                                                color: #0a0a0a;
                                                              "
                                                              >Gracias por ser
                                                              parte de la
                                                              transformación
                                                              digital más grande
                                                              de productos de
                                                              belleza y cuidado
                                                              personal en El
                                                              Salvador.</span
                                                            >
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: justify;
                                                            "
                                                          >
                                                            <br />
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: justify;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                font-size: 14px;
                                                                font-family: inherit;
                                                                color: #0a0a0a;
                                                              "
                                                              >Esperamos que
                                                              disfrutes de una
                                                              experiencia de
                                                              compra excepcional
                                                              y que encuentres
                                                              los productos de
                                                              belleza que estás
                                                              buscando.&nbsp;</span
                                                            >
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: justify;
                                                            "
                                                          >
                                                            <br />
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: justify;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                line-height: 107%;
                                                                font-size: 14px;
                                                                font-family: inherit;
                                                                color: #0a0a0a;
                                                              "
                                                              >Si tienes alguna
                                                              pregunta o
                                                              necesitas ayuda,
                                                              no dudes en
                                                              ponerte en
                                                              contacto con
                                                              nuestro equipo de
                                                              soporte.&nbsp;</span
                                                            >
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: justify;
                                                            "
                                                          >
                                                            <br />
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: left;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                font-size: 14px;
                                                                font-family: inherit;
                                                                color: #0a0a0a;
                                                              "
                                                              >¡</span
                                                            ><span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                font-family: inherit;
                                                                color: #0a0a0a;
                                                                font-size: 14px;
                                                              "
                                                              >Estamos aquí para
                                                              lo que
                                                              necesites!</span
                                                            >
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: left;
                                                            "
                                                          >
                                                            <br />
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: left;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                box-sizing: border-box;
                                                                padding-top: 0px;
                                                                padding-right: 0px;
                                                                padding-bottom: 0px;
                                                                padding-left: 0px;
                                                                margin-top: 0px;
                                                                margin-right: 0px;
                                                                margin-bottom: 0px;
                                                                margin-left: 0px;
                                                                font-style: inherit;
                                                                font-variant-ligatures: inherit;
                                                                font-variant-caps: inherit;
                                                                font-variant-numeric: inherit;
                                                                font-variant-east-asian: inherit;
                                                                font-variant-alternates: inherit;
                                                                font-variant-position: inherit;
                                                                font-weight: inherit;
                                                                font-stretch: inherit;
                                                                line-height: inherit;
                                                                font-family: inherit;
                                                                font-optical-sizing: inherit;
                                                                font-kerning: inherit;
                                                                font-feature-settings: inherit;
                                                                font-variation-settings: inherit;
                                                                font-size: 14px;
                                                                vertical-align: baseline;
                                                                border-top-width: 0px;
                                                                border-right-width: 0px;
                                                                border-bottom-width: 0px;
                                                                border-left-width: 0px;
                                                                border-top-style: initial;
                                                                border-right-style: initial;
                                                                border-bottom-style: initial;
                                                                border-left-style: initial;
                                                                border-top-color: initial;
                                                                border-right-color: initial;
                                                                border-bottom-color: initial;
                                                                border-left-color: initial;
                                                                border-image-source: initial;
                                                                border-image-slice: initial;
                                                                border-image-width: initial;
                                                                border-image-outset: initial;
                                                                border-image-repeat: initial;
                                                                text-align: left;
                                                                color: #000000;
                                                                letter-spacing: normal;
                                                                orphans: 2;
                                                                text-indent: 0px;
                                                                text-transform: none;
                                                                widows: 2;
                                                                word-spacing: 0px;
                                                                -webkit-text-stroke-width: 0px;
                                                                white-space-collapse: preserve;
                                                                text-wrap: wrap;
                                                                background-color: rgb(
                                                                  255,
                                                                  255,
                                                                  255
                                                                );
                                                                text-decoration-thickness: initial;
                                                                text-decoration-style: initial;
                                                                text-decoration-color: initial;
                                                              "
                                                              >Saludos
                                                              cordiales,&nbsp;</span
                                                            >
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: left;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                box-sizing: border-box;
                                                                padding-top: 0px;
                                                                padding-right: 0px;
                                                                padding-bottom: 0px;
                                                                padding-left: 0px;
                                                                margin-top: 0px;
                                                                margin-right: 0px;
                                                                margin-bottom: 0px;
                                                                margin-left: 0px;
                                                                font-style: inherit;
                                                                font-variant-ligatures: inherit;
                                                                font-variant-caps: inherit;
                                                                font-variant-numeric: inherit;
                                                                font-variant-east-asian: inherit;
                                                                font-variant-alternates: inherit;
                                                                font-variant-position: inherit;
                                                                font-weight: inherit;
                                                                font-stretch: inherit;
                                                                line-height: inherit;
                                                                font-family: inherit;
                                                                font-optical-sizing: inherit;
                                                                font-kerning: inherit;
                                                                font-feature-settings: inherit;
                                                                font-variation-settings: inherit;
                                                                font-size: 14px;
                                                                vertical-align: baseline;
                                                                border-top-width: 0px;
                                                                border-right-width: 0px;
                                                                border-bottom-width: 0px;
                                                                border-left-width: 0px;
                                                                border-top-style: initial;
                                                                border-right-style: initial;
                                                                border-bottom-style: initial;
                                                                border-left-style: initial;
                                                                border-top-color: initial;
                                                                border-right-color: initial;
                                                                border-bottom-color: initial;
                                                                border-left-color: initial;
                                                                border-image-source: initial;
                                                                border-image-slice: initial;
                                                                border-image-width: initial;
                                                                border-image-outset: initial;
                                                                border-image-repeat: initial;
                                                                text-align: left;
                                                                color: #000000;
                                                                letter-spacing: normal;
                                                                orphans: 2;
                                                                text-indent: 0px;
                                                                text-transform: none;
                                                                widows: 2;
                                                                word-spacing: 0px;
                                                                -webkit-text-stroke-width: 0px;
                                                                white-space-collapse: preserve;
                                                                text-wrap: wrap;
                                                                background-color: rgb(
                                                                  255,
                                                                  255,
                                                                  255
                                                                );
                                                                text-decoration-thickness: initial;
                                                                text-decoration-style: initial;
                                                                text-decoration-color: initial;
                                                              "
                                                              >Tu equipo</span
                                                            >&nbsp;
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: left;
                                                            "
                                                          >
                                                            <a
                                                              href=""
                                                              title='&lt;span data-offset-key="ditug-0-0" style="box-sizing: border-box; padding: 0px; margin: 0px; font-style: inherit; font-variant: inherit; font-weight: bold; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-size: 14px; vertical-align: baseline; border: 0px;"&gt;&lt;span data-text="true" style="box-sizing: border-box; padding: 0px; margin: 0px; font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-size: 14px; vertical-align: baseline; border: 0px;"&gt;AMA&lt;/span&gt;&lt;/span&gt;&lt;span data-offset-key="ditug-0-1" style="box-sizing: border-box; padding: 0px; margin: 0px; font-style: inherit; font-variant: inherit; font-weight: bold; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-size: 14px; vertical-align: baseline; border: 0px;"&gt;&lt;span data-text="true" style="box-sizing: border-box; padding: 0px; margin: 0px; font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-size: 14px; vertical-align: baseline; border: 0px;"&gt; &lt;/span&gt;&lt;/span&gt;&lt;span data-offset-key="ditug-0-2" style="box-sizing: border-box; padding: 0px; margin: 0px; font-style: inherit; font-variant: inherit; font-weight: bold; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-size: 14px; vertical-align: baseline; border: 0px;"&gt;&lt;span data-text="true" style="box-sizing: border-box; padding: 0px; margin: 0px; font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-size: 14px; vertical-align: baseline; border: 0px;"&gt;BELLE&lt;/span&gt;&lt;/span&gt;'
                                                              ><span
                                                                style="
                                                                  box-sizing: border-box;
                                                                  padding-top: 0px;
                                                                  padding-right: 0px;
                                                                  padding-bottom: 0px;
                                                                  padding-left: 0px;
                                                                  margin-top: 0px;
                                                                  margin-right: 0px;
                                                                  margin-bottom: 0px;
                                                                  margin-left: 0px;
                                                                  font-style: inherit;
                                                                  font-variant-ligatures: inherit;
                                                                  font-variant-caps: inherit;
                                                                  font-variant-numeric: inherit;
                                                                  font-variant-east-asian: inherit;
                                                                  font-variant-alternates: inherit;
                                                                  font-variant-position: inherit;
                                                                  font-weight: bold;
                                                                  font-stretch: inherit;
                                                                  line-height: inherit;
                                                                  font-family: inherit;
                                                                  font-optical-sizing: inherit;
                                                                  font-kerning: inherit;
                                                                  font-feature-settings: inherit;
                                                                  font-variation-settings: inherit;
                                                                  font-size: 14px;
                                                                  vertical-align: baseline;
                                                                  border-top-width: 0px;
                                                                  border-right-width: 0px;
                                                                  border-bottom-width: 0px;
                                                                  border-left-width: 0px;
                                                                  border-top-style: initial;
                                                                  border-right-style: initial;
                                                                  border-bottom-style: initial;
                                                                  border-left-style: initial;
                                                                  border-top-color: initial;
                                                                  border-right-color: initial;
                                                                  border-bottom-color: initial;
                                                                  border-left-color: initial;
                                                                  border-image-source: initial;
                                                                  border-image-slice: initial;
                                                                  border-image-width: initial;
                                                                  border-image-outset: initial;
                                                                  border-image-repeat: initial;
                                                                  text-align: left;
                                                                  color: #1188e6;
                                                                  letter-spacing: normal;
                                                                  orphans: 2;
                                                                  text-indent: 0px;
                                                                  text-transform: none;
                                                                  widows: 2;
                                                                  word-spacing: 0px;
                                                                  -webkit-text-stroke-width: 0px;
                                                                  white-space-collapse: preserve;
                                                                  text-wrap: wrap;
                                                                  background-color: rgb(
                                                                    255,
                                                                    255,
                                                                    255
                                                                  );
                                                                  text-decoration-thickness: initial;
                                                                  text-decoration-style: initial;
                                                                  text-decoration-color: initial;
                                                                  outline-color: initial;
                                                                  outline-style: none;
                                                                  outline-width: initial;
                                                                  text-decoration-line: none;
                                                                  transition-behavior: normal;
                                                                  transition-duration: 0.3s;
                                                                  transition-timing-function: ease;
                                                                  transition-delay: 0s;
                                                                  transition-property: color;
                                                                "
                                                                >AMA</span
                                                              ><span
                                                                style="
                                                                  font-size: 8px;
                                                                "
                                                              >
                                                              </span
                                                              ><span
                                                                style="
                                                                  box-sizing: border-box;
                                                                  padding-top: 0px;
                                                                  padding-right: 0px;
                                                                  padding-bottom: 0px;
                                                                  padding-left: 0px;
                                                                  margin-top: 0px;
                                                                  margin-right: 0px;
                                                                  margin-bottom: 0px;
                                                                  margin-left: 0px;
                                                                  font-style: inherit;
                                                                  font-variant-ligatures: inherit;
                                                                  font-variant-caps: inherit;
                                                                  font-variant-numeric: inherit;
                                                                  font-variant-east-asian: inherit;
                                                                  font-variant-alternates: inherit;
                                                                  font-variant-position: inherit;
                                                                  font-weight: bold;
                                                                  font-stretch: inherit;
                                                                  line-height: inherit;
                                                                  font-family: inherit;
                                                                  font-optical-sizing: inherit;
                                                                  font-kerning: inherit;
                                                                  font-feature-settings: inherit;
                                                                  font-variation-settings: inherit;
                                                                  font-size: 14px;
                                                                  vertical-align: baseline;
                                                                  border-top-width: 0px;
                                                                  border-right-width: 0px;
                                                                  border-bottom-width: 0px;
                                                                  border-left-width: 0px;
                                                                  border-top-style: initial;
                                                                  border-right-style: initial;
                                                                  border-bottom-style: initial;
                                                                  border-left-style: initial;
                                                                  border-top-color: initial;
                                                                  border-right-color: initial;
                                                                  border-bottom-color: initial;
                                                                  border-left-color: initial;
                                                                  border-image-source: initial;
                                                                  border-image-slice: initial;
                                                                  border-image-width: initial;
                                                                  border-image-outset: initial;
                                                                  border-image-repeat: initial;
                                                                  text-align: left;
                                                                  color: #1188e6;
                                                                  letter-spacing: normal;
                                                                  orphans: 2;
                                                                  text-indent: 0px;
                                                                  text-transform: none;
                                                                  widows: 2;
                                                                  word-spacing: 0px;
                                                                  -webkit-text-stroke-width: 0px;
                                                                  white-space-collapse: preserve;
                                                                  text-wrap: wrap;
                                                                  background-color: rgb(
                                                                    255,
                                                                    255,
                                                                    255
                                                                  );
                                                                  text-decoration-thickness: initial;
                                                                  text-decoration-style: initial;
                                                                  text-decoration-color: initial;
                                                                  outline-color: initial;
                                                                  outline-style: none;
                                                                  outline-width: initial;
                                                                  text-decoration-line: none;
                                                                  transition-behavior: normal;
                                                                  transition-duration: 0.3s;
                                                                  transition-timing-function: ease;
                                                                  transition-delay: 0s;
                                                                  transition-property: color;
                                                                "
                                                                >BELLE</span
                                                              ></a
                                                            >&nbsp;
                                                          </div>
                                                          <div></div>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                                <table
                                                  border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  class="module"
                                                  data-role="module-button"
                                                  data-type="button"
                                                  role="module"
                                                  style="table-layout: fixed"
                                                  width="100%"
                                                  data-muid="3c6b1ba6-7302-4e7f-a38f-337e93aa6fdf.1"
                                                >
                                                  <tbody>
                                                    <tr>
                                                      <td
                                                        align="center"
                                                        bgcolor=" #FFFFFFFFFFFFFFFFFFF"
                                                        class="outer-td"
                                                        style="
                                                          padding: 5px 30px 5px
                                                            30px;
                                                          background-color: #FFFFFFFFFFFFFFFFFFF;
                                                        "
                                                      >
                                                        <table
                                                          border="0"
                                                          cellpadding="0"
                                                          cellspacing="0"
                                                          class="wrapper-mobile"
                                                          style="
                                                            text-align: center;
                                                          "
                                                        >
                                                          <tbody>
                                                            <tr>
                                                              <td
                                                                align="center"
                                                                bgcolor="#0c0c0c"
                                                                class="inner-td"
                                                                style="
                                                                  border-radius: 6px;
                                                                  font-size: 16px;
                                                                  text-align: center;
                                                                  background-color: inherit;
                                                                "
                                                              >
                                                                <a
                                                                  href="https://api.whatsapp.com/send?phone=50370438848&text=%C2%A1Hola!%20Tengo%20una%20consulta"
                                                                  style="
                                                                    background-color: #0c0c0c;
                                                                    border: 2px
                                                                      solid
                                                                      #0c0c0c;
                                                                    border-color: #0c0c0c;
                                                                    border-radius: 4px;
                                                                    border-width: 2px;
                                                                    color: #fefdfd;
                                                                    display: inline-block;
                                                                    font-size: 12px;
                                                                    font-weight: normal;
                                                                    letter-spacing: 0px;
                                                                    line-height: normal;
                                                                    padding: 5px
                                                                      10px 5px
                                                                      10px;
                                                                    text-align: center;
                                                                    text-decoration: none;
                                                                    border-style: solid;
                                                                  "
                                                                  target="_blank"
                                                                  >Contact
                                                                  Support</a
                                                                >
                                                              </td>
                                                            </tr>
                                                          </tbody>
                                                        </table>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </table>
                          <!--[if mso]>
                                  </td>
                                </tr>
                              </table>
                            </center>
                            <![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    </center>
  </body>
</html> `,

      /*
        html: `
         Hola,
         <br>
         <br>
         Gracias por registrarte a nuestra tienda de <span>Bellmart</span>.Haga clic en el siguiente enlace para verificar su correo electrónico: 
         <br>
         <br>
        <a href="${verificactionLink}">${verificactionLink}</a>
        <br>
        <br>
        Este enlace caducará en 24 horas. Si no se registro para obtener una cuenta de <span>Bellmart</span>
        <br>
        <br>
        Que estes bien.
        <br>
        <br>
        <span>Bellmart</span> Soporte
        `, // html body
        */
      });

      res.send({
        results: { message: "Revise su Correo para Activar su Cuenta" },
        result: true,
        error: "",
      });
    } else {
      handleHttpError(res, "ERROR CORREO YA EXISTE");
    }
  } catch (error) {
    console.log(error);
    handleHttpError(res, "ERROR REGISTANDO UN CLIENTE");
  }
};
/**
 * Este Controlador es el encargado de logear un Cliente
 * @param {*} req
 * @param {*} res
 */
const loginCtrl = async (req, res) => {
  try {
    req = matchedData(req);

    const cliente = await clienteModel.findAll({
      attributes: [
        "CLIENTE",
        "NOMBRE",
        "CONTRIBUYENTE",
        "RUBRO1_CLI",
        "RUBRO2_CLI",
        "Rol",
        "Password",
        "Nivel_Precio",
        "Direccion",
        "E_Mail",
        "CONFIRN",
        "NOMBRES",
        "APELLIDOS",
        "RUBRO3_CLI",
        "RUBRO4_CLI",
        "RUBRO5_CLI",
        "RECIBIR_BOLETIN",
        "TELEFONO1",
      ],
      where: {
        E_Mail: req.E_Mail,
      },
    });

    if (cliente.length == 0) {
      handleHttpError(res, "Cliente No Existe", 404);
      return;
    }

    for (let i = 0; i < cliente.length; i++) {
      const element = cliente[i];

      if (element.CONFIRN == 0) {
        return res.send({
          results: { message: "Cuenta no esta Activa" },
          result: false,
          error: "",
        });
      }
      const hashPassword = element.Password;

      const check = await compare(req.Password, hashPassword);
      if (!check) {
        handleHttpError(res, "PASSWORD_INVALID", 401);
        return;
      }

      nuevo = JSON.stringify(cliente[0]);
      nuevo = JSON.parse(nuevo);

      const data = {
        token: await tokenSign(nuevo),
        cliente: nuevo,
      };
      res.send({ data });
    }
  } catch (error) {
    handleHttpError(res, "Error al Logear a un cliente");
  }
};
const loginCodigo = async (req, res) => {
  try {
    req = matchedData(req);

    const cliente = await clienteModel.findAll({
      attributes: [
        "CLIENTE",
        "NOMBRE",
        "CONTRIBUYENTE",
        "RUBRO1_CLI",
        "RUBRO2_CLI",
        "Rol",
        "Password",
        "Nivel_Precio",
        "Direccion",
        "Telefono1",
        "E_Mail",
        "CONFIRN",
        "NOMBRES",
        "APELLIDOS",
        "RUBRO3_CLI",
        "RUBRO4_CLI",
        "RUBRO5_CLI",
        "RECIBIR_BOLETIN",
        "TELEFONO1",
      ],
      where: {
        E_Mail: req.E_Mail,
      },
    });

    if (cliente.length == 0) {
      handleHttpError(res, "Cliente No Existe", 404);
      return;
    }

    for (let i = 0; i < cliente.length; i++) {
      const element = cliente[i];

      if (element.CONFIRN == 0) {
        return res.send({
          results: { message: "Cuenta no esta Activa" },
          result: false,
          error: "",
        });
      }
      const hashPassword = element.Password;

      const check = await compare(req.Password, hashPassword);
      if (!check) {
        handleHttpError(res, "PASSWORD_INVALID", 401);
        return;
      }

      nuevo = JSON.stringify(cliente[0]);
      nuevo = JSON.parse(nuevo);

      const data = {
        token: await tokenSign(nuevo),
        cliente: nuevo,
      };
      res.send({ data });
    }
  } catch (error) {
    handleHttpError(res, "Error al Logear a un cliente");
  }
};

const forgotPassword = async (req, res) => {
  const email = req.body.email;

  if (!email) {
    return res.status(400).json({ messaje: "Correo es requerido" });
  }
  const message = "Revise su Correo  y click en link para Reset Password";
  let verificactionLink;
  let emailStatus = "Ok";
  try {
    const cliente = await clienteModel.findAll({
      attributes: [
        "CLIENTE",
        "NOMBRE",
        "CONTRIBUYENTE",
        "RUBRO1_CLI",
        "RUBRO2_CLI",
        "Rol",
        "Password",
        "Nivel_Precio",
        "Direccion",
        "Telefono1",
        "E_Mail",
      ],
      where: {
        E_Mail: email,
      },
    });

    nuevo = JSON.stringify(cliente[0]);
    nuevo = JSON.parse(nuevo);

    const token = await tokenSignReset(nuevo);

    let url = "";

    if (ssl == "N") {
      url = `http://${host}/new-password/${token}`;
    } else {
      url = `https://${host}/new-password/${token}`;
    }
    verificactionLink = url;

    //actualizamos token en la base de datos
    console.log(verificactionLink);
    const updateToken = await clienteModel.update(
      {
        RESET_TOKEN: token,
      },
      { where: { E_Mail: email } }
    );
  } catch (error) {
    return res.json(error);
  }
  //TODO: send Email
  try {
    //Envio de eamil

    await transporter.sendMail({
      from: '"Soporte ama-belle" <no-reply@ama-belle.com>', // sender address
      to: email, // list of receivers
      subject: "Recuperacion de Contraseña", // Subject line
      html:`
      <html
  data-editor-version="2"
  class="sg-campaigns"
  xmlns="http://www.w3.org/1999/xhtml"
>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1"
    />
    <!--[if !mso]><!-->
    <meta http-equiv="X-UA-Compatible" content="IE=Edge" />
    <!--<![endif]-->
    <!--[if (gte mso 9)|(IE)]>
      <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG />
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    <![endif]-->
    <!--[if (gte mso 9)|(IE)]>
      <style type="text/css">
        body {
          width: 600px;
          margin: 0 auto;
        }
        table {
          border-collapse: collapse;
        }
        table,
        td {
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
        }
        img {
          -ms-interpolation-mode: bicubic;
        }
      </style>
    <![endif]-->
    <style type="text/css">
      body,
      p,
      div {
        font-family: inherit;
        font-size: 14px;
      }
      body {
        color: #000000;
      }
      body a {
        color: #1188e6;
        text-decoration: none;
      }
      p {
        margin: 0;
        padding: 0;
      }
      table.wrapper {
        width: 100% !important;
        table-layout: fixed;
        -webkit-font-smoothing: antialiased;
        -webkit-text-size-adjust: 100%;
        -moz-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      img.max-width {
        max-width: 100% !important;
      }
      .column.of-2 {
        width: 50%;
      }
      .column.of-3 {
        width: 33.333%;
      }
      .column.of-4 {
        width: 25%;
      }
      ul ul ul ul {
        list-style-type: disc !important;
      }
      ol ol {
        list-style-type: lower-roman !important;
      }
      ol ol ol {
        list-style-type: lower-latin !important;
      }
      ol ol ol ol {
        list-style-type: decimal !important;
      }
      @media screen and (max-width: 480px) {
        .preheader .rightColumnContent,
        .footer .rightColumnContent {
          text-align: left !important;
        }
        .preheader .rightColumnContent div,
        .preheader .rightColumnContent span,
        .footer .rightColumnContent div,
        .footer .rightColumnContent span {
          text-align: left !important;
        }
        .preheader .rightColumnContent,
        .preheader .leftColumnContent {
          font-size: 80% !important;
          padding: 5px 0;
        }
        table.wrapper-mobile {
          width: 100% !important;
          table-layout: fixed;
        }
        img.max-width {
          height: auto !important;
          max-width: 100% !important;
        }
        a.bulletproof-button {
          display: block !important;
          width: auto !important;
          font-size: 80%;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
        .columns {
          width: 100% !important;
        }
        .column {
          display: block !important;
          width: 100% !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }
        .social-icon-column {
          display: inline-block !important;
        }
      }
    </style>
    <!--user entered Head Start-->
    <link
      href="https://fonts.googleapis.com/css?family=Muli&display=swap"
      rel="stylesheet"
    />
    <style>
      body {
        font-family: "Muli", sans-serif;
      }
    </style>
    <!--End Head user entered-->
  </head>
  <body>
    <center
      class="wrapper"
      data-link-color="#1188E6"
      data-body-style="font-size:14px; font-family:inherit; color:#000000; background-color:#FFFFFF;"
    >
      <div class="webkit">
        <table
          cellpadding="0"
          cellspacing="0"
          border="0"
          width="100%"
          class="wrapper"
          bgcolor="#FFFFFF"
        >
          <tr>
            <td valign="top" bgcolor="#FFFFFF" width="100%">
              <table
                width="100%"
                role="content-container"
                class="outer"
                align="center"
                cellpadding="0"
                cellspacing="0"
                border="0"
              >
                <tr>
                  <td width="100%">
                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                    >
                      <tr>
                        <td>
                          <!--[if mso]>
    <center>
    <table><tr><td width="600">
  <![endif]-->
                          <table
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                            style="width: 100%; max-width: 600px"
                            align="center"
                          >
                            <tr>
                              <td
                                role="modules-container"
                                style="
                                  padding: 0px 0px 0px 0px;
                                  color: #000000;
                                  text-align: left;
                                "
                                bgcolor="#FFFFFF"
                                width="100%"
                                align="left"
                              >
                                <table
                                  class="module preheader preheader-hide"
                                  role="module"
                                  data-type="preheader"
                                  border="0"
                                  cellpadding="0"
                                  cellspacing="0"
                                  width="100%"
                                  style="
                                    display: none !important;
                                    mso-hide: all;
                                    visibility: hidden;
                                    opacity: 0;
                                    color: transparent;
                                    height: 0;
                                    width: 0;
                                  "
                                >
                                  <tr>
                                    <td role="module-content">
                                      <p></p>
                                    </td>
                                  </tr>
                                </table>
                                <table
                                  border="0"
                                  cellpadding="0"
                                  cellspacing="0"
                                  align="center"
                                  width="100%"
                                  role="module"
                                  data-type="columns"
                                  style="padding: 30px 20px 30px 20px"
                                  bgcolor="#fFFFFFFFFFFFFFFFF"
                                  data-distribution="1"
                                >
                                  <tbody>
                                    <tr role="module-content">
                                      <td height="100%" valign="top">
                                        <table
                                          width="540"
                                          style="
                                            width: 540px;
                                            border-spacing: 0;
                                            border-collapse: collapse;
                                            margin: 0px 10px 0px 10px;
                                          "
                                          cellpadding="0"
                                          cellspacing="0"
                                          align="left"
                                          border="0"
                                          bgcolor=""
                                          class="column column-0"
                                        >
                                          <tbody>
                                            <tr>
                                              <td
                                                style="
                                                  padding: 0px;
                                                  margin: 0px;
                                                  border-spacing: 0;
                                                "
                                              >
                                                <table
                                                  class="wrapper"
                                                  role="module"
                                                  data-type="image"
                                                  border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  width="100%"
                                                  style="table-layout: fixed"
                                                  data-muid="d8508015-a2cb-488c-9877-d46adf313282"
                                                >
                                                  <tbody>
                                                    <tr>
                                                      <td
                                                        style="
                                                          font-size: 6px;
                                                          line-height: 10px;
                                                          padding: 18px 0px 18px
                                                            0px;
                                                        "
                                                        valign="top"
                                                        align="center"
                                                      >
                                                        <a href="ama-belle.com"
                                                          ><img
                                                            class="max-width"
                                                            border="0"
                                                            style="
                                                              display: block;
                                                              color: #000000;
                                                              text-decoration: none;
                                                              font-family: Helvetica,
                                                                arial,
                                                                sans-serif;
                                                              font-size: 16px;
                                                              max-width: 100% !important;
                                                              width: 100%;
                                                              height: auto !important;
                                                            "
                                                            width="540"
                                                            alt=""
                                                            data-proportionally-constrained="true"
                                                            data-responsive="true"
                                                            src="https://bellmart.s3.amazonaws.com/ama-belle-logo-big.png"
                                                        /></a>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                                <table
                                                  class="module"
                                                  role="module"
                                                  data-type="text"
                                                  border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  width="100%"
                                                  style="table-layout: fixed"
                                                  data-muid="af2e984f-3bd4-4b6a-ab14-c1c1fad4301a"
                                                  data-mc-module-version="2019-10-22"
                                                >
                                                  <tbody>
                                                    <tr>
                                                      <td
                                                        style="
                                                          padding: 25px 0px 25px
                                                            0px;
                                                          line-height: 25px;
                                                          text-align: inherit;
                                                          background-color: #FFFFFFFFFFFFFFF;
                                                        "
                                                        height="100%"
                                                        valign="top"
                                                        bgcolor="#FFFFFFFFFFFFFFF"
                                                        role="module-content"
                                                      >
                                                        <div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: center;
                                                            "
                                                          >
                                                            &nbsp;<span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                font-size: 14px;
                                                              "
                                                              >¡Te saluda AMA</span
                                                            ><span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                font-size: 8px;
                                                              "
                                                            >
                                                            </span
                                                            ><span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                font-size: 14px;
                                                              "
                                                              >BELLE</span
                                                            ><span
                                                              style="
                                                                box-sizing: border-box;
                                                                padding-top: 0px;
                                                                padding-right: 0px;
                                                                padding-bottom: 0px;
                                                                padding-left: 0px;
                                                                margin-top: 0px;
                                                                margin-right: 0px;
                                                                margin-bottom: 0px;
                                                                margin-left: 0px;
                                                                font-style: inherit;
                                                                font-variant-ligatures: inherit;
                                                                font-variant-caps: inherit;
                                                                font-variant-numeric: inherit;
                                                                font-variant-east-asian: inherit;
                                                                font-variant-alternates: inherit;
                                                                font-variant-position: inherit;
                                                                font-weight: inherit;
                                                                font-stretch: inherit;
                                                                line-height: inherit;
                                                                font-family: inherit;
                                                                font-optical-sizing: inherit;
                                                                font-kerning: inherit;
                                                                font-feature-settings: inherit;
                                                                font-variation-settings: inherit;
                                                                font-size: 14px;
                                                                vertical-align: baseline;
                                                                border-top-width: 0px;
                                                                border-right-width: 0px;
                                                                border-bottom-width: 0px;
                                                                border-left-width: 0px;
                                                                border-top-style: initial;
                                                                border-right-style: initial;
                                                                border-bottom-style: initial;
                                                                border-left-style: initial;
                                                                border-top-color: initial;
                                                                border-right-color: initial;
                                                                border-bottom-color: initial;
                                                                border-left-color: initial;
                                                                border-image-source: initial;
                                                                border-image-slice: initial;
                                                                border-image-width: initial;
                                                                border-image-outset: initial;
                                                                border-image-repeat: initial;
                                                                color: #000000;
                                                                letter-spacing: normal;
                                                                orphans: 2;
                                                                text-align: center;
                                                                text-indent: 0px;
                                                                text-transform: none;
                                                                widows: 2;
                                                                word-spacing: 0px;
                                                                -webkit-text-stroke-width: 0px;
                                                                white-space-collapse: preserve;
                                                                text-wrap: wrap;
                                                                background-color: rgb(
                                                                  246,
                                                                  246,
                                                                  246
                                                                );
                                                                text-decoration-thickness: initial;
                                                                text-decoration-style: initial;
                                                                text-decoration-color: initial;
                                                                overflow-wrap: break-word;
                                                              "
                                                              >!</span
                                                            >
                                                            &nbsp;<span
                                                              style="
                                                                overflow-wrap: break-word;
                                                              "
                                                              >&nbsp;</span
                                                            >
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: center;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                overflow-wrap: break-word;
                                                              "
                                                              ><strong
                                                                >“Where Beauty
                                                                meets
                                                                technology”</strong
                                                              ></span
                                                            ><strong>
                                                              &nbsp;</strong
                                                            >
                                                          </div>
                                                          <div></div>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                                <table
                                                  class="module"
                                                  role="module"
                                                  data-type="text"
                                                  border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  width="100%"
                                                  style="table-layout: fixed"
                                                  data-muid="8ea463eb-9361-4dda-8f06-3f95dd696b57"
                                                  data-mc-module-version="2019-10-22"
                                                >
                                                  <tbody>
                                                    <tr>
                                                      <td
                                                        style="
                                                          padding: 25px 20px
                                                            25px 20px;
                                                          line-height: 25px;
                                                          text-align: inherit;
                                                          background-color: #f6f6f6;
                                                        "
                                                        height="100%"
                                                        valign="top"
                                                        bgcolor="#F6F6F6"
                                                        role="module-content"
                                                      >
                                                        <div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: justify;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                overflow-wrap: break-word;
                                                              "
                                                              >No te preocupes puedes recuperar tu contraseña siguiendo las instrucciones haciendo clic en el siguiente enlace:</span
                                                            >
                                                            &nbsp;
                                                          </div>
                                                          <div></div>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                                <table
                                                  border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  class="module"
                                                  data-role="module-button"
                                                  data-type="button"
                                                  role="module"
                                                  style="table-layout: fixed"
                                                  width="100%"
                                                  data-muid="3c6b1ba6-7302-4e7f-a38f-337e93aa6fdf"
                                                >
                                                  <tbody>
                                                    <tr>
                                                      <td
                                                        align="center"
                                                        bgcolor="#F6F6F6"
                                                        class="outer-td"
                                                        style="
                                                          padding: 0px 0px 0px
                                                            0px;
                                                          background-color: #f6f6f6;
                                                        "
                                                      >
                                                        <table
                                                          border="0"
                                                          cellpadding="0"
                                                          cellspacing="0"
                                                          class="wrapper-mobile"
                                                          style="
                                                            text-align: center;
                                                          "
                                                        >
                                                          <tbody>
                                                            <tr>
                                                              <td
                                                                align="center"
                                                                bgcolor="#FE8C4E"
                                                                class="inner-td"
                                                                style="
                                                                  border-radius: 6px;
                                                                  font-size: 16px;
                                                                  text-align: center;
                                                                  background-color: inherit;
                                                                "
                                                              >
                                                                <a
                                                                  href="${verificactionLink}"
                                                                  style="
                                                                    background-color: #fe8c4e;
                                                                    border: 2px
                                                                      solid
                                                                      #fe8c4e;
                                                                    border-color: #fe8c4e;
                                                                    border-radius: 10px;
                                                                    border-width: 2px;
                                                                    color: #fefdfd;
                                                                    display: inline-block;
                                                                    font-size: 16px;
                                                                    font-weight: normal;
                                                                    letter-spacing: 0px;
                                                                    line-height: normal;
                                                                    padding: 12px
                                                                      18px 12px
                                                                      18px;
                                                                    text-align: center;
                                                                    text-decoration: none;
                                                                    border-style: solid;
                                                                  "
                                                                  target="_blank"
                                                                  >Recuperar contraseña</a
                                                                >
                                                              </td>
                                                            </tr>
                                                          </tbody>
                                                        </table>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                                <table
                                                  class="module"
                                                  role="module"
                                                  data-type="text"
                                                  border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  width="100%"
                                                  style="table-layout: fixed"
                                                  data-muid="8ea463eb-9361-4dda-8f06-3f95dd696b57.1"
                                                  data-mc-module-version="2019-10-22"
                                                >
                                                  <tbody>
                                                    <tr>
                                                      <td
                                                        style="
                                                          padding: 25px 20px
                                                            25px 20px;
                                                          line-height: 17px;
                                                          text-align: inherit;
                                                          background-color: #f6f6f6;
                                                        "
                                                        height="100%"
                                                        valign="top"
                                                        bgcolor="#F6F6F6"
                                                        role="module-content"
                                                      >
                                                        <div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: justify;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                line-height: 107%;
                                                                font-family: inherit;
                                                                font-size: 14px;
                                                              "
                                                              >Recuerda que este
                                                              enlace </span
                                                            ><span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                line-height: 107%;
                                                                color: #fa940a;
                                                                font-family: inherit;
                                                                font-size: 14px;
                                                              "
                                                              ><strong
                                                                >caducará en 1
                                                                hora</strong
                                                              ></span
                                                            ><span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                line-height: 107%;
                                                                font-family: inherit;
                                                                font-size: 14px;
                                                              "
                                                              >.</span
                                                            ><span
                                                              style="
                                                                font-family: inherit;
                                                                font-size: 14px;
                                                              "
                                                            >
                                                              &nbsp;</span
                                                            >
                                                          </div>
                                                          <div></div>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                                <table
                                                  class="module"
                                                  role="module"
                                                  data-type="text"
                                                  border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  width="100%"
                                                  style="table-layout: fixed"
                                                  data-muid="a265ebb9-ab9c-43e8-9009-54d6151b1600"
                                                  data-mc-module-version="2019-10-22"
                                                >
                                                  <tbody>
                                                    <tr>
                                                      <td
                                                        style="
                                                          padding: 30px 20px
                                                            20px 20px;
                                                          line-height: 19px;
                                                          text-align: inherit;
                                                          background-color: #FFFFFFFFFFFFFFFFFFF;
                                                        "
                                                        height="100%"
                                                        valign="top"
                                                        bgcolor="#FFFFFFFFFFFFFFFFFFF"
                                                        role="module-content"
                                                      >
                                                        <div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: center;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                font-family: inherit;
                                                                color: #0a0a0a;
                                                                font-size: 18px;
                                                              "
                                                              ><strong
                                                                >¡Agradecemos
                                                                &nbsp;tu&nbsp;</strong
                                                              ></span
                                                            >
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: center;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                font-family: inherit;
                                                                color: #0a0a0a;
                                                                font-size: 18px;
                                                              "
                                                              ><strong
                                                                >confianza en
                                                                nosotros!</strong
                                                              ></span
                                                            >
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: justify;
                                                            "
                                                          >
                                                            <br />
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: justify;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                font-size: 14px;
                                                                font-family: inherit;
                                                                color: #0a0a0a;
                                                              "
                                                              >Gracias por ser
                                                              parte de la
                                                              transformación
                                                              digital más grande
                                                              de productos de
                                                              belleza y cuidado
                                                              personal en El
                                                              Salvador.</span
                                                            >
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: justify;
                                                            "
                                                          >
                                                            <br />
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: justify;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                font-size: 14px;
                                                                font-family: inherit;
                                                                color: #0a0a0a;
                                                              "
                                                              >Esperamos que
                                                              disfrutes de una
                                                              experiencia de
                                                              compra excepcional
                                                              y que encuentres
                                                              los productos de
                                                              belleza que estás
                                                              buscando.&nbsp;</span
                                                            >
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: justify;
                                                            "
                                                          >
                                                            <br />
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: justify;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                line-height: 107%;
                                                                font-size: 14px;
                                                                font-family: inherit;
                                                                color: #0a0a0a;
                                                              "
                                                              >Si tienes alguna
                                                              pregunta o
                                                              necesitas ayuda,
                                                              no dudes en
                                                              ponerte en
                                                              contacto con
                                                              nuestro equipo de
                                                              soporte.&nbsp;</span
                                                            >
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: justify;
                                                            "
                                                          >
                                                            <br />
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: left;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                font-size: 14px;
                                                                font-family: inherit;
                                                                color: #0a0a0a;
                                                              "
                                                              >¡</span
                                                            ><span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                font-family: inherit;
                                                                color: #0a0a0a;
                                                                font-size: 14px;
                                                              "
                                                              >Estamos aquí para
                                                              lo que necesites!</span
                                                            >
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: left;
                                                            "
                                                          >
                                                            <br />
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: left;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                box-sizing: border-box;
                                                                padding-top: 0px;
                                                                padding-right: 0px;
                                                                padding-bottom: 0px;
                                                                padding-left: 0px;
                                                                margin-top: 0px;
                                                                margin-right: 0px;
                                                                margin-bottom: 0px;
                                                                margin-left: 0px;
                                                                font-style: inherit;
                                                                font-variant-ligatures: inherit;
                                                                font-variant-caps: inherit;
                                                                font-variant-numeric: inherit;
                                                                font-variant-east-asian: inherit;
                                                                font-variant-alternates: inherit;
                                                                font-variant-position: inherit;
                                                                font-weight: inherit;
                                                                font-stretch: inherit;
                                                                line-height: inherit;
                                                                font-family: inherit;
                                                                font-optical-sizing: inherit;
                                                                font-kerning: inherit;
                                                                font-feature-settings: inherit;
                                                                font-variation-settings: inherit;
                                                                font-size: 14px;
                                                                vertical-align: baseline;
                                                                border-top-width: 0px;
                                                                border-right-width: 0px;
                                                                border-bottom-width: 0px;
                                                                border-left-width: 0px;
                                                                border-top-style: initial;
                                                                border-right-style: initial;
                                                                border-bottom-style: initial;
                                                                border-left-style: initial;
                                                                border-top-color: initial;
                                                                border-right-color: initial;
                                                                border-bottom-color: initial;
                                                                border-left-color: initial;
                                                                border-image-source: initial;
                                                                border-image-slice: initial;
                                                                border-image-width: initial;
                                                                border-image-outset: initial;
                                                                border-image-repeat: initial;
                                                                text-align: left;
                                                                color: #000000;
                                                                letter-spacing: normal;
                                                                orphans: 2;
                                                                text-indent: 0px;
                                                                text-transform: none;
                                                                widows: 2;
                                                                word-spacing: 0px;
                                                                -webkit-text-stroke-width: 0px;
                                                                white-space-collapse: preserve;
                                                                text-wrap: wrap;
                                                                background-color: rgb(
                                                                  255,
                                                                  255,
                                                                  255
                                                                );
                                                                text-decoration-thickness: initial;
                                                                text-decoration-style: initial;
                                                                text-decoration-color: initial;
                                                              "
                                                              >Saludos cordiales,&nbsp;</span
                                                            >
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: left;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                box-sizing: border-box;
                                                                padding-top: 0px;
                                                                padding-right: 0px;
                                                                padding-bottom: 0px;
                                                                padding-left: 0px;
                                                                margin-top: 0px;
                                                                margin-right: 0px;
                                                                margin-bottom: 0px;
                                                                margin-left: 0px;
                                                                font-style: inherit;
                                                                font-variant-ligatures: inherit;
                                                                font-variant-caps: inherit;
                                                                font-variant-numeric: inherit;
                                                                font-variant-east-asian: inherit;
                                                                font-variant-alternates: inherit;
                                                                font-variant-position: inherit;
                                                                font-weight: inherit;
                                                                font-stretch: inherit;
                                                                line-height: inherit;
                                                                font-family: inherit;
                                                                font-optical-sizing: inherit;
                                                                font-kerning: inherit;
                                                                font-feature-settings: inherit;
                                                                font-variation-settings: inherit;
                                                                font-size: 14px;
                                                                vertical-align: baseline;
                                                                border-top-width: 0px;
                                                                border-right-width: 0px;
                                                                border-bottom-width: 0px;
                                                                border-left-width: 0px;
                                                                border-top-style: initial;
                                                                border-right-style: initial;
                                                                border-bottom-style: initial;
                                                                border-left-style: initial;
                                                                border-top-color: initial;
                                                                border-right-color: initial;
                                                                border-bottom-color: initial;
                                                                border-left-color: initial;
                                                                border-image-source: initial;
                                                                border-image-slice: initial;
                                                                border-image-width: initial;
                                                                border-image-outset: initial;
                                                                border-image-repeat: initial;
                                                                text-align: left;
                                                                color: #000000;
                                                                letter-spacing: normal;
                                                                orphans: 2;
                                                                text-indent: 0px;
                                                                text-transform: none;
                                                                widows: 2;
                                                                word-spacing: 0px;
                                                                -webkit-text-stroke-width: 0px;
                                                                white-space-collapse: preserve;
                                                                text-wrap: wrap;
                                                                background-color: rgb(
                                                                  255,
                                                                  255,
                                                                  255
                                                                );
                                                                text-decoration-thickness: initial;
                                                                text-decoration-style: initial;
                                                                text-decoration-color: initial;
                                                              "
                                                              >Tu equipo</span
                                                            >&nbsp;
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: left;
                                                            "
                                                          >
                                                            <a
                                                              href=""
                                                              title='&lt;span data-offset-key="ditug-0-0" style="box-sizing: border-box; padding: 0px; margin: 0px; font-style: inherit; font-variant: inherit; font-weight: bold; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-size: 14px; vertical-align: baseline; border: 0px;"&gt;&lt;span data-text="true" style="box-sizing: border-box; padding: 0px; margin: 0px; font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-size: 14px; vertical-align: baseline; border: 0px;"&gt;AMA&lt;/span&gt;&lt;/span&gt;&lt;span data-offset-key="ditug-0-1" style="box-sizing: border-box; padding: 0px; margin: 0px; font-style: inherit; font-variant: inherit; font-weight: bold; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-size: 14px; vertical-align: baseline; border: 0px;"&gt;&lt;span data-text="true" style="box-sizing: border-box; padding: 0px; margin: 0px; font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-size: 14px; vertical-align: baseline; border: 0px;"&gt; &lt;/span&gt;&lt;/span&gt;&lt;span data-offset-key="ditug-0-2" style="box-sizing: border-box; padding: 0px; margin: 0px; font-style: inherit; font-variant: inherit; font-weight: bold; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-size: 14px; vertical-align: baseline; border: 0px;"&gt;&lt;span data-text="true" style="box-sizing: border-box; padding: 0px; margin: 0px; font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-size: 14px; vertical-align: baseline; border: 0px;"&gt;BELLE&lt;/span&gt;&lt;/span&gt;'
                                                              ><span
                                                                style="
                                                                  box-sizing: border-box;
                                                                  padding-top: 0px;
                                                                  padding-right: 0px;
                                                                  padding-bottom: 0px;
                                                                  padding-left: 0px;
                                                                  margin-top: 0px;
                                                                  margin-right: 0px;
                                                                  margin-bottom: 0px;
                                                                  margin-left: 0px;
                                                                  font-style: inherit;
                                                                  font-variant-ligatures: inherit;
                                                                  font-variant-caps: inherit;
                                                                  font-variant-numeric: inherit;
                                                                  font-variant-east-asian: inherit;
                                                                  font-variant-alternates: inherit;
                                                                  font-variant-position: inherit;
                                                                  font-weight: bold;
                                                                  font-stretch: inherit;
                                                                  line-height: inherit;
                                                                  font-family: inherit;
                                                                  font-optical-sizing: inherit;
                                                                  font-kerning: inherit;
                                                                  font-feature-settings: inherit;
                                                                  font-variation-settings: inherit;
                                                                  font-size: 14px;
                                                                  vertical-align: baseline;
                                                                  border-top-width: 0px;
                                                                  border-right-width: 0px;
                                                                  border-bottom-width: 0px;
                                                                  border-left-width: 0px;
                                                                  border-top-style: initial;
                                                                  border-right-style: initial;
                                                                  border-bottom-style: initial;
                                                                  border-left-style: initial;
                                                                  border-top-color: initial;
                                                                  border-right-color: initial;
                                                                  border-bottom-color: initial;
                                                                  border-left-color: initial;
                                                                  border-image-source: initial;
                                                                  border-image-slice: initial;
                                                                  border-image-width: initial;
                                                                  border-image-outset: initial;
                                                                  border-image-repeat: initial;
                                                                  text-align: left;
                                                                  color: #1188e6;
                                                                  letter-spacing: normal;
                                                                  orphans: 2;
                                                                  text-indent: 0px;
                                                                  text-transform: none;
                                                                  widows: 2;
                                                                  word-spacing: 0px;
                                                                  -webkit-text-stroke-width: 0px;
                                                                  white-space-collapse: preserve;
                                                                  text-wrap: wrap;
                                                                  background-color: rgb(
                                                                    255,
                                                                    255,
                                                                    255
                                                                  );
                                                                  text-decoration-thickness: initial;
                                                                  text-decoration-style: initial;
                                                                  text-decoration-color: initial;
                                                                  outline-color: initial;
                                                                  outline-style: none;
                                                                  outline-width: initial;
                                                                  text-decoration-line: none;
                                                                  transition-behavior: normal;
                                                                  transition-duration: 0.3s;
                                                                  transition-timing-function: ease;
                                                                  transition-delay: 0s;
                                                                  transition-property: color;
                                                                "
                                                                >AMA</span
                                                              ><span
                                                                style="
                                                                  font-size: 8px;
                                                                "
                                                              >
                                                              </span
                                                              ><span
                                                                style="
                                                                  box-sizing: border-box;
                                                                  padding-top: 0px;
                                                                  padding-right: 0px;
                                                                  padding-bottom: 0px;
                                                                  padding-left: 0px;
                                                                  margin-top: 0px;
                                                                  margin-right: 0px;
                                                                  margin-bottom: 0px;
                                                                  margin-left: 0px;
                                                                  font-style: inherit;
                                                                  font-variant-ligatures: inherit;
                                                                  font-variant-caps: inherit;
                                                                  font-variant-numeric: inherit;
                                                                  font-variant-east-asian: inherit;
                                                                  font-variant-alternates: inherit;
                                                                  font-variant-position: inherit;
                                                                  font-weight: bold;
                                                                  font-stretch: inherit;
                                                                  line-height: inherit;
                                                                  font-family: inherit;
                                                                  font-optical-sizing: inherit;
                                                                  font-kerning: inherit;
                                                                  font-feature-settings: inherit;
                                                                  font-variation-settings: inherit;
                                                                  font-size: 14px;
                                                                  vertical-align: baseline;
                                                                  border-top-width: 0px;
                                                                  border-right-width: 0px;
                                                                  border-bottom-width: 0px;
                                                                  border-left-width: 0px;
                                                                  border-top-style: initial;
                                                                  border-right-style: initial;
                                                                  border-bottom-style: initial;
                                                                  border-left-style: initial;
                                                                  border-top-color: initial;
                                                                  border-right-color: initial;
                                                                  border-bottom-color: initial;
                                                                  border-left-color: initial;
                                                                  border-image-source: initial;
                                                                  border-image-slice: initial;
                                                                  border-image-width: initial;
                                                                  border-image-outset: initial;
                                                                  border-image-repeat: initial;
                                                                  text-align: left;
                                                                  color: #1188e6;
                                                                  letter-spacing: normal;
                                                                  orphans: 2;
                                                                  text-indent: 0px;
                                                                  text-transform: none;
                                                                  widows: 2;
                                                                  word-spacing: 0px;
                                                                  -webkit-text-stroke-width: 0px;
                                                                  white-space-collapse: preserve;
                                                                  text-wrap: wrap;
                                                                  background-color: rgb(
                                                                    255,
                                                                    255,
                                                                    255
                                                                  );
                                                                  text-decoration-thickness: initial;
                                                                  text-decoration-style: initial;
                                                                  text-decoration-color: initial;
                                                                  outline-color: initial;
                                                                  outline-style: none;
                                                                  outline-width: initial;
                                                                  text-decoration-line: none;
                                                                  transition-behavior: normal;
                                                                  transition-duration: 0.3s;
                                                                  transition-timing-function: ease;
                                                                  transition-delay: 0s;
                                                                  transition-property: color;
                                                                "
                                                                >BELLE</span
                                                              ></a
                                                            >&nbsp;
                                                          </div>
                                                          <div></div>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                                <table
                                                  border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  class="module"
                                                  data-role="module-button"
                                                  data-type="button"
                                                  role="module"
                                                  style="table-layout: fixed"
                                                  width="100%"
                                                  data-muid="3c6b1ba6-7302-4e7f-a38f-337e93aa6fdf.1"
                                                >
                                                  <tbody>
                                                    <tr>
                                                      <td
                                                        align="center"
                                                        bgcolor=" #FFFFFFFFFFFFFFFFFFF"
                                                        class="outer-td"
                                                        style="
                                                          padding: 5px 30px 5px
                                                            30px;
                                                          background-color: #FFFFFFFFFFFFFFFFFFF;
                                                        "
                                                      >
                                                        <table
                                                          border="0"
                                                          cellpadding="0"
                                                          cellspacing="0"
                                                          class="wrapper-mobile"
                                                          style="
                                                            text-align: center;
                                                          "
                                                        >
                                                          <tbody>
                                                            <tr>
                                                              <td
                                                                align="center"
                                                                bgcolor="#0c0c0c"
                                                                class="inner-td"
                                                                style="
                                                                  border-radius: 6px;
                                                                  font-size: 16px;
                                                                  text-align: center;
                                                                  background-color: inherit;
                                                                "
                                                              >
                                                                <a
                                                                  href="https://api.whatsapp.com/send?phone=50370438848&text=%C2%A1Hola!%20Tengo%20una%20consulta"
                                                                  style="
                                                                    background-color: #0c0c0c;
                                                                    border: 2px
                                                                      solid
                                                                      #0c0c0c;
                                                                    border-color: #0c0c0c;
                                                                    border-radius: 4px;
                                                                    border-width: 2px;
                                                                    color: #fefdfd;
                                                                    display: inline-block;
                                                                    font-size: 12px;
                                                                    font-weight: normal;
                                                                    letter-spacing: 0px;
                                                                    line-height: normal;
                                                                    padding: 5px
                                                                      10px 5px
                                                                      10px;
                                                                    text-align: center;
                                                                    text-decoration: none;
                                                                    border-style: solid;
                                                                  "
                                                                  target="_blank"
                                                                  >Contact
                                                                  Support</a
                                                                >
                                                              </td>
                                                            </tr>
                                                          </tbody>
                                                        </table>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </table>
                          <!--[if mso]>
                                  </td>
                                </tr>
                              </table>
                            </center>
                            <![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    </center>
  </body>
</html>`,
      /*
      html: `
      <b>Haga click en el siguiente enlace o péguelo en su navegador para completar el proceso:</b>
      <a href="${verificactionLink}">${verificactionLink}</a>
      `, // html body
      */
    });
  } catch (error) {
    emailStatus = error;
    return res.status(400).send({
      message: "Existen un Problema en el Procesosasasas",
      error: emailStatus,
    });
  }

  res.send({ message, info: emailStatus });
  //res.send(verificactionLink);
};
const createNewPass = async (req, res) => {
  const { newPassword } = req.body;
  const resetToken = req.headers.reset;
  if (!(resetToken && newPassword)) {
    res.status(400).send({ message: "Todos los mensajes son requeridos" });
  }
  let jwtPayload;
  try {
    jwtPayload = await verifyTokenReset(resetToken);
    if (!jwtPayload) {
      return res
        .status(401)
        .send({ message: "El tiempo para realizar cambio ha expirado" });
    }
    const user = await clienteModel.findOne({
      where: { RESET_TOKEN: resetToken },
    });
    // realizamos cambio de password nuevo
    const PASSWORD = await encrypt(newPassword);

    const updatePassword = await clienteModel.update(
      {
        Password: PASSWORD,
      },
      { where: { E_Mail: user.E_Mail } }
    );

    res.send({ message: "Pasword se cambio con existo" });
  } catch (error) {
    return res.status(401).send({ message: "Algo no ha ido Bien" });
  }
};
const changePass = async (req, res) => {
  const cliente = req.cliente;
  const { oldPassword, newPassword } = req.body;
  if (!(oldPassword && newPassword)) {
    res.status(400).send({ message: "Antiguo y Nuevo Password son requerido" });
  }

  try {
    const dataCliente = await clienteModel.findOne({
      where: { CLIENTE: cliente.CLIENTE },
    });
    const encriptar = await compare(oldPassword, dataCliente.Password);
    if (!encriptar) {
      return res.status(401).send({ message: "Cheque el Password Antiguo" });
    }
    //procedemos a cambiar password nuevo
    const nuevoPassword = await encrypt(newPassword);

    const updateNewPassword = clienteModel.update(
      { Password: nuevoPassword },
      { where: { CLIENTE: cliente.CLIENTE } }
    );

    res.send({
      message: "Cambio de Clave con existo",
    });
  } catch (error) {
    res.status(400).send({ message: error });
  }
};
const activarCliente = async (req, res) => {
  const token = req.params.token;

  let jwtPayload;
  try {
    jwtPayload = await verifyToken(token);
    if (!jwtPayload) {
      return res
        .status(401)
        .send({ message: "El tiempo para realizar cambio ha expirado" });
    }
    const user = await clienteModel.update(
      { CONFIRN: 1 },
      {
        where: { CONFIRM_TOKEN: token },
      }
    );

    res.send({
      results: { message: "Se activo con existo su cuenta" },
      result: true,
      error: "",
    });
  } catch (error) {
    res.send({
      results: { messegae: "Existe un Error" },
      result: false,
      errors: error,
    });
  }
};
const generarCodigo = async (req, res) => {
  const email = req.body.email;
  //console.log(email);
  const cliente = await clienteModel.findAll({
    attributes: ["CLIENTE", "E_Mail", "NOMBRE", "CONFIRN"],

    where: {
      E_Mail: email,
    },
  });

  if (cliente.length == 0) {
    return res.send({
      results: { results: { mensage: "Cliente No existe" } },
      result: true,
      error: "",
    });
  }
  for (let i = 0; i < cliente.length; i++) {
    const element = cliente[i];
    if (element.CONFIRN == 0) {
      return res.send({
        results: { message: "Cuenta no esta Activa" },
        result: false,
        error: "",
      });
    }
    let code = "";
    for (let index = 0; index <= 5; index++) {
      let character = Math.ceil(Math.random() * 9);
      code += character;
    }
    const data = {
      CLIENTE: element.CLIENTE,
      NOMBRE: element.NOMBRE,
      EMAIL: email,
      CODE: code,
    };
    //Actualizamos al cliente con el codigo
    const tokenCode = await tokenLoginCode(data);
    const user = await clienteModel.update(
      { LOGIN_CODE: tokenCode },
      {
        where: { E_Mail: email },
      }
    );
    try {
      //Envio de eamil
      await transporter.sendMail({
        from: '"Soporte Ama Belle " <no-reply@ama-belle.com>', // sender address
        to: email, // list of receivers
        subject: "Su clave de acesso es :" + code, // Subject line
      
        html:`
        <html
  data-editor-version="2"
  class="sg-campaigns"
  xmlns="http://www.w3.org/1999/xhtml"
>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1"
    />
    <!--[if !mso]><!-->
    <meta http-equiv="X-UA-Compatible" content="IE=Edge" />
    <!--<![endif]-->
    <!--[if (gte mso 9)|(IE)]>
      <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG />
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    <![endif]-->
    <!--[if (gte mso 9)|(IE)]>
      <style type="text/css">
        body {
          width: 600px;
          margin: 0 auto;
        }
        table {
          border-collapse: collapse;
        }
        table,
        td {
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
        }
        img {
          -ms-interpolation-mode: bicubic;
        }
      </style>
    <![endif]-->
    <style type="text/css">
      body,
      p,
      div {
        font-family: inherit;
        font-size: 14px;
      }
      body {
        color: #000000;
      }
      body a {
        color: #1188e6;
        text-decoration: none;
      }
      p {
        margin: 0;
        padding: 0;
      }
      table.wrapper {
        width: 100% !important;
        table-layout: fixed;
        -webkit-font-smoothing: antialiased;
        -webkit-text-size-adjust: 100%;
        -moz-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      img.max-width {
        max-width: 100% !important;
      }
      .column.of-2 {
        width: 50%;
      }
      .column.of-3 {
        width: 33.333%;
      }
      .column.of-4 {
        width: 25%;
      }
      ul ul ul ul {
        list-style-type: disc !important;
      }
      ol ol {
        list-style-type: lower-roman !important;
      }
      ol ol ol {
        list-style-type: lower-latin !important;
      }
      ol ol ol ol {
        list-style-type: decimal !important;
      }
      @media screen and (max-width: 480px) {
        .preheader .rightColumnContent,
        .footer .rightColumnContent {
          text-align: left !important;
        }
        .preheader .rightColumnContent div,
        .preheader .rightColumnContent span,
        .footer .rightColumnContent div,
        .footer .rightColumnContent span {
          text-align: left !important;
        }
        .preheader .rightColumnContent,
        .preheader .leftColumnContent {
          font-size: 80% !important;
          padding: 5px 0;
        }
        table.wrapper-mobile {
          width: 100% !important;
          table-layout: fixed;
        }
        img.max-width {
          height: auto !important;
          max-width: 100% !important;
        }
        a.bulletproof-button {
          display: block !important;
          width: auto !important;
          font-size: 80%;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
        .columns {
          width: 100% !important;
        }
        .column {
          display: block !important;
          width: 100% !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }
        .social-icon-column {
          display: inline-block !important;
        }
      }
    </style>
    <!--user entered Head Start-->
    <link
      href="https://fonts.googleapis.com/css?family=Muli&display=swap"
      rel="stylesheet"
    />
    <style>
      body {
        font-family: "Muli", sans-serif;
      }
    </style>
    <!--End Head user entered-->
  </head>
  <body>
    <center
      class="wrapper"
      data-link-color="#1188E6"
      data-body-style="font-size:14px; font-family:inherit; color:#000000; background-color:#FFFFFF;"
    >
      <div class="webkit">
        <table
          cellpadding="0"
          cellspacing="0"
          border="0"
          width="100%"
          class="wrapper"
          bgcolor="#FFFFFF"
        >
          <tr>
            <td valign="top" bgcolor="#FFFFFF" width="100%">
              <table
                width="100%"
                role="content-container"
                class="outer"
                align="center"
                cellpadding="0"
                cellspacing="0"
                border="0"
              >
                <tr>
                  <td width="100%">
                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                    >
                      <tr>
                        <td>
                          <!--[if mso]>
    <center>
    <table><tr><td width="600">
  <![endif]-->
                          <table
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                            style="width: 100%; max-width: 600px"
                            align="center"
                          >
                            <tr>
                              <td
                                role="modules-container"
                                style="
                                  padding: 0px 0px 0px 0px;
                                  color: #000000;
                                  text-align: left;
                                "
                                bgcolor="#FFFFFF"
                                width="100%"
                                align="left"
                              >
                                <table
                                  class="module preheader preheader-hide"
                                  role="module"
                                  data-type="preheader"
                                  border="0"
                                  cellpadding="0"
                                  cellspacing="0"
                                  width="100%"
                                  style="
                                    display: none !important;
                                    mso-hide: all;
                                    visibility: hidden;
                                    opacity: 0;
                                    color: transparent;
                                    height: 0;
                                    width: 0;
                                  "
                                >
                                  <tr>
                                    <td role="module-content">
                                      <p></p>
                                    </td>
                                  </tr>
                                </table>
                                <table
                                  border="0"
                                  cellpadding="0"
                                  cellspacing="0"
                                  align="center"
                                  width="100%"
                                  role="module"
                                  data-type="columns"
                                  style="padding: 30px 20px 30px 20px"
                                  bgcolor="#fFFFFFFFFFFFFFFFF"
                                  data-distribution="1"
                                >
                                  <tbody>
                                    <tr role="module-content">
                                      <td height="100%" valign="top">
                                        <table
                                          width="540"
                                          style="
                                            width: 540px;
                                            border-spacing: 0;
                                            border-collapse: collapse;
                                            margin: 0px 10px 0px 10px;
                                          "
                                          cellpadding="0"
                                          cellspacing="0"
                                          align="left"
                                          border="0"
                                          bgcolor=""
                                          class="column column-0"
                                        >
                                          <tbody>
                                            <tr>
                                              <td
                                                style="
                                                  padding: 0px;
                                                  margin: 0px;
                                                  border-spacing: 0;
                                                "
                                              >
                                                <table
                                                  class="wrapper"
                                                  role="module"
                                                  data-type="image"
                                                  border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  width="100%"
                                                  style="table-layout: fixed"
                                                  data-muid="d8508015-a2cb-488c-9877-d46adf313282"
                                                >
                                                  <tbody>
                                                    <tr>
                                                      <td
                                                        style="
                                                          font-size: 6px;
                                                          line-height: 10px;
                                                          padding: 18px 0px 18px
                                                            0px;
                                                        "
                                                        valign="top"
                                                        align="center"
                                                      >
                                                        <a href="ama-belle.com"
                                                          ><img
                                                            class="max-width"
                                                            border="0"
                                                            style="
                                                              display: block;
                                                              color: #000000;
                                                              text-decoration: none;
                                                              font-family: Helvetica,
                                                                arial,
                                                                sans-serif;
                                                              font-size: 16px;
                                                              max-width: 100% !important;
                                                              width: 100%;
                                                              height: auto !important;
                                                            "
                                                            width="540"
                                                            alt=""
                                                            data-proportionally-constrained="true"
                                                            data-responsive="true"
                                                            src="https://bellmart.s3.amazonaws.com/ama-belle-logo-big.png"
                                                        /></a>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                                <table
                                                  class="module"
                                                  role="module"
                                                  data-type="text"
                                                  border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  width="100%"
                                                  style="table-layout: fixed"
                                                  data-muid="af2e984f-3bd4-4b6a-ab14-c1c1fad4301a"
                                                  data-mc-module-version="2019-10-22"
                                                >
                                                  <tbody>
                                                    <tr>
                                                      <td
                                                        style="
                                                          padding: 25px 0px 25px
                                                            0px;
                                                          line-height: 25px;
                                                          text-align: inherit;
                                                          background-color: #FFFFFFFFFFFFFFF;
                                                        "
                                                        height="100%"
                                                        valign="top"
                                                        bgcolor="#FFFFFFFFFFFFFFF"
                                                        role="module-content"
                                                      >
                                                        <div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: center;
                                                            "
                                                          >
                                                            &nbsp;<span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                font-size: 14px;
                                                              "
                                                              >¡Bienvenido a
                                                              AMA</span
                                                            ><span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                font-size: 8px;
                                                              "
                                                            >
                                                            </span
                                                            ><span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                font-size: 14px;
                                                              "
                                                              >BELLE</span
                                                            ><span
                                                              style="
                                                                box-sizing: border-box;
                                                                padding-top: 0px;
                                                                padding-right: 0px;
                                                                padding-bottom: 0px;
                                                                padding-left: 0px;
                                                                margin-top: 0px;
                                                                margin-right: 0px;
                                                                margin-bottom: 0px;
                                                                margin-left: 0px;
                                                                font-style: inherit;
                                                                font-variant-ligatures: inherit;
                                                                font-variant-caps: inherit;
                                                                font-variant-numeric: inherit;
                                                                font-variant-east-asian: inherit;
                                                                font-variant-alternates: inherit;
                                                                font-variant-position: inherit;
                                                                font-weight: inherit;
                                                                font-stretch: inherit;
                                                                line-height: inherit;
                                                                font-family: inherit;
                                                                font-optical-sizing: inherit;
                                                                font-kerning: inherit;
                                                                font-feature-settings: inherit;
                                                                font-variation-settings: inherit;
                                                                font-size: 14px;
                                                                vertical-align: baseline;
                                                                border-top-width: 0px;
                                                                border-right-width: 0px;
                                                                border-bottom-width: 0px;
                                                                border-left-width: 0px;
                                                                border-top-style: initial;
                                                                border-right-style: initial;
                                                                border-bottom-style: initial;
                                                                border-left-style: initial;
                                                                border-top-color: initial;
                                                                border-right-color: initial;
                                                                border-bottom-color: initial;
                                                                border-left-color: initial;
                                                                border-image-source: initial;
                                                                border-image-slice: initial;
                                                                border-image-width: initial;
                                                                border-image-outset: initial;
                                                                border-image-repeat: initial;
                                                                color: #000000;
                                                                letter-spacing: normal;
                                                                orphans: 2;
                                                                text-align: center;
                                                                text-indent: 0px;
                                                                text-transform: none;
                                                                widows: 2;
                                                                word-spacing: 0px;
                                                                -webkit-text-stroke-width: 0px;
                                                                white-space-collapse: preserve;
                                                                text-wrap: wrap;
                                                                background-color: rgb(
                                                                  246,
                                                                  246,
                                                                  246
                                                                );
                                                                text-decoration-thickness: initial;
                                                                text-decoration-style: initial;
                                                                text-decoration-color: initial;
                                                                overflow-wrap: break-word;
                                                              "
                                                              >!</span
                                                            >
                                                            &nbsp;<span
                                                              style="
                                                                overflow-wrap: break-word;
                                                              "
                                                              >&nbsp;</span
                                                            >
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: center;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                overflow-wrap: break-word;
                                                              "
                                                              ><strong
                                                                >“Where Beauty
                                                                meets
                                                                technology”</strong
                                                              ></span
                                                            ><strong>
                                                              &nbsp;</strong
                                                            >
                                                          </div>
                                                          <div></div>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                                <table
                                                  class="module"
                                                  role="module"
                                                  data-type="text"
                                                  border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  width="100%"
                                                  style="table-layout: fixed"
                                                  data-muid="8ea463eb-9361-4dda-8f06-3f95dd696b57"
                                                  data-mc-module-version="2019-10-22"
                                                >
                                                  <tbody>
                                                    <tr>
                                                      <td
                                                        style="
                                                          padding: 25px 20px
                                                            25px 20px;
                                                          line-height: 25px;
                                                          text-align: inherit;
                                                          background-color: #f6f6f6;
                                                        "
                                                        height="100%"
                                                        valign="top"
                                                        bgcolor="#F6F6F6"
                                                        role="module-content"
                                                      >
                                                        <div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: justify;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                overflow-wrap: break-word;
                                                              "
                                                              >Puedes acceder a tu cuenta en <span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                font-size: 14px;
                                                              "
                                                              >AMA</span
                                                            ><span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                font-size: 8px;
                                                              "
                                                            >
                                                            </span
                                                            ><span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                font-size: 14px;
                                                              "
                                                              >BELLE</span
                                                            > ingresando el siguiente código de acceso:</span
                                                            >
                                                            &nbsp;
                                                          </div>
                                                          <div></div>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                                <table
                                                  border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  class="module"
                                                  data-role="module-button"
                                                  data-type="button"
                                                  role="module"
                                                  style="table-layout: fixed"
                                                  width="100%"
                                                  data-muid="3c6b1ba6-7302-4e7f-a38f-337e93aa6fdf"
                                                >
                                                  <tbody>
                                                    <tr>
                                                      <td
                                                        align="center"
                                                        bgcolor="#F6F6F6"
                                                        class="outer-td"
                                                        style="
                                                          padding: 0px 0px 0px
                                                            0px;
                                                          background-color: #f6f6f6;
                                                        "
                                                      >
                                                        <table
                                                          border="0"
                                                          cellpadding="0"
                                                          cellspacing="0"
                                                          class="wrapper-mobile"
                                                          style="
                                                            text-align: center;
                                                          "
                                                        >
                                                          <tbody>
                                                            <tr>
                                                              <td
                                                                align="center"
                                                                bgcolor="#FE8C4E"
                                                                class="inner-td"
                                                                style="
                                                                  border-radius: 6px;
                                                                  font-size: 16px;
                                                                  text-align: center;
                                                                  background-color: inherit;
                                                                "
                                                              >
                                                                <h1 style="color: #fe8c4e;font-size: 58px;font-weight: bold;">${code}</h1>
                                                              </td>
                                                            </tr>
                                                          </tbody>
                                                        </table>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                                <table
                                                  class="module"
                                                  role="module"
                                                  data-type="text"
                                                  border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  width="100%"
                                                  style="table-layout: fixed"
                                                  data-muid="8ea463eb-9361-4dda-8f06-3f95dd696b57.1"
                                                  data-mc-module-version="2019-10-22"
                                                >
                                                  <tbody>
                                                    <tr>
                                                      <td
                                                        style="
                                                          padding: 25px 20px
                                                            25px 20px;
                                                          line-height: 17px;
                                                          text-align: inherit;
                                                          background-color: #f6f6f6;
                                                        "
                                                        height="100%"
                                                        valign="top"
                                                        bgcolor="#F6F6F6"
                                                        role="module-content"
                                                      >
                                                        <div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: justify;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                line-height: 107%;
                                                                font-family: inherit;
                                                                font-size: 14px;
                                                              "
                                                              >Regresa a la página de inicio de sesión e ingresa el código para confirmar tu identidad.</span
                                                            ><span
                                                              style="
                                                                font-family: inherit;
                                                                font-size: 14px;
                                                              "
                                                            >
                                                              &nbsp;</span
                                                            >
                                                          </div>
                                                          <div></div>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                                <table
                                                  class="module"
                                                  role="module"
                                                  data-type="text"
                                                  border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  width="100%"
                                                  style="table-layout: fixed"
                                                  data-muid="a265ebb9-ab9c-43e8-9009-54d6151b1600"
                                                  data-mc-module-version="2019-10-22"
                                                >
                                                  <tbody>
                                                    <tr>
                                                      <td
                                                        style="
                                                          padding: 30px 20px
                                                            20px 20px;
                                                          line-height: 19px;
                                                          text-align: inherit;
                                                          background-color: #FFFFFFFFFFFFFFFFFFF;
                                                        "
                                                        height="100%"
                                                        valign="top"
                                                        bgcolor="#FFFFFFFFFFFFFFFFFFF"
                                                        role="module-content"
                                                      >
                                                        <div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: center;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                font-family: inherit;
                                                                color: #0a0a0a;
                                                                font-size: 18px;
                                                              "
                                                              ><strong
                                                                >¡Agradecemos
                                                                &nbsp;tu&nbsp;</strong
                                                              ></span
                                                            >
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: center;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                font-family: inherit;
                                                                color: #0a0a0a;
                                                                font-size: 18px;
                                                              "
                                                              ><strong
                                                                >confianza en
                                                                nosotros!</strong
                                                              ></span
                                                            >
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: justify;
                                                            "
                                                          >
                                                            <br />
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: justify;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                font-size: 14px;
                                                                font-family: inherit;
                                                                color: #0a0a0a;
                                                              "
                                                              >Gracias por ser
                                                              parte de la
                                                              transformación
                                                              digital más grande
                                                              de productos de
                                                              belleza y cuidado
                                                              personal en El
                                                              Salvador.</span
                                                            >
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: justify;
                                                            "
                                                          >
                                                            <br />
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: justify;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                font-size: 14px;
                                                                font-family: inherit;
                                                                color: #0a0a0a;
                                                              "
                                                              >Esperamos que
                                                              disfrutes de una
                                                              experiencia de
                                                              compra excepcional
                                                              y que encuentres
                                                              los productos de
                                                              belleza que estás
                                                              buscando.&nbsp;</span
                                                            >
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: justify;
                                                            "
                                                          >
                                                            <br />
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: justify;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                line-height: 107%;
                                                                font-size: 14px;
                                                                font-family: inherit;
                                                                color: #0a0a0a;
                                                              "
                                                              >Si tienes alguna
                                                              pregunta o
                                                              necesitas ayuda,
                                                              no dudes en
                                                              ponerte en
                                                              contacto con
                                                              nuestro equipo de
                                                              soporte.&nbsp;</span
                                                            >
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: justify;
                                                            "
                                                          >
                                                            <br />
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: left;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                font-size: 14px;
                                                                font-family: inherit;
                                                                color: #0a0a0a;
                                                              "
                                                              >¡</span
                                                            ><span
                                                              style="
                                                                overflow-wrap: break-word;
                                                                font-family: inherit;
                                                                color: #0a0a0a;
                                                                font-size: 14px;
                                                              "
                                                              >Estamos aquí para
                                                              lo que necesites!</span
                                                            >
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: left;
                                                            "
                                                          >
                                                            <br />
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: left;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                box-sizing: border-box;
                                                                padding-top: 0px;
                                                                padding-right: 0px;
                                                                padding-bottom: 0px;
                                                                padding-left: 0px;
                                                                margin-top: 0px;
                                                                margin-right: 0px;
                                                                margin-bottom: 0px;
                                                                margin-left: 0px;
                                                                font-style: inherit;
                                                                font-variant-ligatures: inherit;
                                                                font-variant-caps: inherit;
                                                                font-variant-numeric: inherit;
                                                                font-variant-east-asian: inherit;
                                                                font-variant-alternates: inherit;
                                                                font-variant-position: inherit;
                                                                font-weight: inherit;
                                                                font-stretch: inherit;
                                                                line-height: inherit;
                                                                font-family: inherit;
                                                                font-optical-sizing: inherit;
                                                                font-kerning: inherit;
                                                                font-feature-settings: inherit;
                                                                font-variation-settings: inherit;
                                                                font-size: 14px;
                                                                vertical-align: baseline;
                                                                border-top-width: 0px;
                                                                border-right-width: 0px;
                                                                border-bottom-width: 0px;
                                                                border-left-width: 0px;
                                                                border-top-style: initial;
                                                                border-right-style: initial;
                                                                border-bottom-style: initial;
                                                                border-left-style: initial;
                                                                border-top-color: initial;
                                                                border-right-color: initial;
                                                                border-bottom-color: initial;
                                                                border-left-color: initial;
                                                                border-image-source: initial;
                                                                border-image-slice: initial;
                                                                border-image-width: initial;
                                                                border-image-outset: initial;
                                                                border-image-repeat: initial;
                                                                text-align: left;
                                                                color: #000000;
                                                                letter-spacing: normal;
                                                                orphans: 2;
                                                                text-indent: 0px;
                                                                text-transform: none;
                                                                widows: 2;
                                                                word-spacing: 0px;
                                                                -webkit-text-stroke-width: 0px;
                                                                white-space-collapse: preserve;
                                                                text-wrap: wrap;
                                                                background-color: rgb(
                                                                  255,
                                                                  255,
                                                                  255
                                                                );
                                                                text-decoration-thickness: initial;
                                                                text-decoration-style: initial;
                                                                text-decoration-color: initial;
                                                              "
                                                              >Saludos cordiales,&nbsp;</span
                                                            >
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: left;
                                                            "
                                                          >
                                                            <span
                                                              style="
                                                                box-sizing: border-box;
                                                                padding-top: 0px;
                                                                padding-right: 0px;
                                                                padding-bottom: 0px;
                                                                padding-left: 0px;
                                                                margin-top: 0px;
                                                                margin-right: 0px;
                                                                margin-bottom: 0px;
                                                                margin-left: 0px;
                                                                font-style: inherit;
                                                                font-variant-ligatures: inherit;
                                                                font-variant-caps: inherit;
                                                                font-variant-numeric: inherit;
                                                                font-variant-east-asian: inherit;
                                                                font-variant-alternates: inherit;
                                                                font-variant-position: inherit;
                                                                font-weight: inherit;
                                                                font-stretch: inherit;
                                                                line-height: inherit;
                                                                font-family: inherit;
                                                                font-optical-sizing: inherit;
                                                                font-kerning: inherit;
                                                                font-feature-settings: inherit;
                                                                font-variation-settings: inherit;
                                                                font-size: 14px;
                                                                vertical-align: baseline;
                                                                border-top-width: 0px;
                                                                border-right-width: 0px;
                                                                border-bottom-width: 0px;
                                                                border-left-width: 0px;
                                                                border-top-style: initial;
                                                                border-right-style: initial;
                                                                border-bottom-style: initial;
                                                                border-left-style: initial;
                                                                border-top-color: initial;
                                                                border-right-color: initial;
                                                                border-bottom-color: initial;
                                                                border-left-color: initial;
                                                                border-image-source: initial;
                                                                border-image-slice: initial;
                                                                border-image-width: initial;
                                                                border-image-outset: initial;
                                                                border-image-repeat: initial;
                                                                text-align: left;
                                                                color: #000000;
                                                                letter-spacing: normal;
                                                                orphans: 2;
                                                                text-indent: 0px;
                                                                text-transform: none;
                                                                widows: 2;
                                                                word-spacing: 0px;
                                                                -webkit-text-stroke-width: 0px;
                                                                white-space-collapse: preserve;
                                                                text-wrap: wrap;
                                                                background-color: rgb(
                                                                  255,
                                                                  255,
                                                                  255
                                                                );
                                                                text-decoration-thickness: initial;
                                                                text-decoration-style: initial;
                                                                text-decoration-color: initial;
                                                              "
                                                              >Tu equipo</span
                                                            >&nbsp;
                                                          </div>
                                                          <div
                                                            style="
                                                              font-family: inherit;
                                                              text-align: left;
                                                            "
                                                          >
                                                            <a
                                                              href=""
                                                              title='&lt;span data-offset-key="ditug-0-0" style="box-sizing: border-box; padding: 0px; margin: 0px; font-style: inherit; font-variant: inherit; font-weight: bold; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-size: 14px; vertical-align: baseline; border: 0px;"&gt;&lt;span data-text="true" style="box-sizing: border-box; padding: 0px; margin: 0px; font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-size: 14px; vertical-align: baseline; border: 0px;"&gt;AMA&lt;/span&gt;&lt;/span&gt;&lt;span data-offset-key="ditug-0-1" style="box-sizing: border-box; padding: 0px; margin: 0px; font-style: inherit; font-variant: inherit; font-weight: bold; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-size: 14px; vertical-align: baseline; border: 0px;"&gt;&lt;span data-text="true" style="box-sizing: border-box; padding: 0px; margin: 0px; font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-size: 14px; vertical-align: baseline; border: 0px;"&gt; &lt;/span&gt;&lt;/span&gt;&lt;span data-offset-key="ditug-0-2" style="box-sizing: border-box; padding: 0px; margin: 0px; font-style: inherit; font-variant: inherit; font-weight: bold; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-size: 14px; vertical-align: baseline; border: 0px;"&gt;&lt;span data-text="true" style="box-sizing: border-box; padding: 0px; margin: 0px; font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-size: 14px; vertical-align: baseline; border: 0px;"&gt;BELLE&lt;/span&gt;&lt;/span&gt;'
                                                              ><span
                                                                style="
                                                                  box-sizing: border-box;
                                                                  padding-top: 0px;
                                                                  padding-right: 0px;
                                                                  padding-bottom: 0px;
                                                                  padding-left: 0px;
                                                                  margin-top: 0px;
                                                                  margin-right: 0px;
                                                                  margin-bottom: 0px;
                                                                  margin-left: 0px;
                                                                  font-style: inherit;
                                                                  font-variant-ligatures: inherit;
                                                                  font-variant-caps: inherit;
                                                                  font-variant-numeric: inherit;
                                                                  font-variant-east-asian: inherit;
                                                                  font-variant-alternates: inherit;
                                                                  font-variant-position: inherit;
                                                                  font-weight: bold;
                                                                  font-stretch: inherit;
                                                                  line-height: inherit;
                                                                  font-family: inherit;
                                                                  font-optical-sizing: inherit;
                                                                  font-kerning: inherit;
                                                                  font-feature-settings: inherit;
                                                                  font-variation-settings: inherit;
                                                                  font-size: 14px;
                                                                  vertical-align: baseline;
                                                                  border-top-width: 0px;
                                                                  border-right-width: 0px;
                                                                  border-bottom-width: 0px;
                                                                  border-left-width: 0px;
                                                                  border-top-style: initial;
                                                                  border-right-style: initial;
                                                                  border-bottom-style: initial;
                                                                  border-left-style: initial;
                                                                  border-top-color: initial;
                                                                  border-right-color: initial;
                                                                  border-bottom-color: initial;
                                                                  border-left-color: initial;
                                                                  border-image-source: initial;
                                                                  border-image-slice: initial;
                                                                  border-image-width: initial;
                                                                  border-image-outset: initial;
                                                                  border-image-repeat: initial;
                                                                  text-align: left;
                                                                  color: #1188e6;
                                                                  letter-spacing: normal;
                                                                  orphans: 2;
                                                                  text-indent: 0px;
                                                                  text-transform: none;
                                                                  widows: 2;
                                                                  word-spacing: 0px;
                                                                  -webkit-text-stroke-width: 0px;
                                                                  white-space-collapse: preserve;
                                                                  text-wrap: wrap;
                                                                  background-color: rgb(
                                                                    255,
                                                                    255,
                                                                    255
                                                                  );
                                                                  text-decoration-thickness: initial;
                                                                  text-decoration-style: initial;
                                                                  text-decoration-color: initial;
                                                                  outline-color: initial;
                                                                  outline-style: none;
                                                                  outline-width: initial;
                                                                  text-decoration-line: none;
                                                                  transition-behavior: normal;
                                                                  transition-duration: 0.3s;
                                                                  transition-timing-function: ease;
                                                                  transition-delay: 0s;
                                                                  transition-property: color;
                                                                "
                                                                >AMA</span
                                                              ><span
                                                                style="
                                                                  font-size: 8px;
                                                                "
                                                              >
                                                              </span
                                                              ><span
                                                                style="
                                                                  box-sizing: border-box;
                                                                  padding-top: 0px;
                                                                  padding-right: 0px;
                                                                  padding-bottom: 0px;
                                                                  padding-left: 0px;
                                                                  margin-top: 0px;
                                                                  margin-right: 0px;
                                                                  margin-bottom: 0px;
                                                                  margin-left: 0px;
                                                                  font-style: inherit;
                                                                  font-variant-ligatures: inherit;
                                                                  font-variant-caps: inherit;
                                                                  font-variant-numeric: inherit;
                                                                  font-variant-east-asian: inherit;
                                                                  font-variant-alternates: inherit;
                                                                  font-variant-position: inherit;
                                                                  font-weight: bold;
                                                                  font-stretch: inherit;
                                                                  line-height: inherit;
                                                                  font-family: inherit;
                                                                  font-optical-sizing: inherit;
                                                                  font-kerning: inherit;
                                                                  font-feature-settings: inherit;
                                                                  font-variation-settings: inherit;
                                                                  font-size: 14px;
                                                                  vertical-align: baseline;
                                                                  border-top-width: 0px;
                                                                  border-right-width: 0px;
                                                                  border-bottom-width: 0px;
                                                                  border-left-width: 0px;
                                                                  border-top-style: initial;
                                                                  border-right-style: initial;
                                                                  border-bottom-style: initial;
                                                                  border-left-style: initial;
                                                                  border-top-color: initial;
                                                                  border-right-color: initial;
                                                                  border-bottom-color: initial;
                                                                  border-left-color: initial;
                                                                  border-image-source: initial;
                                                                  border-image-slice: initial;
                                                                  border-image-width: initial;
                                                                  border-image-outset: initial;
                                                                  border-image-repeat: initial;
                                                                  text-align: left;
                                                                  color: #1188e6;
                                                                  letter-spacing: normal;
                                                                  orphans: 2;
                                                                  text-indent: 0px;
                                                                  text-transform: none;
                                                                  widows: 2;
                                                                  word-spacing: 0px;
                                                                  -webkit-text-stroke-width: 0px;
                                                                  white-space-collapse: preserve;
                                                                  text-wrap: wrap;
                                                                  background-color: rgb(
                                                                    255,
                                                                    255,
                                                                    255
                                                                  );
                                                                  text-decoration-thickness: initial;
                                                                  text-decoration-style: initial;
                                                                  text-decoration-color: initial;
                                                                  outline-color: initial;
                                                                  outline-style: none;
                                                                  outline-width: initial;
                                                                  text-decoration-line: none;
                                                                  transition-behavior: normal;
                                                                  transition-duration: 0.3s;
                                                                  transition-timing-function: ease;
                                                                  transition-delay: 0s;
                                                                  transition-property: color;
                                                                "
                                                                >BELLE</span
                                                              ></a
                                                            >&nbsp;
                                                          </div>
                                                          <div></div>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                                <table
                                                  border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  class="module"
                                                  data-role="module-button"
                                                  data-type="button"
                                                  role="module"
                                                  style="table-layout: fixed"
                                                  width="100%"
                                                  data-muid="3c6b1ba6-7302-4e7f-a38f-337e93aa6fdf.1"
                                                >
                                                  <tbody>
                                                    <tr>
                                                      <td
                                                        align="center"
                                                        bgcolor=" #FFFFFFFFFFFFFFFFFFF"
                                                        class="outer-td"
                                                        style="
                                                          padding: 5px 30px 5px
                                                            30px;
                                                          background-color: #FFFFFFFFFFFFFFFFFFF;
                                                        "
                                                      >
                                                        <table
                                                          border="0"
                                                          cellpadding="0"
                                                          cellspacing="0"
                                                          class="wrapper-mobile"
                                                          style="
                                                            text-align: center;
                                                          "
                                                        >
                                                          <tbody>
                                                            <tr>
                                                              <td
                                                                align="center"
                                                                bgcolor="#0c0c0c"
                                                                class="inner-td"
                                                                style="
                                                                  border-radius: 6px;
                                                                  font-size: 16px;
                                                                  text-align: center;
                                                                  background-color: inherit;
                                                                "
                                                              >
                                                                <a
                                                                  href="https://api.whatsapp.com/send?phone=50370438848&text=%C2%A1Hola!%20Tengo%20una%20consulta"
                                                                  style="
                                                                    background-color: #0c0c0c;
                                                                    border: 2px
                                                                      solid
                                                                      #0c0c0c;
                                                                    border-color: #0c0c0c;
                                                                    border-radius: 4px;
                                                                    border-width: 2px;
                                                                    color: #fefdfd;
                                                                    display: inline-block;
                                                                    font-size: 12px;
                                                                    font-weight: normal;
                                                                    letter-spacing: 0px;
                                                                    line-height: normal;
                                                                    padding: 5px
                                                                      10px 5px
                                                                      10px;
                                                                    text-align: center;
                                                                    text-decoration: none;
                                                                    border-style: solid;
                                                                  "
                                                                  target="_blank"
                                                                  >Contact
                                                                  Support</a
                                                                >
                                                              </td>
                                                            </tr>
                                                          </tbody>
                                                        </table>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </table>
                          <!--[if mso]>
                                  </td>
                                </tr>
                              </table>
                            </center>
                            <![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    </center>
  </body>
</html> `,
      
      
      /*
        html: `
      <div style="box-sizing:border-box;width:100%;height:100%;margin:0;padding:0;background:#f1f1f1!important;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"> 
      <table align="center" bgcolor="#ffffff" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;max-width:650px;border:1px solid #eaeaea;table-layout:auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"> 
      <tbody>
      <tr>
        <td align="center" bgcolor="#ff8f80" height="20" style="height:10px"></td>
      </tr>
      <tr>
        <td align="center" bgcolor="#ff8f80" height="20" style="height:10px"></td>
      </tr>
      <tr>
      <td>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"> 
        <tbody>
          <tr> 
            <td align="center"> 
              <img style="width:38%;text-align:center;margin-top:5%" src="https://ci5.googleusercontent.com/proxy/1aQi4kAtK63mfetU-gw61kIbn36Eg9u-9H8iYXaTpieZG2WK4xJDQVu0XCVfvjUVuwGjDObz0q3gEfLQdi5HDLOvk76X75Mw-w=s0-d-e1-ft#https://xclaim.vtexassets.com/arquivos/logo_xclaim.png" alt="XCLAIM" class="CToWUd a6T" data-bit="iit" tabindex="0">
                <div class="a6S" dir="ltr" style="opacity: 0.01; left: 613.538px; top: 121.5px;"><div id=":30x" class="T-I J-J5-Ji aQv T-I-ax7 L3 a5q" role="button" tabindex="0" aria-label="Descargar el archivo adjunto " jslog="91252; u014N:cOuCgd,Kr2w4b,xr6bB; 4:WyIjbXNnLWY6MTc3OTYwMjA5NDg3NTE1NDQ0OCIsbnVsbCxbXSxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxbXSxbXSxbXV0." data-tooltip-class="a1V" jsaction="JIbuQc:.CLIENT" data-tooltip="Descargar">
                  <div class="akn"><div class="aSK J-J5-Ji aYr"></div>
                </div>
                </div>
                </div> 
            </td> 
          </tr>
        </tbody>
      </table>
    </td>
    </tr>
    <tr>
      <td align="center">
      <table cellspacing="0" style="border-collapse:collapse;width:100%;color:#333333"> 
        <tbody>
          <tr> 
            <td style="height:90px;padding:0px 20px"> 
              <p style="font-size:24px;font-weight:600;padding-top:43px;color:#1f1f1f;text-align:center">¡Hola, ${element.NOMBRE}!</p> 
              <p style="font-size:22px;font-weight:600;padding-top:0px;color:#1f1f1f;text-align:center">Su clave de acceso es:</p> 
              <p style="font-size:51px;font-weight:600;padding-top:30px;padding-bottom:30px;color:#ff8f80;text-align:center">${code}</p> 
              <p style="color:#969696;text-align:center">Regrese a la página de login e ingrese el código de arriba para confirmar su identidad.</p> 
              <p style="color:#969696;text-align:center;font-weight:bold">Atentamente Equipo BELLMART</p> 
            </td> 
          </tr> 
        </tbody>
      </table>
      </td>
    </tr>
    <tr> 
      <td bgcolor="#FFFFFF" style="box-sizing:border-box;padding:0px 15px 15px 15px"> </td> 
    </tr>
    <tr align="right" style="text-align:right">
    <td align="right" bgcolor="#ffffff" height="10" style="padding:5px 10px 5px 0;background:#fff"> 
  
    <table border="0" cellpadding="0" cellspacing="0" style="font-size:12px" width="90%"> 
      <tbody>
        <tr>
          <td>
            <span style="text-align:right;margin-right:4px"> <a href="https://www.facebook.com/Xclaim" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.facebook.com/Xclaim&amp;source=gmail&amp;ust=1697295762917000&amp;usg=AOvVaw2LfY2ixLfF9RJYeUUT9zE8"> 
            <img style="width:4%;text-align:center" src="https://ci4.googleusercontent.com/proxy/1na_zVBv3gGE55W3Gfwm9YZVh3bRtOgoyBVrDwQZxeuB-rNPZb3QPzCCplHxwpYmROrJZfxSENnp8EoYigLVV7r88Bq-fqhwWTiYJJ0d1zNeXx43KpZ1MWJB6pmNbH3sz_ZfJukQ4lXLWgPMqjwGxSSe721e_u7CGGxwOPVmBCTzrSMv=s0-d-e1-ft#https://xclaim.vtexassets.com/assets/vtex/assets-builder/xclaim.store-theme/0.2.3/facebook___2962483%E2%80%A6.png" alt="Xclaim" class="CToWUd" data-bit="iit"></a> </span> 
            <span style="text-align:right;margin-right:4px"> <a href="https://www.instagram.com/xclaimsv/" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.instagram.com/xclaimsv/&amp;source=gmail&amp;ust=1697295762917000&amp;usg=AOvVaw094Ziyeo5uBuX9mDwIhLxu">
            <img style="width:4%;text-align:center" src="https://ci3.googleusercontent.com/proxy/fn__xxCnQHFdDcTjf5XEjBeVY4pAWXmK3UcIfhfo6NTg-fJxSzkNkXCP8UCL_zQh0R__gA3Cr_2O7tu5C6-eA0I4frZTdNM_89lMnVREn0ynLUybJCG57A97x093sYPcDvs4FLrsi30bqhFlm_H_RuZiHkfk0UQhJwzIymYfXYB0QrH1zIOaS14oQjiIqWDRdKa3cTOu=s0-d-e1-ft#https://xclaim.vtexassets.com/assets/vtex/assets-builder/xclaim.store-theme/0.2.3/instagram___9dee60236a2bbfca7c85f1b8c6ff820c.png" alt="Xclaim" class="CToWUd" data-bit="iit"></a> 
            </span> 
          </td>
        </tr>
      </tbody>
    </table> 
    </td> 
  </tr>
  <tr> 
    <td align="center" bgcolor="#ff8f80" height="20" style="height:20px"></td> 
  </tr>
  </tbody>
  </table>
  </div>       
      `, // html body
      */
      });
    } catch (error) {
      emailStatus = error;
      return res.status(400).send({
        results: {
          results: { message: "Existe un problema en el proceso" },
          error: emailStatus,
        },
        result: false,
        error: emailStatus,
      });
    }

    res.send({
      results: { results: { message: "Codigo se envio con exito" } },
      result: true,
      error: "",
    });
  }
  //generarmos el codigo aletorio de 6
};
const validarCode = async (req, res) => {
  const code = req.body.codigo;

  const email = req.body.email;
  console.log("codigo", code);
  //Consultamos el Token del codigo si esta activo aun
  const cliente = await clienteModel.findAll({
    attributes: ["CLIENTE", "E_Mail", "NOMBRE", "CONFIRN", "LOGIN_CODE"],

    where: {
      E_Mail: email,
    },
  });

  if (cliente.length == 0) {
    return res.send({
      results: { results: { mensage: "Cliente No existe" } },
      result: true,
      error: "",
    });
  }
  for (let i = 0; i < cliente.length; i++) {
    const element = cliente[i];
    if (element.CONFIRN == 0) {
      return res.send({
        results: { message: "Cuenta no esta Activa" },
        result: false,
        error: "",
      });
    }
    //vemos si el token esta activo aun
    let jwtPayload;

    jwtPayload = await verifyToken(element.LOGIN_CODE);
    const codeToken = jwtPayload.code;
    if (!jwtPayload) {
      return res.status(401).send({
        results: { message: "El token se se vencio" },
        result: false,
        error: "",
      });
    }

    //Comparamos

    if (code === codeToken) {
      //consultamos el cliente para llenar el token que se el envia
      const cliente = await clienteModel.findAll({
        attributes: [
          "CLIENTE",
          "NOMBRE",
          "CONTRIBUYENTE",
          "RUBRO1_CLI",
          "RUBRO2_CLI",
          "Rol",
          "Password",
          "Nivel_Precio",
          "Direccion",
          "E_Mail",
          "CONFIRN",
          "NOMBRES",
          "APELLIDOS",
          "RUBRO3_CLI",
          "RUBRO4_CLI",
          "RUBRO5_CLI",
          "RECIBIR_BOLETIN",
          "TELEFONO1",
        ],
        where: {
          E_Mail: email,
        },
      });

      nuevo = JSON.stringify(cliente[0]);
      nuevo = JSON.parse(nuevo);

      const data = {
        token: await tokenSign(nuevo),
        cliente: nuevo,
      };

      return res.send({
        data,
        result: true,
        error: "",
      });
    } else {
      return res.send({
        results: { message: "Codigo No es igual a registrado" },
        result: false,
        error: "",
      });
    }
  }

  res.send({
    results: code,
    result: true,
    error: "",
  });
};
const editarCliente = async (req, res) => {
  try {
    const nombres = req.body.nombres;
    const apellidos = req.body.apellidos;
    const documento = req.body.documento;
    const genero = req.body.genero;
    const fechaNacimineto = req.body.fechaNacimineto;
    const recibirboletin = req.body.recibirboletin;
    const telefono = req.body.telefono;
    const cliente = req.cliente;
    const codigo = req.cliente.CLIENTE;
    const nombre = req.body.nombres + " " + req.body.apellidos;

    const actu = await clienteModel.update(
      {
        NOMBRES: nombres,
        APELLIDOS: apellidos,
        RUBRO3_CLI: documento,
        RUBRO4_CLI: genero,
        RUBRO5_CLI: fechaNacimineto,
        RECIBIR_BOLETIN: recibirboletin,
        NOMBRE: nombre,
        TELEFONO1: telefono,
      },
      { where: { CLIENTE: codigo } }
    );

    res.send({
      results: actu,
      result: true,
      error: "",
    });
  } catch (error) {
    res.send({
      results: error,
      result: false,
      error: error,
    });
  }
};
const editarClienteJuridico = async (req, res) => {
  try {
    const nombre = req.body.nombreCop;
    const nombreCom = req.body.nombreCom;
    const documento = req.body.documentoCopr;
    const telefono = req.body.telefonoCopr;
    const cliente = req.cliente;
    const codigo = req.cliente.CLIENTE;

    const actu = await clienteModel.update(
      {
        NOMBRE: nombre,
        ALIAS: nombreCom,
        RUBRO3_CLI: documento,
        NOMBRE: nombre,
        TELEFONO1: telefono,
      },
      { where: { CLIENTE: codigo } }
    );

    res.send({
      results: actu,
      result: true,
      error: "",
    });
  } catch (error) {
    res.send({
      results: error,
      result: false,
      error: error,
    });
  }
};
const dirClienteNew = async (req, res) => {};
const dirClienteUpdate = async (req, res) => {};
module.exports = {
  registerCtrl,
  loginCtrl,
  loginCodigo,
  forgotPassword,
  createNewPass,
  changePass,
  activarCliente,
  generarCodigo,
  validarCode,
  editarCliente,
  editarClienteJuridico,
  dirClienteNew,
  dirClienteUpdate,
};
