-- Script para modificar el campo afip_cae_observaciones para permitir observaciones más largas
-- Ejecutar este script en la base de datos para solucionar el error de longitud

-- Modificar el campo afip_cae_observaciones en la tabla facturacabeza
ALTER TABLE facturacabeza 
MODIFY COLUMN afip_cae_observaciones TEXT;

-- También modificar en otras tablas si existen
-- ALTER TABLE factura_a MODIFY COLUMN afip_cae_observaciones TEXT;
-- ALTER TABLE factura_b MODIFY COLUMN afip_cae_observaciones TEXT;

-- Verificar la estructura después del cambio
DESCRIBE facturacabeza; 