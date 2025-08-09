const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

class CertificateEncryption {
  constructor(secretKey) {
    if (!secretKey) {
      throw new Error("Se requiere una clave de cifrado");
    }
    this.algorithm = "aes-256-gcm";
    this.secretKey = crypto.createHash("sha256").update(secretKey).digest();
  }

  encrypt(filePath, outputDir = "./cert_cifrados") {
    try {
      console.log(`Cifrando archivo: ${filePath}`);

      if (!fs.existsSync(filePath)) {
        throw new Error(`Archivo no encontrado: ${filePath}`);
      }

      // Crear directorio de salida si no existe
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);

      const data = fs.readFileSync(filePath);
      let encrypted = cipher.update(data);
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      const authTag = cipher.getAuthTag();

      const result = {
        iv: iv.toString("hex"),
        authTag: authTag.toString("hex"),
        encryptedData: encrypted.toString("hex"),
        originalName: path.basename(filePath),
        timestamp: new Date().toISOString(),
      };

      const fileName = path.basename(filePath) + ".encrypted";
      const encryptedPath = path.join(outputDir, fileName);

      fs.writeFileSync(encryptedPath, JSON.stringify(result, null, 2));
      console.log(`✅ Certificado cifrado guardado en: ${encryptedPath}`);

      return encryptedPath;
    } catch (error) {
      console.error(`❌ Error al cifrar ${filePath}:`, error.message);
      throw error;
    }
  }

  decrypt(encryptedFilePath) {
    try {
      if (!fs.existsSync(encryptedFilePath)) {
        throw new Error(`Archivo cifrado no encontrado: ${encryptedFilePath}`);
      }

      const encryptedData = JSON.parse(
        fs.readFileSync(encryptedFilePath, "utf8")
      );

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

      return decrypted;
    } catch (error) {
      console.error(`Error al descifrar ${encryptedFilePath}:`, error.message);
      throw error;
    }
  }

  // Método para cifrar todos los certificados en un directorio
  encryptAllInDirectory(sourceDir, outputDir = "./cert_cifrados") {
    console.log(`\n🔐 Cifrando certificados desde: ${sourceDir}`);
    console.log(`📁 Guardando en: ${outputDir}\n`);

    if (!fs.existsSync(sourceDir)) {
      throw new Error(`Directorio fuente no encontrado: ${sourceDir}`);
    }

    const files = fs.readdirSync(sourceDir);
    const certificateExtensions = [".crt", ".key", ".pem", ".pfx", ".p12"];
    const encryptedFiles = [];

    files.forEach((file) => {
      const filePath = path.join(sourceDir, file);
      const ext = path.extname(file).toLowerCase();

      if (
        certificateExtensions.includes(ext) &&
        fs.statSync(filePath).isFile()
      ) {
        try {
          const encryptedPath = this.encrypt(filePath, outputDir);
          encryptedFiles.push({
            original: filePath,
            encrypted: encryptedPath,
            name: file,
          });
        } catch (error) {
          console.error(`Error procesando ${file}:`, error.message);
        }
      }
    });

    return encryptedFiles;
  }
}

// Script principal
async function main() {
  try {
    const claveCifrado = process.env.CLAVE_CIFRADO;

    if (!claveCifrado) {
      console.error("❌ Error: Variable CLAVE_CIFRADO no encontrada en .env");
      console.log("Agrega la siguiente línea a tu archivo .env:");
      console.log('CLAVE_CIFRADO="mifrasedecifrado"');
      process.exit(1);
    }

    console.log("🔐 Iniciando cifrado de certificados...\n");

    const encryption = new CertificateEncryption(claveCifrado);

    // Cifrar certificados desde el directorio src/certs
    const sourceDir = "./src/certs";
    const outputDir = "./cert_cifrados";

    const encryptedFiles = encryption.encryptAllInDirectory(
      sourceDir,
      outputDir
    );

    console.log("\n✅ Proceso de cifrado completado!");
    console.log(`📊 Total de archivos cifrados: ${encryptedFiles.length}\n`);

    if (encryptedFiles.length > 0) {
      console.log("📋 Archivos procesados:");
      encryptedFiles.forEach((file) => {
        console.log(`  • ${file.name} → ${path.basename(file.encrypted)}`);
      });

      console.log("\n🔧 Próximos pasos:");
      console.log(
        "1. Verifica que los archivos cifrados estén en ./cert_cifrados/"
      );
      console.log("2. Actualiza tu código para usar los certificados cifrados");
      console.log(
        "3. Considera eliminar los certificados originales por seguridad"
      );
    }
  } catch (error) {
    console.error("❌ Error durante el cifrado:", error.message);
    process.exit(1);
  }
}

// Exportar la clase para uso en otros módulos
module.exports = CertificateEncryption;

// Ejecutar el script si se llama directamente
if (require.main === module) {
  main();
}
