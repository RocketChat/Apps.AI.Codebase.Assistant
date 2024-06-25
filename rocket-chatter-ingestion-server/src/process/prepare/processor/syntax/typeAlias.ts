import { namedTypes } from "ast-types"
import { TreeNode } from "../core/treeNode"
import { TypeAnnotation } from "../core/typeAnnotation"

export namespace TypeAlias {
	export function Handle(n: namedTypes.TSTypeAliasDeclaration) {
		const node = new TreeNode(
			n.id?.name.toString() ?? "",
			"TypeAlias",
			"",
			n.loc?.start.line ?? 0,
			n.loc?.start.column ?? 0
		)

		// Check for type parameters
		const typeParameters: string[] = []
		for (const p of n.typeParameters?.params ?? []) {
			typeParameters.push((p.name as any).name)
		}

		// Check for external references
		node.pushUse(
			...TypeAnnotation.flatten(n.typeAnnotation).map((name) => ({
				name,
				type: "type",
			}))
		)

		return node
	}
}
