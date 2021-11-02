import {version as ascVersion} from 'assemblyscript/cli/asc';
import assert from 'assert';
import childProcess from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import tempy from 'tempy';

import {CompilationError, InvalidProgramSourcePathError} from './errors.js';


export interface CompilationResult {
	wasm: Buffer;
	sourceMap: string;
	ascVersion: string;
}

function checkFilePath(filePath: string): string {
	const normalizedPath = path.normalize(filePath);
	const {root, dir, ext} = path.parse(normalizedPath);
	if (root !== '') {
		throw new InvalidProgramSourcePathError(filePath, "file path is not relative");
	}
	if (dir.startsWith('..')) {
		throw new InvalidProgramSourcePathError(filePath, "file path is in parent directory");
	}
	if (ext !== '.ts') {
		throw new InvalidProgramSourcePathError(filePath, "file path must have .ts extension");
	}
	return normalizedPath;
}

export async function compile(files: {[filePath: string]: string}): Promise<CompilationResult> {
	const checkedFiles: { [filePath: string]: Buffer } = {};
	for (const filePath in files) {
		const checkedPath = checkFilePath(filePath);
		try {
			checkedFiles[checkedPath] = Buffer.from(files[filePath]);
		} catch (err) {
			if (err instanceof Error) {
				throw new InvalidProgramSourcePathError(filePath, err.message);
			} else {
				throw err;
			}
		}
	}

	let output = Buffer.alloc(0);
	let sourceMap = '';
	await tempy.directory.task(async (baseDirPath) => {
		const srcDirPath = path.join(baseDirPath, 'src');
		await fs.mkdir(srcDirPath);

		for (const relativeFilePath in checkedFiles) {
			const filePath = path.join(srcDirPath, relativeFilePath);
			const dirPath = path.dirname(filePath);
			await fs.mkdir(dirPath, {recursive: true});
			await fs.writeFile(filePath, checkedFiles[relativeFilePath]);
		}

		for (const fileName of ['main.ts', 'mainTypes.ts']) {
			const srcPath = path.join('assemblyscript', fileName);
			const dstPath = path.join(srcDirPath, fileName);
			await fs.copyFile(srcPath, dstPath);
		}

		const outputPath = path.join(baseDirPath, "main.wasm");
		const sourceMapPath = path.join(baseDirPath, "main.wasm.map");
		const args = [
			"main.ts",
			"--baseDir", srcDirPath,
			"--binaryFile", outputPath,
			"--optimize",
			"--sourceMap",
		];
		// Run in subprocess because of https://github.com/AssemblyScript/assemblyscript/issues/2112
		const ascProc = childProcess.fork('./node_modules/.bin/asc', args, {
			stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
		});
		let stderr = '';
		assert(ascProc.stderr !== null, "fork was called with stderr piped to parent");
		ascProc.stderr.on('data', (chunk) => stderr += chunk);

		try {
			await new Promise<void>((resolve, reject) => {
				ascProc.on('error', (err) => {
					console.log(err);
					reject(err);
				});
				ascProc.on('close', (code, signal) => {
					if (code === 0) {
						return resolve();
					}
					reject(new Error(`asc exited with status ${code} on signal ${signal}`));
				});
			});
		} catch (err) {
			if (err instanceof Error) {
				throw new CompilationError(err, stderr);
			}
			throw err;
		}

		output = await fs.readFile(outputPath);
		sourceMap = (await fs.readFile(sourceMapPath)).toString();
	});

	return {
		wasm: output,
		sourceMap,
		ascVersion,
	};
}
