<script lang="ts">
	import Animation from './Animation.svelte';
	import type {Layout, PixelLayout} from 'ledbetter-common';
	import {useFocus, Link} from 'svelte-navigator';
	import axios, {AxiosError, AxiosResponse} from "axios";
	import {pixelLayout as layoutLib} from "ledbetter-common";
	import {decodeBase64} from './util.js';
	import LayoutSelect from './LayoutSelect.svelte';

	const registerFocus = useFocus();
	export let navigate;

	let layout: Layout | null = null;
	let pixelLayout: PixelLayout | null;

	let creating = false;
	let name: string = '';
	let nameInput: HTMLInputElement;
	let bannerError: string | null = null;

	let running = false;
	let programWasm: BufferSource | null = null;

	const SAMPLE_PROGRAM_CODE =
		`import {Pixel} from './mainTypes';

export class PixelAnimation {
  constructor(private pixels: Pixel[][]) {
  }

  tick(): void {
  }
}
`;

	let programCode = SAMPLE_PROGRAM_CODE;
	let programCodeError: string | null = null;

	async function handleCreate() {
		if (programWasm === null) {
			return;
		}
		bannerError = null;

		if (/^\s*$/.test(name)) {
			nameInput.focus();
			return;
		}

		creating = true;
		try {
			await axios.post('/api/programs', {name, sourceCode: {'PixelAnimation.ts': programCode}});
		} catch (untypedErr) {
			const err = untypedErr as AxiosError;
			if (err.response.status === 422 &&
				err.response.data instanceof Object &&
				err.response.data.hasOwnProperty('error'))
			{
				let {error: errMessage} = err.response.data as {error: string};
				bannerError = errMessage
			}
			creating = false;
			return;
		}

		navigate('/demo');
	}

	async function compileProgram(): Promise<void> {
		const files: {[fileName: string]: string} = {'PixelAnimation.ts': programCode};

		let response: AxiosResponse;
		try {
			response = await axios.post('/api/programs/compile', {files});
		} catch (untypedErr) {
			const err = untypedErr as AxiosError;
			if (err.response.status === 422 &&
				err.response.data instanceof Object &&
				err.response.data.hasOwnProperty('error')) {
				programWasm = null;
				programCodeError = err.response.data.error;
				return;
			}
		}

		programWasm = decodeBase64(response.data.wasm);
		programCodeError = null;
	}

	$: pixelLayout = layout ? layoutLib.parseCode(layout.sourceCode) : null;

	compileProgram();
</script>

<style>
	.program-code-edit {
		font-family: monospace;
	}
	.program-code-edit.program-code-valid {
		height: 640px;
	}
	.program-code-edit.program-code-invalid {
		height: 320px;
	}
	.program-code-error {
		height: 320px;
		font-family: monospace;
		background-color: #f5f5f5;
	}

	.action-buttons {
		text-align: right;
	}
</style>

<div class="container">
	<nav class="breadcrumb" aria-label="breadcrumbs">
		<ul>
			<li><Link to="/programs">Programs</Link></li>
			<li class="is-active"><a href="/programs/new" aria-current="page">New Program</a></li>
		</ul>
	</nav>

	{#if bannerError}
		<div class="notification is-danger">
			<button class="delete" on:click|preventDefault={() => bannerError = null}></button>
			{bannerError}
		</div>
	{/if}

	<div class="block">
		<div class="columns">
			<div class="column is-three-quarters">
				{#if !creating}
					<input
						bind:this={nameInput}
						bind:value={name}
						use:registerFocus
						class="input is-large"
						type="text"
						placeholder="Program name..."
					/>
				{:else}
					<h1 class="title is-1">{name}</h1>
				{/if}
			</div>
			<div class="column action-buttons">
				<button
					class="button is-large is-primary is-outlined"
					class:is-loading={creating}
					title="Create"
					disabled={programWasm === null ? true : null}
					on:click|preventDefault={handleCreate}
				>
          <span class="icon">
            <i class="fas fa-check"></i>
          </span>
				</button>
			</div>
		</div>
	</div>

	<div class="columns">
		<div class="column is-three-quarters">
			<div class="block">
				<Animation aspectRatio={1} layout={pixelLayout} {programWasm} {running} />
			</div>

			<div class="block">
				<LayoutSelect bind:layout={layout} />

				<button
					class="button is-success is-light"
					on:click|preventDefault={() => running = true}
					disabled={programWasm === null || running ? true : null}>
					<span class="icon">
						<i class="fas fa-play"></i>
					</span>
				</button>

				<button
					class="button is-danger is-light"
					on:click|preventDefault={() => running = false}
					disabled={programWasm === null || !running ? true : null}>
					<span class="icon">
						<i class="fas fa-stop"></i>
					</span>
				</button>
			</div>
		</div>
		<div class="column">
      <textarea
				class="textarea has-fixed-size program-code-edit"
				class:program-code-valid={programCodeError === null}
				class:program-code-invalid={programCodeError !== null}
				bind:value={programCode}
				on:focusout={compileProgram}
				disabled={creating ? true : null}
			/>
			{#if programCodeError !== null}
      <textarea
				class="textarea program-code-error has-fixed-size is-danger"
				readonly>
			  {programCodeError}
			</textarea>
			{/if}
		</div>
	</div>
</div>
