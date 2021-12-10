<script lang="ts">
	import LayoutEdit from "../components/LayoutEdit.svelte";

	import axios, {AxiosError, AxiosResponse} from 'axios';
	import {layout as layoutLib, PixelLayout, ProgramBrief} from 'ledbetter-common';
	import {Link} from 'svelte-navigator';
	import type {NavigateFn} from 'svelte-navigator';
	import Joi from "joi";

	export let navigate: NavigateFn;

	const SAMPLE_LAYOUT_CODE =
		`SET PIXELS_PER_METER 60

STRIP AT -1m, 0m
TURN 90 degrees
SEGMENT 150 pixels

STRIP AT 1m, 0m
TURN 90 degrees
SEGMENT 150 pixels
`;
	let layoutCode = SAMPLE_LAYOUT_CODE;
	let layout: PixelLayout | null  = null;
	let focusNameInput: () => void;
	let bannerError: string | null = null;

	let creating = false;
	let name: string = '';

	async function handleCreate(): Promise<void> {
		if (layout === null) {
			return;
		}
		bannerError = null;

		if (/^\s*$/.test(name)) {
			focusNameInput();
			return;
		}

		creating = true;

		let response: AxiosResponse;
		try {
			response = await axios.post('/api/layouts', {name, sourceCode: layoutCode});
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

		const newLayout = Joi.attempt(response.data, layoutLib.layoutSchema) as ProgramBrief;
		navigate('/', {state: {layout: newLayout}});
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
			class="button is-small is-primary is-outlined"
			class:is-loading={creating}
			title="Create"
			disabled={layout === null}
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
			<li class="is-active"><Link to="">Layouts</Link></li>
			<li class="is-active"><Link to="/layouts/new" aria-current="page">New</Link></li>
		</ul>
	</nav>

	<LayoutEdit
		bind:name
		bind:layout
		bind:layoutCode
		bind:focusNameInput
		bind:bannerError
		bind:saving={creating}
	/>
</div>
