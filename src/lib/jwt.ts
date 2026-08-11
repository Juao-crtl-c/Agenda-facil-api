import jwt from "jsonwebtoken";
import { env } from "./env";

export type JwtPayload = { usuarioId: string };

export function assinarToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

export function verificarToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
