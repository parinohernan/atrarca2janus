console.log("CLAVE: CONTROLADOR CORRECTO CARGADO");
const dbService = require("../services/db.service");
const afipService = require("../services/afip.service");
const dotenv = require("dotenv");
dotenv.config();
// Mapeo de tipos de comprobante Astrial a AFIP
const tipoComprobanteMap = {
  FCA: "1", // Factura A
  FCB: "6", // Factura B
  NCA: "3", // Nota de Crédito A
  NCB: "8", // Nota de Crédito B
};
const empresahc = {
  cuit: process.env.EMPRESA_CUIT,
  razonSocial: process.env.EMPRESA_RAZON_SOCIAL,
  certificado: process.env.EMPRESA_CERTIFICADO,
  key: process.env.EMPRESA_KEY,
  dbType: process.env.EMPRESA_DB_TYPE,
  dbHost: process.env.EMPRESA_DB_HOST,
  dbPort: parseInt(process.env.EMPRESA_DB_PORT),
  dbUser: process.env.EMPRESA_DB_USER,
  dbPassword: process.env.EMPRESA_DB_PASSWORD,
  dbName: process.env.EMPRESA_DB_NAME,
};
// Obtener facturas y notas de crédito sin CAE
exports.getFacturasSinCAE = async (req, res) => {
  console.log("getFacturasSinCAE");
  try {
    // Obtener parámetros de consulta
    console.log("Query params:", req.query);
    const { puntoVenta, tipo } = req.query;

    // Verificar que el usuario tenga una empresa asociada
    const empresa = empresahc;
    if (!empresa || !empresa.dbName) {
      return res.status(403).json({
        error: "El usuario no tiene configuración de base de datos",
      });
    }

    // Verificar que la empresa tenga datos de conexión completos
    if (!empresa.dbHost || !empresa.dbUser || !empresa.dbPassword) {
      return res.status(400).json({
        error: "Configuración de base de datos incompleta",
      });
    }

    let facturas = [];

    // 1. Consulta para las facturas
    if (!tipo || tipo === "FCA" || tipo === "FCB") {
      let queryFacturas = `
        SELECT 
          f.DocumentoTipo, 
          f.DocumentoSucursal, 
          f.DocumentoNumero, 
          f.Fecha, 
          f.ClienteCodigo as CodigoCliente, 
          f.ImporteNeto,
          f.ImporteIva1,
          f.ImporteTotal,
          f.PorcentajeIva1,
          'factura' as TipoDocumento,
          c.descripcion as ClienteDescripcion
        FROM facturacabeza f
        LEFT JOIN t_clientes c ON f.ClienteCodigo = c.codigo
        WHERE (f.afip_cae IS NULL OR f.afip_cae = '')
      `;

      // Agregar condiciones de filtro
      const paramsFacturas = [];

      if (puntoVenta) {
        queryFacturas += ` AND f.DocumentoSucursal = ?`;
        paramsFacturas.push(puntoVenta);
      }

      if (tipo) {
        queryFacturas += ` AND f.DocumentoTipo = ?`;
        paramsFacturas.push(tipo);
      }

      queryFacturas += ` ORDER BY f.Fecha DESC LIMIT 50`;

      // Ejecutar consulta para facturas
      const facturasResult = await dbService.query(
        empresa,
        queryFacturas,
        paramsFacturas
      );
      facturas = facturas.concat(facturasResult);
    }

    // 2. Consulta para las notas de crédito
    if (!tipo || tipo === "NCA" || tipo === "NCB") {
      let queryNC = `
        SELECT 
          nc.DocumentoTipo, 
          nc.DocumentoSucursal, 
          nc.DocumentoNumero, 
          nc.Fecha, 
          nc.CodigoCliente, 
          nc.ImporteNeto,
          nc.ImporteIva1,
          nc.ImporteTotal,
          nc.PorcentajeIva1,
          'notacredito' as TipoDocumento,
          nc.factura_tipo,
          nc.factura_sucursal,
          nc.factura_numero,
          c.descripcion as ClienteDescripcion
        FROM notacreditocabeza nc
        LEFT JOIN t_clientes c ON nc.CodigoCliente = c.codigo
        WHERE (nc.afip_cae IS NULL OR nc.afip_cae = '')
      `;

      // Agregar condiciones de filtro
      const paramsNC = [];

      if (puntoVenta) {
        queryNC += ` AND nc.DocumentoSucursal = ?`;
        paramsNC.push(puntoVenta);
      }

      if (tipo) {
        queryNC += ` AND nc.DocumentoTipo = ?`;
        paramsNC.push(tipo);
      }

      queryNC += ` ORDER BY nc.Fecha DESC LIMIT 50`;

      // Ejecutar consulta para notas de crédito
      const ncResult = await dbService.query(empresa, queryNC, paramsNC);
      facturas = facturas.concat(ncResult);
    }

    // Ordenar por fecha descendente
    facturas.sort((a, b) => new Date(b.Fecha) - new Date(a.Fecha));

    // Transformar los resultados para la respuesta
    const facturasFormateadas = facturas.map((f) => ({
      tipo: f.DocumentoTipo,
      puntoVenta: f.DocumentoSucursal,
      numero: f.DocumentoNumero,
      fecha: f.Fecha ? f.Fecha.toISOString().split("T")[0] : null,
      cliente: f.CodigoCliente,
      clienteDescripcion: f.ClienteDescripcion,
      importeNeto: f.ImporteNeto,
      importeIva: f.ImporteIva1,
      total: f.ImporteTotal,
      alicuotaIva: f.PorcentajeIva1,
      tipoDocumento: f.TipoDocumento,
      facturaRef: f.factura_tipo
        ? {
            tipo: f.factura_tipo,
            puntoVenta: f.factura_sucursal,
            numero: f.factura_numero,
          }
        : null,
    }));
    console.log("facturasFormateadas", facturasFormateadas);
    res.json({
      success: true,
      facturas: facturasFormateadas,
    });
  } catch (error) {
    console.error("Error al consultar documentos sin CAE:", error);
    res.status(500).json({
      error: "Error al consultar la base de datos",
      detalle: error.message,
    });
  }
};

