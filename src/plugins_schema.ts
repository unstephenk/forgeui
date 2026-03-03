import Ajv from "ajv/dist/2020.js";

export function validatePluginOptions(schema: any, options: any): { ok: true } | { ok: false; error: string } {
  try {
    const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });
    const validate = ajv.compile(schema);
    const ok = validate(options);
    if (ok) return { ok: true };
    const msg = (validate.errors ?? [])
      .map((e) => `${e.instancePath || e.schemaPath}: ${e.message}`)
      .slice(0, 5)
      .join("; ");
    return { ok: false, error: msg || "Invalid plugin options" };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}
