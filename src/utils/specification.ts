import fs from "fs";
import path from "path";
import yaml from "js-yaml";

export const API_PREFIX = "/api/v1";
export const DOCS_PATH = `${API_PREFIX}/docs`;
export const SPEC_PATH = `${API_PREFIX}/spec`;

export const SPEC_FILE_PATH = path.join(__dirname, "../../docs/openAPI.yml");

export const specification = yaml.load(
  fs.readFileSync(SPEC_FILE_PATH, "utf8"),
) as Record<string, unknown>;
