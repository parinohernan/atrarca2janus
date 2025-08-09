# 🚀 Despliegue en Render - API AFIP con Certificados Cifrados

Esta guía te ayudará a desplegar tu API de AFIP con certificados cifrados en Render.

## 📋 Prerequisitos

- ✅ Repositorio en GitHub: https://github.com/parinohernan/atrarca2janus
- ✅ Certificados cifrados en `cert_cifrados/`
- ✅ Sistema de certificados cifrados implementado
- ✅ Rama `produccion` configurada

## 🔧 Configuración en Render

### 1. Crear Nuevo Servicio Web

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Haz clic en **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub: `parinohernan/atrarca2janus`

### 2. Configuración del Servicio

**Configuración Básica:**

- **Name:** `atrarca-afip-api`
- **Region:** Oregon (US West)
- **Branch:** `produccion` ⚠️ **IMPORTANTE**
- **Root Directory:** Dejar vacío (usar raíz del repo)
- **Runtime:** Node
- **Build Command:** `npm install && npm run build:prod`
- **Start Command:** `npm start`

**Plan:**

- Selecciona **Free** (para empezar)

### 3. Variables de Entorno **CRÍTICAS**

En la sección **Environment Variables**, agrega las siguientes variables:

#### 🔐 **Variables de Cifrado (OBLIGATORIAS)**

```
CLAVE_CIFRADO=tu-frase-de-cifrado-super-segura-aqui
USE_ENCRYPTED_CERTS=true
```

#### 🏢 **Variables de Empresa**

```
EMPRESA_CUIT=20354145708
EMPRESA_RAZON_SOCIAL=Tu Empresa S.A.
EMPRESA_CERTIFICADO=src/certs/tu-certificado.crt
EMPRESA_KEY=src/certs/tu-clave.key
```

#### ⚙️ **Variables de Sistema**

```
NODE_ENV=production
AFIP_MODE=production
PORT=10000
JWT_SECRET=tu-jwt-secret-super-seguro
```

#### 🗄️ **Variables de Base de Datos (si usas BD)**

```
EMPRESA_DB_TYPE=mysql
EMPRESA_DB_HOST=tu-host-de-bd
EMPRESA_DB_PORT=3306
EMPRESA_DB_USER=tu-usuario
EMPRESA_DB_PASSWORD=tu-password
EMPRESA_DB_NAME=tu-base-datos
```

### 4. Configuración Avanzada

**Health Check:**

- **Health Check Path:** `/`

**Auto Deploy:**

- ✅ Habilitado (se desplegará automáticamente al hacer push a `produccion`)

## 🔍 Verificaciones Importantes

### Antes del Despliegue

1. **Verificar certificados cifrados:**

   ```bash
   ls -la cert_cifrados/
   # Debe mostrar archivos .encrypted
   ```

2. **Probar script de build localmente:**

   ```bash
   npm run build:prod
   ```

3. **Verificar que CLAVE_CIFRADO sea la correcta:**
   ```bash
   node scripts/test-encrypted-certificates.js
   ```

## 🚀 Proceso de Despliegue

### 1. Hacer Push a Producción

```bash
# Asegúrate de estar en la rama produccion
git branch
# Debe mostrar: * produccion

# Agregar cambios de configuración
git add render.yaml RENDER-DEPLOYMENT.md scripts/verify-encrypted-certs.js package.json

# Commit
git commit -m "feat: Configuración para despliegue en Render

- Agregar render.yaml con configuración de producción
- Crear script de verificación de certificados
- Agregar documentación de despliegue
- Configurar build:prod script"

# Push a la rama produccion
git push -u origin produccion
```

### 2. Monitorear el Despliegue

1. En Render Dashboard, verás el progreso del build
2. Revisa los logs para asegurar que:
   - ✅ `npm install` se ejecute correctamente
   - ✅ `npm run build:prod` verifique los certificados
   - ✅ El servidor inicie en el puerto 10000

## 🔧 Logs y Debugging

### Ver Logs en Tiempo Real

En el Dashboard de Render:

1. Ve a tu servicio `atrarca-afip-api`
2. Haz clic en **"Logs"**
3. Verifica que aparezcan estos mensajes:

```
🔐 Verificando certificados cifrados para producción...
📁 Directorio cert_cifrados encontrado
📊 Certificados cifrados disponibles: 19
✅ SecureCertificateService: OK
✅ WSAAService: OK
✅ Verificación completada exitosamente!
🚀 El servidor está listo para desplegarse en Render
```

### Problemas Comunes

#### ❌ Error: "CLAVE_CIFRADO no configurada"

**Solución:** Verifica que la variable esté configurada en Render Dashboard

#### ❌ Error: "Certificados cifrados no encontrados"

**Solución:** Asegúrate de que `cert_cifrados/` esté incluido en el repositorio

#### ❌ Error: "Build failed"

**Solución:** Revisa los logs de build y verifica las dependencias

## 🌐 Acceso a la API

Una vez desplegado exitosamente:

**URL de tu API:** `https://atrarca-afip-api.onrender.com`

### Endpoints de Prueba

1. **Health Check:**

   ```
   GET https://atrarca-afip-api.onrender.com/
   ```

   Respuesta esperada: `"API de AFIP funcionando"`

2. **Test de API:**

   ```
   GET https://atrarca-afip-api.onrender.com/api/test
   ```

3. **Test de Certificados:**
   ```
   GET https://atrarca-afip-api.onrender.com/api/afip/test-certificados
   ```

## 🔒 Seguridad en Producción

### Variables Sensibles

⚠️ **NUNCA** incluyas estas variables en el código:

- `CLAVE_CIFRADO`
- `JWT_SECRET`
- Passwords de base de datos
- CUITs reales

### Certificados

✅ **Los certificados cifrados SÍ están seguros** en el repositorio porque:

- Están cifrados con AES-256-GCM
- Solo se pueden descifrar con `CLAVE_CIFRADO`
- La clave está solo en variables de entorno

## 📊 Monitoreo

### Métricas Importantes

1. **Tiempo de respuesta** de endpoints AFIP
2. **Errores de autenticación** con AFIP
3. **Uso de memoria** (certificados en caché)
4. **Logs de certificados** (sin contenido sensible)

### Alertas Recomendadas

- Errores de descifrado de certificados
- Fallos de autenticación con AFIP
- Timeouts en servicios AFIP
- Memoria alta (> 80%)

## 🔄 Actualizaciones

### Para Actualizar el Código

```bash
# Hacer cambios en develop/master
git checkout master
# ... hacer cambios ...
git commit -m "feat: nuevas funcionalidades"

# Merge a produccion
git checkout produccion
git merge master
git push origin produccion
```

**Render automáticamente desplegará** los cambios cuando hagas push a `produccion`.

## 📞 Soporte

Si tienes problemas:

1. **Revisa los logs** en Render Dashboard
2. **Verifica variables de entorno** están configuradas
3. **Prueba localmente** con las mismas variables
4. **Ejecuta** `npm run build:prod` localmente

---

**🎉 ¡Tu API de AFIP con certificados cifrados está lista para producción!**
