export enum SourceFileType {
	// TypeScript
	TypeScript,
	TypeScriptReact,

	// JavaScript
	JavaScript,
	JavaScriptReact,

	// Others
	JSON,
}

export interface ISourceFile {
	read(): string

	getProjectPath(): string
	getFullPath(): string
}
