// ============ 流管理模块 ============
const StreamManager = {

  // ---- 预览流 ----
  stopPreviewStream() {
    if (AppState.previewStream) {
      AppState.previewStream.getTracks().forEach(t => t.stop());
      AppState.previewStream = null;
    }
  },

  async autoStartPreview() {
    try {
      if (AppState.screenSources.length === 0) return;

      const sourceId = AppState.screenSources[0].id;
      AppState.selectedSourceId = sourceId;

      const firstItem = UI.screenList.querySelector('.source-item');
      if (firstItem) {
        firstItem.classList.add('selected');
        const r = firstItem.querySelector('mdui-radio');
        if (r) r.checked = true;
      }

      UI.startBtn.disabled = false;

      AppState.previewStream = await navigator.mediaDevices.getUserMedia({
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
            maxFrameRate: 15
          }
        },
        audio: false
      });

      // 首次自动预览时展开窗口（仅一次）
      if (!AppState.hasAutoExpanded) {
        AppState.hasAutoExpanded = true;
        animatePreviewExpand();
      }
      updatePreview();
      addLog(I18n.t('log.autoPreviewStarted'), 'success');
    } catch (err) {
      console.warn('自动预览失败:', err.message);
      UI.previewEmpty.querySelector('p').textContent = I18n.t('log.autoPreviewFailed');
    }
  },

  async updatePreviewForSource(sourceId) {
    const isCamera = AppState.cameraSources.some(cam => cam.deviceId === sourceId);
    this.stopPreviewStream();
    try {
      if (isCamera) {
        AppState.previewStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: sourceId ? { exact: sourceId } : undefined, width: 640, height: 480 }
        });
      } else {
        AppState.previewStream = await navigator.mediaDevices.getUserMedia({
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sourceId,
              maxFrameRate: 15
            }
          },
          audio: false
        });
      }
      updatePreview();
    } catch (err) {
      console.warn('预览失败:', err);
    }
  },

  // ---- 源列表加载 ----
  async loadSources() {
    try {
      const sources = await window.electronAPI.getSources();
      AppState.screenSources = sources.filter(s => s.id.startsWith('screen:'));
      AppState.windowSources = sources.filter(s => s.id.startsWith('window:'));

      const devices = await navigator.mediaDevices.enumerateDevices();
      AppState.cameraSources = devices.filter(d => d.kind === 'videoinput');
      const micSources = devices.filter(d => d.kind === 'audioinput');

      if (micSources.length > 0) {
        UI.micSelect.innerHTML = '';
        micSources.forEach((d, i) => {
          const opt = document.createElement('mdui-menu-item');
          opt.value = d.deviceId;
          opt.textContent = d.label || I18n.t('options.micN', { n: i + 1 });
          UI.micSelect.appendChild(opt);
        });
        UI.micSelect.value = micSources[0].deviceId;
        UI.micSelectSection.style.display = 'block';
      } else {
        UI.micSelectSection.style.display = 'none';
      }

      if (AppState.cameraSources.length > 0) {
        UI.cameraSelect.innerHTML = '';
        AppState.cameraSources.forEach((d, i) => {
          const opt = document.createElement('mdui-menu-item');
          opt.value = d.deviceId;
          opt.textContent = d.label || I18n.t('options.cameraN', { n: i + 1 });
          UI.cameraSelect.appendChild(opt);
        });
        UI.cameraSelect.value = AppState.cameraSources[0].deviceId;
        UI.cameraSelectSection.style.display = UI.shareCamera.checked ? 'block' : 'none';
      } else {
        UI.cameraSelectSection.style.display = 'none';
      }

      renderSourceList(UI.screenList, AppState.screenSources);
      renderSourceList(UI.windowList, AppState.windowSources);

      addLog(I18n.t('log.sourcesLoaded', { screens: AppState.screenSources.length, windows: AppState.windowSources.length, cameras: AppState.cameraSources.length }), 'success');

      if (!AppState.isStreaming && !AppState.previewStream) {
        await this.autoStartPreview();
      }
    } catch (err) {
      console.error('获取源失败:', err);
    }
  },

  // ---- 摄像头 ----
  // 摄像头只用于预览窗口，不加入合成流
  async startCameraStream() {
    if (AppState.cameraStream) return true;
    try {
      const deviceId = UI.cameraSelect.value;
      const [w, h] = [1280, 720];
      AppState.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: deviceId ? { exact: deviceId } : undefined, width: { ideal: w }, height: { ideal: h } }
      });
      addLog(I18n.t('log.cameraStarted'), 'success');
      updatePreview();
      return true;
    } catch (err) {
      console.error('摄像头启动失败:', err);
      addLog(I18n.t('log.cameraStartFailed', { error: err.message }), 'error');
      return false;
    }
  },

  stopCameraStream() {
    if (AppState.cameraStream) {
      AppState.cameraStream.getTracks().forEach(t => t.stop());
      AppState.cameraStream = null;
      addLog(I18n.t('log.cameraStopped'), 'info');
      updatePreview();
    }
  },

  // ---- 麦克风 ----
  async startMicStream() {
    if (AppState.micStream) return true;
    try {
      const deviceId = UI.micSelect.value;
      AppState.micStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: deviceId ? { exact: deviceId } : undefined }
      });
      addLog(I18n.t('log.micStarted'), 'success');
      updatePreview();
      return true;
    } catch (err) {
      console.error('麦克风启动失败:', err);
      addLog(I18n.t('log.micStartFailed', { error: err.message }), 'error');
      return false;
    }
  },

  stopMicStream() {
    if (AppState.micStream) {
      AppState.micStream.getTracks().forEach(t => t.stop());
      AppState.micStream = null;
      addLog(I18n.t('log.micStopped'), 'info');
      updatePreview();
    }
  },

  // ---- 摄像头独立窗口 ----
  async toggleCameraWindow() {
    const isOpen = await window.electronAPI.isCameraWindowOpen();
    if (isOpen) {
      this.closeCameraWindow();
    } else {
      await this.openCameraWindow();
    }
  },

  async openCameraWindow() {
    if (!AppState.cameraStream) {
      await this.startCameraStream();
    }
    if (!AppState.cameraStream) return;

    const deviceId = UI.cameraSelect.value;
    const [w, h] = [1280, 720];

    await window.electronAPI.openCameraWindow(deviceId);
    AppState.cameraWindowOpen = true;

    setTimeout(() => {
      window.electronAPI.sendCameraStreamToWindow({ deviceId, width: w, height: h });
    }, 500);
  },

  async closeCameraWindow() {
    await window.electronAPI.closeCameraWindow();
    AppState.cameraWindowOpen = false;
  },

  // ---- 合成流（不含摄像头，摄像头仅预览窗口） ----
  buildCompositeStream() {
    const tracks = [];

    if (AppState.screenStream && UI.shareVideo.checked) {
      AppState.screenStream.getVideoTracks().forEach(t => tracks.push(t));
    }
    if (AppState.screenStream && UI.shareAudio.checked) {
      AppState.screenStream.getAudioTracks().forEach(t => tracks.push(t));
    }
    // 摄像头仅预览窗口，不加入合成流
    if (AppState.micStream && UI.shareMic.checked) {
      AppState.micStream.getAudioTracks().forEach(t => tracks.push(t));
    }

    AppState.compositeStream = new MediaStream(tracks);
    updatePreview();
    return AppState.compositeStream;
  },

  async toggleCameraInComposite() {
    // 摄像头开关由 UI 层直接控制窗口开关，此处仅处理共享中的状态
    // 摄像头不影响合成流
  },

  async toggleMicInComposite() {
    if (UI.shareMic.checked) {
      await this.startMicStream();
    } else {
      this.stopMicStream();
    }
    this.rebuildCompositeStream();
    SignalingManager.updateAllPeerConnections();
  },

  rebuildCompositeStream() {
    this.buildCompositeStream();
    SignalingManager.updateAllPeerConnections();
  },

  // ---- 屏幕捕获 ----
  async startCapture(sourceId, options) {
    try {
      this.stopPreviewStream();

      if (AppState.screenStream) {
        AppState.screenStream.getTracks().forEach(track => track.stop());
        AppState.screenStream = null;
      }

      const isCamera = AppState.cameraSources.some(cam => cam.deviceId === sourceId);
      if (isCamera) {
        AppState.screenStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: sourceId ? { exact: sourceId } : undefined },
          audio: options.shareMic ? { deviceId: options.micDeviceId ? { exact: options.micDeviceId } : undefined } : false
        });
        return true;
      }

      await this.loadSources();
      const allSources = [...AppState.screenSources, ...AppState.windowSources];
      let validSourceId = sourceId;
      if (!allSources.some(s => s.id === sourceId)) {
        if (allSources.length > 0) {
          validSourceId = allSources[0].id;
          AppState.selectedSourceId = validSourceId;
        } else {
          return false;
        }
      }

      const constraints = {
        audio: options.shareAudio ? {
          mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: validSourceId }
        } : false,
        video: {
          mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: validSourceId, maxFrameRate: AppState.frameRate, minFrameRate: Math.floor(AppState.frameRate / 2) }
        }
      };

      AppState.screenStream = await navigator.mediaDevices.getUserMedia(constraints);
      return true;
    } catch (err) {
      console.error('Capture error:', err);
      if (AppState.screenStream) { AppState.screenStream.getTracks().forEach(t => t.stop()); AppState.screenStream = null; }
      return false;
    }
  },

  stopCapture() {
    if (AppState.screenStream) { AppState.screenStream.getTracks().forEach(t => t.stop()); AppState.screenStream = null; }
    this.stopCameraStream();
    this.stopMicStream();
    AppState.compositeStream = null;
    updatePreview();
    if (AppState.selectedSourceId && !AppState.isStreaming) {
      this.updatePreviewForSource(AppState.selectedSourceId);
    }
  }
};

// 监听摄像头窗口关闭
window.electronAPI.onCameraWindowClosed(() => {
  AppState.cameraWindowOpen = false;
  UI.shareCamera.checked = false;
  UI.cameraSelectSection.style.display = 'none';
});
