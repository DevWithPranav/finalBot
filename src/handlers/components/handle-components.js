import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const foldersPath = path.resolve(__dirname, '..', '..', 'components'); // Adjust the path to be absolute

export const loadComponents = async (client) => {
  try {
    if (!fs.existsSync(foldersPath)) {
      throw new Error(`The components folder does not exist at path: ${foldersPath}`);
    }

    const componentFolders = fs.readdirSync(foldersPath);

    for (const folder of componentFolders) {
      const componentsPath = path.join(foldersPath, folder);
      if (!fs.lstatSync(componentsPath).isDirectory()) {
        console.warn(`[WARNING] Skipping ${componentsPath} as it is not a directory.`);
        continue;
      }

      const componentFiles = fs.readdirSync(componentsPath).filter(file => file.endsWith('.js'));

      for (const file of componentFiles) {
        const filePath = path.join(componentsPath, file);
        try {
          const component = await import(pathToFileURL(filePath).href);
          if ('default' in component) {
            const cmp = component.default;
            if ('customId' in cmp && 'execute' in cmp) {
              client.components.set(cmp.customId, cmp);
            } else {
              console.warn(`[WARNING] The component at ${filePath} is missing a required "customId" or "execute" property.`);
            }
          } else {
            console.warn(`[WARNING] The component at ${filePath} does not have a default export.`);
          }
        } catch (importError) {
          console.error(`[ERROR] Failed to import component at ${filePath}: ${importError.message}`);
        }
      }
    }
  } catch (error) {
    console.error(`[ERROR] Failed to load components: ${error.message}`);
    process.exit(1); // Exit the process if a critical error occurs
  }
};
