<script lang="ts">
	import axios, {AxiosError, AxiosResponse} from 'axios';
	import Animation from './Animation.svelte';
	import {layout as layoutLib, pixelLayout, PixelLayout, ProgramBrief} from 'ledbetter-common';
	import {useFocus, Link} from 'svelte-navigator';
	import type {NavigateFn} from 'svelte-navigator';
	import Joi from "joi";

	const registerFocus = useFocus();

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
	let layoutCodeError: Error | null;
	$: {
		try {
			layout = pixelLayout.parseCode(layoutCode);
			layoutCodeError = null;
		} catch (err) {
			layout = null;
			layoutCodeError = err;
		}
	}
	let creating = false;
	let name: string = '';
	let nameInput: HTMLInputElement;
	let bannerError: string | null = null;

	async function handleCreate(): Promise<void> {
		if (layout === null) {
			return;
		}
		bannerError = null;

		if (/^\s*$/.test(name)) {
			nameInput.focus();
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
	textarea.layout-code-edit {
		font-family: monospace;
	  max-height: none;
	}
	textarea.layout-code-edit.layout-code-valid {
		height: 100%;
	}
	textarea.layout-code-edit.layout-code-invalid {
	  height: 65%;
	}
	textarea.layout-code-error {
		height: 35%;
		font-family: monospace;
		background-color: #f5f5f5;
	}

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
				placeholder="Layout name..."
		/>
	</div>

	<div class="columns">
		<div class="column is-three-quarters">
			<Animation aspectRatio={1} {layout} />
		</div>
		<div class="column">
      <textarea
				class="textarea has-fixed-size layout-code-edit"
				class:layout-code-valid={layoutCodeError === null}
				class:layout-code-invalid={layoutCodeError !== null}
				bind:value={layoutCode}
				disabled={creating}
			/>
			{#if layoutCodeError !== null}
      <textarea
				class="textarea layout-code-error has-fixed-size is-danger"
				readonly>
			  {layoutCodeError.message}
			</textarea>
			{/if}
		</div>
	</div>
</div>
