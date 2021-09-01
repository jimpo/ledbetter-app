<script lang="ts">
  const bluetooth: Bluetooth = navigator.bluetooth;
  const bluetoothAvailable = bluetooth ? bluetooth.getAvailability() : Promise.reject(false);

  const NRF_BLINKY_SERVICE_UUID = '00001523-1212-efde-1523-785feabcd123';
  const NRF_BLINKY_LED_CHAR = '00001525-1212-efde-1523-785feabcd123';

  interface DeviceWithState {
    device: BluetoothDevice;
    isPlaying: boolean | null,
  }

  let devices: Record<string, DeviceWithState> = {};
  let devicesList: string[] = [];
  function updateDevice(device: DeviceWithState): void {
    const deviceId = device.device.id;
    if (deviceId in devices) {
      devices[deviceId] = device;
    }
  }

  async function onSearch(): Promise<void> {
    const bluetoothDevice = await bluetooth.requestDevice({
      filters: [{services: [NRF_BLINKY_SERVICE_UUID]}],
    });
    const device = {
      device: bluetoothDevice,
      isPlaying: null,
    };

    const deviceId = bluetoothDevice.id;
    if (bluetoothDevice.id in devices) {
      return;
    }
    devices[deviceId] = device;
    devicesList = [...devicesList, deviceId];
  }

  async function onConnect(deviceId: string): Promise<void> {
    const device = devices[deviceId];
    const gatt = await device.device.gatt.connect();
    updateDevice(device);
    const service = await gatt.getPrimaryService(NRF_BLINKY_SERVICE_UUID);
    if (!service) {
      throw Error(`no service ${NRF_BLINKY_SERVICE_UUID}`);
    }
    const playingChar = await service.getCharacteristic(NRF_BLINKY_LED_CHAR);
    const playingValue = await playingChar.readValue();

    if (playingValue.byteLength !== 1) {
      throw Error(`PLAYING characteristic value is ${playingValue.byteLength} bytes`);
    }
    updateDevice({
      ...device,
      isPlaying: !!playingValue.getUint8(0),
    });
  }

  function onDisconnect(deviceId: string): void {
    let device = devices[deviceId];
    device.device.gatt.disconnect();
    updateDevice(device);
  }

  async function handlePlay(deviceId: string): Promise<void> {
    await setPlayState(deviceId, true);
  }

  async function handleStop(deviceId: string): Promise<void> {
    await setPlayState(deviceId, false);
  }

  async function setPlayState(deviceId: string, value: boolean): Promise<void> {
    const device = devices[deviceId];
    const gatt = device.device.gatt;
    const service = await gatt.getPrimaryService(NRF_BLINKY_SERVICE_UUID);
    if (!service) {
      throw Error(`no service ${NRF_BLINKY_SERVICE_UUID}`);
    }
    const playingChar = await service.getCharacteristic(NRF_BLINKY_LED_CHAR);
    const charValue = (new Uint8Array([value ? 1 : 0])).buffer;
    await playingChar.writeValue(charValue);
    updateDevice({
      ...device,
      isPlaying: value,
    });
  }
</script>

<div class="container">
{#await bluetoothAvailable}
  <i class="fas fa-spinner fa-spin"></i>
{:then isAvailable}
  {#if isAvailable}
  <ul>
    {#each devicesList as deviceId}
      <li class="block">
        <span class="icon">
        {#if devices[deviceId].device.gatt.connected}
          <i class="fas fa-link" on:click={() => onDisconnect(deviceId)}></i>
        {:else}
          <i class="fas fa-unlink" on:click={() => onConnect(deviceId)}></i>
        {/if}
        </span>
        <span class="icon">
        {#if devices[deviceId].isPlaying}
          <i class="fas fa-stop" on:click={() => handleStop(deviceId)}></i>
        {:else if devices[deviceId].isPlaying === false}
          <i class="fas fa-play" on:click={() => handlePlay(deviceId)}></i>
        {/if}
        </span>
        <strong>{devices[deviceId].device.name}</strong>
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
