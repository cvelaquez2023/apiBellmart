const express = require("express");
const router = express.Router();

const {
  validatorRegisterItem,
  validatorLogin,
  validatorLoginCodigo,
} = require("../validators/auth");

const {
  loginCtrl,
  registerCtrl,
  forgotPassword,
  createNewPass,
  changePass,
  activarCliente,
  generarCodigo,
  validarCode,
  editarCliente,
  dirClienteNew,
  dirClienteUpdate,
  editarClienteJuridico,
} = require("../controllers/auth");
const authMiddleware = require("../middleware/session");
const checkRol = require("../middleware/rol");
//Crear Clientes
router.post("/register", validatorRegisterItem, registerCtrl);
//Activar Cuentas
router.post("/email-confirm/:token", activarCliente);
//Generar Codigo
router.post("/codigo", generarCodigo);
//Validar Code
router.post("/validarCode", validarCode);
//Login contraseña
router.post("/login", validatorLogin, loginCtrl);
//Login Codigo
router.post("/loginCodigo", validatorLoginCodigo, loginCtrl);

//Recuperar Contraseña
router.put("/forgot-password", forgotPassword);
//Nueva contraseña
router.put("/new-password", createNewPass);
router.post(
  "/change-password",
  authMiddleware,
  checkRol(["User", "Admin"]),
  changePass
);
// editar datos el cliente
router.put(
  "/editar",
  authMiddleware,
  checkRol(["User", "Admin"]),
  editarCliente
);
// editar datos el cliente cOPR
router.put(
  "/editarJur",
  authMiddleware,
  checkRol(["User", "Admin"]),
  editarClienteJuridico
);

router.post("/direcionNew", dirClienteNew);
router.put("/direcionUpdate", dirClienteUpdate);
module.exports = router;
