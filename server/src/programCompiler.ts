import asc from 'assemblyscript/cli/asc';
import path from 'path';
import fs from 'fs/promises';
import tempy from 'tempy';
import {promisify} from 'util';

import {CompilationError, InvalidProgramSourcePathError} from './errors.js';


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

export async function compile(files: {[filePath: string]: string}): Promise<Buffer> {
	const checkedFiles: { [filePath: string]: Buffer } = {};
	for (const filePath in files) {
		const checkedPath = checkFilePath(filePath);
		try {
			checkedFiles[checkedPath] = Buffer.from(files[filePath], 'base64');
		} catch (err) {
			if (err instanceof Error) {
				throw new InvalidProgramSourcePathError(filePath, err.message);
			} else {
				throw err;
			}
		}
	}

	let output = Buffer.alloc(0);
	await tempy.directory.task(async (baseDirPath) => {
		const srcDirPath = path.join(baseDirPath, 'src');

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

		await asc.ready;

		const outputPath = path.join(baseDirPath, "output.wasm");
		const stdout = asc.createMemoryStream();
		const stderr = asc.createMemoryStream();
		await promisify((callback: (err?: any) => void) => {
			asc.main(
				[
					"main.ts",
					"--baseDir", srcDirPath,
					"--binaryFile", outputPath,
					"--optimize",
				],
				{
					stdout,
					stderr,
				},
				(err) => {
					if (err) {
						callback(new CompilationError(err, stderr.toString()));
					} else {
						callback();
					}
					return 0;
				},
			);
		})();

		output = await fs.readFile(outputPath);
	});

	return output;
}
