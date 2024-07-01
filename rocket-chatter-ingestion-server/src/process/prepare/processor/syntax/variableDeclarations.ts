import { namedTypes } from "ast-types"

import { TreeNode } from "../core/treeNode"
import { Classes } from "./classes"
import { Functions } from "./functions"

export namespace VariableDeclarations {
	export function Handle(n: namedTypes.VariableDeclaration) {
		const nodes: TreeNode[] = []

		// For variable declarations
		for (const d of n.declarations) {
			if (namedTypes.VariableDeclarator.check(d)) {
				const node = new TreeNode((d.id as any).name, "variable", "", "", {
					start: {
						line: n.loc?.start.line ?? 0,
						column: n.loc?.start.column ?? 0,
					},
					end: {
						line: n.loc?.end.line ?? 0,
						column: n.loc?.end.column ?? 0,
					},
				})

				// For variables declared using other variables
				if (namedTypes.Identifier.check(d.init)) {
					if (!d.init.name) continue
					node.pushUse({
						name: d.init.name,
						type: "variable",
					})
				}
				// For variables declared using function calls
				else if (namedTypes.CallExpression.check(d.init)) {
					node.pushUse(
						{
							name: (d.init.callee as any).name,
							type: "function",
						},
						...Functions.flattenCallExpression(d.init)
					)
				}
				// For variables declared using new expressions
				else if (namedTypes.NewExpression.check(d.init)) {
					if (namedTypes.Identifier.check(d.init.callee)) {
						node.pushUse({
							name: d.init.callee.name,
							type: "class",
						})
					}
					node.pushUse(...Classes.flattenNewExpression(d.init))
				}

				nodes.push(node)
			}
		}

		return nodes
	}
}
