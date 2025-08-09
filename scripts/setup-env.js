const fs = require("fs");
const path = require("path");

console.log(
  "🔧 Configurando variables de entorno para certificados cifrados...\n"
);

const envContent = `# Configuración de Cifrado de Certificados
CLAVE_CIFRADO="mifrasedecifrado"
USE_ENCRYPTED_CERTS=true

# Configuración AFIP
AFIP_MODE=testing
# AFIP_MODE=production

# Configuración de Empresa (rutas a certificados originales)
EMPRESA_CUIT=20354145708
EMPRESA_RAZON_SOCIAL="Empresa de Prueba"
EMPRESA_CERTIFICADO=src/certs/certificate.crt
EMPRESA_KEY=src/certs/private.key

# Configuración de Base de Datos
EMPRESA_DB_TYPE=mysql
EMPRESA_DB_HOST=localhost
EMPRESA_DB_PORT=3306
EMPRESA_DB_USER=usuario
EMPRESA_DB_PASSWORD=password
EMPRESA_DB_NAME=database_name

# Configuración de Seguridad
JWT_SECRET=afip-api-secret-key-super-secure

# Configuración de Desarrollo
NODE_ENV=development

# Puerto del servidor
PORT=3000
`;

const envPath = path.resolve(".env");

try {
  if (fs.existsSync(envPath)) {
    console.log("⚠️ El archivo .env ya existe.");
    console.log("📋 Contenido recomendado para .env:\n");
    console.log(envContent);
    console.log(
      "\n🔧 Asegúrate de que tu archivo .env contenga estas variables."
    );
  } else {
    fs.writeFileSync(envPath, envContent);
    console.log("✅ Archivo .env creado exitosamente!");
    console.log("📁 Ubicación:", envPath);
  }

  console.log("\n📝 Instrucciones:");
  console.log(
    "1. Revisa y ajusta las variables en .env según tu configuración"
  );
  console.log("2. Cambia CLAVE_CIFRADO por una frase segura");
  console.log(
    "3. Actualiza los datos de tu empresa (CUIT, razón social, etc.)"
  );
  console.log("4. Configura los datos de tu base de datos");
  console.log(
    "5. Ejecuta el script de cifrado: node scripts/encrypt-certificates.js"
  );
} catch (error) {
  console.error("❌ Error al crear .env:", error.message);
  console.log("\n📋 Crea manualmente el archivo .env con este contenido:\n");
  console.log(envContent);
}
