import { namedTypes } from "ast-types"

import { TreeNode } from "../core/treeNode"
import { TypeAnnotation } from "../core/typeAnnotation"
import { TypeArgument } from "../core/typeArgument"

export namespace Interface {
	export function Handle(n: namedTypes.InterfaceDeclaration) {
		const node = new TreeNode(
			n.id?.name.toString() ?? "",
			"Interface",
			"",
			"",
			{
				start: {
					line: n.loc?.start.line ?? 0,
					column: n.loc?.start.column ?? 0,
				},
				end: {
					line: n.loc?.end.line ?? 0,
					column: n.loc?.end.column ?? 0,
				},
			}
		)

		// Check for type parameters
		const typeParameters: string[] = []
		for (const p of n.typeParameters?.params ?? []) {
			typeParameters.push((p.name as any).name)
		}

		// Check for extensions
		for (const e of n.extends ?? []) {
			const name = (e as any).expression.name
			if (typeParameters.includes(name)) continue

			node.pushUse({
				name: name,
				type: "type",
			})

			const params = (e as any).typeArguments?.params ?? []
			node.pushUse(
				...TypeArgument.flatten(params)
					.map((t) => ({
						name: t,
						type: "type",
					}))
					.filter((t) => !typeParameters.includes(t.name))
			)
		}

		// Check for external references
		for (const m of (n.body as any).body) {
			// Check for type references & index signatures (classes, enums, interfaces etc...)
			const annotation = m.typeAnnotation?.typeAnnotation as any
			if (namedTypes.TSTypeReference.check(annotation)) {
				const name = (annotation as any).typeName.name
				if (!name) continue
				if (typeParameters.includes(name)) continue

				node.pushUse(
					...TypeAnnotation.flatten(
						m.typeAnnotation?.typeAnnotation as any
					).map((t) => ({
						name: t,
						type: "type",
					}))
				)
			}
			// Check for call signatures (functions)
			else if (
				namedTypes.TSCallSignatureDeclaration.check(m) ||
				namedTypes.TSMethodSignature.check(m) ||
				namedTypes.TSConstructSignatureDeclaration.check(m)
			) {
				// Check for the return type
				const returnType = ((m as any).returnType?.typeAnnotation as any)
					?.typeName?.name
				if (returnType) {
					node.pushUse({
						name: returnType,
						type: "type",
					})
				}

				// Check for the params type params (recursive)
				for (const p of (m as any).params ?? []) {
					node.pushUse(
						...TypeAnnotation.flatten(p.typeAnnotation ?? []).map((t) => ({
							name: t,
							type: "type",
						}))
					)
				}
			}
		}

		// Remove uses that uses the type parameters
		node.uses = node.uses.filter((u) => !typeParameters.includes(u.name))

		return node
	}
}
