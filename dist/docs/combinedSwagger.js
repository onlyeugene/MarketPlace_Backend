"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const authSwagger_1 = __importDefault(require("./authSwagger"));
const profileSwaggerDocument_1 = __importDefault(require("./profileSwaggerDocument"));
function dedupeBy(items, keyFn) {
    const seen = new Set();
    const result = [];
    for (const item of items) {
        const key = keyFn(item);
        if (!seen.has(key)) {
            seen.add(key);
            result.push(item);
        }
    }
    return result;
}
const combinedSwagger = {
    openapi: "3.0.0",
    info: {
        title: "Marketplace API",
        version: "1.0.0",
        description: "Combined API documentation for Authentication and Profile management.",
    },
    servers: authSwagger_1.default.servers || profileSwaggerDocument_1.default.servers,
    tags: dedupeBy([...(authSwagger_1.default.tags || []), ...(profileSwaggerDocument_1.default.tags || [])], 
    // @ts-ignore – OpenAPI Tag Object has a name field
    (t) => t.name),
    paths: Object.assign(Object.assign({}, (authSwagger_1.default.paths || {})), (profileSwaggerDocument_1.default.paths || {})),
    components: {
        securitySchemes: Object.assign(Object.assign({}, (((_a = profileSwaggerDocument_1.default.components) === null || _a === void 0 ? void 0 : _a.securitySchemes) || {})), (((_b = authSwagger_1.default.components) === null || _b === void 0 ? void 0 : _b.securitySchemes) || {})),
    },
};
exports.default = combinedSwagger;
