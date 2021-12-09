import {validateWasmBinary} from './program';
import {readFileSync} from 'fs';

const TEST_WASM = readFileSync('../test-programs/turnRed.wasm');


test('validateWasm throws on unknown API version', async () => {
	await expect(validateWasmBinary(TEST_WASM, 2))
		.rejects.toThrow(/unknown program API version/);
});

test('validateWasm accepts correct API v1 Wasm', async () => {
	await expect(validateWasmBinary(TEST_WASM, 1)).resolves.toBeUndefined();
});
