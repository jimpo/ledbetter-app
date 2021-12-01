<script lang="ts">
	import Animation from './Animation.svelte';
	import type {Layout, PixelLayout} from 'ledbetter-common';
	import {useFocus, Link} from 'svelte-navigator';
	import axios, {AxiosError} from "axios";
	import {DriverStatus, pixelLayout as layoutLib} from "ledbetter-common";
	import LayoutSelect from './LayoutSelect.svelte';
	import ProgramCodeEdit from './ProgramCodeEdit.svelte';
	import ControlButtons from "./ControlButtons.svelte";

	const registerFocus = useFocus();
	export let navigate;

	let layout: Layout | null = null;
	let pixelLayout: PixelLayout | null;

	let creating = false;
	let name: string = '';
	let nameInput: HTMLInputElement;
	let bannerError: string | null = null;

	let demoStatus: DriverStatus = 'NotPlaying';
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
		float: right;
	}
</style>

<div class="container">
	<div class="action-buttons">
		<button
			class="button is-primary is-outlined is-small"
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

	<nav class="breadcrumb is-medium" aria-label="breadcrumbs">
		<ul>
			<li><Link to="/">LEDBetter Lights</Link></li>
			<li><a href="#">Programs</a></li>
			<li class="is-active"><Link to="" aria-current="page">New</Link></li>
		</ul>
	</nav>

	{#if bannerError}
		<div class="notification is-danger">
			<button class="delete" on:click|preventDefault={() => bannerError = null}></button>
			{bannerError}
		</div>
	{/if}

	<div class="block">
		<input
			bind:this={nameInput}
			bind:value={name}
			use:registerFocus
			disabled={creating}
			class="input is-large"
			type="text"
			placeholder="Program name..."
		/>
	</div>

	<div class="block">
		<ProgramCodeEdit bind:programCode bind:programWasm disabled={creating} />
	</div>

	<div class="block">
		<Animation aspectRatio={1} layout={pixelLayout} {programWasm} status={demoStatus} />
	</div>

	<div class="block columns">
		<div class="column is-one-quarter">
			<LayoutSelect bind:layout={layout} />
		</div>
		<div class="column">
			<ControlButtons
				ready={programWasm !== null && layout !== null}
				status={demoStatus}
				onPlay={async () => { demoStatus = 'Playing' }}
				onPause={async () => { demoStatus = 'Paused' }}
				onStop={async () => { demoStatus = 'NotPlaying' }}
			/>
		</div>
	</div>
</div>
