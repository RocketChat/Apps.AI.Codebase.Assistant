import { namedTypes } from "ast-types"

export namespace TypeArgument {
	export function flatten(
		args: namedTypes.TypeParameterInstantiation["params"]
	) {
		const typeArguments = new Set<string>()

		for (const t of args) {
			if (namedTypes.TSTypeReference.check(t)) {
				typeArguments.add((t as any).typeName.name)

				if ((t as any).typeArguments) {
					flatten((t as any).typeArguments.params).forEach((x) =>
						typeArguments.add(x)
					)
				}
			}
		}

		return [...typeArguments]
	}
}
