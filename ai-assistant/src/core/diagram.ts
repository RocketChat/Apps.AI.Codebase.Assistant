export default {}
// import { exec } from "child_process";
// // import { randomUUID } from "crypto"
// import { unlinkSync, writeFileSync } from "fs";

// export async function renderDiagramToBase64URI(
//     diagram: string
// ): Promise<string> {
//     const diagramID = "diagram";
//     // ?? randomUUID()
//     const diagramSourceFileName = `${diagramID}.txt`;
//     const diagramSVGFileName = `${diagramID}.svg`;

//     writeFileSync(diagramSourceFileName, diagram);

//     await new Promise<void>((resolve, reject) => {
//         const diagram = exec(
//             `npx mmdc -i ${diagramSourceFileName} -o ${diagramSVGFileName}`,
//             {
//                 cwd: process.cwd(),
//                 timeout: 10000,
//             }
//         );

//         diagram.on("exit", async (code) => {
//             //			unlinkSync(diagramSourceFileName)
//             if (code === 0) {
//                 resolve();
//             } else {
//                 console.log(`Error: ${code}`);
//                 reject();
//             }
//         });
//     });

//     const base64 = await new Promise<string>((resolve, reject) => {
//         exec(`base64 ${diagramSVGFileName}`, async (err, stdout) => {
//             unlinkSync(diagramSVGFileName);
//             if (err) reject(err);
//             resolve(stdout);
//         });
//     });

//     const uri = `data:image/svg+xml;base64,${base64.trim()}`;

//     return uri;
// }
