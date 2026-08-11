import bcrypt from "bcryptjs";
import { AppError } from "../lib/AppError";
import { assinarToken } from "../lib/jwt";
import { usuarioRepository } from "../repositories/usuario.repository";
import { LoginBody, RegistroBody } from "../schemas/auth.schemas";

const SALT_ROUNDS = 10;

export const authService = {
  async registrar(dados: RegistroBody) {
    const existente = await usuarioRepository.buscarPorEmail(dados.email);
    if (existente) {
      throw new AppError("Já existe uma conta com esse e-mail.", 409, "EMAIL_EM_USO");
    }

    const senhaHash = await bcrypt.hash(dados.senha, SALT_ROUNDS);
    const usuario = await usuarioRepository.criar({ nome: dados.nome, email: dados.email, senhaHash });

    return montarResposta(usuario.id, usuario.nome, usuario.email);
  },

  async login(dados: LoginBody) {
    const usuario = await usuarioRepository.buscarPorEmail(dados.email);
    if (!usuario) {
      throw AppError.naoAutorizado("E-mail ou senha incorretos.");
    }

    const senhaConfere = await bcrypt.compare(dados.senha, usuario.senhaHash);
    if (!senhaConfere) {
      throw AppError.naoAutorizado("E-mail ou senha incorretos.");
    }

    return montarResposta(usuario.id, usuario.nome, usuario.email);
  },
};

function montarResposta(id: string, nome: string, email: string) {
  return {
    token: assinarToken({ usuarioId: id }),
    usuario: { id, nome, email },
  };
}
