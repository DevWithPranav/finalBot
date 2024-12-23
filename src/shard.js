import { ShardingManager } from 'discord.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import colors from 'colors';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.DISCORD_TOKEN) {
    throw new Error('DISCORD_TOKEN is not defined in the .env file');
}

const manager = new ShardingManager(path.join(__dirname, 'index.js'), {
    totalShards: 'auto',
    token: process.env.DISCORD_TOKEN,
    respawn: true
});

console.clear();

manager.on('shardCreate', shard => {
    console.log('System'.cyan, '>>'.blue, 'Starting up.....'.green, ':'.grey, `Shard #${shard.id}....`.green);

    shard.on('death', process => {
        console.log('System'.cyan, '>>'.blue, `Shard ${shard.id} died with exit code ${process.exitCode}.`.red);
    });

    shard.on('disconnect', event => {
        console.log('System'.cyan, '>>'.blue, `Shard ${shard.id} disconnected. Dumping socket close event...`.red);
        console.log(event);
    });

    shard.on('reconnecting', () => {
        console.log('System'.cyan, '>>'.blue, `Shard ${shard.id} is reconnecting...`.yellow);
    });

    shard.on('ready', () => {
        console.log('System'.cyan, '>>'.blue, `Shard ${shard.id} is ready!`.green);
    });
});

manager.spawn().catch(error => {
    console.error('Error spawning shards:', error);
    process.exit(1);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('warning', warn => {
    console.warn('Warning:', warn);
});
