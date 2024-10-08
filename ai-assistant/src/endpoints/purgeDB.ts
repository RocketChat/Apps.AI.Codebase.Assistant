import { IHttp, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors"
import {
   ApiEndpoint,
   IApiEndpointInfo,
   IApiRequest,
   IApiResponse,
} from "@rocket.chat/apps-engine/definition/api"
import { IDB } from "../core/services/db/db.types"
import { Neo4j } from "../core/services/db/neo4j"

export class PurgeDBEndpoint extends ApiEndpoint {
   public path = "purgeDB"

   /**
    * Empties the specified database by deleting all nodes and relationships.
    *
    * @param {IDB} db - The database to be emptied.
    * @returns {Promise<void>} - A promise that resolves when the database has been emptied.
    */
   async emptyDB(db: IDB) {
      const query = `MATCH (n) DETACH DELETE n`
      await db.run(query)
   }

   /**
    * Sets up the indices for name embeddings and code embeddings in the specified database.
    *
    * @param {IDB} db - The database object.
    * @returns {Promise<void>} - A promise that resolves when the indices are set up.
    */
   async setupIndices(db: IDB) {
      const query = [
         // Create indices for name embeddings
         [
            "CREATE VECTOR INDEX `nameEmbeddings` IF NOT EXISTS",
            "FOR (n: Node) ON (n.nameEmbeddings)",
            "OPTIONS {indexConfig: {",
            "   `vector.dimensions`: 384,",
            "   `vector.similarity_function`: 'COSINE'",
            "}};",
         ],

         // Create indices for name embeddings
         [
            "CREATE VECTOR INDEX `codeEmbeddings` IF NOT EXISTS",
            "FOR (n: Node) ON (n.codeEmbeddings)",
            "OPTIONS {indexConfig: {",
            "   `vector.dimensions`: 384,",
            "   `vector.similarity_function`: 'COSINE'",
            "}};",
         ],

         // Create indices for content embeddings
         [
            "CREATE VECTOR INDEX `contentEmbeddings` IF NOT EXISTS",
            "FOR (n: DevDocDBNode) ON (n.contentEmbeddings)",
            "OPTIONS {indexConfig: {",
            "   `vector.dimensions`: 384,",
            "   `vector.similarity_function`: 'COSINE'",
            "}};",
         ],
      ].map((q) => q.join("\n"))

      for (const q of query) await db.run(q)
   }

   public async post(
      request: IApiRequest,
      endpoint: IApiEndpointInfo,
      read: IRead,
      modify: IModify,
      http: IHttp,
      persis: IPersistence
   ): Promise<IApiResponse> {
      const db = new Neo4j(http)

      await this.setupIndices(db)
      await this.emptyDB(db)

      return this.success()
   }
}
