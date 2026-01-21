import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi"
import * as schemas from "./schemas"

// ============================================
// REGISTRY
// ============================================

const registry = new OpenAPIRegistry()

// Register common schemas
registry.register("Error", schemas.ErrorSchema)
registry.register("Pagination", schemas.PaginationSchema)

// Register event schemas
registry.register("Event", schemas.EventSchema)
registry.register("EventWithStats", schemas.EventWithStatsSchema)
registry.register("CreateEventRequest", schemas.CreateEventSchema)
registry.register("UpdateEventRequest", schemas.UpdateEventSchema)
registry.register("ShareTokenResponse", schemas.ShareTokenResponseSchema)

// Register photo schemas
registry.register("Photo", schemas.PhotoSchema)
registry.register("PhotoWithOriginalUrl", schemas.PhotoWithOriginalUrlSchema)
registry.register("UploadResponse", schemas.UploadResponseSchema)

// Register validation schemas
registry.register("ValidationEventResponse", schemas.ValidationEventResponseSchema)
registry.register("SubmitValidationRequest", schemas.SubmitValidationSchema)
registry.register("ValidationResult", schemas.ValidationResultSchema)
registry.register("ZipJobResponse", schemas.ZipJobResponseSchema)
registry.register("ZipStatusResponse", schemas.ZipStatusResponseSchema)

// ============================================
// PATHS
// ============================================

// GET /api/events
registry.registerPath({
  method: "get",
  path: "/api/events",
  tags: ["Events"],
  summary: "List events",
  security: [{ sessionAuth: [] }],
  request: { query: schemas.ListEventsQuerySchema },
  responses: {
    200: {
      description: "List of events with stats",
      content: {
        "application/json": {
          schema: schemas.createPaginatedResponseSchema(schemas.EventWithStatsSchema),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: schemas.ErrorSchema } },
    },
  },
})

// POST /api/events
registry.registerPath({
  method: "post",
  path: "/api/events",
  tags: ["Events"],
  summary: "Create event",
  security: [{ sessionAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: schemas.CreateEventSchema } } },
  },
  responses: {
    201: {
      description: "Event created",
      content: { "application/json": { schema: schemas.EventSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: schemas.ErrorSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: schemas.ErrorSchema } },
    },
  },
})

// GET /api/validate/{token}
registry.registerPath({
  method: "get",
  path: "/api/validate/{token}",
  tags: ["Validation"],
  summary: "Get event for validation",
  request: {
    params: schemas.TokenParamSchema,
  },
  responses: {
    200: {
      description: "Event with photos for validation",
      content: {
        "application/json": { schema: schemas.ValidationEventResponseSchema },
      },
    },
    401: {
      description: "Invalid or expired token",
      content: { "application/json": { schema: schemas.ErrorSchema } },
    },
  },
})

// PATCH /api/validate/{token}
registry.registerPath({
  method: "patch",
  path: "/api/validate/{token}",
  tags: ["Validation"],
  summary: "Submit validation decisions",
  request: {
    params: schemas.TokenParamSchema,
    body: { content: { "application/json": { schema: schemas.SubmitValidationSchema } } },
  },
  responses: {
    200: {
      description: "Validation results",
      content: { "application/json": { schema: schemas.ValidationResultSchema } },
    },
    401: {
      description: "Invalid or expired token",
      content: { "application/json": { schema: schemas.ErrorSchema } },
    },
  },
})

// ============================================
// GENERATE DOCUMENT
// ============================================

const generator = new OpenApiGeneratorV3(registry.definitions)

export const openApiDocument = generator.generateDocument({
  openapi: "3.0.3",
  info: {
    title: "PicFlow API",
    version: "1.0.0",
    description: "Photo validation workflow API for churches",
    license: { name: "MIT", url: "https://opensource.org/licenses/MIT" },
  },
  servers: [
    { url: process.env.APP_URL || "http://localhost:3000", description: "Current" },
  ],
  tags: [
    { name: "Events", description: "Event management (Admin)" },
    { name: "Photos", description: "Photo upload and management (Admin)" },
    { name: "Validation", description: "Photo validation (Token)" },
    { name: "Download", description: "Photo download (Token)" },
  ],
  security: [],
})
