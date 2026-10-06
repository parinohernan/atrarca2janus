const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const CONFIG_DIR = path.resolve(__dirname, "../../config/instancias");
const ALGORITHM = "aes-256-gcm";

// Cada campo editable desde la API y las variables de entorno que alimenta
const CAMPOS = {
  cuit: ["EMPRESA_CUIT", "AFIP_CUIT"],
  razonSocial: ["EMPRESA_RAZON_SOCIAL"],
  certificado: ["EMPRESA_CERTIFICADO", "AFIP_CERT_PATH"],
  key: ["EMPRESA_KEY", "AFIP_KEY_PATH"],
  dbType: ["EMPRESA_DB_TYPE"],
  dbHost: ["EMPRESA_DB_HOST"],
  dbPort: ["EMPRESA_DB_PORT"],
  dbUser: ["EMPRESA_DB_USER"],
  dbPassword: ["EMPRESA_DB_PASSWORD"],
  dbName: ["EMPRESA_DB_NAME"],
  afipMode: ["AFIP_MODE"],
};

function getInstancia() {
  const instancia = process.env.ATRARCA_INSTANCIA;
  if (!instancia) return null;
  if (!/^[a-z0-9_-]+$/i.test(instancia)) {
    throw new Error(`ATRARCA_INSTANCIA inválida: ${instancia}`);
  }
  return instancia;
}

function getSecretKey() {
  if (!process.env.CLAVE_CIFRADO) {
    throw new Error("CLAVE_CIFRADO no está configurada");
  }
  return crypto.createHash("sha256").update(process.env.CLAVE_CIFRADO).digest();
}

function getConfigPath() {
  const instancia = getInstancia();
  if (!instancia) throw new Error("ATRARCA_INSTANCIA no está configurada");
  return path.join(CONFIG_DIR, `${instancia}.json`);
}

function leerArchivo() {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) return {};

  const contenido = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getSecretKey(),
    Buffer.from(contenido.iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(contenido.authTag, "hex"));
  const datos = Buffer.concat([
    decipher.update(Buffer.from(contenido.encryptedData, "hex")),
    decipher.final(),
  ]);
  return JSON.parse(datos.toString("utf8"));
}

function escribirArchivo(datos) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(datos), "utf8"),
    cipher.final(),
  ]);

  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(
    getConfigPath(),
    JSON.stringify(
      {
        iv: iv.toString("hex"),
        authTag: cipher.getAuthTag().toString("hex"),
        encryptedData: encrypted.toString("hex"),
        actualizado: new Date().toISOString(),
      },
      null,
      2
    ),
    { mode: 0o600 }
  );
}

function aplicarEnEnv(datos) {
  for (const [campo, vars] of Object.entries(CAMPOS)) {
    if (datos[campo] === undefined || datos[campo] === null) continue;
    for (const v of vars) process.env[v] = String(datos[campo]);
  }
}

/**
 * Aplica sobre process.env la configuración guardada de esta instancia.
 * Debe ejecutarse antes de cargar rutas/controladores.
 */
function cargar() {
  try {
    if (!getInstancia()) {
      console.log("ℹ️ ATRARCA_INSTANCIA no definida, se usa solo el .env");
      return false;
    }
    const datos = leerArchivo();
    if (Object.keys(datos).length === 0) {
      console.log(`ℹ️ Sin configuración guardada para ${getInstancia()}`);
      return false;
    }
    aplicarEnEnv(datos);
    console.log(`⚙️ Configuración de empresa cargada para ${getInstancia()}`);
    return true;
  } catch (error) {
    console.error("❌ No se pudo cargar la configuración guardada:", error.message);
    return false;
  }
}

/**
 * Une los cambios con la configuración guardada, la persiste cifrada
 * y la aplica sobre process.env.
 */
function guardar(cambios) {
  const actual = leerArchivo();
  const nuevo = { ...actual };
  for (const campo of Object.keys(CAMPOS)) {
    if (cambios[campo] !== undefined && cambios[campo] !== "") {
      nuevo[campo] = cambios[campo];
    }
  }
  escribirArchivo(nuevo);
  aplicarEnEnv(nuevo);
  return nuevo;
}

/** Configuración efectiva actual (archivo + .env) */
function obtenerActual() {
  const actual = {};
  for (const [campo, vars] of Object.entries(CAMPOS)) {
    actual[campo] = process.env[vars[0]] || null;
  }
  return actual;
}

function infoCertificado(buffer) {
  const cert = new crypto.X509Certificate(buffer);
  const validTo = new Date(cert.validTo);
  const cuitMatch = cert.subject.match(/serialNumber=CUIT (\d{11})/);
  return {
    cert,
    info: {
      sujeto: cert.subject.split("\n").join(", "),
      emisor: cert.issuer.split("\n").join(", "),
      cuit: cuitMatch ? cuitMatch[1] : null,
      validoDesde: new Date(cert.validFrom).toISOString(),
      validoHasta: validTo.toISOString(),
      diasRestantes: Math.floor((validTo - Date.now()) / 86400000),
      vencido: validTo < new Date(),
    },
  };
}

module.exports = {
  CAMPOS,
  getInstancia,
  cargar,
  guardar,
  obtenerActual,
  infoCertificado,
};
