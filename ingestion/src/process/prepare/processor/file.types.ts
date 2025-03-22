import { CodeModel } from "@/models/code"
import { DocumentationModel } from "@/models/devdoc"
import { ISourceFile } from "../sourceFile.types"

export interface IFileProcessor {
   process(sourceFile: ISourceFile, nodesRef: Record<string, CodeModel | DocumentationModel>): void
}
