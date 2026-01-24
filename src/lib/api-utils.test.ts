import { describe, expect, it } from "vitest"
import { z } from "zod"
import { ApiError, getPaginationParams, validateParams } from "./api-utils"

describe("api-utils", () => {
  it("getPaginationParams returns skip/take", () => {
    expect(getPaginationParams(1, 20)).toEqual({ skip: 0, take: 20 })
    expect(getPaginationParams(3, 10)).toEqual({ skip: 20, take: 10 })
  })

  it("validateParams returns typed data", () => {
    const schema = z.object({ id: z.string().uuid() })
    const data = validateParams({ id: "550e8400-e29b-41d4-a716-446655440000" }, schema)
    expect(data.id).toBe("550e8400-e29b-41d4-a716-446655440000")
  })

  it("validateParams throws ApiError on invalid params", () => {
    const schema = z.object({ id: z.string().uuid() })
    try {
      validateParams({ id: "not-a-uuid" }, schema)
      throw new Error("Expected validateParams to throw")
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      expect((error as ApiError).status).toBe(400)
      expect((error as ApiError).code).toBe("VALIDATION_ERROR")
    }
  })
})
