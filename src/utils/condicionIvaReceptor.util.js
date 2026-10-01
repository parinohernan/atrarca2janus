/**
 * RG 5616 / WSFE: CondicionIVAReceptorId
 * Códigos de FEParamGetCondicionIvaReceptor.
 */
const MAP_LETRA = {
  I: 1, // Responsable Inscripto
  R: 1,
  M: 6, // Monotributo
  E: 4, // Exento
  F: 5, // Consumidor Final
  C: 5,
  N: 7, // No categorizado
  S: 13, // Monotributo social
  X: 9, // Cliente del exterior
  L: 10, // IVA Liberado – Ley 19.640
};

const TIPOS_COMPROBANTE_A = new Set([1, 2, 3]);

function mapearCondicionIvaReceptor(categoriaIva, tipoComprobante) {
  if (categoriaIva != null && String(categoriaIva).trim() !== "") {
    const raw = String(categoriaIva).trim();
    const asNumber = Number(raw);
    if (Number.isInteger(asNumber) && asNumber >= 1 && asNumber <= 16) {
      return asNumber;
    }

    const letra = raw.toUpperCase().charAt(0);
    if (MAP_LETRA[letra]) return MAP_LETRA[letra];

    const desc = raw.toLowerCase();
    if (desc.includes("inscript")) return 1;
    if (desc.includes("monotributo social")) return 13;
    if (desc.includes("monotribut")) return 6;
    if (desc.includes("exent")) return 4;
    if (desc.includes("consumidor") || desc.includes("final")) return 5;
    if (desc.includes("exterior")) return 9;
    if (desc.includes("no categori")) return 7;
    if (desc.includes("liberad")) return 10;
    if (desc.includes("no alcanz")) return 15;
  }

  const tipo = Number(tipoComprobante);
  if (TIPOS_COMPROBANTE_A.has(tipo)) return 1;
  return 5;
}

module.exports = {
  mapearCondicionIvaReceptor,
  MAP_LETRA,
};
