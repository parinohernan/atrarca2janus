const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

class SecureCertificateService {
  constructor() {
    this.encryptionKey = process.env.CLAVE_CIFRADO;
    if (!this.encryptionKey) {
      throw new Error(
        "CLAVE_CIFRADO no está configurada en variables de entorno"
      );
    }

    this.algorithm = "aes-256-gcm";
    this.secretKey = crypto
      .createHash("sha256")
      .update(this.encryptionKey)
      .digest();
    this.certificateCache = new Map();

    console.log("🔐 Servicio de certificados seguros inicializado");
  }

  /**
   * Cargar certificado cifrado desde archivo
   * @param {string} certPath - Ruta al certificado original (sin .encrypted)
   * @returns {Buffer} - Datos del certificado descifrado
   */
  loadEncryptedCertificate(certPath) {
    try {
      // Verificar si ya está en caché
      if (this.certificateCache.has(certPath)) {
        console.log(
          `📋 Certificado cargado desde caché: ${path.basename(certPath)}`
        );
        return this.certificateCache.get(certPath);
      }

      // Construir ruta del archivo cifrado
      const encryptedPath = this.getEncryptedPath(certPath);

      if (!fs.existsSync(encryptedPath)) {
        throw new Error(`Certificado cifrado no encontrado: ${encryptedPath}`);
      }

      console.log(`🔓 Descifrando certificado: ${path.basename(certPath)}`);

      const encryptedData = JSON.parse(fs.readFileSync(encryptedPath, "utf8"));

      const iv = Buffer.from(encryptedData.iv, "hex");
      const authTag = Buffer.from(encryptedData.authTag, "hex");
      const encrypted = Buffer.from(encryptedData.encryptedData, "hex");

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.secretKey,
        iv
      );
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      // Guardar en caché
      this.certificateCache.set(certPath, decrypted);

      console.log(
        `✅ Certificado descifrado exitosamente: ${path.basename(certPath)}`
      );
      return decrypted;
    } catch (error) {
      console.error(
        `❌ Error al cargar certificado cifrado ${certPath}:`,
        error.message
      );
      throw new Error(
        `No se pudo cargar el certificado cifrado: ${error.message}`
      );
    }
  }

  /**
   * Obtener la ruta del archivo cifrado
   * @param {string} originalPath - Ruta original del certificado
   * @returns {string} - Ruta del archivo cifrado
   */
  getEncryptedPath(originalPath) {
    const fileName = path.basename(originalPath);
    return path.join("./cert_cifrados", fileName + ".encrypted");
  }

  /**
   * Verificar si existe el certificado cifrado
   * @param {string} certPath - Ruta al certificado original
   * @returns {boolean} - true si existe el archivo cifrado
   */
  hasEncryptedCertificate(certPath) {
    const encryptedPath = this.getEncryptedPath(certPath);
    return fs.existsSync(encryptedPath);
  }

  /**
   * Cargar certificado y clave privada para una empresa
   * @param {Object} empresa - Objeto con datos de la empresa
   * @returns {Object} - Objeto con cert y key descifrados
   */
  loadCertificateAndKey(empresa) {
    try {
      if (!empresa || !empresa.certificado || !empresa.key) {
        throw new Error(
          "Datos de empresa incompletos para cargar certificados"
        );
      }

      console.log(
        `🏢 Cargando certificados para empresa: ${empresa.cuit || "N/A"}`
      );

      const certData = this.loadEncryptedCertificate(empresa.certificado);
      const keyData = this.loadEncryptedCertificate(empresa.key);

      return {
        cert: certData,
        key: keyData,
      };
    } catch (error) {
      console.error(
        "❌ Error al cargar certificados de la empresa:",
        error.message
      );
      throw error;
    }
  }

  /**
   * Listar certificados cifrados disponibles
   * @returns {Array} - Lista de certificados disponibles
   */
  listAvailableCertificates() {
    try {
      const certsDir = "./cert_cifrados";
      if (!fs.existsSync(certsDir)) {
        return [];
      }

      const files = fs.readdirSync(certsDir);
      const certificates = [];

      files.forEach((file) => {
        if (file.endsWith(".encrypted")) {
          try {
            const filePath = path.join(certsDir, file);
            const encryptedData = JSON.parse(fs.readFileSync(filePath, "utf8"));

            certificates.push({
              encryptedFile: file,
              originalName: encryptedData.originalName,
              timestamp: encryptedData.timestamp,
              path: filePath,
            });
          } catch (error) {
            console.warn(`Advertencia: No se pudo leer metadatos de ${file}`);
          }
        }
      });

      return certificates;
    } catch (error) {
      console.error("Error al listar certificados:", error.message);
      return [];
    }
  }

  /**
   * Limpiar caché de certificados (recomendado para seguridad)
   */
  clearCache() {
    console.log("🧹 Limpiando caché de certificados...");
    this.certificateCache.clear();
    console.log("✅ Caché limpiado");
  }

  /**
   * Obtener estadísticas del servicio
   * @returns {Object} - Estadísticas del servicio
   */
  getStats() {
    const availableCerts = this.listAvailableCertificates();

    return {
      certificatesInCache: this.certificateCache.size,
      availableEncryptedCerts: availableCerts.length,
      encryptionAlgorithm: this.algorithm,
      certificates: availableCerts.map((cert) => ({
        name: cert.originalName,
        encrypted: cert.encryptedFile,
        timestamp: cert.timestamp,
      })),
    };
  }

  /**
   * Validar integridad de un certificado cifrado
   * @param {string} certPath - Ruta al certificado original
   * @returns {boolean} - true si el certificado es válido
   */
  validateEncryptedCertificate(certPath) {
    try {
      const encryptedPath = this.getEncryptedPath(certPath);

      if (!fs.existsSync(encryptedPath)) {
        return false;
      }

      // Intentar descifrar (sin guardar en caché)
      const encryptedData = JSON.parse(fs.readFileSync(encryptedPath, "utf8"));

      const iv = Buffer.from(encryptedData.iv, "hex");
      const authTag = Buffer.from(encryptedData.authTag, "hex");
      const encrypted = Buffer.from(encryptedData.encryptedData, "hex");

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.secretKey,
        iv
      );
      decipher.setAuthTag(authTag);

      decipher.update(encrypted);
      decipher.final();

      return true;
    } catch (error) {
      console.error(`Error validando certificado ${certPath}:`, error.message);
      return false;
    }
  }
}

module.exports = SecureCertificateService;
