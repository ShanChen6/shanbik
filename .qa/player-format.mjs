import fs from "node:fs/promises";
import prettier from "prettier";
const paths = ["src/features/cube/viewer/move-queue.ts","src/features/cube/viewer/playback-controls.tsx","src/features/cube/viewer/practice-cube.tsx","src/features/cube/scramble/scramble-panel.tsx","src/features/cube/viewer/playback.test.ts","docs/cube-player.md","README.md","src/app/help/page.tsx","docs/routes.md","docs/cube-scramble.md"];
const entries = [];
for (const path of paths) {
  const content = await prettier.format(await fs.readFile(path,"utf8"), { filepath: path });
  await fs.writeFile(path,content);
  entries.push({path,content});
}
const encoded = Buffer.from(JSON.stringify(entries)).toString("base64");
for (let offset=0,index=0;offset<encoded.length;offset+=8000,index++) console.log("PLAYER_FORMAT_" + String(index).padStart(3,"0") + "=" + encoded.slice(offset,offset+8000));
