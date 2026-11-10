import { Elysia } from "elysia";
import { calculation } from "./model";
import { calculate } from "./service";
export const calculations = new Elysia({ prefix: "/api/v1" }).post(
  "/calculate",
  ({ body }) => calculate(body),
  { body: calculation },
);
