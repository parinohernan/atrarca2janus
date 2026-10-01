/** Tipos AFIP de notas de crédito/débito (A, B, C). */
const TIPOS_NOTA_CREDITO_DEBITO = new Set([2, 3, 7, 8, 12, 13]);

function esNotaCreditoDebito(tipo) {
  return TIPOS_NOTA_CREDITO_DEBITO.has(Number(tipo));
}

const TIPO_FACTURA_AFIP_MAP = {
  A: 1,
  B: 6,
  C: 11,
  E: 19,
  M: 51,
  FCA: 1,
  FCB: 6,
  FCC: 11,
  FCE: 19,
  FCM: 51,
  FA: 1,
  FB: 6,
  FC: 11,
};

/**
 * Mapea tipo de factura Astrial/BD (B, FCB, etc.) al código AFIP WSFE.
 * @returns {number|null}
 */
function mapearTipoFacturaAfip(tipoFactura) {
  if (tipoFactura == null || String(tipoFactura).trim() === "") return null;
  const s = String(tipoFactura).trim().toUpperCase();
  if (TIPO_FACTURA_AFIP_MAP[s] != null) return TIPO_FACTURA_AFIP_MAP[s];
  const ultimaLetra = s.slice(-1);
  if (TIPO_FACTURA_AFIP_MAP[ultimaLetra] != null) {
    return TIPO_FACTURA_AFIP_MAP[ultimaLetra];
  }
  return null;
}

module.exports = {
  esNotaCreditoDebito,
  mapearTipoFacturaAfip,
  TIPOS_NOTA_CREDITO_DEBITO,
};
