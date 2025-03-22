import { CodeModel } from "@/lib/models/code"
import { DocumentationModel } from "@/lib/models/devdoc"
import { ISourceFile } from "../sourceFile.types"

export interface IFileProcessor {
   process(sourceFile: ISourceFile, nodesRef: Record<string, CodeModel | DocumentationModel>): void
}
