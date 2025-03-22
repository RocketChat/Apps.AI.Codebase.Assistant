import { writeFileSync } from "fs"
import { StyleguideModel } from "../lib/models/styleguide"

const links = [
   "https://github.com/RocketChat/Rocket.Chat/raw/develop/.prettierrc",
   "https://github.com/RocketChat/Rocket.Chat/raw/develop/postcss.config.js",
   "https://github.com/RocketChat/Rocket.Chat/raw/develop/apps/meteor/.stylelintrc",
   "https://github.com/RocketChat/Rocket.Chat/raw/develop/apps/meteor/.stylelintignore",
   "https://github.com/RocketChat/Rocket.Chat/raw/develop/apps/meteor/.postcssrc",
   "https://github.com/RocketChat/Rocket.Chat/raw/develop/apps/meteor/.eslintrc.json",
   "https://github.com/RocketChat/Rocket.Chat/raw/develop/apps/meteor/tsconfig.json",
   "https://github.com/RocketChat/Rocket.Chat/raw/develop/apps/meteor/scalingo.json",
   "https://github.com/RocketChat/Rocket.Chat/raw/develop/apps/meteor/tsconfig.typecheck.json",
   "https://github.com/RocketChat/Rocket.Chat/raw/develop/apps/meteor/tsconfig.webpack.json",
   "https://github.com/RocketChat/Rocket.Chat/raw/develop/apps/meteor/.babelrc",
   "https://github.com/RocketChat/Rocket.Chat/raw/develop/apps/meteor/.codeclimate.yml",
   "https://github.com/RocketChat/Rocket.Chat/raw/develop/apps/meteor/.storybook/babel.config.js",
   "https://github.com/RocketChat/Rocket.Chat/raw/develop/.editorconfig",
   "https://github.com/RocketChat/Rocket.Chat/raw/develop/.kodiak.toml",
   "https://github.com/RocketChat/Rocket.Chat/raw/develop/tsconfig.base.client.json",
   "https://github.com/RocketChat/Rocket.Chat/raw/develop/tsconfig.base.json",
   "https://github.com/RocketChat/Rocket.Chat/raw/develop/tsconfig.base.server.json",
]

let styleguides: Record<string, string> = {}

async function fetchStyleguide(url: string) {
   const res = await fetch(url)
   const data = await res.text()
   const filePath = url.split("raw/develop").at(-1)!
   styleguides[filePath] = data
}

async function fetchStyleguides(): Promise<Record<string, string>> {
   await Promise.all(links.map(fetchStyleguide))
   const result = { ...styleguides }
   styleguides = {}

   return result
}

export async function insertStyleguides() {
   const styleguides = await fetchStyleguides()
   writeFileSync("styleguides.data.json", JSON.stringify(styleguides, null, 2))

   const transaction = db.beginTransaction()

   transaction.run(`
		MATCH (n:Styleguide)
		DETACH DELETE n
	`)

   const jobs = []
   for (const [filePath, data] of Object.entries(styleguides)) {
      const node = new StyleguideModel({
         id: filePath,
         name: filePath,
         filePath: filePath,
         content: data,
         relations: [],
         nameEmbeddings: [],
         codeEmbeddings: [],
         contentEmbeddings: [],
         descriptor: "Styleguide"
      })
      const job = transaction.run(node.getDBInsertQuery(), node)
      jobs.push(job)
   }
   await Promise.all(jobs)

   await transaction.commit()
}
