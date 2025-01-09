import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function generateHash(filePath) {
    const fileBuffer = await fs.readFile(filePath);
    return createHash('sha384')
        .update(fileBuffer)
        .digest('base64');
}

async function findNodeModulesPath() {
    // Chemins possibles pour PNPM
    const paths = [
        // Chemin standard node_modules
        path.join(__dirname, '../node_modules/material-design-lite'),
        // Chemin PNPM store local
        path.join(__dirname, '../.pnpm/material-design-lite@1.3.0/node_modules/material-design-lite')
    ];

    for (const p of paths) {
        try {
            await fs.access(p);
            return p;
        } catch {
            continue;
        }
    }

    throw new Error('Material Design Lite package not found');
}

async function setupMDL() {
    try {
        // Création du dossier public/mdl
        const mdlPublicDir = path.join(__dirname, '../public/mdl');
        await fs.mkdir(mdlPublicDir, { recursive: true });

        // Trouver le bon chemin des fichiers source
        const nodeModulesPath = await findNodeModulesPath();
        const files = ['material.min.css', 'material.min.js'];

        // Copie des fichiers et génération des hashes
        const hashes = {};

        for (const file of files) {
            const sourcePath = path.join(nodeModulesPath, file);
            const destPath = path.join(mdlPublicDir, file);

            // Copie du fichier
            await fs.copyFile(sourcePath, destPath);

            // Génération du hash
            const hash = await generateHash(destPath);
            hashes[file] = hash;

            console.log(`✓ Copié ${file}`);
            console.log(`  Hash: sha384-${hash}`);
        }

        // Mise à jour du composant MaterialDesignLite.astro
        const componentPath = path.join(__dirname, '../src/components/MaterialDesignLite.astro');
        let content = await fs.readFile(componentPath, 'utf-8');

        // Mise à jour des hashes d'intégrité
        content = content.replace(
            /integrity="sha384-..."/g,
            (match, offset) => {
                const isJS = content.slice(offset - 40, offset).includes('.js');
                return `integrity="sha384-${isJS ? hashes['material.min.js'] : hashes['material.min.css']}"`;
            }
        );

        await fs.writeFile(componentPath, content);
        console.log('✓ Hashes mis à jour dans MaterialDesignLite.astro');

    } catch (error) {
        console.error('Erreur:', error);
        process.exit(1);
    }
}

setupMDL(); 