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
