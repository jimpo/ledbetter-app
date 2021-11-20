<script lang="ts">
	import Animation from './Animation.svelte';
	import type {Layout, PixelLayout} from 'ledbetter-common';
	import {useFocus, Link} from 'svelte-navigator';
	import axios, {AxiosError} from "axios";
	import {pixelLayout as layoutLib} from "ledbetter-common";
	import LayoutSelect from './LayoutSelect.svelte';
	import ProgramCodeEdit from './ProgramCodeEdit.svelte';

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

	$: pixelLayout = layout ? layoutLib.parseCode(layout.sourceCode) : null;

</script>

<style>
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
			<ProgramCodeEdit bind:programCode bind:programWasm disabled={creating} />
		</div>
	</div>
</div>
