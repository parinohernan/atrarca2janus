# 📚 Documentación de Endpoints - API AFIP

## 🌐 Información General

- **Base URL**: `http://localhost:3301`
- **Prefijo API**: `/api`
- **Modo**: Production (configurado en variables de entorno)
- **CUIT**: 27260512078

---

## 🔐 Autenticación (`/api/auth`)

### POST `/api/auth/login`

Inicia sesión y obtiene un token de autenticación.

**Parámetros:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Respuesta exitosa:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "empresa1",
    "name": "JHP DEVELOPMENT",
    "role": "user",
    "empresa": {
      "razonSocial": "EMPRESA EJEMPLO",
      "cuit": "27260512078"
    }
  }
}
```

### GET `/api/auth/me`

Obtiene información del usuario autenticado.

**Headers requeridos:**

```
Authorization: Bearer <token>
```

**Respuesta:**

```json
{
  "success": true,
  "user": {
    "username": "empresa1",
    "name": "JHP DEVELOPMENT",
    "role": "user",
    "empresa": {
      "razonSocial": "EMPRESA EJEMPLO",
      "cuit": "27260512078"
    }
  }
}
```

---

## 🏛️ AFIP (`/api/afip`)

### GET `/api/afip/test`

Prueba básica del router AFIP.

**Respuesta:**

```json
{
  "message": "API Router funcionando correctamente"
}
```

### GET `/api/afip/ultimo-comprobante`

Obtiene el último número de comprobante autorizado para un punto de venta y tipo de comprobante.

**Parámetros de consulta:**

- `puntoVenta` (number): Punto de venta habilitado
- `tipoComprobante` (number): Tipo de comprobante (1=Factura A, 6=Factura B, etc.)

**Ejemplo:**

```
GET /api/afip/ultimo-comprobante?puntoVenta=4&tipoComprobante=1
```

**Respuesta exitosa:**

```json
{
  "success": true,
  "fecha": "2025-07-15",
  "ultimoComprobante": 12345
}
```

**Respuesta de error (punto de venta no habilitado):**

```json
{
  "error": "Error al consultar AFIP",
  "detalle": "Error de AFIP: Código 11002: El punto de venta no se encuentra habilitado a usar en el presente WS. Ver metodo FEParamGetPtosVenta"
}
```

### GET `/api/afip/puntos-venta`

Obtiene la lista de puntos de venta habilitados para el CUIT.

**Ejemplo:**

```
GET /api/afip/puntos-venta
```

**Respuesta:**

```json
{
  "FEParamGetPtosVentaResult": {
    "ResultGet": {
      "PtoVenta": [
        {
          "Nro": 2,
          "EmisionTipo": "CAE - Monotributo",
          "Bloqueado": "N",
          "FchBaja": "20171010"
        },
        {
          "Nro": 4,
          "EmisionTipo": "CAE - Ri Iva",
          "Bloqueado": "N",
          "FchBaja": "NULL"
        }
      ]
    },
    "Events": {
      "Evt": [
        {
          "Code": 39,
          "Msg": "IMPORTANTE: El dia 6 de abril de 2025, se actualizo la version del Web Service..."
        }
      ]
    }
  }
}
```

### GET `/api/afip/condiciones-iva`

Obtiene las condiciones de IVA válidas.

**Ejemplo:**

```
GET /api/afip/condiciones-iva
```

**Respuesta:**

```json
{
  "FEParamGetTiposIvaResult": {
    "ResultGet": {
      "IvaTipo": [
        {
          "Id": 1,
          "Desc": "No Gravado",
          "FchDesde": "20100701",
          "FchHasta": "NULL"
        },
        {
          "Id": 2,
          "Desc": "Exento",
          "FchDesde": "20100701",
          "FchHasta": "NULL"
        }
      ]
    }
  }
}
```

### GET `/api/afip/condiciones-iva-receptor`

Obtiene las condiciones de IVA del receptor válidas.

**Ejemplo:**

```
GET /api/afip/condiciones-iva-receptor
```

**Respuesta:**

```json
{
  "FEParamGetCondicionIvaReceptorResult": {
    "ResultGet": {
      "CondicionIvaReceptor": [
        {
          "Id": 1,
          "Desc": "Responsable Inscripto",
          "FchDesde": "20100701",
          "FchHasta": "NULL"
        },
        {
          "Id": 5,
          "Desc": "Consumidor Final",
          "FchDesde": "20100701",
          "FchHasta": "NULL"
        }
      ]
    }
  }
}
```

### GET `/api/afip/tipos-comprobantes`

Obtiene los tipos de comprobantes válidos.

**Ejemplo:**

```
GET /api/afip/tipos-comprobantes
```

**Respuesta:**

```json
{
  "FEParamGetTiposCbteResult": {
    "ResultGet": {
      "CbteTipo": [
        {
          "Id": 1,
          "Desc": "Factura A",
          "FchDesde": "20100701",
          "FchHasta": "NULL"
        },
        {
          "Id": 6,
          "Desc": "Factura B",
          "FchDesde": "20100701",
          "FchHasta": "NULL"
        }
      ]
    }
  }
}
```

### GET `/api/afip/cotizacion/:moneda`

Obtiene la cotización de una moneda específica.

**Parámetros de ruta:**

- `moneda` (string): Código de moneda (ej: DOL, PES, EUR)

**Ejemplo:**

```
GET /api/afip/cotizacion/DOL
```

**Respuesta:**

```json
{
  "success": true,
  "moneda": "DOL",
  "fecha": "2025-07-15",
  "cotizacion": 1234.56,
  "respuestaCompleta": {
    "MonId": "DOL",
    "FchCotiz": "20250715",
    "MonCotiz": "1234.56"
  }
}
```

### POST `/api/afip/obtener-cae`

Solicita un CAE (Código de Autorización Electrónico) para un comprobante.

**Cuerpo de la petición:**

```json
{
  "tipoComprobante": 1,
  "puntoVenta": 4,
  "numero": 12345,
  "fecha": "20250715",
  "importeTotal": 1210.0,
  "importeNeto": 1000.0,
  "importeIva": 210.0,
  "conceptoIncluido": 1,
  "tipoDocReceptor": 80,
  "nroDocReceptor": "20123456789",
  "alicuotaIva": 21,
  "condicionVenta": 1
}
```

**Respuesta exitosa:**

```json
{
  "success": true,
  "cae": "12345678901234",
  "fechaVencimiento": "2025-08-15",
  "numeroComprobante": 12345,
  "puntoVenta": 4,
  "tipoComprobante": 1
}
```

### POST `/api/afip/comprobante`

Crea un comprobante (alias de obtener-cae).

**Parámetros requeridos:**

- `puntoVenta` (number)
- `tipoComprobante` (number)
- `docNro` (string)
- `importeTotal` (number)

### GET `/api/afip/metodos-disponibles`

Obtiene la lista de métodos disponibles en el Web Service de AFIP.

**Ejemplo:**

```
GET /api/afip/metodos-disponibles
```

**Respuesta:**

```json
{
  "metodos": [
    "FEParamGetTiposCbte",
    "FEParamGetTiposConcepto",
    "FEParamGetTiposDoc",
    "FEParamGetTiposIva",
    "FEParamGetTiposMonedas",
    "FEParamGetTiposOpcional",
    "FEParamGetTiposPaises",
    "FEParamGetTiposTributos",
    "FEParamGetPtosVenta",
    "FEParamGetCotizacion",
    "FEParamGetCondicionIvaReceptor"
  ]
}
```

### GET `/api/afip/test-certificados`

Prueba la configuración de certificados.

**Ejemplo:**

```
GET /api/afip/test-certificados
```

**Respuesta:**

```json
{
  "success": true,
  "diagnostico": {
    "archivos": {
      "certificadoExiste": true,
      "keyExiste": true,
      "certificadoPath": "src/certs/otarola.crt",
      "keyPath": "src/certs/otarola.key"
    },
    "configuracion": {
      "cuit": "27260512078",
      "modo": "production"
    }
  }
}
```

### GET `/api/afip/comprobante-autorizado`

Consulta un comprobante ya autorizado para obtener su CAE y datos completos.

**Parámetros de consulta:**

- `puntoVenta` (number): Punto de venta del comprobante
- `tipoComprobante` (number): Tipo de comprobante (1=Factura A, 6=Factura B, etc.)
- `numeroComprobante` (number): Número del comprobante

**Ejemplo:**

```
GET /api/afip/comprobante-autorizado?puntoVenta=4&tipoComprobante=1&numeroComprobante=12345
```

**Respuesta exitosa:**

```json
{
  "success": true,
  "cae": "12345678901234",
  "fechaVencimiento": "2025-12-31",
  "resultado": "A",
  "puntoVenta": 4,
  "tipoComprobante": 1,
  "numeroComprobante": 12345,
  "fecha": "20250715",
  "importeTotal": 1210.0,
  "importeNeto": 1000.0,
  "importeIva": 210.0,
  "observaciones": null,
  "detalleCompleto": {
    "CAE": "12345678901234",
    "CAEFchVto": "20251231",
    "Resultado": "A",
    "PtoVta": 4,
    "CbteTipo": 1,
    "CbteNro": 12345,
    "CbteFch": "20250715",
    "ImpTotal": 1210.0,
    "ImpNeto": 1000.0,
    "ImpIVA": 210.0
  }
}
```

**Respuesta cuando el comprobante no está autorizado:**

```json
{
  "success": false,
  "resultado": "R",
  "mensaje": "El comprobante no está autorizado",
  "observaciones": [
    {
      "Code": 11,
      "Msg": "El n° de comprobante no es correlativo"
    }
  ]
}
```

**Respuesta de error:**

```json
{
  "error": "Error al consultar comprobante autorizado",
  "detalle": "Error 1001: El comprobante no existe"
}
```

---

## ⭐ Astrial (`/api/astrial`)

### GET `/api/astrial/facturas-sin-cae`

Obtiene facturas y notas de crédito sin CAE desde la base de datos.

**Parámetros de consulta:**

- `puntoVenta` (number, opcional): Filtrar por punto de venta
- `tipo` (string, opcional): Filtrar por tipo (FCA, FCB, NCA, NCB)

**Ejemplo:**

```
GET /api/astrial/facturas-sin-cae?puntoVenta=4&tipo=FCA
```

**Respuesta:**

```json
{
  "success": true,
  "facturas": [
    {
      "tipo": "FCA",
      "puntoVenta": 4,
      "numero": 12345,
      "fecha": "2025-07-15",
      "cliente": "CLI001",
      "clienteDescripcion": "CLIENTE EJEMPLO",
      "importeNeto": 1000.0,
      "importeIva": 210.0,
      "total": 1210.0,
      "alicuotaIva": 21,
      "tipoDocumento": "factura"
    }
  ]
}
```

### POST `/api/astrial/grabar-cae`

Graba un CAE en una factura o nota de crédito.

**Cuerpo de la petición:**

```json
{
  "tipo": "FCA",
  "puntoVenta": 4,
  "numero": 12345,
  "solicitarCAE": true
}
```

**Respuesta exitosa:**

```json
{
  "success": true,
  "mensaje": "CAE obtenido y registrado correctamente",
  "cae": "12345678901234",
  "fechaVencimiento": "2025-08-15"
}
```

---

## 🛠️ Administración de empresa (`/api/admin`)

Cada instancia (`atrarca-<nombre>.janus314.com.ar`) administra **su propia empresa**. Sirve para dar de alta una empresa nueva desde la web y para renovar certificados vencidos sin tocar archivos en el servidor.

**Requisitos en el `.env` de la instancia** (`apps/envs/atrarca-<nombre>.env`):

```bash
ATRARCA_INSTANCIA=fontanella   # nombre único de la instancia
ADMIN_API_KEY=<clave larga>    # sin esta variable los endpoints responden 503
CLAVE_CIFRADO=...              # se usa para cifrar certificados y configuración
```

**Autenticación:** todas las rutas requieren el header `x-admin-key: <ADMIN_API_KEY>`. Si falta o es incorrecto, responden 401.

**Dónde se guarda:**

- Los datos de la empresa van cifrados en `config/instancias/<ATRARCA_INSTANCIA>.json` y tienen prioridad sobre el `.env`.
- El certificado y la key se guardan cifrados en `cert_cifrados/<instancia>_<fecha-hora>.crt|.key.encrypted`. Las versiones sin cifrar nunca se escriben en disco, y las anteriores quedan como respaldo.

**Reinicio:** después de guardar cambios (`PUT` o renovación), la instancia se reinicia sola y tarda unos 20 a 30 segundos en volver.

### GET `/api/admin/empresa`

Devuelve la configuración vigente (con la contraseña de la base enmascarada) y los datos del certificado activo.

```bash
curl -H "x-admin-key: $ADMIN_API_KEY" https://atrarca-fontanella.janus314.com.ar/api/admin/empresa
```

```json
{
  "success": true,
  "instancia": "fontanella",
  "empresa": {
    "cuit": "20123456789",
    "razonSocial": "Fontanella SA",
    "certificado": "./src/certs/fontanella_20261006-020524.crt",
    "key": "./src/certs/fontanella_20261006-020524.key",
    "dbType": "mysql",
    "dbHost": "54.39.97.149",
    "dbPort": "3306",
    "dbUser": "root",
    "dbPassword": "********",
    "dbName": "db_sis_fac",
    "afipMode": "production"
  },
  "certificado": {
    "archivo": "fontanella_20261006-020524.crt",
    "cuit": "20123456789",
    "validoDesde": "2026-10-06T02:05:16.000Z",
    "validoHasta": "2028-10-05T02:05:16.000Z",
    "diasRestantes": 729,
    "vencido": false
  }
}
```

### PUT `/api/admin/empresa`

Alta o edición de la empresa. Se envía como `multipart/form-data`. Todos los campos son opcionales: se actualizan solo los que se mandan.

| Campo | Descripción |
|-------|-------------|
| `cuit` | 11 dígitos sin guiones |
| `razonSocial` | Razón social |
| `dbType`, `dbHost`, `dbPort`, `dbUser`, `dbPassword`, `dbName` | Base de datos del sistema de facturación |
| `afipMode` | `production` o `testing` |
| `certificado` (archivo) | `.crt`/`.pem` emitido por ARCA (PEM o DER) |
| `key` (archivo) | Clave privada sin contraseña (PEM o DER) |

```bash
curl -X PUT https://atrarca-fontanella.janus314.com.ar/api/admin/empresa \
  -H "x-admin-key: $ADMIN_API_KEY" \
  -F cuit=20123456789 -F "razonSocial=Fontanella SA" \
  -F dbHost=54.39.97.149 -F dbPort=3306 -F dbUser=root \
  -F dbPassword=xxxx -F dbName=db_sis_fac \
  -F certificado=@fontanella.crt -F key=@fontanella.key
