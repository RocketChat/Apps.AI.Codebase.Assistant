import { namedTypes } from "ast-types"

export namespace TypeAnnotation {
	export function flatten(
		type: namedTypes.TSTypeAliasDeclaration["typeAnnotation"]
	) {
		const typeArguments = new Set<string>()

		// Handle type annotations
		if (namedTypes.TSTypeAnnotation.check(type)) {
			flatten((type as any).typeAnnotation).forEach((x) => typeArguments.add(x))
		}
		// Handle direct type references
		else if (namedTypes.TSTypeReference.check(type)) {
			const name = (type as any).typeName.name
			if (name) typeArguments.add(name)
		}
		// Handle intersection (|) and union (&) types
		else if (
			namedTypes.TSIntersectionType.check(type) ||
			namedTypes.TSUnionType.check(type)
		) {
			for (const t of type.types) {
				flatten(t).forEach((x) => typeArguments.add(x))
			}
		}
		// Handle function types
		else if (namedTypes.TSFunctionType.check(type)) {
			// Handle return type of the function
			if ((type as any).returnType) {
				flatten((type as any).returnType.typeAnnotation).forEach((x) =>
					typeArguments.add(x)
				)
			}

			// Handle parameters of the function
			for (const t of (type as any).params ?? []) {
				flatten((t as any).typeAnnotation).forEach((x) => typeArguments.add(x))
			}
		}
		// Handle array types
		else if (namedTypes.TSTupleType.check(type)) {
			for (const t of type.elementTypes)
				flatten(t).forEach((x) => typeArguments.add(x))
		}
		// Handle indexed access types
		else if (namedTypes.TSIndexedAccessType.check(type)) {
			flatten((type as any).objectType).forEach((x) => typeArguments.add(x))
			flatten((type as any).indexType).forEach((x) => typeArguments.add(x))
		}
		// Handle infer types
		else if (namedTypes.TSConditionalType.check(type)) {
			flatten(type.checkType).forEach((x) => typeArguments.add(x))
			flatten(type.extendsType).forEach((x) => typeArguments.add(x))
			flatten(type.trueType).forEach((x) => typeArguments.add(x))
			flatten(type.falseType).forEach((x) => typeArguments.add(x))
		}
		// Handle mapped types
		else if (namedTypes.TSMappedType.check(type)) {
			if (type.typeAnnotation)
				flatten(type.typeAnnotation).forEach((x) => typeArguments.add(x))
			if (type.typeParameter.constraint)
				flatten(type.typeParameter.constraint).forEach((x) =>
					typeArguments.add(x)
				)
			if (type.typeParameter.default)
				flatten(type.typeParameter.default).forEach((x) => typeArguments.add(x))
		}

		return [...typeArguments]
	}
}
