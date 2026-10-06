en cada consulta para conocer el ultimo comprobante de afip me adbierte de esta resolucion.

node_atrarca_novak  | Estructura de respuesta AFIP: {
node_atrarca_novak  |   "FECompUltimoAutorizadoResult": {
node_atrarca_novak  |     "PtoVta": 3,
node_atrarca_novak  |     "CbteTipo": 11,
node_atrarca_novak  |     "CbteNro": 0,
node_atrarca_novak  |     "Events": {
node_atrarca_novak  |       "Evt": [
node_atrarca_novak  |         {
node_atrarca_novak  |           "Code": 39,
node_atrarca_novak  |           "Msg": "IMPORTANTE: El dia 6 de abril de 2025, se actualizo la version del Web Service (WS) que permite enviar, de forma opcional, el campo Condicion Frente al IVA del receptor. Cabe destacar que la Resolucion General Nro 5616 indica que ese dato debe enviarse de manera obligatoria a partir del 15/04/2025. No obstante, se mantendra como un dato no excluyente hasta el 30/11/2026, inclusive. A partir del 01/12/2026 se rechazaran las solicitudes de emision de comprobantes sin este dato. Para mas informacion, consultar el manual en: https://www.arca.gob.ar/fe/ayuda/webservice.asp, https://www.arca.gob.ar/ws/documentacion/ws-factura-electronica.asp"
node_atrarca_novak  |         }
node_atrarca_novak  |       ]
node_atrarca_novak  |     }
node_atrarca_novak  |   }
node_atrarca_novak  | }

**Estado (sep 2026):** atrarca ya envía `CondicionIVAReceptorId` en `FECAESolicitar`, mapeando `t_clientes.CategoriaIva` (I→1, M→6, E→4, F/C→5, etc.). Si el próximo CAE no trae la obs. 10245, está cumplido.

y en cada nuevo comprobante autorizado


node_atrarca_valur  | Respuesta AFIP completa: {
node_atrarca_valur  |   cae: '86372436886633',
node_atrarca_valur  |   caeVencimiento: '20260920',
node_atrarca_valur  |   observaciones: '10245: El campo Condicion Frente al IVA del receptor resultara obligatorio conforme lo reglamentado por la Resolución General Nro 5616. Para mas informacion consular metodo FEParamGetCondicionIvaReceptor',
node_atrarca_valur  |   fromBackup: false
node_atrarca_valur  | }
node_atrarca_valur  | CAE obtenido: 86372436886633
node_atrarca_valur  | Fecha vencimiento: 20260920
node_atrarca_valur  | Ejecutando actualización en BD con query:
node_atrarca_valur  |         UPDATE facturacabeza
node_atrarca_valur  |         SET afip_cae = ?, afip_cae_vencimiento = ?, afip_cae_observaciones = ?
node_atrarca_valur  |         WHERE DocumentoTipo = ?
node_atrarca_valur  |           AND DocumentoSucursal = ?
node_atrarca_valur  |           AND DocumentoNumero = ?
node_atrarca_valur  |
node_atrarca_valur  | Parámetros: [
node_atrarca_valur  |   '86372436886633',
node_atrarca_valur  |   '20260920',
node_atrarca_valur  |   '10245: El campo Condicion Frente al IVA del receptor resultara obligatorio conforme lo reglamentado por la Resolución General Nro 5616. Para mas informacion consular metodo FEParamGetCondicionIvaReceptor',
node_atrarca_valur  |   'FCA',
node_atrarca_valur  |   '0003',
node_atrarca_valur  |   '00003545'
node_atrarca_valur  | ]
node_atrarca_valur  | Resultado de actualización en BD: ResultSetHeader {
node_atrarca_valur  |   fieldCount: 0,
node_atrarca_valur  |   affectedRows: 1,
node_atrarca_valur  |   insertId: 0,
node_atrarca_valur  |   info: '(Rows matched: 1  Changed: 1  Warnings: 0',
node_atrarca_valur  |   serverStatus: 2,
node_atrarca_valur  |   warningStatus: 0,
node_atrarca_valur  |   changedRows: 1
node_atrarca_valur  | }

