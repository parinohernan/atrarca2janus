const soap = require("soap");
const wsaaService = require("./wsaa.service");
const { esNotaCreditoDebito } = require("../utils/afipComprobantes.util");
const {
  mapearCondicionIvaReceptor,
} = require("../utils/condicionIvaReceptor.util");
const fs = require("fs");
const path = require("path");

// URLs de servicios AFIP
const URLS = {
  testing: {
    wsfe: "https://wswhomo.afip.gov.ar/wsfev1/service.asmx?WSDL",
  },
  production: {
    wsfe: "https://servicios1.afip.gov.ar/wsfev1/service.asmx?WSDL",
  },
};

class AfipService {
  constructor() {
    this.mode = process.env.AFIP_MODE || "testing";
    this.wsfeClient = null;
    this.cuit = process.env.AFIP_CUIT;
    console.log("AFIP_CUIT", this.cuit);
  }

  // Método para establecer la empresa actual
  setEmpresa(empresa) {
    if (!empresa || !empresa.cuit) {
      throw new Error("Datos de empresa incompletos");
    }

    this.cuit = empresa.cuit;
    console.log(`Usando CUIT: ${this.cuit} para operaciones AFIP`);
  }

  async getWSFEClient() {
    if (!this.wsfeClient) {
      try {
        this.wsfeClient = await new Promise((resolve, reject) => {
          soap.createClient(URLS[this.mode].wsfe, (err, client) => {
            if (err) return reject(err);
            resolve(client);
          });
        });
      } catch (error) {
        console.error("Error al crear cliente SOAP:", error);
        throw new Error(
          "No se pudo conectar con el servicio de AFIP: " + error.message
        );
      }
    }
    return this.wsfeClient;
  }

  // Modificar getAuthData para usar la empresa del usuario
  async getAuthData(empresa) {
    try {
      if (empresa) {
        this.setEmpresa(empresa);
      }
      // Verificar que el CUIT está configurado
      if (!this.cuit) {
        throw new Error("No se ha configurado el CUIT de la empresa");
      }

      // Pasar la empresa al servicio WSAA
      const { token, sign } = await wsaaService.authenticate("wsfe", empresa);
      return {
        Token: token,
        Sign: sign,
        Cuit: this.cuit,
      };
    } catch (error) {
      console.error("Error al obtener datos de autenticación:", error);
      throw error;
    }
  }

  async consultarUltimoComprobante(puntoVenta, tipoComprobante, empresa) {
    try {
      console.log(
        `Consultando último comprobante: Punto de venta ${puntoVenta}, Tipo ${tipoComprobante}`
      );

      // Pasar la empresa a getAuthData
      const authData = await this.getAuthData(empresa);

      // Obtener el cliente SOAP para WSFE
      const client = await this.getWSFEClient();

      // Preparar parámetros para la solicitud
      const params = {
        Auth: authData,
        PtoVta: puntoVenta,
        CbteTipo: tipoComprobante,
      };

      // Llamar al método FECompUltimoAutorizado
      const resultado = await new Promise((resolve, reject) => {
        client.FECompUltimoAutorizado(params, function (err, result) {
          if (err) return reject(err);
          resolve(result);
        });
      });

      // Agregar esto para depuración
      console.log(
        "Estructura de respuesta AFIP:",
        JSON.stringify(resultado, null, 2)
      );

      // Verificar si hay errores en la respuesta
      if (resultado.FECompUltimoAutorizadoResult.Errors) {
        const errors = this.formatearErrores(
          resultado.FECompUltimoAutorizadoResult.Errors
        );
        throw new Error(`Error de AFIP: ${errors}`);
      }

      // Formatear respuesta
      return {
        success: true,
        fecha: new Date().toISOString().slice(0, 10),
        ultimoComprobante: resultado.FECompUltimoAutorizadoResult.CbteNro,
      };
    } catch (error) {
      console.error("Error al consultar último comprobante:", error);
      throw new Error(
        `Error al consultar último comprobante: ${error.message}`
      );
    }
  }

  // Método para formatear errores u observaciones de AFIP en un mensaje legible
  formatearErrores(errors) {
    try {
      if (!errors) return "Error desconocido";

      // Observaciones (FECAEDetResponse)
      if (Array.isArray(errors.Obs)) {
        return errors.Obs.map((e) => `Código ${e.Code}: ${e.Msg}`).join(". ");
      }
      if (errors.Obs) {
        return `Código ${errors.Obs.Code}: ${errors.Obs.Msg}`;
      }

      // Errores (Errors / Err)
      if (Array.isArray(errors.Err)) {
        return errors.Err.map((e) => `Código ${e.Code}: ${e.Msg}`).join(". ");
      }
      if (errors.Err) {
        return `Código ${errors.Err.Code}: ${errors.Err.Msg}`;
      }

      return JSON.stringify(errors);
    } catch (error) {
      console.error("Error al formatear errores:", error);
      return "Error al procesar la respuesta de AFIP";
    }
  }

