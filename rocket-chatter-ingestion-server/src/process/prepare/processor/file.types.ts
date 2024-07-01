import { DBNode } from "../../../core/dbNode"
import { ISourceFile } from "../sourceFile.types"

export interface IFileProcessor {
	process(sourceFile: ISourceFile, nodesRef: Record<string, DBNode>): void
}
