import { MedusaError } from "@medusajs/framework/utils"
const { Meilisearch } = require("meilisearch")

type MeilisearchOptions = {
  host: string
  apiKey: string
  productIndexName: string
}

export type MeilisearchIndexType = "product"

type MeilisearchIndex = {
  addDocuments: (documents: object[]) => Promise<unknown>
  getDocument: (id: string) => Promise<Record<string, unknown>>
  deleteDocuments: (documentIds: string[]) => Promise<unknown>
  search: (query: string) => Promise<unknown>
}

type MeilisearchClient = {
  index: (indexName: string) => MeilisearchIndex
}

export default class MeilisearchModuleService {
  private client: MeilisearchClient
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
    }) as MeilisearchClient
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

  async indexData<T extends object>(data: T[], type: MeilisearchIndexType = "product") {
    const indexName = await this.getIndexName(type)
    const index = this.client.index(indexName)

    await index.addDocuments(data)
  }

  async retrieveFromIndex<T extends Record<string, unknown> = Record<string, unknown>>(
    documentIds: string[],
    type: MeilisearchIndexType = "product"
  ): Promise<T[]> {
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

    return results.filter((result): result is T => Boolean(result))
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
