export type TreeNodeSourceLocation = {
	start: {
		line: number
		column: number
	}
	end: {
		line: number
		column: number
	}
}

export class TreeNode {
	name: string = ""
	type: string = ""
	body: string = ""

	location: TreeNodeSourceLocation
	sourceFileRelativePath: string

	uses: {
		name: string
		type: string
	}[] = []

	constructor(
		name: string,
		type: string,
		body: string,
		sourceFilePath: string,
		location: TreeNodeSourceLocation
	) {
		this.name = name
		this.type = type
		this.body = body
		this.sourceFileRelativePath = sourceFilePath
		this.location = location
	}

	toString() {
		return `${this.name} (${this.type})`
	}

	getID(): string {
		return `${this.sourceFileRelativePath}:${this.name}`
	}

	pushUse(...uses: { name: string; type: string }[]) {
		for (const use of uses) {
			if (this.uses.findIndex((u) => u.name == use.name) !== -1) continue
			this.uses.push(use)
		}
	}

	isFile() {
		return false
	}
}
