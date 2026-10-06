const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const mysql = require("mysql2/promise");
const { requireAdminKey } = require("../middleware/admin.middleware");
const empresaConfig = require("../services/empresa-config.service");
const SecureCertificateService = require("../services/secure-certificate.service");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024, files: 2 },
}).fields([
  { name: "certificado", maxCount: 1 },
  { name: "key", maxCount: 1 },
]);

const recibirArchivos = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: `Error en archivos: ${err.message}` });
    }
    next();
  });
};

class ErrorValidacion extends Error {}

let secureCerts;
const getSecureCerts = () => {
  if (!secureCerts) secureCerts = new SecureCertificateService();
  return secureCerts;
};

const empresaDesdeEnv = () => ({
  cuit: process.env.EMPRESA_CUIT,
  razonSocial: process.env.EMPRESA_RAZON_SOCIAL,
  certificado: process.env.EMPRESA_CERTIFICADO,
  key: process.env.EMPRESA_KEY,
  dbType: process.env.EMPRESA_DB_TYPE,
  dbHost: process.env.EMPRESA_DB_HOST,
  dbPort: parseInt(process.env.EMPRESA_DB_PORT) || 3306,
  dbUser: process.env.EMPRESA_DB_USER,
  dbPassword: process.env.EMPRESA_DB_PASSWORD,
  dbName: process.env.EMPRESA_DB_NAME,
});

const infoCertificadoActual = () => {
  const certPath = process.env.EMPRESA_CERTIFICADO;
  if (!certPath) return { error: "Sin certificado configurado" };
  try {
    const buffer = getSecureCerts().loadEncryptedCertificate(certPath);
    return {
      archivo: path.basename(certPath),
      ...empresaConfig.infoCertificado(buffer).info,
    };
  } catch (error) {
    return { archivo: path.basename(certPath), error: error.message };
  }
};

const leerClavePrivada = (buffer) => {
  try {
    return crypto.createPrivateKey(buffer);
  } catch (_) {
    for (const type of ["pkcs8", "pkcs1", "sec1"]) {
      try {
        return crypto.createPrivateKey({ key: buffer, format: "der", type });
      } catch (_) {}
    }
  }
  throw new ErrorValidacion(
    "La key no es una clave privada válida (PEM o DER sin contraseña)"
  );
};

const sello = () =>
  new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);

/**
 * Valida el par certificado/key, lo normaliza a PEM, lo cifra en cert_cifrados
 * y devuelve las rutas a guardar en la configuración.
 */
const procesarCertificados = (files, cuitEsperado) => {
  const certFile = files?.certificado?.[0];
  const keyFile = files?.key?.[0];
  if (!certFile && !keyFile) return null;
  if (!certFile || !keyFile) {
    throw new ErrorValidacion("Hay que enviar juntos el certificado y la key");
  }

  let cert, info;
  try {
    ({ cert, info } = empresaConfig.infoCertificado(certFile.buffer));
  } catch (_) {
    throw new ErrorValidacion(
      "El certificado no es un X.509 válido (.crt/.pem en PEM o DER; .pfx no soportado)"
    );
  }
  const key = leerClavePrivada(keyFile.buffer);

  if (!cert.checkPrivateKey(key)) {
    throw new ErrorValidacion("La key no corresponde a este certificado");
  }
  if (info.vencido) {
    throw new ErrorValidacion(`El certificado venció el ${info.validoHasta}`);
  }
  if (info.cuit && cuitEsperado && info.cuit !== String(cuitEsperado)) {
    throw new ErrorValidacion(
      `El certificado es del CUIT ${info.cuit} y la empresa tiene CUIT ${cuitEsperado}`
    );
  }

  const base = `${empresaConfig.getInstancia()}_${sello()}`;
  const nombreCert = `${base}.crt`;
  const nombreKey = `${base}.key`;
  const certs = getSecureCerts();
  certs.encryptBuffer(Buffer.from(cert.toString()), nombreCert);
  certs.encryptBuffer(
    Buffer.from(key.export({ type: "pkcs8", format: "pem" })),
    nombreKey
  );

  return {
    certificado: `./src/certs/${nombreCert}`,
    key: `./src/certs/${nombreKey}`,
    info,
  };
};

const borrarTokens = (...cuits) => {
  for (const cuit of new Set(cuits.filter(Boolean))) {
    const tokenPath = path.resolve(process.cwd(), "src/temp", `${cuit}_wsfe_token.json`);
    if (fs.existsSync(tokenPath)) fs.unlinkSync(tokenPath);
  }
};

