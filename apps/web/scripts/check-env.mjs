#!/usr/bin/env node
/**
 * Valida variables de entorno antes del deploy.
 * Uso: node scripts/check-env.mjs [--strict]
 * En CI (--strict o CI=true) falla si faltan vars obligatorias.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const strict = process.env.CI === "true" || process.argv.includes("--strict");
const envPath = resolve(process.cwd(), ".env");
const env = {};

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const get = (k) => process.env[k] || env[k] || "";

const required = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];
const recommended = ["VITE_APP_URL", "VITE_ADMIN_PIN"];

const missing = required.filter((k) => !get(k));
const missingRecommended = recommended.filter((k) => !get(k));

if (missing.length) {
  console.warn("⚠️  Variables obligatorias faltantes:", missing.join(", "));
} else {
  console.log("✓ Supabase configurado");
}

if (missingRecommended.length) {
  console.warn("ℹ️  Recomendadas faltantes:", missingRecommended.join(", "));
}

if (strict && missing.length) {
  console.error("\nDeploy abortado: configura las variables en tu hosting o .env");
  process.exit(1);
}

console.log(strict ? "Listo para producción." : "Modo desarrollo — usa --strict en CI.");
