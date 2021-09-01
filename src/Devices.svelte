<script lang="ts">
  const bluetooth: Bluetooth = navigator.bluetooth;
  const bluetoothAvailable = bluetooth ? bluetooth.getAvailability() : Promise.reject(false);

  let devices = [];
  async function onSearch(): Promise<void> {
    const device = await bluetooth.requestDevice({acceptAllDevices: true});
    devices = [...devices, device];
  }

  async function onConnect(deviceIndex: number): Promise<void> {
    const device = devices[deviceIndex];
    await device.gatt.connect();
    devices[deviceIndex] = device;
  }

  function onDisconnect(deviceIndex: number) {
    const device = devices[deviceIndex];
    device.gatt.disconnect();
    devices[deviceIndex] = device;
  }
</script>

<div class="container">
{#await bluetoothAvailable}
  <i class="fas fa-spinner fa-spin"></i>
{:then isAvailable}
  {#if isAvailable}
  <ul>
    {#each devices as device, i}
      <li class="block">
        <span class="icon">
        {#if device.gatt.connected}
          <i class="fas fa-link" on:click={() => onDisconnect(i)}></i>
        {:else}
          <i class="fas fa-unlink" on:click={() => onConnect(i)}></i>
        {/if}
        </span>
        <span class="icon"></span>
        <strong>{device.name}</strong>
      </li>
    {/each}
    <button class="button is-fullwidth" on:click={onSearch}>Search for devices</button>
  </ul>
  {:else}
  <div class="notification is-warning">
    <div class="content">
      <p>This browser does not support the <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API">Web Bluetooth API</a>. Check the <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API#browser_compatibility">browser compatibility chart</a>.
    </div>
  </div>
  {/if}
{:catch err}
  <div class="notification is-warning">
    <div class="content">
      <p>Error checking Bluetooth API availability: {err}</p>
    </div>
  </div>
{/await}
</div>
