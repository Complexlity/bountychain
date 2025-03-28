import { Prettify } from "./types";
import { z } from "zod";
import { SupportedChainKey, supportedChains } from "./viem";

const Dialect = z.enum(["sqlite", "turso"]);
type Dialect = Prettify<z.infer<typeof Dialect>>;
const serverEnvSchema = z
  .object({
    NODE_ENV: z.string().default("development"),
    DATABASE_URL: z.string().url(),
    DATABASE_AUTH_TOKEN: z.string().optional(),
    DIALECT: Dialect.optional(),
    MORALIS_API_KEY: z.string(),
    NEXT_PUBLIC_BACKUP_SERVER: z.string().url().optional(),
    NEXT_PUBLIC_ACTIVE_CHAIN: z
      .string()
      .default("arbitrum")
      .refine((val): val is SupportedChainKey => val in supportedChains, {
        message:
          "ACTIVE_CHAIN must be one of the supported chains: " +
          Object.keys(supportedChains).join(", "),
      }),
  })
  .superRefine((input, ctx) => {
    if (input.NODE_ENV === "production" && !input.DATABASE_AUTH_TOKEN) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_type,
        expected: "string",
        received: "undefined",
        path: ["DATABASE_AUTH_TOKEN"],
        message: "Must be set when NODE_ENV is 'production'",
      });
    }
  })
  .transform((env) => ({
    ...env,
    DIALECT: env.NODE_ENV === "production" ? "turso" : "sqlite",
  }))
  .refine((env): env is Prettify<typeof env & { DIALECT: Dialect }> => true);
export type serverEnv = z.infer<typeof serverEnvSchema>;

const { data: serverEnv, error } = serverEnvSchema.safeParse(process.env);
console.log(process.env)

if (error) {
  console.error("❌ Invalid env:");
  console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));
  throw new Error("Invalid env");
}

export default serverEnv!;
