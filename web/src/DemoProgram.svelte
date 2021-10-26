<script lang="ts">
  import axios from 'axios';
  import LayoutComponent from './Layout.svelte';
	import {pixelLayout as layoutLib, Layout, PixelLayout} from 'ledbetter-common';
	import Animation from './Animation.svelte';
	import {createProgram, Program} from './program';

	let layouts: Layout[] = [];
	let layoutId = '';
	let pixelLayout: PixelLayout | null;

	let program: Program | null;
	let programWasm: BufferSource | null = null;
	let programPromise: Promise<void> | null;

	function decodeBase64(encoded: string): Uint8Array {
		const binStr = window.atob(encoded);
		const len = binStr.length;
		const decoded = new Uint8Array(len);
		for (let i = 0; i < len; i++) {
			decoded[i] = binStr.charCodeAt(i);
		}
		return decoded;
	}

	async function loadLayouts(): Promise<void> {

		const response = await axios.get('/api/layouts');
		layouts = response.data;
	}

	async function loadPrograms(): Promise<void> {
		const response = await axios.get('/api/programs/test');
		programWasm = decodeBase64(response.data.wasm);
	}

	$: {
		const layout = layouts.find((layout) => layout.id === layoutId);
		if (layout) {
			pixelLayout = layoutLib.parseCode(layout.sourceCode);
		} else {
			pixelLayout = null;
		}
	}

	$: {
		if (programWasm && pixelLayout) {
			if (!program) {
				programPromise = (async () => {
					program = await createProgram(programWasm, pixelLayout);
				})();
			} else {
				programPromise = null;
			}
		} else {
			program = null;
			programPromise = null;
		}
	}
</script>

<div class="container">
	<div class="block">
		{#if program !== null}
			<Animation width={1280} height={1280} {program} />
		{:else}
			{#if pixelLayout !== null}
				<LayoutComponent width={1280} height={1280} layout={pixelLayout} />
			{/if}
			{#if programPromise !== null}
				{#await programPromise}
				{/await}
			{/if}
		{/if}
	</div>
	<div class="block">
		{#await loadLayouts()}
			<div class="select is-loading">
				<select>
					<option value="">Select layout</option>
				</select>
			</div>
		{:then _}
			<div class="select">
				<select bind:value={layoutId}>
					<option value="">Select layout</option>
					{#each layouts as layout}
						<option value={layout.id}>{layout.name}</option>
					{/each}
				</select>
			</div>
		{:catch err}
			<div class="notification is-danger">
				{err}
			</div>
		{/await}

		{#await loadPrograms()}
			<div class="select is-loading">
				<select>
					<option value="">Select program</option>
				</select>
			</div>
		{:then _}
			<div class="select">
				<select>
					<option value="">Select program</option>
					<option value="test" selected>Test</option>
				</select>
			</div>
		{:catch err}
			<div class="notification is-danger">
				{err}
			</div>
		{/await}
	</div>
</div>
