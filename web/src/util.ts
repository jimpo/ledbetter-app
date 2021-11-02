export function decodeBinStr(encoded: string): Uint8Array {
	const len = encoded.length;
	const decoded = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		decoded[i] = encoded.charCodeAt(i);
	}
	return decoded;
}

export function decodeBase64(encoded: string): Uint8Array {
	return decodeBinStr(window.atob(encoded));
}