// Grabar CAE en factura o nota de crédito
exports.grabarCAE = async (req, res) => {
  try {
    // Verificar que el usuario tenga una empresa asociada
    const todo = {
      username: "empresa1",
      password: "empresa1",
      name: "JHP DEVELOPMENT",
      role: "user",
      empresa: {
        cuit: process.env.EMPRESA_CUIT,
        razonSocial: process.env.EMPRESA_RAZON_SOCIAL,
        certificado: process.env.EMPRESA_CERTIFICADO,
        key: process.env.EMPRESA_KEY,
        dbType: process.env.EMPRESA_DB_TYPE,
        dbHost: process.env.EMPRESA_DB_HOST,
        dbPort: parseInt(process.env.EMPRESA_DB_PORT),
        dbUser: process.env.EMPRESA_DB_USER,
        dbPassword: process.env.EMPRESA_DB_PASSWORD,
        dbName: process.env.EMPRESA_DB_NAME,
      },
    };
    const empresa = todo.empresa;
    if (!empresa || !empresa.dbName) {
      return res.status(403).json({
        error: "El usuario no tiene configuración de base de datos",
      });
    }

    const { tipo, puntoVenta, numero, solicitarCAE } = req.body;

    // Validar que todos los campos requeridos estén presentes
    if (!tipo || !puntoVenta || !numero) {
      return res.status(400).json({
        error: "Faltan parámetros requeridos (tipo, puntoVenta, numero)",
      });
    }

    // Validar que los valores numéricos sean realmente números válidos
    const puntoVentaNum = parseInt(puntoVenta, 10);
    const numeroFactura = parseInt(numero, 10);

    if (isNaN(puntoVentaNum) || isNaN(numeroFactura)) {
      return res.status(400).json({
        error: "El punto de venta y número deben ser valores numéricos válidos",
        detalles: {
          puntoVenta: puntoVenta,
          numero: numero,
          puntoVentaParseado: puntoVentaNum,
          numeroParseado: numeroFactura,
        },
      });
    }

    // Determinar si es factura o nota de crédito
    const esNotaCredito = tipo === "NCA" || tipo === "NCB";
    const tabla = esNotaCredito ? "notacreditocabeza" : "facturacabeza";
    const clienteField = esNotaCredito ? "CodigoCliente" : "ClienteCodigo";

    // SOLUCIÓN ALTERNATIVA: Consulta modificada para asegurar que la unión funcione correctamente
    const query = `
      SELECT d.*, 
             c.cuit as ClienteCUIT, 
             c.tipodocumento as ClienteTipoDoc,
             d.${clienteField} as CodigoClienteReal
      FROM ${tabla} d
      LEFT JOIN t_clientes c ON TRIM(d.${clienteField}) = TRIM(c.codigo)
      WHERE d.DocumentoTipo = ? 
        AND d.DocumentoSucursal = ? 
        AND d.DocumentoNumero = ?
        AND d.FechaAnulacion IS NULL
    `;

    // Ejecutar consulta
    const documentos = await dbService.query(empresa, query, [
      tipo,
      puntoVenta,
      numero,
    ]);

    if (!documentos || documentos.length === 0) {
      return res.status(404).json({
        error: "No se encontró el documento especificado",
      });
    }

    const documento = documentos[0];
    console.log(
      `Datos de ${esNotaCredito ? "nota de crédito" : "factura"} encontrados:`,
      {
        codigo: documento[clienteField],
        cuit: documento.ClienteCUIT,
        tipoDoc: documento.ClienteTipoDoc,
      }
    );

    // Agregar logging adicional para depuración
    console.log(
      "Estructura completa del documento:",
      JSON.stringify(documento)
    );

    // Si se solicita CAE
    if (solicitarCAE) {
      // Establecer el tipo de documento y número según los datos del cliente
      let tipoDocReceptor = 80; // Por defecto CUIT
      let nroDocReceptor = "20000000001"; // Valor por defecto
      if (documento.ClienteCUIT) {
        // Limpiar el CUIT/DNI de caracteres no numéricos
        nroDocReceptor = documento.ClienteCUIT.replace(/\D/g, "");
        console.log(`CUIT del cliente procesado: ${nroDocReceptor}`);

        // Si está definido el tipo de documento del cliente, usarlo
        if (documento.ClienteTipoDoc) {
          tipoDocReceptor = parseInt(documento.ClienteTipoDoc, 10);
        }
        // Si no hay tipo definido pero el número parece DNI (menor a 10 millones)
        else if (parseInt(nroDocReceptor, 10) < 10000000) {
          tipoDocReceptor = 96; // DNI
        }
      } else {
        console.log(
          "ADVERTENCIA: No se encontró CUIT para el cliente, usando valor por defecto"
        );
      }

      // Validación adicional para el CUIT
      if (nroDocReceptor) {
        // Eliminar caracteres no numéricos
        nroDocReceptor = nroDocReceptor.replace(/\D/g, "");

        // Verificar longitud del CUIT (debe ser 11 dígitos)
        if (nroDocReceptor.length !== 11) {
          console.warn(
            `CUIT con formato incorrecto: ${nroDocReceptor}, longitud: ${nroDocReceptor.length}`
          );
          // Si es un CUIT incompleto y el tipo doc es 80, usar consumidor final
          if (tipoDocReceptor === 80) {
            tipoDocReceptor = 99; // Tipo doc consumidor final
            nroDocReceptor = "0"; // Número para consumidor final
          }
        }
      }

      // Verificar si es una nota de crédito
      const esNotaCredito = tipo === "NCA";

      // Inicializar datos adicionales
      let datosAdicionales = {};

      console.log("=== DATOS EN EL CONTROLADOR ===");
      console.log("Datos de la base de datos:", {
        importeTotal: documento.ImporteTotal,
        importeNeto: documento.ImporteNeto,
        importeIva1: documento.ImporteIva1,
        importeIva2: documento.ImporteIva2,
        baseImponible1: documento.BaseImponible1,
        baseImponible2: documento.BaseImponible2,
        porcentajeIva1: documento.PorcentajeIva1,
        porcentajeIva2: documento.PorcentajeIva2,
      });

      // Corregir el formato de los importes para la solicitud de CAE
      const importeTotal = parseFloat(
        parseFloat(documento.ImporteTotal).toFixed(2)
      );
      const importeNeto = parseFloat(
        parseFloat(documento.ImporteNeto).toFixed(2)
      );

      // Calcular el IVA total sumando ambas alícuotas
      const importeIvaTotal =
        parseFloat(documento.ImporteIva1 || 0) +
        parseFloat(documento.ImporteIva2 || 0);

      // Preparar alícuotas múltiples
      const alicuotasIVA = [];

      // Agregar primera alícuota si existe
      if (
        documento.BaseImponible1 &&
        documento.ImporteIva1 &&
        documento.PorcentajeIva1
      ) {
        alicuotasIVA.push({
          porcentaje: parseFloat(documento.PorcentajeIva1),
          baseImponible: parseFloat(documento.BaseImponible1),
          importe: parseFloat(documento.ImporteIva1),
        });
      }

      // Agregar segunda alícuota si existe
      if (
        documento.BaseImponible2 &&
        documento.ImporteIva2 &&
        documento.PorcentajeIva2
      ) {
        alicuotasIVA.push({
          porcentaje: parseFloat(documento.PorcentajeIva2),
          baseImponible: parseFloat(documento.BaseImponible2),
          importe: parseFloat(documento.ImporteIva2),
        });
      }

      // Asegurar que la fecha no sea futura
      const fechaActual = new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "");
      const fechaDocumento = documento.Fecha
        ? new Date(documento.Fecha).toISOString().slice(0, 10).replace(/-/g, "")
        : fechaActual;

      // Si la fecha es futura, usar la fecha actual
      const fechaFinal =
        fechaDocumento > fechaActual ? fechaActual : fechaDocumento;

      // Usar la fecha corregida
      const datosComprobante = {
        tipoComprobante: mapearTipoComprobante(tipo),
        puntoVenta: puntoVentaNum.toString(),
        numero: numeroFactura.toString(),
        fecha: fechaFinal,
        importeTotal: Math.round(importeTotal * 100) / 100,
        importeNeto: Math.round(importeNeto * 100) / 100,
        importeIva: Math.round(importeIvaTotal * 100) / 100, // Usar el IVA total con 2 decimales
        conceptoIncluido: 1, // 1 = Productos
        tipoDocReceptor: tipoDocReceptor,
        nroDocReceptor: nroDocReceptor,
        cuitCliente: nroDocReceptor, // Agregar cuitCliente para el servicio AFIP
        alicuotaIva: parseFloat(documento.PorcentajeIva1) || 21, // Mantener para compatibilidad
        condicionVenta: 1, // 1 = Contado
        alicuotasIVA: alicuotasIVA.map((iva) => ({
          porcentaje: iva.porcentaje,
          baseImponible: Math.round(iva.baseImponible * 100) / 100,
          importe: Math.round(iva.importe * 100) / 100,
        })), // Formatear alícuotas con 2 decimales
        ...datosAdicionales,
      };

      console.log("🔍 CLAVE: Tipo original:", tipo);
      console.log("🔍 CLAVE: Tipo mapeado:", datosComprobante.tipoComprobante);
      console.log(
        "🔍 CLAVE: ¿Es nota de crédito/débito?",
        datosComprobante.tipoComprobante === 2 ||
          datosComprobante.tipoComprobante === 3
      );

      // Para notas de crédito y débito, obtener el comprobante asociado
      if (
        datosComprobante.tipoComprobante === 2 ||
        datosComprobante.tipoComprobante === 3
      ) {
        console.log("✅ CLAVE: Procesando nota de crédito/débito...");

        // Los datos del comprobante asociado ya están en el documento
        if (
          documento.factura_tipo &&
          documento.factura_sucursal &&
          documento.factura_numero
        ) {
          console.log("✅ CLAVE: Datos del comprobante asociado encontrados:", {
            factura_tipo: documento.factura_tipo,
            factura_sucursal: documento.factura_sucursal,
            factura_numero: documento.factura_numero,
          });

          // Mapear el tipo de factura a número
          const tipoFacturaMap = {
            A: 1,
            B: 6,
            C: 11,
            E: 19,
            M: 51,
          };

          datosComprobante.comprobanteAsociado = {
            tipo: tipoFacturaMap[documento.factura_tipo] || 1,
            puntoVenta: documento.factura_sucursal,
            numero: documento.factura_numero,
          };

          console.log(
            "✅ CLAVE: Comprobante asociado agregado:",
            datosComprobante.comprobanteAsociado
          );
        } else {
          console.warn(
            "⚠️ CLAVE: No se encontraron datos del comprobante asociado"
          );
        }
      } else {
        console.log("❌ CLAVE: No es nota de crédito/débito");
      }

      console.log("🔍 CLAVE: Datos finales enviados al servicio:", {
        tipoComprobante: datosComprobante.tipoComprobante,
        comprobanteAsociado: datosComprobante.comprobanteAsociado,
        comprobantesAsociados: datosComprobante.comprobantesAsociados,
      });

      // Solicitar CAE a AFIP (con verificación de backup)
      const resultadoAFIP = await afipService.obtenerCAEConBackup(
        datosComprobante,
        empresa
      );

      console.log("Respuesta AFIP completa:", resultadoAFIP);
      console.log("CAE obtenido:", resultadoAFIP.cae);
      console.log("Fecha vencimiento:", resultadoAFIP.caeVencimiento);

      if (!resultadoAFIP.cae) {
        return res.status(400).json({
          error: "Error al obtener CAE de AFIP",
          detalle: resultadoAFIP.observaciones || "No se pudo obtener el CAE",
        });
      }

      // Pequeño delay para evitar interrupciones de nodemon
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Actualizar el documento con el CAE
      const updateQuery = `
        UPDATE ${tabla} 
        SET afip_cae = ?, afip_cae_vencimiento = ?, afip_cae_observaciones = ?
        WHERE DocumentoTipo = ? 
          AND DocumentoSucursal = ? 
          AND DocumentoNumero = ?
      `;

      console.log("Ejecutando actualización en BD con query:", updateQuery);
      console.log("Parámetros:", [
        resultadoAFIP.cae,
        resultadoAFIP.caeVencimiento,
        resultadoAFIP.observaciones || "",
        tipo,
        puntoVenta,
        numero,
      ]);

      // Truncar observaciones a 250 caracteres para evitar error de longitud
      const observacionesTruncadas = (
        resultadoAFIP.observaciones || ""
      ).substring(0, 250);

      const updateResult = await dbService.query(empresa, updateQuery, [
        resultadoAFIP.cae,
        resultadoAFIP.caeVencimiento,
        observacionesTruncadas,
        tipo,
        puntoVenta,
        numero,
      ]);

      console.log("Resultado de actualización en BD:", updateResult);

      return res.json({
        success: true,
        mensaje: "CAE obtenido y registrado correctamente",
        cae: resultadoAFIP.cae,
        fechaVencimiento: resultadoAFIP.caeVencimiento,
        observaciones: resultadoAFIP.observaciones,
        fromBackup: resultadoAFIP.fromBackup || false,
        updateResult: updateResult,
      });
    }

    // Si no se solicita CAE, solo devolver la información del documento
    return res.json({
      success: true,
      documento: {
        tipo: documento.DocumentoTipo,
        puntoVenta: documento.DocumentoSucursal,
        numero: documento.DocumentoNumero,
        fecha: documento.Fecha,
        cliente: documento[clienteField],
        importeNeto: documento.ImporteNeto,
        importeIva: documento.ImporteIva1,
        total: documento.ImporteTotal,
      },
    });
  } catch (error) {
    console.error("Error al procesar documento:", error);
    res.status(500).json({
      error: "Error al procesar el documento",
      detalle: error.message,
    });
  }
};

