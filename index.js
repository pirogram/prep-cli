#!/usr/bin/env node

const program = require( 'commander');
const watch = require( 'node-watch');
const pirepLoader = require( 'prep-loader');
const { spawn } = require('child_process');
const path = require('path');

program
    .version('0.1.0')
    .option('-i, --ssh-identity [path]', 'ssh identity file path.')
    .option('-s, --src [path]', 'source directory for pirogram package [current directory].', '.')
    .option('-d, --dst [path]', 'destination directory for pirogram package.')
    .option('-a, --author [author]', 'pirogram username for author.')
    .parse(process.argv)

if( !program.sshIdentity || !program.author || !program.dst) {
    program.help();
}

const packageDirectory = path.resolve( program.src);

watch( packageDirectory, {recursive: true}, async (evt, path) => {
    console.log(`${path} changed.`);

    let p;
    try {
        p = await pirepLoader.loadPackage( program.author, packageDirectory);
    } catch( e) {
        console.log(e);
        return;
    }

    console.log("Syncing content.");

    const rsync = spawn( "rsync", ["-avzh", "-e", `ssh -i ${program.sshIdentity}`, `${packageDirectory}/`,
        `${program.dst}/${program.author}/${p.meta.code}/`]);

    rsync.stdout.on( 'data', (data) => { process.stdout.write( data.toString()); });
    rsync.stderr.on( 'data', (data) => { process.stderr.write( data.toString()); });
});

console.log(`Watching dirctory [${packageDirectory}] for changes.`);