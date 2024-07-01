import { readFileSync } from "fs"
import path from "path"
import { ISourceFile } from "./sourceFile.types"

export class SourceFile implements ISourceFile {
	private _path: string
	private _projectPath: string

	constructor(filepath: string) {
		// Normalize file path
		this._path = filepath.replace(/\\/g, "/")

		// Get project path
		const sourceFileAbsolutePath = path.resolve(this._path).replace(/\\/g, "/")
		const projectPath = sourceFileAbsolutePath.slice(
			0,
			sourceFileAbsolutePath.indexOf(this._path)
		)
		this._projectPath = projectPath
	}

	read(): string {
		const content = readFileSync(this._path, "utf-8")
		return content
	}

	getProjectPath(): string {
		return this._projectPath
	}

	getFullPath(): string {
		return this._path
	}
}
