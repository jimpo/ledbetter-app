export function decodeBase64(encoded: string): Uint8Array {
	const binStr = window.atob(encoded);
	const len = binStr.length;
	const decoded = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		decoded[i] = binStr.charCodeAt(i);
	}
	return decoded;
}
