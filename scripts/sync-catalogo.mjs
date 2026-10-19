/* Copia o catálogo normalizado (../../catalogo) pra src/data. Roda antes do build. */
import fs from "node:fs";
import path from "node:path";
const origem = path.resolve("../../catalogo");
const destino = path.resolve("src/data");
fs.mkdirSync(destino, { recursive: true });
for (const f of ["produtos.json", "taxonomia-nova.json"]) {
  const de = path.join(origem, f);
  if (!fs.existsSync(de)) { console.warn(`sync: ${de} não existe; mantendo o que está em src/data`); continue; }
  fs.copyFileSync(de, path.join(destino, f));
}
console.log("sync:catalogo ok");
