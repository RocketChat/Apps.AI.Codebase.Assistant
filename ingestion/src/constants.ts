import { configDotenv } from "dotenv"
configDotenv()

export const REPO_URI = "https://github.com/RocketChat/Rocket.Chat"
export const RC_APP_URI = process.env["RC_APP_URI"] ?? ""
