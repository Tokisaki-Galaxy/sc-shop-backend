import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { MEILISEARCH_MODULE } from "../../../../modules/meilisearch"
import MeilisearchModuleService from "../../../../modules/meilisearch/service"

export const SearchSchema = z.object({
  query: z.string(),
})

type SearchRequest = z.infer<typeof SearchSchema>

export async function POST(
  req: MedusaRequest<SearchRequest>,
  res: MedusaResponse
) {
  const meilisearchModuleService = req.scope.resolve<MeilisearchModuleService>(
    MEILISEARCH_MODULE
  )
  const { query } = req.validatedBody

  const results = await meilisearchModuleService.search(query)

  res.json(results)
}
