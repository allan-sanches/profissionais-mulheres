import {
  n as createInvalidVariablesError,
  o as getEnv$1,
  p as setOnSetGetEnv,
} from "./entrypoint_BfZMvszB.mjs";

function getEnvFieldType(options) {
  const optional = options.optional
    ? options.default !== void 0
      ? false
      : true
    : false;
  let type;
  if (options.type === "enum") {
    type = options.values.map((v) => `'${v}'`).join(" | ");
  } else {
    type = options.type;
  }
  return `${type}${optional ? " | undefined" : ""}`;
}
const stringValidator =
  ({ max, min, length, url, includes, startsWith, endsWith }) =>
  (input) => {
    if (typeof input !== "string") {
      return {
        ok: false,
        errors: ["type"],
      };
    }
    const errors = [];
    if (max !== void 0 && !(input.length <= max)) {
      errors.push("max");
    }
    if (min !== void 0 && !(input.length >= min)) {
      errors.push("min");
    }
    if (length !== void 0 && !(input.length === length)) {
      errors.push("length");
    }
    if (url !== void 0 && !URL.canParse(input)) {
      errors.push("url");
    }
    if (includes !== void 0 && !input.includes(includes)) {
      errors.push("includes");
    }
    if (startsWith !== void 0 && !input.startsWith(startsWith)) {
      errors.push("startsWith");
    }
    if (endsWith !== void 0 && !input.endsWith(endsWith)) {
      errors.push("endsWith");
    }
    if (errors.length > 0) {
      return {
        ok: false,
        errors,
      };
    }
    return {
      ok: true,
      value: input,
    };
  };
const numberValidator =
  ({ gt, min, lt, max, int }) =>
  (input) => {
    const num = Number.parseFloat(input ?? "");
    if (isNaN(num)) {
      return {
        ok: false,
        errors: ["type"],
      };
    }
    const errors = [];
    if (gt !== void 0 && !(num > gt)) {
      errors.push("gt");
    }
    if (min !== void 0 && !(num >= min)) {
      errors.push("min");
    }
    if (lt !== void 0 && !(num < lt)) {
      errors.push("lt");
    }
    if (max !== void 0 && !(num <= max)) {
      errors.push("max");
    }
    if (int !== void 0) {
      const isInt = Number.isInteger(num);
      if (!(int ? isInt : !isInt)) {
        errors.push("int");
      }
    }
    if (errors.length > 0) {
      return {
        ok: false,
        errors,
      };
    }
    return {
      ok: true,
      value: num,
    };
  };
const booleanValidator = (input) => {
  const bool = input === "true" ? true : input === "false" ? false : void 0;
  if (typeof bool !== "boolean") {
    return {
      ok: false,
      errors: ["type"],
    };
  }
  return {
    ok: true,
    value: bool,
  };
};
const enumValidator =
  ({ values }) =>
  (input) => {
    if (!(typeof input === "string" ? values.includes(input) : false)) {
      return {
        ok: false,
        errors: ["type"],
      };
    }
    return {
      ok: true,
      value: input,
    };
  };
function selectValidator(options) {
  switch (options.type) {
    case "string":
      return stringValidator(options);
    case "number":
      return numberValidator(options);
    case "boolean":
      return booleanValidator;
    case "enum":
      return enumValidator(options);
  }
}
function validateEnvVariable(value, options) {
  const isOptional = options.optional || options.default !== void 0;
  if (isOptional && value === void 0) {
    return {
      ok: true,
      value: options.default,
    };
  }
  if (!isOptional && value === void 0) {
    return {
      ok: false,
      errors: ["missing"],
    };
  }
  return selectValidator(options)(value);
}

const schema = {
  UMAMI_URL: {
    context: "client",
    access: "public",
    optional: true,
    type: "string",
  },
  UMAMI_WEBSITE_ID: {
    context: "client",
    access: "public",
    optional: true,
    type: "string",
  },
  GOOGLE_SHEET_ID: { context: "server", access: "secret", type: "string" },
  GOOGLE_CLIENT_EMAIL: { context: "server", access: "secret", type: "string" },
  GOOGLE_PRIVATE_KEY: { context: "server", access: "secret", type: "string" },
  ADMIN_TOKEN: {
    context: "server",
    access: "secret",
    default: "ecologia2026",
    type: "string",
  },
};

// @ts-check

// @ts-expect-error
/** @returns {string} */
// used while generating the virtual module
// biome-ignore lint/correctness/noUnusedFunctionParameters: `key` is used by the generated code
const getEnv = (key) => {
  return getEnv$1(key);
};

const _internalGetSecret = (key) => {
  const rawVariable = getEnv(key);
  const variable = rawVariable === "" ? undefined : rawVariable;
  const options = schema[key];

  const result = validateEnvVariable(variable, options);
  if (result.ok) {
    return result.value;
  }
  const type = getEnvFieldType(options);
  throw createInvalidVariablesError(key, type, result);
};

setOnSetGetEnv(() => {
  GOOGLE_SHEET_ID = _internalGetSecret("GOOGLE_SHEET_ID");
  GOOGLE_CLIENT_EMAIL = _internalGetSecret("GOOGLE_CLIENT_EMAIL");
  GOOGLE_PRIVATE_KEY = _internalGetSecret("GOOGLE_PRIVATE_KEY");
  ADMIN_TOKEN = _internalGetSecret("ADMIN_TOKEN");
});
let GOOGLE_SHEET_ID = _internalGetSecret("GOOGLE_SHEET_ID");
let GOOGLE_CLIENT_EMAIL = _internalGetSecret("GOOGLE_CLIENT_EMAIL");
let GOOGLE_PRIVATE_KEY = _internalGetSecret("GOOGLE_PRIVATE_KEY");
let ADMIN_TOKEN = _internalGetSecret("ADMIN_TOKEN");

export {
  ADMIN_TOKEN as A,
  GOOGLE_SHEET_ID as G,
  GOOGLE_PRIVATE_KEY as a,
  GOOGLE_CLIENT_EMAIL as b,
};
