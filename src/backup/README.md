# 📁 Sistema de Backup de CAEs

## 🎯 Propósito

Este directorio contiene el archivo de backup automático de CAEs (`cae-backup.json`) que se genera automáticamente cuando se obtienen CAEs de AFIP.

## 🔄 Funcionamiento

### **Backup Automático**

- ✅ **Se guarda automáticamente** cada CAE obtenido exitosamente de AFIP
- ✅ **Incluye todos los datos** del comprobante y CAE
- ✅ **Evita duplicados** - actualiza entradas existentes
- ✅ **No interrumpe** la operación principal si falla el backup

### **Recuperación Manual**

- 🔍 **Buscar CAEs** por tipo, punto de venta y número
- 📊 **Listar todos** los CAEs almacenados
- 📈 **Estadísticas** del backup
- 🔄 **Actualizar BD** automáticamente al recuperar

## 📋 Estructura del Archivo

```json
[
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
```

## 🚀 Endpoints Disponibles

### **Recuperar CAE del Backup**

```bash
POST /api/afip/recuperar-cae-backup
{
  "tipoComprobante": "FCA",
  "puntoVenta": 6,
  "numeroComprobante": 2126
}
```

### **Listar Todos los CAEs**

```bash
GET /api/afip/listar-caes-backup
```

### **Estadísticas del Backup**

```bash
GET /api/afip/estadisticas-backup
```

## 💡 Casos de Uso

### **1. CAE Obtenido pero No Guardado en BD**

```bash
# Buscar en backup
GET /api/afip/listar-caes-backup

# Recuperar específico
POST /api/afip/recuperar-cae-backup
{
  "tipoComprobante": "FCA",
  "puntoVenta": 6,
  "numeroComprobante": 2126
}
```

### **2. Verificar CAEs Disponibles**

```bash
# Ver estadísticas
GET /api/afip/estadisticas-backup

# Ver todos los CAEs
GET /api/afip/listar-caes-backup
```

## ⚠️ Consideraciones

- **Limpieza automática**: Los CAEs se eliminan del backup después de actualizar la BD
- **Sin duplicados**: Si se solicita el mismo CAE, se actualiza la entrada existente
- **Respaldo seguro**: El archivo se guarda en formato JSON legible
- **Sin impacto**: Los errores de backup no afectan la operación principal

## 🔧 Mantenimiento

### **Limpieza Manual**

Si necesitas limpiar CAEs antiguos del backup, puedes editar manualmente el archivo `cae-backup.json`.

### **Respaldo del Archivo**

Se recomienda hacer respaldo periódico del archivo `cae-backup.json` en caso de fallos del sistema.

---

**Última actualización:** 15 de Julio de 2025
