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

export function encodeBinStr(data: ArrayBuffer): string {
	return Array.from(new Uint8Array(data), byte => String.fromCharCode(byte)).join('');
}

export function encodeBase64(data: ArrayBuffer): string {
	return window.btoa(encodeBinStr(data));
}
