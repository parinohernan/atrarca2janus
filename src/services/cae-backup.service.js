const fs = require("fs");
const path = require("path");

class CAEBackupService {
  constructor() {
    this.backupDir = path.join(__dirname, "../backup");
    this.backupFile = path.join(this.backupDir, "cae-backup.json");
    this.ensureBackupDirectory();
  }

  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async saveCAE(caeData) {
    try {
      const timestamp = new Date().toISOString();

      // Mapeo de tipos de comprobante para normalización
      const tipoComprobanteMap = {
        FCA: 1,
        1: 1,
        NDA: 2,
        2: 2,
        NCA: 3,
        3: 3,
        FCB: 6,
        6: 6,
        NDB: 7,
        7: 7,
        NCB: 8,
        8: 8,
        FCE: 19,
        19: 19,
        NCE: 21,
        21: 21,
      };

      // Normalizar el tipo de comprobante a número
      const tipoComprobanteNormalizado =
        tipoComprobanteMap[caeData.tipoComprobante] || caeData.tipoComprobante;

      const backupEntry = {
        timestamp,
        ...caeData,
        tipoComprobante: tipoComprobanteNormalizado,
      };

      // Leer backup existente
      let backup = [];
      if (fs.existsSync(this.backupFile)) {
        const content = fs.readFileSync(this.backupFile, "utf8");
        backup = JSON.parse(content);
      }

      // Verificar si ya existe este CAE para evitar duplicados
      const existingIndex = backup.findIndex(
        (entry) =>
          entry.tipoComprobante === tipoComprobanteNormalizado &&
          entry.puntoVenta === parseInt(caeData.puntoVenta) &&
          entry.numeroComprobante === parseInt(caeData.numeroComprobante)
      );

      if (existingIndex !== -1) {
        // Actualizar entrada existente
        backup[existingIndex] = backupEntry;
        console.log(
          `CAE actualizado en backup: ${caeData.cae} para ${caeData.tipoComprobante} ${caeData.puntoVenta}-${caeData.numeroComprobante}`
        );
      } else {
        // Agregar nueva entrada
        backup.push(backupEntry);
        console.log(
          `CAE guardado en backup: ${caeData.cae} para ${caeData.tipoComprobante} ${caeData.puntoVenta}-${caeData.numeroComprobante}`
        );
      }

      // Guardar backup actualizado
      fs.writeFileSync(this.backupFile, JSON.stringify(backup, null, 2));

      return true;
    } catch (error) {
      console.error("Error al guardar CAE en backup:", error);
      return false;
    }
  }