// Función auxiliar para mapear tipos de comprobante
function mapearTipoComprobante(tipoAstrial) {
  const mapa = {
    FCA: 1, // Factura A
    FCB: 6, // Factura B
    NCA: 3, // Nota de Crédito A
    NDA: 2, // Nota de Débito A
    NCB: 8, // Nota de Crédito B
    NDB: 7, // Nota de Débito B
  };

  return mapa[tipoAstrial] || 1; // Default a Factura A si no se encuentra
}

// Endpoint para diagnosticar la base de datos
exports.diagnosticarBD = async (req, res) => {
  try {
    console.log("Diagnosticando base de datos...");

    const empresa = {
      cuit: process.env.EMPRESA_CUIT,
      razonSocial: process.env.EMPRESA_RAZON_SOCIAL,
      certificado: process.env.EMPRESA_CERTIFICADO,
      key: process.env.EMPRESA_KEY,
      dbType: process.env.EMPRESA_DB_TYPE,
      dbHost: process.env.EMPRESA_DB_HOST,
      dbPort: parseInt(process.env.EMPRESA_DB_PORT),
      dbUser: process.env.EMPRESA_DB_USER,
      dbPassword: process.env.EMPRESA_DB_PASSWORD,
      dbName: process.env.EMPRESA_DB_NAME,
    };

    if (!empresa.dbName) {
      return res.status(400).json({
        error: "No se ha configurado la base de datos",
        configuracion: {
          dbHost: empresa.dbHost,
          dbPort: empresa.dbPort,
          dbUser: empresa.dbUser,
          dbName: empresa.dbName,
        },
      });
    }

    const dbService = require("../services/db.service");

    // 1. Verificar conexión
    let conexion;
    try {
      conexion = await dbService.getConnection(empresa);
      console.log("✅ Conexión a BD exitosa");
    } catch (error) {
      return res.status(500).json({
        error: "Error al conectar con la base de datos",
        detalle: error.message,
        configuracion: {
          dbHost: empresa.dbHost,
          dbPort: empresa.dbPort,
          dbUser: empresa.dbUser,
          dbName: empresa.dbName,
        },
      });
    }

    // 2. Obtener todas las tablas
    const tablasQuery = "SHOW TABLES";
    const tablas = await dbService.query(empresa, tablasQuery);

    console.log("Tablas encontradas:", tablas);

    // 3. Buscar tablas relacionadas con facturas
    const tablasFacturas = tablas.filter((tabla) => {
      const nombreTabla = Object.values(tabla)[0];
      return (
        nombreTabla.toLowerCase().includes("factura") ||
        nombreTabla.toLowerCase().includes("nota") ||
        nombreTabla.toLowerCase().includes("cabeza") ||
        nombreTabla.toLowerCase().includes("head")
      );
    });

    // 4. Verificar tablas específicas que necesitamos
    const tablasNecesarias = [
      "facturaCabeza",
      "facturacabeza",
      "factura_cabeza",
      "facturas",
      "notacreditocabeza",
      "nota_credito_cabeza",
      "notas_credito",
      "t_clientes",
    ];

    const tablasEncontradas = {};
    for (const tablaNecesaria of tablasNecesarias) {
      const existe = tablas.some((tabla) => {
        const nombreTabla = Object.values(tabla)[0];
        return nombreTabla.toLowerCase() === tablaNecesaria.toLowerCase();
      });
      tablasEncontradas[tablaNecesaria] = existe;
    }

    // 5. Si encontramos tablas de facturas, verificar su estructura
    let estructuraTablas = {};
    if (tablasFacturas.length > 0) {
      for (const tabla of tablasFacturas.slice(0, 3)) {
        // Solo las primeras 3
        const nombreTabla = Object.values(tabla)[0];
        try {
          const estructuraQuery = `DESCRIBE \`${nombreTabla}\``;
          const estructura = await dbService.query(empresa, estructuraQuery);
          estructuraTablas[nombreTabla] = estructura;
        } catch (error) {
          estructuraTablas[nombreTabla] = { error: error.message };
        }
      }
    }

    res.json({
      success: true,
      diagnostico: {
        conexion: "✅ Exitosa",
        baseDatos: empresa.dbName,
        servidor: empresa.dbHost,
        totalTablas: tablas.length,
        tablasFacturas: tablasFacturas.map((t) => Object.values(t)[0]),
        tablasNecesarias: tablasEncontradas,
        estructuraTablas: estructuraTablas,
        todasLasTablas: tablas.map((t) => Object.values(t)[0]),
      },
    });
  } catch (error) {
    console.error("Error al diagnosticar BD:", error);
    res.status(500).json({
      error: "Error al diagnosticar la base de datos",
      detalle: error.message,
    });
  }
};

