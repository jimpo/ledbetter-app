import {CompilationError, InvalidProgramSourcePathError} from './errors';
import {compile} from './programCompiler';


function base64Encode(str: string): string {
	return Buffer.from(str).toString('base64');
}

test('compile requires filenames with relative paths', async () => {
	await expect(async () => {
		await compile({
			'/root/PixelAnimation.ts': "class PixelAnimation {}",
		})
	}).rejects.toBeInstanceOf(InvalidProgramSourcePathError);
});

test('compile requires filenames without ..', async () => {
	await expect(async () => {
		await compile({
			'tricky/../../PixelAnimation.ts': "class PixelAnimation {}",
		})
	}).rejects.toBeInstanceOf(InvalidProgramSourcePathError);
});

test('compile requires filenames to have ts extension', async () => {
	await expect(async () => {
		await compile({
			'PixelAnimation.wat': "class PixelAnimation {}",
		});
	}).rejects.toBeInstanceOf(InvalidProgramSourcePathError);
});

test('compile invalid source code', async () => {
	const expectErr = await expect(async () => {
		await compile({
			'PixelAnimation.ts': "class PixelAnimation {}",
		});
	}).rejects;
	await expectErr.toBeInstanceOf(CompilationError);
	await expectErr.toThrow(/Module 'PixelAnimation' has no exported member 'PixelAnimation'/);
});

test('compile valid source code', async () => {
	const source = `
import {Pixel} from './mainTypes';

export class PixelAnimation {
  constructor(private pixels: Pixel[][]) {
  }

  tick(): void {
  }

  render(): void {
  }
}
`;
	await compile({
		'PixelAnimation.ts': source,
	});
});