```

Validaciones de los archivos (responden 400 con `error`):

- El certificado y la key se envían juntos.
- La key tiene que corresponder al certificado.
- El certificado no puede estar vencido.
- El CUIT del certificado (`serialNumber=CUIT ...`) tiene que coincidir con el de la empresa.
- Máximo 100 KB por archivo. Los `.pfx` no se aceptan.

Respuesta: `{ "success": true, "reiniciando": true, ... }`.

### POST `/api/admin/empresa/certificado`

Renovación de certificado: recibe solo los archivos `certificado` y `key`, con las mismas validaciones, y además borra el token WSAA cacheado de ese CUIT.

```bash
curl -X POST https://atrarca-fontanella.janus314.com.ar/api/admin/empresa/certificado \
  -H "x-admin-key: $ADMIN_API_KEY" \
  -F certificado=@nuevo.crt -F key=@nueva.key
```

### POST `/api/admin/empresa/verificar`

Prueba la conexión a la base de datos y la autenticación contra ARCA (WSAA) con la configuración vigente. Siempre responde 200; el resultado está en `success`.

```json
{
  "instancia": "fontanella",
  "cuit": "20123456789",
  "certificado": { "diasRestantes": 729, "vencido": false },
  "baseDatos": { "ok": true },
  "afip": { "ok": false, "error": "Error en el servicio WSAA: ns1:coe.notAuthorized: ..." },
  "success": false
}
```

Errores típicos de `afip.error`:

- `cms.cert.untrusted`: el certificado no fue emitido por ARCA.
- `coe.notAuthorized`: el certificado no está asociado al servicio de facturación electrónica (wsfe) en ARCA, o el CUIT no corresponde.

### Uso desde una web

```js
const form = new FormData();
form.append("cuit", "20123456789");
form.append("razonSocial", "Fontanella SA");
form.append("certificado", inputCert.files[0]);
form.append("key", inputKey.files[0]);

