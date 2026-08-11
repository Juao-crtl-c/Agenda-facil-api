// Erro "esperado" da aplicação (regra de negócio, validação, conflito) —
// carrega o status HTTP certo, ao contrário de um erro genérico que sempre
// viraria 500 no handler central.
export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(message: string, statusCode = 400, code = "BAD_REQUEST", details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static naoEncontrado(entidade: string) {
    return new AppError(`${entidade} não encontrado(a).`, 404, "NOT_FOUND");
  }

  static naoAutorizado(message = "Não autorizado.") {
    return new AppError(message, 401, "UNAUTHORIZED");
  }

  static conflito(message: string, details?: unknown) {
    return new AppError(message, 409, "CONFLICT", details);
  }
}
