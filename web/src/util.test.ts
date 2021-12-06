import {decodeBase64, decodeBinStr, encodeBase64, encodeBinStr} from "./util";

test('encodebinStr/decodeBinStr', () => {
	const data = new Uint8Array(3);
	for (let i = 0; i < 1000; i++) {
		data[i] = Math.floor(Math.random() * 256);
	}

	const dataCopy = decodeBinStr(encodeBinStr(data));
	expect(dataCopy).toEqual(data);
});

test('encodeBase64/decodeBase64', () => {
	const data = new Uint8Array(3);
	for (let i = 0; i < 1000; i++) {
		data[i] = Math.floor(Math.random() * 256);
	}

	const dataCopy = decodeBase64(encodeBase64(data));
	expect(dataCopy).toEqual(data);
});