  extraerDetalleCae(resultado) {
    const raw = resultado?.FECAESolicitarResult?.FeDetResp?.FECAEDetResponse;
    if (!raw) return null;
    return Array.isArray(raw) ? raw[0] : raw;
  }

  // Método para obtener CAE con backup
  async obtenerCAEConBackup(datosComprobante, empresa) {
    try {
      console.log("Intentando obtener CAE con backup...");

      // Primero intentar obtener del backup
      const caeBackup = await this.obtenerCAEDelBackup(datosComprobante);
      if (caeBackup) {
        console.log("CAE encontrado en backup:", caeBackup);
        return caeBackup;
      }

      // Si no hay backup, solicitar nuevo CAE
      console.log("No se encontró CAE en backup, solicitando nuevo...");
      return await this.obtenerCAE(datosComprobante, empresa);
    } catch (error) {
      console.error("Error en obtenerCAEConBackup:", error);
      throw error;
    }
  }

  // Método para obtener CAE del backup
  async obtenerCAEDelBackup(datosComprobante) {
    try {
      const caeBackupService = require("./cae-backup.service");
      const backup = await caeBackupService.findCAE(
        datosComprobante.tipoComprobante,
        datosComprobante.puntoVenta,
        datosComprobante.numero
      );

      if (backup && backup.cae) {
        console.log("CAE encontrado en backup:", backup.cae);
        return {
          cae: backup.cae,
          caeVencimiento: backup.caeVencimiento,
          observaciones: backup.observaciones,
          fromBackup: true,
        };
      }

      return null;
    } catch (error) {
      console.error("Error al obtener CAE del backup:", error);
      return null;
    }
  }

