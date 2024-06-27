import { namedTypes } from "ast-types/gen/namedTypes"
import { TreeNode } from "../core/treeNode"
import { Enums } from "./enums"
import { Functions } from "./functions"
import { Interface } from "./interface"
import { TypeAlias } from "./typeAlias"

export namespace Namespaces {
	export function Handle(n: namedTypes.TSModuleDeclaration) {
		const node = new TreeNode(
			(n.id as any)?.name.toString() ?? "",
			"Namespace",
			"",
			""
		)

		const body = ((n as any).declaration?.body?.body ??
			[]) as namedTypes.TSModuleBlock[]
		for (const b of body) {
			let d = b
			if (namedTypes.ExportNamedDeclaration.check(b)) d = (b as any).declaration

			if (namedTypes.FunctionDeclaration.check(d)) {
				Functions.Handle(d)
			} else if (namedTypes.TSInterfaceDeclaration.check(d)) {
				Interface.Handle(d as any)
			} else if (namedTypes.TSTypeAliasDeclaration.check(d)) {
				TypeAlias.Handle(d)
			} else if (namedTypes.TSEnumDeclaration.check(d)) {
				Enums.Handle(d as any)
			} else if (
				namedTypes.TSModuleDeclaration.check(d) ||
				namedTypes.ExportNamedDeclaration.check(d)
			) {
				Namespaces.Handle(d as any)
			} else if (namedTypes.ClassDeclaration.check(d)) {
				// Classes.Handle(d)
			}
		}

		return node
	}
}
