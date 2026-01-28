import { z } from "zod"
import { PaginationQuerySchema } from "./common"

// ============================================
// ENUMS
// ============================================

export const CommentTypeEnum = z
  .enum(["GENERAL", "TIMECODE"])
  .openapi("CommentType")

// ============================================
// COMMENT SCHEMAS
// ============================================

export const CommentSchema = z
  .object({
    id: z.string().cuid(),
    type: CommentTypeEnum,
    content: z.string(),
    timecode: z.number().int().nullable(),
    mediaId: z.string().cuid2(),
    authorId: z.string().cuid().nullable(),
    authorName: z.string().nullable(),
    authorImage: z.string().url().nullable(),
    parentId: z.string().cuid().nullable(),
    replyCount: z.number().int().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("Comment")

export const CommentWithRepliesSchema = CommentSchema.extend({
  replies: z.array(CommentSchema),
}).openapi("CommentWithReplies")

export const CreateCommentSchema = z
  .object({
    content: z.string().min(1).max(5000).openapi({ example: "Bonne prise !" }),
    type: CommentTypeEnum.optional().default("GENERAL"),
    timecode: z
      .number()
      .int()
      .min(0)
      .optional()
      .openapi({ example: 125, description: "Timecode en secondes (vidéos)" }),
    parentId: z.string().cuid().optional(),
  })
  .refine(
    (data) => {
      // Si type TIMECODE, timecode doit être fourni
      if (data.type === "TIMECODE" && data.timecode === undefined) {
        return false
      }
      return true
    },
    {
      message: "Timecode is required for TIMECODE comment type",
    }
  )
  .openapi("CreateCommentRequest")

export const UpdateCommentSchema = z
  .object({
    content: z.string().min(1).max(5000),
  })
  .openapi("UpdateCommentRequest")

export const ListCommentsQuerySchema = z
  .object({
    parentId: z.string().cuid().optional(),
    type: CommentTypeEnum.optional(),
  })
  .merge(PaginationQuerySchema)
  .openapi("ListCommentsQuery")

// ============================================
// TYPES
// ============================================

export type CommentType = z.infer<typeof CommentTypeEnum>
export type Comment = z.infer<typeof CommentSchema>
export type CommentWithReplies = z.infer<typeof CommentWithRepliesSchema>
export type CreateComment = z.infer<typeof CreateCommentSchema>
export type UpdateComment = z.infer<typeof UpdateCommentSchema>
export type ListCommentsQuery = z.infer<typeof ListCommentsQuerySchema>