// Endpoint para verificar estructura de facturacabeza
exports.verificarEstructuraFactura = async (req, res) => {
  try {
    console.log("Verificando estructura de facturacabeza...");

    const empresa = {
      cuit: process.env.EMPRESA_CUIT,
      razonSocial: process.env.EMPRESA_RAZON_SOCIAL,
      certificado: process.env.EMPRESA_CERTIFICADO,
      key: process.env.EMPRESA_KEY,
      dbType: process.env.EMPRESA_DB_TYPE,
      dbHost: process.env.EMPRESA_DB_HOST,
      dbPort: parseInt(process.env.EMPRESA_DB_PORT),
      dbUser: process.env.EMPRESA_DB_USER,
      dbPassword: process.env.EMPRESA_DB_PASSWORD,
      dbName: process.env.EMPRESA_DB_NAME,
    };

    const dbService = require("../services/db.service");

    // 1. Verificar estructura de facturacabeza
    const estructuraQuery = "DESCRIBE facturacabeza";
    const estructura = await dbService.query(empresa, estructuraQuery);

    // 2. Buscar campos específicos que necesitamos
    const camposNecesarios = [
      "DocumentoTipo",
      "DocumentoSucursal",
      "DocumentoNumero",
      "Fecha",
      "ClienteCodigo",
      "ImporteNeto",
      "ImporteIva1",
      "ImporteTotal",
      "PorcentajeIva1",
      "afip_cae",
      "afip_cae_vencimiento",
      "FechaAnulacion",
    ];

    const camposEncontrados = {};
    for (const campo of camposNecesarios) {
      const existe = estructura.some((col) => col.Field === campo);
      camposEncontrados[campo] = existe;
    }

    // 3. Verificar si hay datos en la tabla
    const countQuery = "SELECT COUNT(*) as total FROM facturacabeza";
    const countResult = await dbService.query(empresa, countQuery);
    const totalRegistros = countResult[0].total;

    // 4. Verificar si hay registros sin CAE
    const sinCAEQuery =
      "SELECT COUNT(*) as total FROM facturacabeza WHERE (afip_cae IS NULL OR afip_cae = '')";
    const sinCAEResult = await dbService.query(empresa, sinCAEQuery);
    const registrosSinCAE = sinCAEResult[0].total;

    // 5. Obtener algunos ejemplos de registros
    const ejemplosQuery = `
      SELECT DocumentoTipo, DocumentoSucursal, DocumentoNumero, Fecha, ClienteCodigo, ImporteTotal, afip_cae
      FROM facturacabeza 
      ORDER BY Fecha DESC 
      LIMIT 5
    `;
    const ejemplos = await dbService.query(empresa, ejemplosQuery);

    res.json({
      success: true,
      estructura: {
        tabla: "facturacabeza",
        totalCampos: estructura.length,
        camposNecesarios: camposEncontrados,
        estructuraCompleta: estructura,
        totalRegistros: totalRegistros,
        registrosSinCAE: registrosSinCAE,
        ejemplos: ejemplos,
      },
    });
  } catch (error) {
    console.error("Error al verificar estructura:", error);
    res.status(500).json({
      error: "Error al verificar la estructura de facturacabeza",
      detalle: error.message,
    });
  }
};

