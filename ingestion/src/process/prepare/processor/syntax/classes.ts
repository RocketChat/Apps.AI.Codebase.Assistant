import { namedTypes } from "ast-types"

import { TreeNode } from "../core/treeNode"
import { TypeArgument } from "../core/typeArgument"
import { Functions } from "../syntax/functions"

export namespace Classes {
   export function Handle(n: namedTypes.ClassDeclaration) {
      const node = new TreeNode(n.id?.name.toString() ?? "", "Class", "", "", {
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

      // Check for super class
      if (n.superClass) {
         if (namedTypes.Identifier.check(n.superClass)) {
            node.pushUse({
               name: n.superClass.name,
               type: "class",
            })
         }
      }

      // Check for implemented interfaces
      if (n.implements) {
         for (const i of n.implements) {
            node.pushUse({
               name: (i as any).expression.name,
               type: "interface",
            })
         }
      }

      // Check for external references in any of the methods
      for (const m of n.body.body) {
         if (namedTypes.MethodDefinition.check(m)) {
            if (namedTypes.FunctionExpression.check(m.value)) {
               node.pushUse(...Functions.Handle(m.value as any).uses)
            }
         }
      }

      // Remove uses that uses the type parameters
      node.uses = node.uses.filter((u) => !typeParameters.includes(u.name))

      return node
   }

   export function flattenNewExpression(node: namedTypes.NewExpression) {
      const uses: { name: string; type: string }[] = []

      if (namedTypes.Identifier.check(node.callee)) {
         uses.push({
            name: node.callee.name,
            type: "class",
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
               uses.push(...Functions.flattenCallExpression(a))
            } else if (namedTypes.NewExpression.check(a)) {
               uses.push(...flattenNewExpression(a))
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
