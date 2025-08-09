# 🔐 Sistema de Certificados Cifrados

Este documento explica cómo usar el sistema de certificados cifrados implementado para proteger los certificados AFIP de forma segura.

## 📋 Índice

- [¿Qué es?](#qué-es)
- [Ventajas](#ventajas)
- [Instalación y Configuración](#instalación-y-configuración)
- [Uso](#uso)
- [Scripts Disponibles](#scripts-disponibles)
- [Estructura de Archivos](#estructura-de-archivos)
- [Solución de Problemas](#solución-de-problemas)
- [Seguridad](#seguridad)

## ¿Qué es?

El sistema de certificados cifrados permite almacenar los certificados AFIP (.crt, .key, .pfx) de forma segura usando cifrado AES-256-GCM. Los certificados originales se cifran y almacenan en un directorio separado, mientras que el código los descifra dinámicamente cuando los necesita.

## 🎯 Ventajas

- **Seguridad**: Los certificados están cifrados en disco
- **Compatibilidad**: Funciona con el código existente sin cambios mayores
- **Flexibilidad**: Fallback automático a certificados tradicionales
- **Control**: Una sola clave maestra controla el acceso
- **Caché**: Los certificados se mantienen en memoria para mejor rendimiento

## 🚀 Instalación y Configuración

### 1. Configurar Variables de Entorno

Ejecuta el script de configuración:

```bash
node scripts/setup-env.js
```

O crea manualmente el archivo `.env` con:

```env
# Configuración de Cifrado de Certificados
CLAVE_CIFRADO="mifrasedecifrado"
USE_ENCRYPTED_CERTS=true

# Configuración AFIP
AFIP_MODE=testing

# Configuración de Empresa
EMPRESA_CUIT=20354145708
EMPRESA_RAZON_SOCIAL="Tu Empresa"
EMPRESA_CERTIFICADO=src/certs/tu-certificado.crt
EMPRESA_KEY=src/certs/tu-clave.key

# ... otras configuraciones
```

### 2. Cifrar Certificados Existentes

Ejecuta el script de cifrado:

```bash
node scripts/encrypt-certificates.js
```

Este script:

- Lee todos los certificados de `src/certs/`
- Los cifra usando AES-256-GCM
- Los guarda en `cert_cifrados/` con extensión `.encrypted`
- Mantiene metadatos (nombre original, timestamp)

### 3. Probar la Configuración

Ejecuta el script de pruebas:

```bash
node scripts/test-encrypted-certificates.js
```

## 📁 Estructura de Archivos

```
proyecto/
├── cert_cifrados/                    # Certificados cifrados
│   ├── certificado.crt.encrypted
│   ├── clave.key.encrypted
│   └── archivo.pfx.encrypted
├── scripts/
│   ├── encrypt-certificates.js      # Cifra certificados
│   ├── setup-env.js                 # Configura .env
│   └── test-encrypted-certificates.js # Prueba el sistema
├── src/
│   ├── services/
│   │   ├── secure-certificate.service.js # Servicio principal
│   │   └── wsaa.service.js          # Modificado para usar cifrado
│   └── certs/                       # Certificados originales (opcional)
└── .env                             # Variables de entorno
```

## 🔧 Scripts Disponibles

### `encrypt-certificates.js`

Cifra todos los certificados del directorio `src/certs/`:

```bash
node scripts/encrypt-certificates.js
```

### `setup-env.js`

Configura las variables de entorno necesarias:

```bash
node scripts/setup-env.js
```

### `test-encrypted-certificates.js`

Valida que todo funcione correctamente:

```bash
node scripts/test-encrypted-certificates.js
```

## 🔨 Uso en el Código

El sistema funciona automáticamente. Los servicios detectan si hay certificados cifrados disponibles:

```javascript
// El servicio WSAA automáticamente usa certificados cifrados si están disponibles
const wsaaService = new WSAAService();
wsaaService.setEmpresa({
  cuit: "20354145708",
  certificado: "src/certs/certificado.crt",
  key: "src/certs/clave.key",
});
```

### Uso Manual del Servicio

```javascript
const SecureCertificateService = require("./src/services/secure-certificate.service");

const secureCerts = new SecureCertificateService();

// Cargar un certificado específico
const certData = secureCerts.loadEncryptedCertificate(
  "src/certs/certificado.crt"
);

// Cargar certificado y clave para una empresa
const empresa = { certificado: "path/to/cert.crt", key: "path/to/key.key" };
const { cert, key } = secureCerts.loadCertificateAndKey(empresa);

// Listar certificados disponibles
const available = secureCerts.listAvailableCertificates();

// Validar integridad
const isValid = secureCerts.validateEncryptedCertificate("path/to/cert.crt");

// Limpiar caché (recomendado periódicamente)
secureCerts.clearCache();
```

## 🔍 Formato de Archivos Cifrados

Los archivos cifrados tienen este formato JSON:

```json
{
  "iv": "hexadecimal_initialization_vector",
  "authTag": "hexadecimal_authentication_tag",
  "encryptedData": "hexadecimal_encrypted_data",
  "originalName": "nombre_original.crt",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🛠️ Solución de Problemas

### Error: "CLAVE_CIFRADO no está configurada"

**Solución**: Configura la variable en tu archivo `.env`:

```env
CLAVE_CIFRADO="tu-clave-segura-aqui"
```

### Error: "Certificado cifrado no encontrado"

**Solución**:

1. Verifica que exista el archivo `.encrypted` en `cert_cifrados/`
2. Ejecuta `node scripts/encrypt-certificates.js`
3. Verifica las rutas en `.env`

### Error de descifrado

**Solución**:

1. Verifica que `CLAVE_CIFRADO` sea la misma usada para cifrar
2. Verifica que el archivo cifrado no esté corrupto
3. Re-cifra el certificado si es necesario

### Fallback a certificados tradicionales

Si hay problemas, el sistema automáticamente usa certificados sin cifrar:

```
⚠️ No se pudo inicializar certificados cifrados, usando método tradicional
```

## 🔒 Seguridad

### Mejores Prácticas

1. **Clave de Cifrado Segura**:

   ```env
   CLAVE_CIFRADO="una-frase-muy-larga-y-segura-con-numeros-123-y-simbolos-!"
   ```

2. **Proteger Variables de Entorno**:

   - Nunca commits `.env` al repositorio
   - Usa variables de entorno del sistema en producción
   - Considera usar servicios de gestión de secretos

3. **Limpieza de Certificados Originales**:

   ```bash
   # Después de cifrar y probar, elimina los originales
   rm -rf src/certs/*.crt src/certs/*.key src/certs/*.pfx
   ```

4. **Rotación de Claves**:

   - Cambia `CLAVE_CIFRADO` periódicamente
   - Re-cifra certificados con nueva clave
   - Limpia caché después de cambios

5. **Monitoreo**:
   - Revisa logs para intentos de acceso
   - Implementa alertas para fallos de descifrado
   - Audita el acceso a certificados

### Consideraciones de Seguridad

- **Archivos Temporales**: Se crean y eliminan automáticamente durante el proceso de firma
- **Caché en Memoria**: Los certificados descifrados se mantienen en memoria temporalmente
- **Logs**: Se registran las operaciones pero no el contenido de los certificados
- **Fallback**: Si falla el cifrado, el sistema usa certificados tradicionales como respaldo

## 🚀 Migración desde Certificados Tradicionales

1. **Backup**: Respalda tus certificados actuales
2. **Configura**: Ejecuta `node scripts/setup-env.js`
3. **Cifra**: Ejecuta `node scripts/encrypt-certificates.js`
4. **Prueba**: Ejecuta `node scripts/test-encrypted-certificates.js`
5. **Verifica**: Prueba tu aplicación normalmente
6. **Limpia**: Elimina certificados originales (opcional)

## 📞 Soporte

Si tienes problemas:

1. Ejecuta el script de pruebas para diagnosticar
2. Revisa los logs de la aplicación
3. Verifica la configuración de variables de entorno
4. Asegúrate de que los certificados cifrados existan

---

**🔐 ¡Tus certificados AFIP ahora están protegidos con cifrado militar!**
