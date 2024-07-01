import { namedTypes } from "ast-types"

import { TreeNode } from "../core/treeNode"
import { Classes } from "./classes"
import { Functions } from "./functions"

export namespace Enums {
	export function Handle(n: namedTypes.EnumDeclaration) {
		const node = new TreeNode(n.id?.name.toString() ?? "", "Enum", "", "", {
			start: {
				line: n.loc?.start.line ?? 0,
				column: n.loc?.start.column ?? 0,
			},
			end: {
				line: n.loc?.end.line ?? 0,
				column: n.loc?.end.column ?? 0,
			},
		})

		// Check for external references while initializing the enum members
		for (const m of (n as any).members as namedTypes.TSEnumMember[]) {
			if (namedTypes.CallExpression.check(m.initializer)) {
				node.pushUse(...Functions.flattenCallExpression(m.initializer))
			} else if (namedTypes.NewExpression.check(m.initializer)) {
				node.pushUse(...Classes.flattenNewExpression(m.initializer))
			} else if (namedTypes.Identifier.check(m.initializer)) {
				node.pushUse({
					name: m.initializer.name,
					type: "variable",
				})
			}
		}

		return node
	}
}
