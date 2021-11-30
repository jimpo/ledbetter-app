<script lang="ts">
	import Animation from './Animation.svelte';
	import type {DriverStatus, Layout, PixelLayout} from 'ledbetter-common';
	import {useFocus, useParams, Link} from 'svelte-navigator';
	import axios, {AxiosError} from "axios";
	import {pixelLayout as layoutLib} from "ledbetter-common";
	import LayoutSelect from './LayoutSelect.svelte';
	import ProgramCodeEdit from './ProgramCodeEdit.svelte';
	import ControlButtons from "./ControlButtons.svelte";

	const registerFocus = useFocus();
	const params = useParams();
	export let navigate;
	const programId = $params.id;

	let layout: Layout | null = null;
	let pixelLayout: PixelLayout | null;

	let saving = false;
	let name: string = '';
	let nameInput: HTMLInputElement;
	let bannerError: string | null = null;

	let demoStatus: DriverStatus = 'NotPlaying';
	let programWasm: BufferSource | null = null;

	let programCode = '';

	async function loadProgram() {
		const response = await axios.get(`/api/programs/${programId}`);
		name = response.data.name;
		programCode = response.data.sourceCode['PixelAnimation.ts'];
	}

	async function handleSave() {
	}
	// async function handleCreate() {
	// 	if (programWasm === null) {
	// 		return;
	// 	}
	// 	bannerError = null;
	//
	// 	if (/^\s*$/.test(name)) {
	// 		nameInput.focus();
	// 		return;
	// 	}
	//
	// 	creating = true;
	// 	try {
	// 		await axios.post('/api/programs', {name, sourceCode: {'PixelAnimation.ts': programCode}});
	// 	} catch (untypedErr) {
	// 		const err = untypedErr as AxiosError;
	// 		if (err.response.status === 422 &&
	// 			err.response.data instanceof Object &&
	// 			err.response.data.hasOwnProperty('error'))
	// 		{
	// 			let {error: errMessage} = err.response.data as {error: string};
	// 			bannerError = errMessage
	// 		}
	// 		creating = false;
	// 		return;
	// 	}
	//
	// 	navigate('/demo');
	// }

	loadProgram();
	$: pixelLayout = layout ? layoutLib.parseCode(layout.sourceCode) : null;
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
	{#if bannerError}
		<div class="notification is-danger">
			<button class="delete" on:click|preventDefault={() => bannerError = null}></button>
			{bannerError}
		</div>
	{/if}

	<div class="block">
		<div class="columns">
			<div class="column is-three-quarters">
				<h1 use:registerFocus class="title is-1">{name}</h1>
			</div>
			<div class="column action-buttons">
				<button
					class="button is-large is-outlined"
					class:is-loading={saving}
					title="Save"
					disabled={programWasm === null ? true : null}
					on:click|preventDefault={handleSave}
				>
          <span class="icon">
            <i class="fas fa-save"></i>
          </span>
				</button>
			</div>
		</div>
	</div>

	<div class="columns">
		<div class="column is-three-quarters">
			<div class="block">
				<Animation aspectRatio={1} layout={pixelLayout} {programWasm} status={demoStatus} />
			</div>

			<div class="block">
				<LayoutSelect bind:layout={layout} />
				<ControlButtons
					ready={programWasm !== null && layout !== null}
					status={demoStatus}
					onPlay={async () => { demoStatus = 'Playing' }}
					onPause={async () => { demoStatus = 'Paused' }}
					onStop={async () => { demoStatus = 'NotPlaying' }}
				/>
			</div>
		</div>
		<div class="column">
			<ProgramCodeEdit {programCode} bind:programWasm={programWasm} disabled={saving} />
		</div>
	</div>
</div>
