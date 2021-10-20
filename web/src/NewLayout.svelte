<script lang="ts">
  import axios from 'axios';
  import Layout from './Layout.svelte';
  import {layout as layoutLib} from 'ledbetter-common';
  import {API_BASE_URL} from './consts';

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
  let layout = null;
  let layoutCodeError = null;
  $: {
    try {
      layout = layoutLib.parseCode(layoutCode);
      layoutCodeError = null;
    } catch (err) {
      layout = null;
      layoutCodeError = err;
    }
  }
  let creating = false;
  let name: string = '';
  let nameInput: HTMLInputElement;

  async function handleCreate(): Promise<void> {
    if (layout === null) {
      return;
    }
    if (/^\s*$/.test(name)) {
      nameInput.focus();
      return;
    }

    creating = true;

    try {
      const response = await axios.post(`${API_BASE_URL}/layouts`, {name, sourceCode: layoutCode});
      console.log(response);
    } catch (err) {
      console.error(err);
    }
  }
</script>

<style>
  .layout-code-edit {
    font-family: monospace;
  }
  .layout-code-edit.layout-code-valid {
    height: 640px;
  }
  .layout-code-edit.layout-code-invalid {
    height: 320px;
  }
  .layout-code-error {
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
      <li><a href="/layouts">Layouts</a></li>
      <li class="is-active"><a href="/layouts/new" aria-current="page">New Layout</a></li>
    </ul>
  </nav>

  <div class="block">
    <div class="columns">
      <div class="column is-three-quarters">
        {#if !creating}
        <input
          bind:this={nameInput}
          bind:value={name}
          class="input is-large"
          type="text"
          placeholder="Layout name..."
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
          disabled={layout === null ? true : null}
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
    <div class="column">
      <Layout width={640} height={640} layout={layout} />
    </div>
    <div class="column">
      <textarea
        class="textarea has-fixed-size layout-code-edit"
        class:layout-code-valid={layoutCodeError === null}
        class:layout-code-invalid={layoutCodeError !== null}
        bind:value={layoutCode}
        disabled={creating ? true : null}
      />
      {#if layoutCodeError !== null}
      <textarea
        class="textarea layout-code-error has-fixed-size is-danger"
        readonly
        value={layoutCodeError.message}
      />
      {/if}
    </div>
  </div>
</div>
