import { TreeNode } from "../process/prepare/processor/core/treeNode"
import { LLM } from "./llm"

export type DBNodeRelation = "CONTAINS" | "USES"

export class DBNode {
	id: string
	name: string
	type: string

	code: string

	filePath: string
	relations: { target: string; relation: DBNodeRelation }[]

	nameEmbeddings: number[]
	codeEmbeddings: number[]

	isFile: boolean
	descriptor: "Node" | string

	constructor(node: {
		id: string
		name: string
		type: string
		code: string
		filePath: string
		relations: { target: string; relation: DBNodeRelation }[]
		nameEmbeddings: number[]
		codeEmbeddings: number[]
		descriptor: "Node" | string

		isFile?: boolean
	}) {
		this.id = node.id
		this.name = node.name
		this.type = node.type

		this.code = node.code

		this.filePath = node.filePath
		this.relations = node.relations

		this.nameEmbeddings = node.nameEmbeddings
		this.codeEmbeddings = node.codeEmbeddings

		this.isFile = node.isFile || false
		this.descriptor = node.descriptor
	}

	static fromTreeNode(node: TreeNode): DBNode {
		return new DBNode({
			id: node.getID(),
			name: node.name,
			type: node.type,

			code: node.body,

			filePath: node.sourceFileRelativePath,
			relations: node.uses.map((use) => ({
				target: use.name,
				relation: "USES",
			})),

			nameEmbeddings: [],
			codeEmbeddings: [],

			isFile: false,
			descriptor: "Node",
		})
	}

	static async fillEmbeddings(node: DBNode): Promise<DBNode> {
		node.nameEmbeddings = await LLM.generateEmbeddings(node.name)
		node.codeEmbeddings = await LLM.generateEmbeddings(node.code)

		return node
	}

	getNodeName(): string {
		return this.name
	}

	getDBInsertQuery(): string {
		let query = ""
		query += `
         CREATE (n:${this.descriptor} {
            id: $id,
            name: $name,
            type: $type,

            code: $code,
            filePath: $filePath,

            nameEmbeddings: $nameEmbeddings,
            codeEmbeddings: $codeEmbeddings
         })
      `

		return query
	}
}
