// Cargar dotenv al inicio, antes de cualquier otro import
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

// La configuración guardada desde /api/admin tiene prioridad sobre el .env
require("./services/empresa-config.service").cargar();

// Verificar que se cargó correctamente
console.log("Variables de entorno cargadas:");
console.log("AFIP_MODE:", process.env.AFIP_MODE);
console.log("AFIP_CUIT:", process.env.AFIP_CUIT);

const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const dotenv = require("dotenv");
const path = require("path");

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3301;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api", routes);

// Ruta básica para verificar que el servidor está funcionando
app.get("/", (req, res) => {
  res.send("API de AFIP funcionando");
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor API ejecutándose en puerto ${PORT}`);
  console.log(`Modo: ${process.env.AFIP_MODE || "testing"}`);
});

module.exports = app;
