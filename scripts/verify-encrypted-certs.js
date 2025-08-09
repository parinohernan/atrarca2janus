const fs = require("fs");
const path = require("path");

console.log("🔐 Verificando certificados cifrados para producción...\n");

try {
  // Verificar que exista el directorio de certificados cifrados
  const certsDir = "./cert_cifrados";

  if (!fs.existsSync(certsDir)) {
    console.error("❌ Error: Directorio cert_cifrados no encontrado");
    console.log(
      "📋 Asegúrate de que los certificados cifrados estén incluidos en el repositorio"
    );
    process.exit(1);
  }

  // Listar certificados cifrados disponibles
  const files = fs.readdirSync(certsDir);
  const encryptedFiles = files.filter((file) => file.endsWith(".encrypted"));

  console.log(`📁 Directorio cert_cifrados encontrado`);
  console.log(`📊 Certificados cifrados disponibles: ${encryptedFiles.length}`);

  if (encryptedFiles.length > 0) {
    console.log("📋 Lista de certificados:");
    encryptedFiles.forEach((file) => {
      const filePath = path.join(certsDir, file);
      const stats = fs.statSync(filePath);
      console.log(`  • ${file} (${stats.size} bytes)`);
    });
  }

  // Verificar variables de entorno críticas (solo las que deben estar definidas)
  const requiredEnvVars = ["CLAVE_CIFRADO", "EMPRESA_CUIT"];

  console.log("\n🔧 Verificando variables de entorno...");

  let missingVars = [];
  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    } else {
      console.log(`✅ ${varName}: configurada`);
    }
  });

  if (missingVars.length > 0) {
    console.log("\n⚠️ Variables faltantes (se configurarán en Render):");
    missingVars.forEach((varName) => {
      console.log(`  • ${varName}`);
    });
  }

  // Verificar que el servicio de certificados seguros se pueda importar
  console.log("\n🧪 Verificando servicios...");

  try {
    require("../src/services/secure-certificate.service");
    console.log("✅ SecureCertificateService: OK");
  } catch (error) {
    console.error(
      "❌ Error al importar SecureCertificateService:",
      error.message
    );
    process.exit(1);
  }

  try {
    require("../src/services/wsaa.service");
    console.log("✅ WSAAService: OK");
  } catch (error) {
    console.error("❌ Error al importar WSAAService:", error.message);
    process.exit(1);
  }

  console.log("\n✅ Verificación completada exitosamente!");
  console.log("🚀 El servidor está listo para desplegarse en Render");

  console.log("\n📝 Recordatorios para Render:");
  console.log("1. Configurar CLAVE_CIFRADO en las variables de entorno");
  console.log("2. Configurar datos de empresa (CUIT, certificados, etc.)");
  console.log("3. Configurar datos de base de datos si es necesario");
  console.log("4. El servidor usará certificados cifrados automáticamente");
} catch (error) {
  console.error("❌ Error durante la verificación:", error.message);
  process.exit(1);
}
