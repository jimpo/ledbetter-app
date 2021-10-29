import {InvalidProgramSourcePathError} from './errors';
import {compile} from './programCompiler';


function base64Encode(str: string): string {
	return (new Buffer(str)).toString('base64');
}

test('compile requires filenames with relative paths', async () => {
	await expect(async () => {
		await compile({
			'/root/logic.ts': base64Encode("class PixelAnimation {}"),
		})
	}).rejects.toBeInstanceOf(InvalidProgramSourcePathError);
});

test('compile requires filenames without ..', async () => {
	await expect(async () => {
		await compile({
			'tricky/../../logic.ts': base64Encode("class PixelAnimation {}"),
		})
	}).rejects.toBeInstanceOf(InvalidProgramSourcePathError);
});

test('compile requires filenames to have ts extension', async () => {
	await expect(async () => {
		await compile({
			'logic.wat': base64Encode("class PixelAnimation {}"),
		});
	}).rejects.toBeInstanceOf(InvalidProgramSourcePathError);
});
