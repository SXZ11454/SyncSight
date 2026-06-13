const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onCameraStream: (callback) => {
    ipcRenderer.on('camera-stream-id', (event, streamId) => {
      callback(streamId);
    });
  },
  closeCameraWindow: () => ipcRenderer.invoke('close-camera-window'),
  setAspectRatio: (ratio) => ipcRenderer.send('camera-aspect-ratio', ratio)
});
