// Mapa único de todos los códigos de error de negocio de la API a su status HTTP.
// Antes esto estaba duplicado (uno por controller); ahora vive en un solo lugar.
export const ERROR_STATUS_MAP = {
  // sessions
  MISSING_FIELDS: 400,
  INVALID_EMAIL: 400,
  INVALID_PASSWORD: 400,
  EMAIL_EXISTS: 409,
  // users
  USER_NOT_FOUND: 404,
  // products
  INVALID_PRICE: 400,
  INVALID_STOCK: 400,
  INVALID_STATUS: 400,
  PRODUCT_EXISTS: 409,
  PRODUCT_NOT_FOUND: 404,
  // mocks
  INVALID_QTY: 400,
  INVALID_ROLE: 400,
  NO_CUSTOMERS: 400,
  NO_DRIVERS: 400,
};

// Middleware de errores de Express: se reconoce por tener 4 parámetros.
// Cualquier controller que llame next(error) termina acá. Si el error trae
// un `code` conocido (viene de un ServiceError armado en un service), se
// traduce al status correspondiente; si no, es un error no controlado y
// respondemos 500 sin filtrar detalles internos al cliente.
export const errorHandler = (error, req, res, next) => {
  const statusCode = ERROR_STATUS_MAP[error.code];

  if (statusCode) {
    return res.status(statusCode).json({ status: "error", message: error.message });
  }

  console.error(error);
  return res.status(500).json({ status: "error", message: "Error interno del servidor" });
};