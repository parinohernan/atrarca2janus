const path = require("path");
require("dotenv").config();

// Importar nuestros servicios
const SecureCertificateService = require("../src/services/secure-certificate.service");
const WSAAService = require("../src/services/wsaa.service");

async function testEncryptedCertificates() {
  console.log("🧪 Iniciando pruebas de certificados cifrados...\n");

  try {
    // 1. Probar el servicio de certificados seguros
    console.log("1️⃣ Probando SecureCertificateService...");
    const secureCerts = new SecureCertificateService();

    // Listar certificados disponibles
    const availableCerts = secureCerts.listAvailableCertificates();
    console.log(
      `📋 Certificados cifrados disponibles: ${availableCerts.length}`
    );

    if (availableCerts.length > 0) {
      console.log("📁 Lista de certificados:");
      availableCerts.forEach((cert) => {
        console.log(`  • ${cert.originalName} (${cert.encryptedFile})`);
      });
    }

    // 2. Probar carga de un certificado específico
    console.log("\n2️⃣ Probando carga de certificados...");

    // Usar certificados de prueba (ajusta según tus archivos)
    const testCertPaths = [
      "src/certs/romero.crt",
      "src/certs/romero.key",
      "src/certs/novak_2024.crt",
      "src/certs/privada_novak.key",
    ];

    for (const certPath of testCertPaths) {
      try {
        if (secureCerts.hasEncryptedCertificate(certPath)) {
          console.log(
            `✅ Certificado cifrado encontrado: ${path.basename(certPath)}`
          );

          // Probar validación
          const isValid = secureCerts.validateEncryptedCertificate(certPath);
          console.log(
            `🔍 Validación: ${isValid ? "✅ VÁLIDO" : "❌ INVÁLIDO"}`
          );

          // Probar carga (solo los primeros bytes para verificar)
          const certData = secureCerts.loadEncryptedCertificate(certPath);
          console.log(`📊 Tamaño descifrado: ${certData.length} bytes`);
          console.log(
            `🔍 Primeros caracteres: ${certData
              .toString("utf8")
              .substring(0, 50)}...`
          );
        } else {
          console.log(
            `⚠️ Certificado cifrado NO encontrado: ${path.basename(certPath)}`
          );
        }
      } catch (error) {
        console.log(
          `❌ Error con ${path.basename(certPath)}: ${error.message}`
        );
      }
    }

    // 3. Probar el servicio WSAA con certificados cifrados
    console.log("\n3️⃣ Probando WSAAService con certificados cifrados...");

    const wsaaService = new WSAAService();

    // Configurar una empresa de prueba
    const empresaPrueba = {
      cuit: process.env.EMPRESA_CUIT || "20354145708",
      razonSocial: process.env.EMPRESA_RAZON_SOCIAL || "Empresa de Prueba",
      certificado: process.env.EMPRESA_CERTIFICADO || "src/certs/romero.crt",
      key: process.env.EMPRESA_KEY || "src/certs/romero.key",
    };

    console.log(
      `🏢 Configurando empresa: ${empresaPrueba.razonSocial} (CUIT: ${empresaPrueba.cuit})`
    );

    try {
      wsaaService.setEmpresa(empresaPrueba);
      console.log("✅ Configuración de empresa exitosa");

      // Verificar si puede cargar los certificados
      if (wsaaService.useEncryptedCerts) {
        console.log("🔐 Modo: Certificados cifrados");

        // Probar carga de certificados
        const certData =
          wsaaService.secureCerts.loadCertificateAndKey(empresaPrueba);
        console.log(`📊 Certificado cargado: ${certData.cert.length} bytes`);
        console.log(`📊 Clave privada cargada: ${certData.key.length} bytes`);
      } else {
        console.log("📁 Modo: Certificados tradicionales");
      }
    } catch (error) {
      console.log(`❌ Error configurando empresa: ${error.message}`);
    }

    // 4. Estadísticas del servicio
    console.log("\n4️⃣ Estadísticas del servicio...");
    const stats = secureCerts.getStats();
    console.log("📊 Estadísticas:", JSON.stringify(stats, null, 2));

    // 5. Limpiar caché
    console.log("\n5️⃣ Limpiando caché...");
    secureCerts.clearCache();

    console.log("\n✅ Todas las pruebas completadas exitosamente!");
    console.log(
      "\n🎉 Los certificados cifrados están funcionando correctamente."
    );
    console.log("\n📝 Próximos pasos:");
    console.log(
      "1. Actualiza tu archivo .env con los datos correctos de tu empresa"
    );
    console.log("2. Configura USE_ENCRYPTED_CERTS=true en tu .env");
    console.log(
      "3. Considera eliminar los certificados originales por seguridad"
    );
    console.log("4. Ejecuta tu aplicación normalmente");
  } catch (error) {
    console.error("❌ Error durante las pruebas:", error);
    console.log("\n🔧 Posibles soluciones:");
    console.log("1. Verifica que CLAVE_CIFRADO esté configurada en .env");
    console.log(
      "2. Asegúrate de que los certificados cifrados existan en ./cert_cifrados/"
    );
    console.log(
      "3. Verifica que los paths en .env apunten a los certificados correctos"
    );

    process.exit(1);
  }
}

// Función para mostrar ayuda
function showHelp() {
  console.log("🔐 Script de Prueba de Certificados Cifrados\n");
  console.log(
    "Este script valida que los certificados cifrados funcionen correctamente.\n"
  );
  console.log("Uso:");
  console.log("  node scripts/test-encrypted-certificates.js\n");
  console.log("Requisitos:");
  console.log("  • Archivo .env configurado con CLAVE_CIFRADO");
  console.log("  • Certificados cifrados en ./cert_cifrados/");
  console.log("  • Variables EMPRESA_CERTIFICADO y EMPRESA_KEY configuradas");
}

// Ejecutar el script
if (require.main === module) {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    showHelp();
  } else {
    testEncryptedCertificates();
  }
}
