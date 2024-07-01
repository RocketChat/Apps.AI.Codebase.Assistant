import OpenAI from "openai"
import { OPENAI_KEY } from "../constants"

const openai = new OpenAI({ apiKey: OPENAI_KEY })

export namespace LLM {
	export async function generateEmbeddings(data: string): Promise<number[]> {
		try {
			const content = await openai.embeddings.create({
				input: data,
				model: "text-embedding-3-small",
				dimensions: 768,
				encoding_format: "float",
			})
			const embedding = content.data[0].embedding
			console.log("🔥 Generated embeddings")
			console.log(embedding)
			return embedding
		} catch {
			return []
		}
	}
}