// Endpoint para verificar el estado del CAE en la base de datos
exports.verificarCAE = async (req, res) => {
  try {
    const { tipo, puntoVenta, numero } = req.params;

    if (!tipo || !puntoVenta || !numero) {
      return res.status(400).json({
        error: "Faltan parámetros requeridos: tipo, puntoVenta, numero",
      });
    }

    console.log(`Verificando CAE para: ${tipo} ${puntoVenta}-${numero}`);

    const empresa = {
      cuit: process.env.EMPRESA_CUIT,
      razonSocial: process.env.EMPRESA_RAZON_SOCIAL,
      certificado: process.env.EMPRESA_CERTIFICADO,
      key: process.env.EMPRESA_KEY,
      dbType: process.env.EMPRESA_DB_TYPE,
      dbHost: process.env.EMPRESA_DB_HOST,
      dbPort: parseInt(process.env.EMPRESA_DB_PORT),
      dbUser: process.env.EMPRESA_DB_USER,
      dbPassword: process.env.EMPRESA_DB_PASSWORD,
      dbName: process.env.EMPRESA_DB_NAME,
    };

    const dbService = require("../services/db.service");

    // Determinar la tabla según el tipo de documento
    const tabla = tipo === "FCA" ? "factura_a" : "factura_b";

    const query = `
      SELECT DocumentoTipo, DocumentoSucursal, DocumentoNumero, 
             afip_cae, afip_cae_vencimiento, afip_cae_observaciones,
             ImporteTotal, ImporteNeto, ImporteIva1
      FROM ${tabla} 
      WHERE DocumentoTipo = ? 
        AND DocumentoSucursal = ? 
        AND DocumentoNumero = ?
    `;

    const [documento] = await dbService.query(empresa, query, [
      tipo,
      puntoVenta,
      numero,
    ]);

    if (!documento) {
      return res.status(404).json({
        error: "Documento no encontrado",
        busqueda: { tipo, puntoVenta, numero },
      });
    }

    return res.json({
      success: true,
      documento: {
        tipo: documento.DocumentoTipo,
        puntoVenta: documento.DocumentoSucursal,
        numero: documento.DocumentoNumero,
        cae: documento.afip_cae,
        caeVencimiento: documento.afip_cae_vencimiento,
        caeObservaciones: documento.afip_cae_observaciones,
        importeTotal: documento.ImporteTotal,
        importeNeto: documento.ImporteNeto,
        importeIva: documento.ImporteIva1,
        tieneCAE: !!documento.afip_cae,
      },
    });
  } catch (error) {
    console.error("Error al verificar CAE:", error);
    res.status(500).json({
      error: "Error al verificar CAE",
      detalle: error.message,
    });
  }
};
