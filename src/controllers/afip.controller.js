const afipService = require("../services/afip.service");

exports.getUltimoComprobante = async (req, res) => {
  console.log("getUltimoComprobante", req.query);
  try {
    // Debuggear valores de variables de entorno
    console.log("Valores de configuración:", {
      cuit: process.env.EMPRESA_CUIT,
      certificado: process.env.EMPRESA_CERTIFICADO,
      key: process.env.EMPRESA_KEY,
    });

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

    // Verificar que la empresa tenga todos los datos necesarios
    if (!empresahc.cuit || !empresahc.certificado || !empresahc.key) {
      throw new Error(
        "Faltan datos de configuración de la empresa (CUIT, certificado o key)"
      );
    }

    req.user = { empresa: empresahc };
    // Verificar explícitamente si existe req.user
    // if (!req.user) {
    //   return res.status(401).json({
    //     error: "No autenticado o sesión expirada",
    //     detalle: "Debe iniciar sesión nuevamente",
    //   });
    // }

    const { puntoVenta, tipoComprobante } = req.query;

    // Usar la empresa del usuario autenticado
    const empresa = req.user.empresa;
    if (!empresa) {
      return res.status(403).json({
        error: "El usuario no tiene una empresa asociada",
      });
    }

    // Asegurarnos de que el token pertenezca a la empresa actual
    console.log(`Consultando con CUIT: ${empresa.cuit}`);

    // Pasar la empresa al servicio
    const resultado = await afipService.consultarUltimoComprobante(
      parseInt(puntoVenta),
      parseInt(tipoComprobante),
      empresa
    );

    res.json(resultado);
  } catch (error) {
    console.error("Error en controlador:", error);

    // Mejorar respuesta de error para mostrar más detalles
    res.status(500).json({
      error: "Error al consultar AFIP",
      detalle: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

exports.obtenerCAE = async (req, res) => {
  try {
    const datosComprobante = req.body;

    // Usar la empresa del usuario autenticado
    const empresa = req.user.empresa;
    if (!empresa) {
      return res.status(403).json({
        error: "El usuario no tiene una empresa asociada",
      });
    }

    if (!datosComprobante) {
      return res.status(400).json({
        error: "Debe proporcionar los datos del comprobante",
      });
    }

    // Pasar la empresa al servicio
    const resultado = await afipService.obtenerCAE(datosComprobante, empresa);
    res.json(resultado);
  } catch (error) {
    console.error("Error en controlador:", error);
    res.status(500).json({
      error: "Error al obtener CAE",
      detalle: error.message,
    });
  }
};

exports.createComprobante = async (req, res) => {
  try {
    const datosComprobante = req.body;

    // Validar datos requeridos
    if (
      !datosComprobante.puntoVenta ||
      !datosComprobante.tipoComprobante ||
      !datosComprobante.docNro ||
      !datosComprobante.importeTotal
    ) {
      return res.status(400).json({
        error: "Faltan datos requeridos para el comprobante",
      });
    }

    console.log("Solicitando CAE para comprobante:", datosComprobante);

    // Llamar al servicio AFIP para obtener el CAE
    const resultado = await afipService.obtenerCAE(datosComprobante);
    // console.log("resultado", JSON.stringify(resultado));
    res.status(200).JSON.stringify(resultado);
  } catch (error) {
    console.error("Error al solicitar CAE:", error);
    res.status(500).json({
      error: error.message || "Error al solicitar CAE",
    });
  }
};

exports.getCondicionesIVA = async (req, res) => {
  try {
    // Debuggear valores de variables de entorno
    console.log("Valores de configuración:", {
      cuit: process.env.EMPRESA_CUIT,
      certificado: process.env.EMPRESA_CERTIFICADO,
      key: process.env.EMPRESA_KEY,
    });

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

    // Verificar que la empresa tenga todos los datos necesarios
    if (!empresahc.cuit || !empresahc.certificado || !empresahc.key) {
      throw new Error(
        "Faltan datos de configuración de la empresa (CUIT, certificado o key)"
      );
    }

    const condiciones = await afipService.consultarCondicionesIVA(empresahc);
    res.json(condiciones);
  } catch (error) {
    console.error("Error al consultar condiciones IVA:", error);
    res.status(500).json({
      error: error.message || "Error al consultar condiciones IVA",
    });
  }
};

exports.getCondicionesIVAReceptor = async (req, res) => {
  try {
    // Debuggear valores de variables de entorno
    console.log("Valores de configuración:", {
      cuit: process.env.EMPRESA_CUIT,
      certificado: process.env.EMPRESA_CERTIFICADO,
      key: process.env.EMPRESA_KEY,
    });

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

    // Verificar que la empresa tenga todos los datos necesarios
    if (!empresahc.cuit || !empresahc.certificado || !empresahc.key) {
      throw new Error(
        "Faltan datos de configuración de la empresa (CUIT, certificado o key)"
      );
    }

    const condiciones = await afipService.consultarCondicionesIVAReceptor(
      empresahc
    );
    res.json(condiciones);
  } catch (error) {
    console.error("Error al consultar condiciones IVA receptor:", error);
    res.status(500).json({
      error: error.message || "Error al consultar condiciones IVA receptor",
    });
  }
};

exports.getTiposComprobantes = async (req, res) => {
  try {
    // Debuggear valores de variables de entorno
    console.log("Valores de configuración:", {
      cuit: process.env.EMPRESA_CUIT,
      certificado: process.env.EMPRESA_CERTIFICADO,
      key: process.env.EMPRESA_KEY,
    });

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

    // Verificar que la empresa tenga todos los datos necesarios
    if (!empresahc.cuit || !empresahc.certificado || !empresahc.key) {
      throw new Error(
        "Faltan datos de configuración de la empresa (CUIT, certificado o key)"
      );
    }

    const client = await afipService.getWSFEClient();
    const auth = await afipService.getAuthData(empresahc);

    const resultado = await new Promise((resolve, reject) => {
      client.FEParamGetTiposCbte({ Auth: auth }, function (err, result) {
        if (err) return reject(err);
        resolve(result);
      });
    });

    res.json(resultado);
  } catch (error) {
    console.error("Error al consultar tipos de comprobantes:", error);
    res.status(500).json({
      error: error.message || "Error al consultar tipos de comprobantes",
    });
  }
};

exports.getMetodosDisponibles = async (req, res) => {
  try {
    const client = await afipService.getWSFEClient();

    // Mostrar todos los métodos disponibles en el cliente SOAP
    const metodos = [];
    for (const key in client) {
      if (typeof client[key] === "function" && key.startsWith("FEParam")) {
        metodos.push(key);
      }
    }

    res.json({
      metodos: metodos,
    });
  } catch (error) {
    console.error("Error al consultar métodos disponibles:", error);
    res.status(500).json({
      error: error.message || "Error al consultar métodos disponibles",
    });
  }
};

exports.getPuntosVenta = async (req, res) => {
  try {
    console.log("getPuntosVenta - Consultando puntos de venta habilitados");

    // Debuggear valores de variables de entorno
    console.log("Valores de configuración:", {
      cuit: process.env.EMPRESA_CUIT,
      certificado: process.env.EMPRESA_CERTIFICADO,
      key: process.env.EMPRESA_KEY,
    });

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

    // Verificar que la empresa tenga todos los datos necesarios
    if (!empresahc.cuit || !empresahc.certificado || !empresahc.key) {
      throw new Error(
        "Faltan datos de configuración de la empresa (CUIT, certificado o key)"
      );
    }

    console.log(`Consultando puntos de venta para CUIT: ${empresahc.cuit}`);

    // Pasar la empresa al servicio
    const resultado = await afipService.consultarPuntosVenta(empresahc);

    res.json(resultado);
  } catch (error) {
    console.error("Error en controlador getPuntosVenta:", error);
    res.status(500).json({
      error: "Error al consultar puntos de venta",
      detalle: error.message,
    });
  }
};

exports.getCotizacion = async (req, res) => {
  try {
    const { moneda } = req.params;

    if (!moneda) {
      return res.status(400).json({
        error: "Debe proporcionar el código de moneda (ej: DOL para dólar)",
      });
    }

    console.log(`Consultando cotización para moneda: ${moneda}`);

    // Debuggear valores de variables de entorno
    console.log("Valores de configuración:", {
      cuit: process.env.EMPRESA_CUIT,
      certificado: process.env.EMPRESA_CERTIFICADO,
      key: process.env.EMPRESA_KEY,
    });

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

    // Verificar que la empresa tenga todos los datos necesarios
    if (!empresahc.cuit || !empresahc.certificado || !empresahc.key) {
      throw new Error(
        "Faltan datos de configuración de la empresa (CUIT, certificado o key)"
      );
    }

    const resultado = await afipService.consultarCotizacion(moneda, empresahc);
    res.json(resultado);
  } catch (error) {
    console.error("Error al consultar cotización:", error);
    res.status(500).json({
      error: "Error al consultar cotización",
      detalle: error.message,
    });
  }
};

exports.testCertificados = async (req, res) => {
  try {
    console.log("Iniciando test de certificados por solicitud del usuario");

    // Usar los certificados configurados en variables de entorno
    const empresahc = {
      cuit: process.env.EMPRESA_CUIT,
      razonSocial: process.env.EMPRESA_RAZON_SOCIAL,
      certificado: process.env.EMPRESA_CERTIFICADO,
      key: process.env.EMPRESA_KEY,
    };

    // Verificaciones básicas
    const fs = require("fs");
    const path = require("path");

    const certPath = path.resolve(empresahc.certificado);
    const keyPath = path.resolve(empresahc.key);

    const diagnostico = {
      configuracion: {
        cuit: empresahc.cuit,
        certificadoPath: empresahc.certificado,
        keyPath: empresahc.key,
      },
      archivos: {
        certificadoExiste: fs.existsSync(certPath),
        certificadoRutaAbsoluta: certPath,
        keyExiste: fs.existsSync(keyPath),
        keyRutaAbsoluta: keyPath,
      },
      wsaaUrl: "https://wsaa.afip.gov.ar/ws/services/LoginCms?wsdl",
    };

    // Solo intentar la autenticación si los certificados existen
    if (
      diagnostico.archivos.certificadoExiste &&
      diagnostico.archivos.keyExiste
    ) {
      try {
        // Importar servicios solo cuando sea necesario
        const soap = require("soap");
        const url = diagnostico.wsaaUrl;

        // Verificar si el servicio está disponible
        diagnostico.servicio = { intentando: true };

        try {
          const client = await soap.createClientAsync(url, { timeout: 5000 });
          diagnostico.servicio = {
            disponible: true,
            metodos: Object.keys(client).filter(
              (m) => typeof client[m] === "function"
            ),
          };
        } catch (error) {
          diagnostico.servicio = {
            disponible: false,
            error: error.message,
          };
        }
      } catch (error) {
        diagnostico.autenticacion = {
          success: false,
          error: error.message,
        };
      }
    }

    res.json({
      success: true,
      diagnostico,
    });
  } catch (error) {
    console.error("Error al probar certificados:", error);
    res.status(500).json({
      success: false,
      error: "Error al probar certificados",
      detalle: error.message,
    });
  }
};

exports.consultarComprobanteAutorizado = async (req, res) => {
  try {
    console.log("consultarComprobanteAutorizado", req.query);

    const { puntoVenta, tipoComprobante, numeroComprobante } = req.query;

    // Validar parámetros requeridos
    if (!puntoVenta || !tipoComprobante || !numeroComprobante) {
      return res.status(400).json({
        error:
          "Faltan parámetros requeridos: puntoVenta, tipoComprobante, numeroComprobante",
      });
    }

    // Debuggear valores de variables de entorno
    console.log("Valores de configuración:", {
      cuit: process.env.EMPRESA_CUIT,
      certificado: process.env.EMPRESA_CERTIFICADO,
      key: process.env.EMPRESA_KEY,
    });

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

    // Verificar que la empresa tenga todos los datos necesarios
    if (!empresahc.cuit || !empresahc.certificado || !empresahc.key) {
      throw new Error(
        "Faltan datos de configuración de la empresa (CUIT, certificado o key)"
      );
    }

    req.user = { empresa: empresahc };

    // Usar la empresa del usuario autenticado
    const empresa = req.user.empresa;
    if (!empresa) {
      return res.status(403).json({
        error: "El usuario no tiene una empresa asociada",
      });
    }

    console.log(`Consultando comprobante con CUIT: ${empresa.cuit}`);

    // Pasar la empresa al servicio
    const resultado = await afipService.consultarComprobanteAutorizado(
      parseInt(puntoVenta),
      parseInt(tipoComprobante),
      parseInt(numeroComprobante),
      empresa
    );

    res.json(resultado);
  } catch (error) {
    console.error("Error en controlador:", error);

    res.status(500).json({
      error: "Error al consultar comprobante autorizado",
      detalle: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

exports.recuperarYActualizarCAE = async (req, res) => {
  try {
    console.log("recuperarYActualizarCAE", req.body);

    const { tipoComprobante, puntoVenta, numeroComprobante } = req.body;

    // Validar parámetros requeridos
    if (!tipoComprobante || !puntoVenta || !numeroComprobante) {
      return res.status(400).json({
        error:
          "Faltan parámetros requeridos: tipoComprobante, puntoVenta, numeroComprobante",
      });
    }

    // Mapeo de tipos de comprobante Astrial a AFIP
    const tipoComprobanteMap = {
      FCA: 1, // Factura A
      FCB: 6, // Factura B
      NCA: 3, // Nota de Crédito A
      NCB: 8, // Nota de Crédito B
    };

    // Verificar que el tipo de comprobante sea válido
    if (!tipoComprobanteMap[tipoComprobante]) {
      return res.status(400).json({
        error: "Tipo de comprobante no válido",
        detalle: "Solo se admiten FCA, FCB, NCA, NCB",
        tiposValidos: Object.keys(tipoComprobanteMap),
      });
    }

    const tipoComprobanteAFIP = tipoComprobanteMap[tipoComprobante];

    // Debuggear valores de variables de entorno
    console.log("Valores de configuración:", {
      cuit: process.env.EMPRESA_CUIT,
      certificado: process.env.EMPRESA_CERTIFICADO,
      key: process.env.EMPRESA_KEY,
    });

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

    // Verificar que la empresa tenga todos los datos necesarios
    if (!empresahc.cuit || !empresahc.certificado || !empresahc.key) {
      throw new Error(
        "Faltan datos de configuración de la empresa (CUIT, certificado o key)"
      );
    }

    req.user = { empresa: empresahc };

    // Usar la empresa del usuario autenticado
    const empresa = req.user.empresa;
    if (!empresa) {
      return res.status(403).json({
        error: "El usuario no tiene una empresa asociada",
      });
    }

    console.log(
      `Recuperando CAE para comprobante: Tipo ${tipoComprobante} (AFIP: ${tipoComprobanteAFIP}), Punto de venta ${puntoVenta}, Número ${numeroComprobante}`
    );

    // 1. Consultar el comprobante autorizado en AFIP
    const resultadoAFIP = await afipService.consultarComprobanteAutorizado(
      parseInt(puntoVenta),
      tipoComprobanteAFIP,
      parseInt(numeroComprobante),
      empresa
    );

    if (!resultadoAFIP.success) {
      return res.status(400).json({
        error: "No se pudo recuperar el CAE del comprobante",
        detalle: resultadoAFIP.mensaje,
        observaciones: resultadoAFIP.observaciones,
      });
    }

    // 2. Determinar la tabla según el tipo de comprobante
    const dbService = require("../services/db.service");
    let tabla;
    let clienteField;

    if (tipoComprobante === "FCA" || tipoComprobante === "FCB") {
      tabla = "Facturas";
      clienteField = "ClienteNombre";
    } else if (tipoComprobante === "NCA" || tipoComprobante === "NCB") {
      tabla = "NotasCredito";
      clienteField = "ClienteNombre";
    } else {
      return res.status(400).json({
        error: "Tipo de comprobante no válido",
        detalle: "Solo se admiten FCA, FCB, NCA, NCB",
      });
    }

    // 3. Verificar que el documento existe en la base de datos
    const selectQuery = `
      SELECT * FROM ${tabla} 
      WHERE DocumentoTipo = ? 
        AND DocumentoSucursal = ? 
        AND DocumentoNumero = ?
    `;

    const documentos = await dbService.query(empresa, selectQuery, [
      tipoComprobante,
      parseInt(puntoVenta),
      parseInt(numeroComprobante),
    ]);

    if (documentos.length === 0) {
      return res.status(404).json({
        error: "Documento no encontrado en la base de datos",
        detalle: `No se encontró ${tipoComprobante} ${puntoVenta}-${numeroComprobante} en la tabla ${tabla}`,
      });
    }

    const documento = documentos[0];

    // 4. Actualizar el documento con el CAE recuperado
    const updateQuery = `
      UPDATE ${tabla} 
      SET afip_cae = ?, afip_cae_vencimiento = ?
      WHERE DocumentoTipo = ? 
        AND DocumentoSucursal = ? 
        AND DocumentoNumero = ?
    `;

    await dbService.query(empresa, updateQuery, [
      resultadoAFIP.cae,
      resultadoAFIP.fechaVencimiento,
      tipoComprobante,
      parseInt(puntoVenta),
      parseInt(numeroComprobante),
    ]);

    console.log(
      `CAE actualizado exitosamente: ${resultadoAFIP.cae} para ${tipoComprobante} ${puntoVenta}-${numeroComprobante}`
    );

    // 5. Devolver respuesta exitosa
    res.json({
      success: true,
      mensaje: "CAE recuperado y actualizado correctamente en la base de datos",
      documento: {
        tipo: tipoComprobante,
        puntoVenta: parseInt(puntoVenta),
        numero: parseInt(numeroComprobante),
        cliente: documento[clienteField],
        fecha: documento.Fecha,
        importeNeto: documento.ImporteNeto,
        importeIva: documento.ImporteIva1,
        total: documento.ImporteTotal,
      },
      cae: {
        numero: resultadoAFIP.cae,
        fechaVencimiento: resultadoAFIP.fechaVencimiento,
        resultado: resultadoAFIP.resultado,
      },
      datosAFIP: {
        importeTotal: resultadoAFIP.importeTotal,
        importeNeto: resultadoAFIP.importeNeto,
        importeIva: resultadoAFIP.importeIva,
        fecha: resultadoAFIP.fecha,
      },
    });
  } catch (error) {
    console.error("Error al recuperar y actualizar CAE:", error);

    res.status(500).json({
      error: "Error al recuperar y actualizar CAE",
      detalle: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

exports.recuperarCAEDelBackup = async (req, res) => {
  try {
    const { tipoComprobante, puntoVenta, numeroComprobante } = req.body;

    // Validar parámetros requeridos
    if (!tipoComprobante || !puntoVenta || !numeroComprobante) {
      return res.status(400).json({
        error:
          "Faltan parámetros requeridos: tipoComprobante, puntoVenta, numeroComprobante",
      });
    }

    // Debuggear valores de variables de entorno
    console.log("Valores de configuración:", {
      cuit: process.env.EMPRESA_CUIT,
      certificado: process.env.EMPRESA_CERTIFICADO,
      key: process.env.EMPRESA_KEY,
    });

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

    // Verificar que la empresa tenga todos los datos necesarios
    if (!empresahc.cuit || !empresahc.certificado || !empresahc.key) {
      throw new Error(
        "Faltan datos de configuración de la empresa (CUIT, certificado o key)"
      );
    }

    req.user = { empresa: empresahc };

    // Usar la empresa del usuario autenticado
    const empresa = req.user.empresa;
    if (!empresa) {
      return res.status(403).json({
        error: "El usuario no tiene una empresa asociada",
      });
    }

    console.log(
      `Buscando CAE en backup: Tipo ${tipoComprobante}, Punto de venta ${puntoVenta}, Número ${numeroComprobante}`
    );

    // Importar servicios
    const caeBackupService = require("../services/cae-backup.service");
    const dbService = require("../services/db.service");

    // Buscar en backup
    const caeBackup = await caeBackupService.findCAE(
      tipoComprobante,
      puntoVenta,
      numeroComprobante
    );

    if (!caeBackup) {
      return res.status(404).json({
        error: "CAE no encontrado en backup",
        detalle: `No se encontró backup para ${tipoComprobante} ${puntoVenta}-${numeroComprobante}`,
      });
    }

    // Determinar la tabla según el tipo de comprobante
    let tabla;
    let clienteField;

    if (tipoComprobante === "FCA" || tipoComprobante === "FCB") {
      tabla = "Facturas";
      clienteField = "ClienteNombre";
    } else if (tipoComprobante === "NCA" || tipoComprobante === "NCB") {
      tabla = "NotasCredito";
      clienteField = "ClienteNombre";
    } else {
      return res.status(400).json({
        error: "Tipo de comprobante no válido",
        detalle: "Solo se admiten FCA, FCB, NCA, NCB",
      });
    }

    // Verificar que el documento existe en la base de datos
    const selectQuery = `
      SELECT * FROM ${tabla} 
      WHERE DocumentoTipo = ? 
        AND DocumentoSucursal = ? 
        AND DocumentoNumero = ?
    `;

    const documentos = await dbService.query(empresa, selectQuery, [
      tipoComprobante,
      parseInt(puntoVenta),
      parseInt(numeroComprobante),
    ]);

    if (documentos.length === 0) {
      return res.status(404).json({
        error: "Documento no encontrado en la base de datos",
        detalle: `No se encontró ${tipoComprobante} ${puntoVenta}-${numeroComprobante} en la tabla ${tabla}`,
        caeBackup: caeBackup, // Devolver el CAE del backup aunque no exista en BD
      });
    }

    const documento = documentos[0];

    // Actualizar el documento con el CAE del backup
    const updateQuery = `
      UPDATE ${tabla} 
      SET afip_cae = ?, afip_cae_vencimiento = ?
      WHERE DocumentoTipo = ? 
        AND DocumentoSucursal = ? 
        AND DocumentoNumero = ?
    `;

    await dbService.query(empresa, updateQuery, [
      caeBackup.cae,
      caeBackup.fechaVencimiento,
      tipoComprobante,
      parseInt(puntoVenta),
      parseInt(numeroComprobante),
    ]);

    console.log(
      `CAE recuperado del backup y actualizado: ${caeBackup.cae} para ${tipoComprobante} ${puntoVenta}-${numeroComprobante}`
    );

    // Eliminar del backup después de actualizar BD exitosamente
    await caeBackupService.removeCAE(
      tipoComprobante,
      puntoVenta,
      numeroComprobante
    );

    res.json({
      success: true,
      mensaje: "CAE recuperado del backup y actualizado en la base de datos",
      documento: {
        tipo: tipoComprobante,
        puntoVenta: parseInt(puntoVenta),
        numero: parseInt(numeroComprobante),
        cliente: documento[clienteField],
        fecha: documento.Fecha,
        importeNeto: documento.ImporteNeto,
        importeIva: documento.ImporteIva1,
        total: documento.ImporteTotal,
      },
      cae: {
        numero: caeBackup.cae,
        fechaVencimiento: caeBackup.fechaVencimiento,
        timestamp: caeBackup.timestamp,
      },
      datosBackup: {
        importeTotal: caeBackup.importeTotal,
        importeNeto: caeBackup.importeNeto,
        importeIva: caeBackup.importeIva,
        fecha: caeBackup.fecha,
      },
    });
  } catch (error) {
    console.error("Error al recuperar CAE del backup:", error);

    res.status(500).json({
      error: "Error al recuperar CAE del backup",
      detalle: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

exports.listarCAEsBackup = async (req, res) => {
  try {
    const caeBackupService = require("../services/cae-backup.service");
    const caes = await caeBackupService.getAllCAEs();
    const stats = await caeBackupService.getBackupStats();

    res.json({
      success: true,
      total: caes.length,
      estadisticas: stats,
      caes: caes,
    });
  } catch (error) {
    console.error("Error al listar CAEs del backup:", error);
    res.status(500).json({
      error: "Error al listar CAEs del backup",
      detalle: error.message,
    });
  }
};

exports.estadisticasBackup = async (req, res) => {
  try {
    const caeBackupService = require("../services/cae-backup.service");
    const stats = await caeBackupService.getBackupStats();

    res.json({
      success: true,
      estadisticas: stats,
    });
  } catch (error) {
    console.error("Error al obtener estadísticas del backup:", error);
    res.status(500).json({
      error: "Error al obtener estadísticas del backup",
      detalle: error.message,
    });
  }
};
