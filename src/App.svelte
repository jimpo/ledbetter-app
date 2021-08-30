<script lang="ts">
  import 'bulma/css/bulma.css';
  import '@fortawesome/fontawesome-free/scss/solid.scss';
  import '@fortawesome/fontawesome-free/scss/fontawesome.scss';

  import Devices from './Devices.svelte';
  import DeviceSearch from './DeviceSearch.svelte';

  let isSearching = false;
  function onSearchDevices(): void {
    isSearching = true;
  }
</script>

<main class="section">
{#if isSearching}
  <DeviceSearch/>
{:else}
  <Devices onSearch={onSearchDevices}/>
{/if}
</main>
