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
	readFile(): string
}