  // Método para obtener CAE de AFIP
  async obtenerCAE(datosComprobante, empresa) {
    try {
      console.log("Solicitando CAE a AFIP...");
      console.log(
        "Datos del comprobante:",
        JSON.stringify(datosComprobante, null, 2)
      );

      // Obtener datos de autenticación
      const authData = await this.getAuthData(empresa);

      // Obtener cliente SOAP
      const client = await this.getWSFEClient();

      const condicionIVAReceptorId = mapearCondicionIvaReceptor(
        datosComprobante.condicionIVAReceptorId ??
          datosComprobante.categoriaIvaReceptor,
        datosComprobante.tipoComprobante
      );
      console.log(
        `CondicionIVAReceptorId=${condicionIVAReceptorId} (categoria=${datosComprobante.categoriaIvaReceptor || datosComprobante.condicionIVAReceptorId || "default"})`
      );

      // Preparar datos del comprobante
      const comprobante = {
        Concepto: 1, // Productos
        DocTipo: 80, // CUIT
        DocNro: datosComprobante.cuitCliente,
        CbteDesde: datosComprobante.numero,
        CbteHasta: datosComprobante.numero,
        CbteFch: datosComprobante.fecha || this.formatearFecha(new Date()),
        ImpTotal: Math.round(datosComprobante.importeTotal * 100) / 100,
        ImpTotConc: 0,
        ImpNeto: Math.round(datosComprobante.importeNeto * 100) / 100,
        ImpOpEx: 0,
        ImpIVA: Math.round(datosComprobante.importeIva * 100) / 100,
        ImpTrib: 0,
        FchServDesde: null,
        FchServHasta: null,
        FchVtoPago: null,
        MonId: "PES",
        MonCotiz: 1,
        CondicionIVAReceptorId: condicionIVAReceptorId,
        Tributos: null,
        Iva: {
          AlicIva: datosComprobante.alicuotasIVA.map((iva) => ({
            Id: iva.porcentaje === 21 ? 5 : 4, // 5=21%, 4=10.5%
            BaseImp: Math.round(iva.baseImponible * 100) / 100,
            Importe: Math.round(iva.importe * 100) / 100,
          })),
        },
        Opcionales: null,
      };

      // Notas de crédito/débito (A/B/C): AFIP exige CbteAsoc
      const tipoCbte = Number(datosComprobante.tipoComprobante);
      console.log(
        "🔍 CLAVE AFIP: Verificando tipo de comprobante:",
        tipoCbte
      );

      if (esNotaCreditoDebito(tipoCbte)) {
        console.log(
          "✅ CLAVE AFIP: Tipo de comprobante es nota de crédito/débito, procesando..."
        );
        console.log(
          "🔍 CLAVE AFIP: comprobanteAsociado:",
          datosComprobante.comprobanteAsociado
        );
        console.log(
          "🔍 CLAVE AFIP: comprobantesAsociados:",
          datosComprobante.comprobantesAsociados
        );

        const asociados = [];
        if (Array.isArray(datosComprobante.comprobantesAsociados)) {
          for (const c of datosComprobante.comprobantesAsociados) {
            if (c?.tipo != null && c?.puntoVenta != null && c?.numero != null) {
              asociados.push({
                Tipo: Number(c.tipo),
                PtoVta: Number(c.puntoVenta),
                Nro: Number(c.numero),
              });
            }
          }
        } else if (datosComprobante.comprobanteAsociado) {
          const c = datosComprobante.comprobanteAsociado;
          asociados.push({
            Tipo: Number(c.tipo),
            PtoVta: Number(c.puntoVenta),
            Nro: Number(c.numero),
          });
        }

        if (asociados.length > 0) {
          comprobante.CbtesAsoc = { CbteAsoc: asociados };
          console.log(
            "✅ CLAVE AFIP: Comprobante(s) asociado(s) agregado(s):",
            JSON.stringify(comprobante.CbtesAsoc, null, 2)
          );
        } else {
          console.warn(
            "⚠️ CLAVE AFIP: Nota de crédito/débito sin comprobante asociado. AFIP puede rechazarla."
          );
        }
      } else {
        console.log(
          "ℹ️ CLAVE AFIP: Tipo de comprobante no es nota de crédito/débito:",
          tipoCbte
        );
      }

      // Preparar parámetros para la solicitud
      const params = {
        Auth: authData,
        FeCAEReq: {
          FeCabReq: {
            CantReg: 1,
            PtoVta: datosComprobante.puntoVenta,
            CbteTipo: datosComprobante.tipoComprobante,
          },
          FeDetReq: {
            FECAEDetRequest: [comprobante],
          },
        },
      };

      console.log(
        "Parámetros enviados a AFIP:",
        JSON.stringify(params, null, 2)
      );

      // Llamar al método FECAESolicitar
      const resultado = await new Promise((resolve, reject) => {
        client.FECAESolicitar(params, function (err, result) {
          if (err) return reject(err);
          resolve(result);
        });
      });

      console.log("Respuesta de AFIP:", JSON.stringify(resultado, null, 2));

      // Verificar si hay errores en la respuesta
      if (resultado.FECAESolicitarResult.Errors) {
        const errors = this.formatearErrores(
          resultado.FECAESolicitarResult.Errors
        );
        throw new Error(`Error de AFIP: ${errors}`);
      }

      // Verificar que la respuesta tenga la estructura esperada
      if (!resultado.FECAESolicitarResult.FeCabResp) {
        throw new Error("Respuesta de AFIP sin estructura esperada");
      }

      const detalle = this.extraerDetalleCae(resultado);
      if (!detalle) {
        throw new Error("Respuesta de AFIP sin detalles de comprobante");
      }

      const cabResultado = resultado.FECAESolicitarResult.FeCabResp?.Resultado;
      if (cabResultado !== "A" || detalle.Resultado !== "A") {
        const errors = this.formatearErrores(
          resultado.FECAESolicitarResult.Errors ||
            detalle.Observaciones
        );
        throw new Error(`Error de AFIP: ${errors}`);
      }

      const obsList = detalle.Observaciones?.Obs;
      const obsNormalizadas = obsList
        ? Array.isArray(obsList)
          ? obsList
          : [obsList]
        : [];

      const cae = {
        cae: detalle.CAE,
        caeVencimiento: detalle.CAEFchVto,
        observaciones: obsNormalizadas
          .map((obs) => `${obs.Code}: ${obs.Msg}`)
          .join("; "),
        fromBackup: false,
      };

      console.log("CAE obtenido exitosamente:", cae);

      // Guardar en backup
      try {
        const caeBackupService = require("./cae-backup.service");
        await caeBackupService.saveCAE({
          tipoComprobante: datosComprobante.tipoComprobante,
          puntoVenta: datosComprobante.puntoVenta,
          numeroComprobante: datosComprobante.numero,
          importeTotal: datosComprobante.importeTotal,
          importeNeto: datosComprobante.importeNeto,
          importeIva: datosComprobante.importeIva,
          cae: cae.cae,
          caeVencimiento: cae.caeVencimiento,
          observaciones: cae.observaciones,
        });
        console.log("CAE guardado en backup");
      } catch (backupError) {
        console.error("Error al guardar CAE en backup:", backupError);
      }

      return cae;
    } catch (error) {
      console.error("Error al obtener CAE:", error);
      throw error;
    }
  }

  // Método para formatear fecha en formato requerido por AFIP (YYYYMMDD).
  // El día calendario es el de Argentina: el contenedor corre en UTC y,
  // después de las 21:00, getDate() ya es el día siguiente.
  formatearFecha(fecha) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .format(fecha)
      .replaceAll("-", "");
  }
}

module.exports = new AfipService();
