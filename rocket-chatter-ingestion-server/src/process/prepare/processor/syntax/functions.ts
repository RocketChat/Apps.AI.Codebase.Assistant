import { namedTypes } from "ast-types"

import { TreeNode } from "../core/treeNode"
import { TypeAnnotation } from "../core/typeAnnotation"
import { TypeArgument } from "../core/typeArgument"
import { Classes } from "./classes"

export namespace Functions {
	export function Handle(n: namedTypes.FunctionDeclaration) {
		const node = new TreeNode(n.id?.name.toString() ?? "", "Function", "", "", {
			start: {
				line: n.body.loc?.start.line ?? 0,
				column: n.body.loc?.start.column ?? 0,
			},
			end: {
				line: n.body.loc?.end.line ?? 0,
				column: n.body.loc?.end.column ?? 0,
			},
		})

		// Check for type parameters
		const typeParameters: string[] = []
		for (const p of n.typeParameters?.params ?? []) {
			typeParameters.push((p.name as any).name)
		}

		// Handle type annotations
		if (n.returnType?.typeAnnotation) {
			node.pushUse(
				...TypeAnnotation.flatten(n.returnType.typeAnnotation as any).map(
					(name) => ({
						name: name,
						type: "type",
					})
				)
			)
		}

		// Handle parameters to see if any of them uses an external entity
		for (const p of n.params) {
			if (namedTypes.Identifier.check(p)) {
				node.pushUse(
					...TypeAnnotation.flatten(
						p.typeAnnotation?.typeAnnotation as any
					).map((name) => ({
						name: name,
						type: "type",
					}))
				)
			}
		}

		// Handle the body of the function
		for (const c of n.body.body) {
			if (namedTypes.ExpressionStatement.check(c)) {
				// For direct calls
				if (namedTypes.CallExpression.check(c.expression)) {
					node.pushUse(
						{
							name: (c.expression.callee as any).name,
							type: "function",
						},
						...flattenCallExpression(c.expression)
					)
				}
			}
			// For variable declarations
			else if (namedTypes.VariableDeclaration.check(c)) {
				// For variable declarations
				for (const d of c.declarations) {
					if (namedTypes.VariableDeclarator.check(d)) {
						// For variables declared using function calls
						if (namedTypes.CallExpression.check(d.init)) {
							node.pushUse(
								{
									name: (d.init.callee as any).name,
									type: "function",
								},
								...flattenCallExpression(d.init)
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
						// For variables declared using other variables or direct values
						else if (namedTypes.Identifier.check(d.init)) {
							node.pushUse({
								name: d.init.name,
								type: "variable",
							})
						} else {
							// For other types of declarations (e.g. arrow functions) we don't need to do anything
							// as they can't refer to other functions
						}
					}
				}
			}
		}

		// Remove uses that uses the type parameters
		node.uses = node.uses.filter((u) => !typeParameters.includes(u.name))

		return node
	}

	export function flattenCallExpression(node: namedTypes.CallExpression) {
		const uses: { name: string; type: string }[] = []

		if (namedTypes.Identifier.check(node.callee)) {
			uses.push({
				name: node.callee.name,
				type: "function",
			})
		}

		if (node.arguments) {
			for (const a of node.arguments) {
				if (namedTypes.Identifier.check(a)) {
					uses.push({
						name: a.name,
						type: "variable",
					})
				} else if (namedTypes.CallExpression.check(a)) {
					uses.push(...flattenCallExpression(a))
				} else if (namedTypes.NewExpression.check(a)) {
					uses.push(...Classes.flattenNewExpression(a))
				}
			}
		}

		if (node.typeArguments) {
			const types = TypeArgument.flatten(node.typeArguments?.params ?? [])
			for (const t of types) {
				uses.push({
					name: t,
					type: "type",
				})
			}
		}

		return uses
	}
}
