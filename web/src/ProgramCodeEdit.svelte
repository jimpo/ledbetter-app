<script lang="ts">
	import axios, {AxiosError, AxiosResponse} from "axios";
	import {decodeBase64} from "./util";

	export let programCode: string;
	export let programWasm: BufferSource | null = null;
	export let disabled: boolean;
	let programCodeError: string | null = null;

	async function compileProgram(): Promise<void> {
		const files: {[fileName: string]: string} = {'PixelAnimation.ts': programCode};

		let response: AxiosResponse;
		try {
			response = await axios.post('/api/programs/compile', {files});
		} catch (untypedErr) {
			const err = untypedErr as AxiosError;
			programWasm = null;

			if (err.response.status === 422) {
				const data = err.response.data;
				if (data instanceof Object && data.hasOwnProperty('error')) {
					programCodeError = data.error;
					return;
				} else if (data instanceof Array) {
					programCodeError = data.map(({message}) => message).join("\n");
				} else {
					console.error('unknown error response', data);
				}
				return;
			}
		}

		programWasm = decodeBase64(response.data.wasm);
		programCodeError = null;
	}

	compileProgram();
</script>

<style>
	.program-code-edit {
		font-family: monospace;
	}
	.program-code-error {
		height: 100%;
	  font-family: monospace;
	  background-color: #f5f5f5;
  }
</style>

<div class="columns">
	<div class="column" class:is-two-thirds={programCodeError !== null}>
		<textarea
			class="textarea program-code-edit"
			bind:value={programCode}
			on:focusout={compileProgram}
			{disabled}
		/>
	</div>
	{#if programCodeError !== null}
		<div class="column">
			<textarea
				class="textarea program-code-error has-fixed-size is-danger"
				readonly
			>
  			{programCodeError}
  		</textarea>
		</div>
	{/if}
</div>
