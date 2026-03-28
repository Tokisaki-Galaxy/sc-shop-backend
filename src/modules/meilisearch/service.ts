import { MedusaError } from "@medusajs/framework/utils"
const { Meilisearch } = require("meilisearch")

type MeilisearchOptions = {
  host: string
  apiKey: string
  productIndexName: string
}

export type MeilisearchIndexType = "product"

export default class MeilisearchModuleService {
  private client: any
  private options: MeilisearchOptions

  constructor({}, options: MeilisearchOptions) {
    if (!options.host || !options.apiKey || !options.productIndexName) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        "Meilisearch options are required"
      )
    }

    this.client = new Meilisearch({
      host: options.host,
      apiKey: options.apiKey,
    })
    this.options = options
  }

  async getIndexName(type: MeilisearchIndexType) {
    switch (type) {
      case "product":
        return this.options.productIndexName
      default:
        throw new Error(`Invalid index type: ${type}`)
    }
  }

  async indexData(data: Record<string, unknown>[], type: MeilisearchIndexType = "product") {
    const indexName = await this.getIndexName(type)
    const index = this.client.index(indexName)

    await index.addDocuments(data)
  }

  async retrieveFromIndex(
    documentIds: string[],
    type: MeilisearchIndexType = "product"
  ): Promise<Record<string, unknown>[]> {
    const indexName = await this.getIndexName(type)
    const index = this.client.index(indexName)

    const results = await Promise.all(
      documentIds.map(async (id) => {
        try {
          return await index.getDocument(id)
        } catch {
          return null
        }
      })
    )

    return results.filter((result): result is Record<string, unknown> => Boolean(result))
  }

  async deleteFromIndex(documentIds: string[], type: MeilisearchIndexType = "product") {
    const indexName = await this.getIndexName(type)
    const index = this.client.index(indexName)

    await index.deleteDocuments(documentIds)
  }

  async search(query: string, type: MeilisearchIndexType = "product") {
    const indexName = await this.getIndexName(type)
    const index = this.client.index(indexName)

    return await index.search(query)
  }
}
