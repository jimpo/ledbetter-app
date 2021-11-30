import {PixelLayoutStrip} from "ledbetter-common/dist/pixelLayout";
import {PixelLayout} from "ledbetter-common";
import {readFile} from 'fs/promises';
import path from 'path';

import {createWasmProgram} from './program';

const TEST_WASM_PATH = path.join(__dirname, '..', '..', 'test-programs', 'turnRed.wasm');

function getTestLayout() {
	return new PixelLayout([
		new PixelLayoutStrip({
			pixelsPerMeter: 60,
			startXMeters: 10,
			startYMeters: -10,
			segments: [
				{
					directionDegrees: 30,
					lengthPixels: 300,
				},
			],
		}),
	]);
}

describe('WasmProgram', () => {
	test('tick and render', async () => {
		const wasmSource = await readFile(TEST_WASM_PATH);
		const program = await createWasmProgram(wasmSource, getTestLayout());

		const rgbWhite = {red: 0, grn: 0, blu: 0};
		let pixels = program.render();
		expect(pixels).toEqual([(new Array(300)).fill(rgbWhite)]);

		program.tick();

		const rgbRed = {red: 255, grn: 0, blu: 0};
		pixels = program.render();
		expect(pixels).toEqual([(new Array(300)).fill(rgbRed)]);
	});
});