const resp = await fetch("https://atrarca-fontanella.janus314.com.ar/api/admin/empresa", {
  method: "PUT", // o POST a /api/admin/empresa/certificado para renovar
  headers: { "x-admin-key": adminKey }, // no fijar Content-Type: lo arma FormData
  body: form,
});
const data = await resp.json();
// Esperar unos 30 s y llamar a POST /api/admin/empresa/verificar
```

La `ADMIN_API_KEY` no tiene que quedar en el código del navegador: pedila al usuario administrador o enviala desde un backend.

### Flujo para una empresa nueva

1. Crear el contenedor y el túnel (`docker-compose.yml` y `.cloudflared/config.yml`) con un `.env` mínimo: `ATRARCA_INSTANCIA`, `ADMIN_API_KEY`, `CLAVE_CIFRADO`, `AFIP_MODE` y `NODE_ENV`.
2. `PUT /api/admin/empresa` con los datos, el certificado y la key.
3. Esperar el reinicio y llamar a `POST /api/admin/empresa/verificar`.
4. En ARCA, habilitar el punto de venta para Web Services si aparece el error 11002 al facturar.

### Renovación de certificado

1. Generar el nuevo certificado en ARCA y asociarlo al servicio wsfe.
2. `POST /api/admin/empresa/certificado` con el nuevo `.crt` y su `.key`.
3. Esperar el reinicio y llamar a `POST /api/admin/empresa/verificar`. Para controlar vencimientos, revisar `certificado.diasRestantes` en el `GET`.

---

## 🌐 Generales

### GET `/api/test`

Prueba general del API.

**Respuesta:**

```json
{
  "message": "API Router funcionando correctamente"
}
```

### GET `/`

Verificación del servidor.

**Respuesta:**

```
API de AFIP funcionando
```

---

## ⚠️ Códigos de Error Comunes

### Error 11002

```
"El punto de venta no se encuentra habilitado a usar en el presente WS"
```

**Solución:** Usar un punto de venta válido consultando `/api/afip/puntos-venta`

### Error de Certificados

```
"No se pudo firmar el TRA: Command failed: openssl..."
```

**Solución:** Verificar que los archivos de certificado y clave privada existan y estén configurados correctamente.

### Error de Autenticación

```
"No se ha configurado el CUIT de la empresa"
```

**Solución:** Verificar las variables de entorno `EMPRESA_CUIT`, `EMPRESA_CERTIFICADO`, `EMPRESA_KEY`.

---

## 🔧 Configuración de Variables de Entorno

```env
# Configuración AFIP
AFIP_MODE=production
AFIP_CUIT=27260512078

