import tempy from 'tempy';
import path from 'path';
import fs from 'fs/promises';

import {InvalidProgramSourcePathError} from './errors.js';


function checkFilePath(filePath: string): string {
	const normalizedPath = path.normalize(filePath);
	const {root, dir, ext} = path.parse(normalizedPath);
	if (root !== '') {
		throw new InvalidProgramSourcePathError(filePath, "file path is not relative");
	}
	if (dir.startsWith('..')) {
		throw new InvalidProgramSourcePathError(filePath, "file path is in parent directory");
	}
	if (ext !== 'ts') {
		throw new InvalidProgramSourcePathError(filePath, "file path must have .ts extension");
	}
	return normalizedPath;
}

export async function compile(files: {[filePath: string]: string}) {
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

	await tempy.directory.task(async (baseDirPath) => {
		for (const relativeFilePath in checkedFiles) {
			const filePath = path.join(baseDirPath, relativeFilePath);
			const dirPath = path.dirname(filePath);
			await fs.mkdir(dirPath, {recursive: true});
			await fs.writeFile(filePath, checkedFiles[relativeFilePath]);
		}

		for (const fileName of ['main.ts', 'mainTypes.ts']) {
			const srcPath = path.join('assemblyscript', fileName);
			const dstPath = path.join(baseDirPath, fileName);
			await fs.copyFile(srcPath, dstPath);
		}
	});
}