const validarCampos = (body) => {
  const datos = {};
  for (const campo of Object.keys(empresaConfig.CAMPOS)) {
    if (["certificado", "key"].includes(campo)) continue;
    const valor = typeof body[campo] === "string" ? body[campo].trim() : body[campo];
    if (valor !== undefined && valor !== null && valor !== "") datos[campo] = valor;
  }

  if (datos.cuit !== undefined && !/^\d{11}$/.test(String(datos.cuit))) {
    throw new ErrorValidacion("cuit debe tener 11 dígitos, sin guiones");
  }
  if (datos.dbPort !== undefined && !/^\d{1,5}$/.test(String(datos.dbPort))) {
    throw new ErrorValidacion("dbPort debe ser numérico");
  }
  if (datos.afipMode !== undefined && !["production", "testing"].includes(datos.afipMode)) {
    throw new ErrorValidacion("afipMode debe ser 'production' o 'testing'");
  }
  return datos;
};

const reiniciarAlResponder = (res) => {
  res.on("finish", () => {
    console.log("🔄 Configuración actualizada, reiniciando proceso...");
    setTimeout(() => process.exit(0), 500);
  });
};

const vistaConfig = () => {
  const actual = empresaConfig.obtenerActual();
  return {
    instancia: empresaConfig.getInstancia(),
    empresa: { ...actual, dbPassword: actual.dbPassword ? "********" : null },
    certificado: infoCertificadoActual(),
  };
};

const manejarError = (res, error) => {
  if (error instanceof ErrorValidacion) {
    return res.status(400).json({ error: error.message });
  }
  console.error("❌ Error en administración de empresa:", error);
  return res.status(500).json({ error: error.message });
};

router.use(requireAdminKey);

router.use((req, res, next) => {
  if (!empresaConfig.getInstancia()) {
    return res
      .status(503)
      .json({ error: "ATRARCA_INSTANCIA no configurada en esta instancia" });
  }
  next();
});

router.get("/empresa", (req, res) => {
  try {
    res.json({ success: true, ...vistaConfig() });
  } catch (error) {
    manejarError(res, error);
  }
});

router.put("/empresa", recibirArchivos, (req, res) => {
  try {
    const datos = validarCampos(req.body || {});
    const cuitAnterior = process.env.EMPRESA_CUIT;
    const cuit = datos.cuit || cuitAnterior;
    const certs = procesarCertificados(req.files, cuit);
    if (certs) {
      datos.certificado = certs.certificado;
      datos.key = certs.key;
    }
    if (Object.keys(datos).length === 0) {
      throw new ErrorValidacion("No se envió ningún dato para actualizar");
    }

    empresaConfig.guardar(datos);
    if (certs || datos.cuit) borrarTokens(cuitAnterior, cuit);

    reiniciarAlResponder(res);
    res.json({
      success: true,
      reiniciando: true,
      mensaje: "Configuración guardada. La instancia se reinicia en unos segundos.",
      ...vistaConfig(),
      certificado: certs ? certs.info : infoCertificadoActual(),
    });
  } catch (error) {
    manejarError(res, error);
  }
});

router.post("/empresa/certificado", recibirArchivos, (req, res) => {
  try {
    const cuit = process.env.EMPRESA_CUIT;
    if (!/^\d{11}$/.test(cuit || "")) {
      throw new ErrorValidacion(
        "La empresa todavía no tiene CUIT configurado; usar PUT /api/admin/empresa"
      );
    }
    const certs = procesarCertificados(req.files, cuit);
    if (!certs) {
      throw new ErrorValidacion("Hay que enviar los archivos certificado y key");
    }

    empresaConfig.guardar({ certificado: certs.certificado, key: certs.key });
    borrarTokens(cuit);

    reiniciarAlResponder(res);
    res.json({
      success: true,
      reiniciando: true,
      mensaje: "Certificado renovado. La instancia se reinicia en unos segundos.",
      certificado: { archivo: path.basename(certs.certificado), ...certs.info },
    });
  } catch (error) {
    manejarError(res, error);
  }
});

router.post("/empresa/verificar", async (req, res) => {
  const empresa = empresaDesdeEnv();
  const resultado = {
    instancia: empresaConfig.getInstancia(),
    cuit: empresa.cuit,
    certificado: infoCertificadoActual(),
  };

  try {
    const conn = await mysql.createConnection({
      host: empresa.dbHost,
      port: empresa.dbPort,
      user: empresa.dbUser,
      password: empresa.dbPassword,
      database: empresa.dbName,
      connectTimeout: 8000,
    });
    await conn.query("SELECT 1");
    await conn.end();
    resultado.baseDatos = { ok: true };
  } catch (error) {
    resultado.baseDatos = { ok: false, error: error.message };
  }

  try {
    const wsaa = require("../services/wsaa.service");
    const auth = await wsaa.authenticate("wsfe", empresa);
    resultado.afip = { ok: Boolean(auth && auth.token) };
  } catch (error) {
    resultado.afip = { ok: false, error: error.message };
  }

  // Siempre 200: Cloudflare reemplaza los 5xx del origen y se perdería el detalle
  resultado.success = resultado.baseDatos.ok && resultado.afip.ok;
  res.json(resultado);
});

module.exports = router;