# Configuración Empresa
EMPRESA_CUIT=27260512078
EMPRESA_RAZON_SOCIAL=EMPRESA EJEMPLO
EMPRESA_CERTIFICADO=src/certs/otarola.crt
EMPRESA_KEY=src/certs/privada_otarola.key

# Configuración Base de Datos
EMPRESA_DB_TYPE=mysql
EMPRESA_DB_HOST=localhost
EMPRESA_DB_PORT=3306
EMPRESA_DB_USER=usuario
EMPRESA_DB_PASSWORD=password
EMPRESA_DB_NAME=base_datos
```

---

## 📝 Notas Importantes

1. **Puntos de Venta**: Solo usar puntos de venta habilitados consultando `/api/afip/puntos-venta`
2. **Certificados**: Los archivos deben estar en `src/certs/` y ser accesibles
3. **Fechas**: Usar formato YYYYMMDD para fechas en AFIP
4. **Importes**: Enviar con exactamente 2 decimales
5. **CUIT**: Para facturas tipo A, el CUIT del receptor debe tener 11 dígitos

---

## 🚀 Ejemplos de Uso

### Flujo Completo para Emitir Factura

1. **Consultar puntos de venta habilitados:**

   ```
   GET /api/afip/puntos-venta
   ```

2. **Obtener último comprobante:**

   ```
   GET /api/afip/ultimo-comprobante?puntoVenta=4&tipoComprobante=1
   ```

3. **Solicitar CAE:**
   ```
   POST /api/afip/obtener-cae
   {
     "tipoComprobante": 1,
     "puntoVenta": 4,
     "numero": 12346,
     "fecha": "20250715",
     "importeTotal": 1210.00,
     "importeNeto": 1000.00,
     "importeIva": 210.00,
     "tipoDocReceptor": 80,
     "nroDocReceptor": "20123456789"
   }
   ```

---

### POST `/api/afip/recuperar-actualizar-cae`

Recupera el CAE de un comprobante autorizado en AFIP y lo actualiza automáticamente en la base de datos.

**Cuerpo de la petición:**

```json
{
  "tipoComprobante": "FCA",
  "puntoVenta": 4,
  "numeroComprobante": 12345
}
```

**Parámetros:**

- `tipoComprobante` (string): Tipo de comprobante (FCA, FCB, NCA, NCB)
- `puntoVenta` (number): Punto de venta del comprobante
- `numeroComprobante` (number): Número del comprobante

**Ejemplo:**

```bash
POST /api/afip/recuperar-actualizar-cae
Content-Type: application/json

