import deepEqual from 'deep-equal';
import Joi from 'joi';

export const API_VERSION_LATEST: number = 1;

const API_V1_REQUIRED_EXPORTS: WebAssembly.ModuleExportDescriptor[] = [
	{name: 'initLayoutSetNumStrips', kind: 'function'},
	{name: 'initLayoutSetStripLen', kind: 'function'},
	{name: 'initLayoutSetPixelLoc', kind: 'function'},
	{name: 'initLayoutDone', kind: 'function'},
	{name: 'tick', kind: 'function'},
	{name: 'getPixelVal', kind: 'function'},
	{name: 'memory', kind: 'memory'},
];

const API_V1_SUPPORTED_IMPORTS: WebAssembly.ModuleImportDescriptor[] = [
	{module: 'env', name: 'abort', kind: 'function'},
	{module: 'env', name: 'seed', kind: 'function'},
	{module: 'colorConvert', name: 'hsvToRgbEncoded', kind: 'function'},
];

export interface ProgramBrief {
	id: string,
	name: string,
	apiVersion: number,
}

export const programBriefSchema = Joi.object<ProgramBrief>({
	id: Joi.string().uuid().required(),
	name: Joi.string().required(),
	apiVersion: Joi.number().required(),
});

export async function validateWasmBinary(wasm: ArrayBuffer, apiVersion: number): Promise<void> {
	const module = await WebAssembly.compile(wasm);
	validateWasmModule(module, apiVersion);
}

export function validateWasmModule(module: WebAssembly.Module, apiVersion: number) {
	if (apiVersion === 1) {
		validateExports(module, API_V1_REQUIRED_EXPORTS);
		validateImports(module, API_V1_SUPPORTED_IMPORTS);
	}	else {
		throw new Error("unknown program API version");
	}
}

function validateExports(
	module: WebAssembly.Module,
	requiredExports: WebAssembly.ModuleExportDescriptor[]
) {
	const exports = WebAssembly.Module.exports(module);
	for (const requiredExport of requiredExports) {
		if (!exports.find((export_) => deepEqual(export_, requiredExport))) {
			throw Error(`missing required export: ${JSON.stringify(requiredExport)}`);
		}
	}
}

function validateImports(
	module: WebAssembly.Module,
	supportedImports: WebAssembly.ModuleImportDescriptor[]
) {
	const imports = WebAssembly.Module.imports(module);
	for (const import_ of imports) {
		if (!supportedImports.find((supportedImport) => deepEqual(import_, supportedImport))) {
			throw Error(`import not supported: ${JSON.stringify(import_)}`);
		}
	}
}