<script lang="ts">
	import {Link} from 'svelte-navigator';
	import type {NavigatorLocation, NavigateFn} from 'svelte-navigator';
	import axios, {AxiosError, AxiosResponse} from "axios";
	import {Layout, program as programLib, ProgramBrief} from "ledbetter-common";
	import ProgramEdit from "./ProgramEdit.svelte";
	import Joi from "joi";
	const {API_VERSION_LATEST, validateWasmBinary, programBriefSchema} = programLib;

	export let location: NavigatorLocation<{programWasm?: ArrayBuffer | null, layout?: Layout | null}>;
	export let navigate: NavigateFn;

	let name: string = '';
	let apiVersion: number = API_VERSION_LATEST;
	let programWasm: ArrayBuffer | null = location.state?.programWasm || null;

	let creating: boolean = false;
	let bannerError: string | null = null;
	let focusNameInput: () => void;
	let layout: Layout | null = location.state?.layout || null;

	async function handleCreate() {
		if (programWasm === null) {
			return;
		}
		bannerError = null;

		if (/^\s*$/.test(name)) {
			focusNameInput();
			return;
		}

		const formData = new FormData();
		formData.append('body', JSON.stringify({name, apiVersion}));
		formData.append('wasm', new Blob([programWasm], {type: 'application/wasm'}));

		creating = true;
		let response: AxiosResponse;
		try {
			response = await axios.post('/api/programs', formData);
		} catch (untypedErr) {
			const err = untypedErr as AxiosError;
			if (
				err.response.status === 422 &&
				err.response.data instanceof Object &&
				'error' in err.response.data &&
				typeof err.response.data.error === 'string'
			)
			{
				let {error: errMessage} = err.response.data as {error: string};
				bannerError = errMessage
			}
			creating = false;
			return;
		}

		const programBrief = Joi.attempt(response.data, programBriefSchema) as ProgramBrief;
		navigate('/', {state: {programBrief, programWasm, layout}});
	}
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
			disabled={programWasm === null}
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
			<li class="is-active"><Link to="">Programs</Link></li>
			<li class="is-active"><Link to="" aria-current="page">New</Link></li>
		</ul>
	</nav>

	<ProgramEdit
		bind:name
		bind:apiVersion
		bind:programWasm
		bind:layout
		bind:saving={creating}
		bind:bannerError
		bind:focusNameInput
	/>
</div>