{
  "tipoComprobante": "FCA",
  "puntoVenta": 4,
  "numeroComprobante": 12345
}
```

**Respuesta exitosa:**

```json
{
  "success": true,
  "mensaje": "CAE recuperado y actualizado correctamente en la base de datos",
  "documento": {
    "tipo": "FCA",
    "puntoVenta": 4,
    "numero": 12345,
    "cliente": "EMPRESA EJEMPLO S.A.",
    "fecha": "2025-01-15",
    "importeNeto": 1000.0,
    "importeIva": 210.0,
    "total": 1210.0
  },
  "cae": {
    "numero": "12345678901234",
    "fechaVencimiento": "2025-12-31",
    "resultado": "A"
  },
  "datosAFIP": {
    "importeTotal": 1210.0,
    "importeNeto": 1000.0,
    "importeIva": 210.0,
    "fecha": "20250115"
  }
}
```

**Respuesta cuando el comprobante no está autorizado:**

```json
{
  "error": "No se pudo recuperar el CAE del comprobante",
  "detalle": "El comprobante no está autorizado",
  "observaciones": [
    {
      "Code": 11,
      "Msg": "El n° de comprobante no es correlativo"
    }
  ]
}
```

**Respuesta cuando el documento no existe en la BD:**

```json
{
  "error": "Documento no encontrado en la base de datos",
  "detalle": "No se encontró FCA 4-12345 en la tabla Facturas"
}
```

**Respuesta de error:**

```json
{
  "error": "Error al recuperar y actualizar CAE",
  "detalle": "Error 1001: El comprobante no existe"
}
```

---

### POST `/api/afip/recuperar-cae-backup`

Recupera un CAE del archivo de backup y lo actualiza en la base de datos.

**Cuerpo de la petición:**

```json
{
  "tipoComprobante": "FCA",
  "puntoVenta": 6,
  "numeroComprobante": 2126
}
```

**Respuesta exitosa:**

```json
{
  "success": true,
  "mensaje": "CAE recuperado del backup y actualizado en la base de datos",
  "documento": {
    "tipo": "FCA",
    "puntoVenta": 6,
    "numero": 2126,
    "cliente": "NOMBRE DEL CLIENTE",
    "fecha": "2025-01-15",
    "importeNeto": 1000.0,
    "importeIva": 210.0,
    "total": 1210.0
  },
  "cae": {
    "numero": "12345678901234",
    "fechaVencimiento": "2025-12-31",
    "timestamp": "2025-01-15T10:30:45.123Z"
  },
  "datosBackup": {
    "importeTotal": 1210.0,
    "importeNeto": 1000.0,
    "importeIva": 210.0,
    "fecha": "20250115"
  }
}
```

### GET `/api/afip/listar-caes-backup`

Lista todos los CAEs almacenados en el archivo de backup.

**Respuesta:**

```json
{
  "success": true,
  "total": 5,
  "estadisticas": {
    "total": 5,
    "porTipo": {
      "FCA": 3,
      "FCB": 2
    },
    "porEmpresa": {
      "27260512078": 5
    },
    "fechaMasAntigua": "2025-01-10T08:15:30.000Z",
    "fechaMasReciente": "2025-01-15T16:45:20.000Z"
  },
  "caes": [
    {
      "timestamp": "2025-01-15T10:30:45.123Z",
      "cae": "12345678901234",
      "fechaVencimiento": "2025-12-31",
      "tipoComprobante": "FCA",
      "puntoVenta": 6,
      "numeroComprobante": 2129,
      "importeTotal": 1210.0,
      "importeNeto": 1000.0,
      "importeIva": 210.0,
      "fecha": "20250115",
      "empresa": "27260512078"
    }
  ]
}
```

### GET `/api/afip/estadisticas-backup`

Obtiene estadísticas del archivo de backup de CAEs.

**Respuesta:**

```json
{
  "success": true,
  "estadisticas": {
    "total": 5,
    "porTipo": {
      "FCA": 3,
      "FCB": 2
    },
    "porEmpresa": {
      "27260512078": 5
    },
    "fechaMasAntigua": "2025-01-10T08:15:30.000Z",
    "fechaMasReciente": "2025-01-15T16:45:20.000Z"
  }
}
```

---

_Documentación generada el 15 de Julio de 2025_