  async findCAE(tipoComprobante, puntoVenta, numeroComprobante) {
    try {
      if (!fs.existsSync(this.backupFile)) {
        console.log("❌ Archivo de backup no existe");
        return null;
      }

      const content = fs.readFileSync(this.backupFile, "utf8");
      const backup = JSON.parse(content);

      // Mapeo de tipos de comprobante para búsqueda flexible
      const tipoComprobanteMap = {
        FCA: 1,
        1: 1,
        NDA: 2,
        2: 2,
        NCA: 3,
        3: 3,
        FCB: 6,
        6: 6,
        NDB: 7,
        7: 7,
        NCB: 8,
        8: 8,
        FCE: 19,
        19: 19,
        NCE: 21,
        21: 21,
      };

      // Normalizar el tipo de comprobante a número
      const tipoComprobanteNormalizado =
        tipoComprobanteMap[tipoComprobante] || tipoComprobante;

      console.log(
        ` Buscando en backup con tipo normalizado: ${tipoComprobante} -> ${tipoComprobanteNormalizado}`
      );
      console.log(
        ` Buscando: tipo=${tipoComprobanteNormalizado}, puntoVenta=${puntoVenta}, numero=${numeroComprobante}`
      );

      // Buscar CAE específico - comparar como strings para evitar problemas de tipos
      const caeEntry = backup.find((entry) => {
        const match =
          entry.tipoComprobante === tipoComprobanteNormalizado &&
          entry.puntoVenta.toString() === puntoVenta.toString() &&
          entry.numeroComprobante.toString() === numeroComprobante.toString();

        if (
          entry.tipoComprobante === tipoComprobanteNormalizado &&
          entry.puntoVenta.toString() === puntoVenta.toString()
        ) {
          console.log(
            ` Comparando entrada: tipo=${entry.tipoComprobante}, puntoVenta=${entry.puntoVenta}, numero=${entry.numeroComprobante} -> ${match}`
          );
        }

        return match;
      });

      if (caeEntry) {
        console.log(`✅ CAE encontrado en backup: ${caeEntry.cae}`);
      } else {
        console.log(
          `❌ CAE no encontrado en backup para ${tipoComprobante} ${puntoVenta}-${numeroComprobante}`
        );

        // Mostrar algunas entradas similares para debug
        const entradasSimilares = backup.filter(
          (entry) =>
            entry.tipoComprobante === tipoComprobanteNormalizado &&
            entry.puntoVenta.toString() === puntoVenta.toString()
        );

        if (entradasSimilares.length > 0) {
          console.log(
            ` Entradas similares encontradas (mismo tipo y punto de venta):`
          );
          entradasSimilares.slice(0, 3).forEach((entry) => {
            console.log(
              `   - ${entry.tipoComprobante} ${entry.puntoVenta}-${entry.numeroComprobante} (CAE: ${entry.cae})`
            );
          });
        }
      }

      return caeEntry || null;
    } catch (error) {
      console.error("Error al buscar CAE en backup:", error);
      return null;
    }
  }

  async getAllCAEs() {
    try {
      if (!fs.existsSync(this.backupFile)) {
        return [];
      }

      const content = fs.readFileSync(this.backupFile, "utf8");
      return JSON.parse(content);
    } catch (error) {
      console.error("Error al leer backup de CAEs:", error);
      return [];
    }
  }

  async removeCAE(tipoComprobante, puntoVenta, numeroComprobante) {
    try {
      if (!fs.existsSync(this.backupFile)) {
        return false;
      }

      const content = fs.readFileSync(this.backupFile, "utf8");
      let backup = JSON.parse(content);

      // Filtrar el CAE a eliminar
      const originalLength = backup.length;
      backup = backup.filter(
        (entry) =>
          !(
            entry.tipoComprobante === tipoComprobante &&
            entry.puntoVenta === parseInt(puntoVenta) &&
            entry.numeroComprobante === parseInt(numeroComprobante)
          )
      );

      if (backup.length < originalLength) {
        fs.writeFileSync(this.backupFile, JSON.stringify(backup, null, 2));
        console.log(
          `CAE eliminado del backup: ${tipoComprobante} ${puntoVenta}-${numeroComprobante}`
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error al eliminar CAE del backup:", error);
      return false;
    }
  }

  async getBackupStats() {
    try {
      const caes = await this.getAllCAEs();

      const stats = {
        total: caes.length,
        porTipo: {},
        porEmpresa: {},
        fechaMasAntigua: null,
        fechaMasReciente: null,
      };

      if (caes.length > 0) {
        // Agrupar por tipo de comprobante
        caes.forEach((cae) => {
          const tipo = cae.tipoComprobante;
          stats.porTipo[tipo] = (stats.porTipo[tipo] || 0) + 1;
        });

        // Agrupar por empresa
        caes.forEach((cae) => {
          const empresa = cae.empresa;
          stats.porEmpresa[empresa] = (stats.porEmpresa[empresa] || 0) + 1;
        });

        // Fechas
        const fechas = caes.map((cae) => new Date(cae.timestamp)).sort();
        stats.fechaMasAntigua = fechas[0].toISOString();
        stats.fechaMasReciente = fechas[fechas.length - 1].toISOString();
      }

      return stats;
    } catch (error) {
      console.error("Error al obtener estadísticas del backup:", error);
      return null;
    }
  }
}

module.exports = new CAEBackupService();
