import { copyFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const outDir = resolve('.output/public')

await copyFile(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
await writeFile(resolve(outDir, '.nojekyll'), '')
