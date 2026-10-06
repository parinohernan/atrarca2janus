const crypto = require("crypto");

const hash = (valor) => crypto.createHash("sha256").update(valor).digest();

const requireAdminKey = (req, res, next) => {
  const esperada = process.env.ADMIN_API_KEY;
  if (!esperada) {
    return res
      .status(503)
      .json({ error: "Administración deshabilitada: ADMIN_API_KEY no configurada" });
  }

  const recibida = req.headers["x-admin-key"];
  if (!recibida || !crypto.timingSafeEqual(hash(recibida), hash(esperada))) {
    return res.status(401).json({ error: "x-admin-key inválida o ausente" });
  }

  next();
};

module.exports = { requireAdminKey };
