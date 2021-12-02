<script lang="ts">
	import Animation from './Animation.svelte';
	import type {DriverStatus, Layout, PixelLayout} from 'ledbetter-common';
	import {useFocus, useParams, Link, navigate} from 'svelte-navigator';
	import axios from "axios";
	import {pixelLayout as layoutLib} from "ledbetter-common";
	import LayoutSelect from './LayoutSelect.svelte';
	import ProgramCodeEdit from './ProgramCodeEdit.svelte';
	import ControlButtons from "./ControlButtons.svelte";
	import LoadingIcon from "./LoadingIcon.svelte";
	import {writable} from "svelte/store";
	import type {Writable} from "svelte/store";
	import {BrowserAnimationDriver} from "./driverControl";
	import type {DriverControl} from "./driverControl";

	const registerFocus = useFocus();
	const params = useParams();
	const programId = $params.id;

	let layout: Layout | null = null;
	let pixelLayout: PixelLayout | null;

	let saving = false;
	let name: string = '';
	let nameInput: HTMLInputElement;
	let bannerError: string | null = null;

	let programWasm: BufferSource | null = null;

	let demoStatus: Writable<DriverStatus> = writable('NotPlaying');
	let driverControl: DriverControl;

	let programCode = '';

	async function loadProgram() {
		const response = await axios.get(`/api/programs/${programId}`);
		name = response.data.name;
		programCode = response.data.sourceCode['PixelAnimation.ts'];
	}

	async function handleSave() {
	}

	async function handleDelete() {
		await axios.delete(`/api/programs/${programId}`);
		navigate('/');
	}

	loadProgram();
	$: pixelLayout = layout ? layoutLib.parseCode(layout.sourceCode) : null;
	$: driverControl = new BrowserAnimationDriver(layout, programWasm, demoStatus);
</script>

<style>
	.action-buttons {
		float: right;
	}
</style>

<div class="container">
	{#await loadProgram()}
		<LoadingIcon/>
	{:then _}
		<div class="action-buttons">
			<button
				class="button is-small is-outlined"
				class:is-loading={saving}
				title="Save"
				disabled={programWasm === null}
				on:click|preventDefault={handleSave}
			>
			<span class="icon">
				<i class="fas fa-save"></i>
			</span>
			</button>
			<button
				class="button is-small is-outlined is-danger"
				class:is-loading={saving}
				title="Delete"
				on:click|preventDefault={handleDelete}
			>
			<span class="icon">
				<i class="fas fa-trash-alt"></i>
			</span>
			</button>
		</div>

		<nav class="breadcrumb is-medium" aria-label="breadcrumbs">
			<ul>
				<li><Link to="/">LEDBetter Lights</Link></li>
				<li class="is-active"><Link to="">Programs</Link></li>
				<li class="is-active"><Link to="" aria-current="page">{name}</Link></li>
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
				disabled={saving}
				class="input is-large"
				type="text"
				placeholder="Program name..."
			/>
		</div>

		<div class="block">
			<ProgramCodeEdit {programCode} bind:programWasm={programWasm} disabled={saving} />
		</div>

		<div class="block">
			<Animation aspectRatio={1} layout={pixelLayout} {programWasm} status={$demoStatus} />
		</div>

		<div class="columns">
			<div class="column is-one-quarter">
				<LayoutSelect bind:layout={layout} />
			</div>
			<div class="column">
				<ControlButtons status={$demoStatus} {driverControl} />
			</div>
		</div>
	{/await}
</div>
