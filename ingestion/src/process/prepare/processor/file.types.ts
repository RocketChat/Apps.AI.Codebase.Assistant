import { CodeModel } from "@/lib/models/code"
import { DevDocModel } from "@/lib/models/devdoc"
import { ISourceFile } from "../sourceFile.types"

export interface IFileProcessor {
   process(sourceFile: ISourceFile, nodesRef: Record<string, CodeModel | DevDocModel>): void
}
