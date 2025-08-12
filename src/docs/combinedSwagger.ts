import { OpenApiSpec } from "@loopback/openapi-v3-types";
import authSwagger from "./authSwagger";
import profileSwaggerDocument from "./profileSwaggerDocument";
import adminSwaggerDocument from "./adminSwaggerDocument";

function dedupeBy<T, K extends keyof any>(
  items: T[],
  keyFn: (item: T) => K
): T[] {
  const seen = new Set<K>();
  const result: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

const combinedSwagger: OpenApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Marketplace API",
    version: "1.0.0",
    description:
      "Combined API documentation for Authentication, Profile management and Admin functionalities.",
  },
  servers: authSwagger.servers || profileSwaggerDocument.servers || adminSwaggerDocument.servers,
  tags: dedupeBy(
    [...(authSwagger.tags || []), ...(profileSwaggerDocument.tags || [])],
    // @ts-ignore – OpenAPI Tag Object has a name field
    (t: any) => t.name
  ),
  paths: {
    ...(authSwagger.paths || {}),
    ...(profileSwaggerDocument.paths || {}),
    ...(adminSwaggerDocument.paths || {}),
  },
  components: {
    securitySchemes: {
      ...(profileSwaggerDocument.components?.securitySchemes || {}),
      ...(authSwagger.components?.securitySchemes || {}),
        ...(adminSwaggerDocument.components?.securitySchemes || {}),
    },
  },
};

export default combinedSwagger;
