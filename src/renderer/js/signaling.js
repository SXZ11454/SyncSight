// ============ 信令与 WebRTC 模块 ============
const SignalingManager = {

  cleanupPeerConnection(socketId) {
    if (socketId) {
      const pc = AppState.peerConnections.get(socketId);
      if (pc) { pc.close(); AppState.peerConnections.delete(socketId); }
    } else {
      AppState.peerConnections.forEach(pc => pc.close());
      AppState.peerConnections.clear();
    }
  },

  createPeerConnection(socketId) {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    });

    if (AppState.compositeStream) {
      AppState.compositeStream.getTracks().forEach(track => {
        pc.addTrack(track, AppState.compositeStream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        window.electronAPI.sendSignaling(socketId, 'ICE_CANDIDATE', event.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        addLog(I18n.t('log.clientConnected', { id: socketId.slice(0, 4) }), 'success');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        addLog(I18n.t('log.clientDisconnected', { id: socketId.slice(0, 4) }), 'error');
        this.cleanupPeerConnection(socketId);
      }
    };

    const dc = pc.createDataChannel('control');
    dc.onopen = () => { console.log('DataChannel opened for', socketId); };
    dc.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'SET_VIDEO_QUALITY') {
          console.log('Quality request:', data.payload);
        }
      } catch (err) {}
    };

    AppState.peerConnections.set(socketId, pc);
    return pc;
  },

  async renegotiate(pc, socketId) {
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      window.electronAPI.sendSignaling(socketId, 'OFFER', {
        type: offer.type,
        sdp: offer.sdp
      });
    } catch (err) {
      console.warn('Renegotiate failed:', err);
    }
  },

  updateAllPeerConnections() {
    if (!AppState.compositeStream) return;

    AppState.peerConnections.forEach((pc, socketId) => {
      const senders = pc.getSenders();

      senders.forEach(sender => {
        if (sender.track && !AppState.compositeStream.getTracks().includes(sender.track)) {
          pc.removeTrack(sender);
        }
      });

      AppState.compositeStream.getTracks().forEach(track => {
        const existingSender = senders.find(s => s.track && s.track.kind === track.kind && s.track.id === track.id);
        if (!existingSender) {
          const sameKindSender = senders.find(s => s.track && s.track.kind === track.kind);
          if (sameKindSender) {
            sameKindSender.replaceTrack(track).catch(err => {
              console.warn('replaceTrack failed:', err);
              try { pc.addTrack(track, AppState.compositeStream); } catch(e) {}
            });
          } else {
            try { pc.addTrack(track, AppState.compositeStream); } catch(e) {}
          }
        }
      });

      this.renegotiate(pc, socketId);
    });
  },

  async handleSignalingMessage(data) {
    const socketId = data.fromSocketID;

    if (data.type === 'ANSWER') {
      const pc = AppState.peerConnections.get(socketId);
      if (pc) {
        try {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.payload));
            if (pc.pendingIceCandidates) {
              for (const c of pc.pendingIceCandidates) {
                try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch(e) {}
              }
              pc.pendingIceCandidates = [];
            }
          }
        } catch (err) { console.error('Set remote desc error:', err); }
      }
    } else if (data.type === 'ICE_CANDIDATE') {
      const pc = AppState.peerConnections.get(socketId);
      if (!pc) return;
      if (!pc.remoteDescription) return;
      if (data.payload && data.payload.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate({
            candidate: data.payload.candidate.candidate,
            sdpMid: data.payload.candidate.sdpMid || '0',
            sdpMLineIndex: data.payload.candidate.sdpMLineIndex || 0
          }));
        } catch (err) {}
      }
    }
  },

  async handleReceiverConnected(data) {
    const socketId = data.socketId;
    if (!socketId) return;
    if (AppState.peerConnections.has(socketId)) return;

    if (!AppState.screenStream || AppState.screenStream.getVideoTracks().length === 0) {
      const ok = await StreamManager.startCapture(AppState.selectedSourceId, {
        shareVideo: UI.shareVideo.checked,
        shareAudio: UI.shareAudio.checked,
        shareMic: false
      });
      if (!ok) return;
    }

    if (!AppState.compositeStream) StreamManager.buildCompositeStream();

    const pc = this.createPeerConnection(socketId);
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      window.electronAPI.sendSignaling(socketId, 'OFFER', {
        type: offer.type,
        sdp: offer.sdp
      });
      addLog(I18n.t('log.offerSent', { id: socketId.slice(0, 4) }), 'info');
    } catch (err) {
      console.error('Create offer error:', err);
    }
  },

  // ---- 开始共享 ----
  async startSharing() {
    if (!AppState.selectedSourceId) { addLog(I18n.t('log.selectSource'), 'warn'); return; }
    if (!UI.shareVideo.checked && !UI.shareAudio.checked) { addLog(I18n.t('log.selectContent'), 'warn'); return; }

    const port = parseInt(UI.portInput.value);
    if (isNaN(port) || port < 1024 || port > 65535) { addLog(I18n.t('log.invalidPort'), 'warn'); return; }

    UI.startBtn.disabled = true;
    UI.startBtn.textContent = I18n.t('action.starting');

    try {
      window.electronAPI.onSignalingMessage((data) => this.handleSignalingMessage(data));
      window.electronAPI.onClientJoined((data) => {
        if (data.mode === 'bt' && data.relayFrom) {
          addLog(I18n.t('log.relayFromSeed', { id: data.client?.socketId?.slice(0, 4) }), 'info');
          return;
        }
        this.handleReceiverConnected({ socketId: data.client?.socketId, roomId: data.roomId, client: data.client });
      });
      window.electronAPI.onClientLeft((data) => {
        this.cleanupPeerConnection(data.clientId);
      });
      window.electronAPI.onStopCapture(() => {
        StreamManager.stopCapture();
        this.cleanupPeerConnection();
      });

      const captureOk = await StreamManager.startCapture(AppState.selectedSourceId, {
        shareVideo: UI.shareVideo.checked,
        shareAudio: UI.shareAudio.checked,
        shareMic: false
      });
      if (!captureOk) {
        UI.startBtn.textContent = I18n.t('action.start');
        UI.startBtn.disabled = false;
        return;
      }

      if (UI.shareCamera.checked) await StreamManager.startCameraStream();
      if (UI.shareMic.checked) await StreamManager.startMicStream();

      StreamManager.buildCompositeStream();

      const result = await window.electronAPI.startSharing(AppState.selectedSourceId, {
        shareVideo: UI.shareVideo.checked,
        shareAudio: UI.shareAudio.checked,
        mode: AppState.currentMode
      }, port);

      if (result.success) {
        AppState.isStreaming = true;
        // 禁用源选择
        document.querySelectorAll('.source-item').forEach(el => el.classList.add('disabled'));
        AppState.serverInfo = result.serverInfo;
        const { address, port: actualPort, roomId, mode } = result.serverInfo;
        const url = `http://${address}:${actualPort}`;
        const modeLabel = mode === 'bt' ? ' [BT]' : ' [Star]';
        UI.serverUrl.textContent = url + modeLabel;
        UI.roomIdEl.textContent = roomId;
        UI.addressRow.style.display = '';
        UI.roomIdRow.style.display = '';
        UI.statusDot.classList.add('active');
        UI.statusText.textContent = I18n.t('server.statusRunning');
        UI.statusText.classList.add('active');
        UI.startBtn.textContent = I18n.t('action.sharing');
        UI.startBtn.disabled = true;
        UI.stopBtn.disabled = false;
        UI.portInput.disabled = true;

        addLog(I18n.t('log.sharingStarted'), 'success');
      } else {
        StreamManager.stopCapture();
        addLog(I18n.t('log.startFailed', { error: result.error || '' }), 'error');
        UI.startBtn.textContent = I18n.t('action.start');
        UI.startBtn.disabled = false;
      }
    } catch (err) {
      StreamManager.stopCapture();
      addLog(I18n.t('log.startError', { error: err.message }), 'error');
      UI.startBtn.textContent = I18n.t('action.start');
      UI.startBtn.disabled = false;
    }
  },

  // ---- 停止共享 ----
  async stopSharing() {
    UI.stopBtn.disabled = true;

    // 收起预览区动画
    animatePreviewCollapse(async () => {
      try {
        this.cleanupPeerConnection();
        window.electronAPI.removeAllListeners('signaling-message');
        window.electronAPI.removeAllListeners('receiver-disconnected');
        StreamManager.stopCapture();
        await StreamManager.closeCameraWindow();
        await window.electronAPI.stopSharing();

        AppState.isStreaming = false;
        // 恢复源选择
        document.querySelectorAll('.source-item').forEach(el => el.classList.remove('disabled'));
        AppState.serverInfo = null;
        UI.serverUrl.textContent = '';
        UI.roomIdEl.textContent = '';
        UI.addressRow.style.display = 'none';
        UI.roomIdRow.style.display = 'none';
        UI.statusDot.classList.remove('active');
        UI.statusText.textContent = I18n.t('server.statusNotRunning');
        UI.statusText.classList.remove('active');
        UI.startBtn.textContent = I18n.t('action.start');
        UI.startBtn.disabled = false;
        UI.stopBtn.disabled = true;
        UI.portInput.disabled = false;

        addLog(I18n.t('log.sharingStopped'), 'success');

        // 重新展开预览
        if (AppState.selectedSourceId) {
          await StreamManager.updatePreviewForSource(AppState.selectedSourceId);
          animatePreviewExpand();
        }
      } catch (err) {
        addLog(I18n.t('log.stopError', { error: err.message }), 'error');
      }
    });
  }
};

// ============ 事件绑定 ============
UI.startBtn.addEventListener('click', () => SignalingManager.startSharing());
UI.stopBtn.addEventListener('click', () => SignalingManager.stopSharing());
UI.refreshBtn.addEventListener('click', () => {
  UI.refreshBtn.setAttribute('loading', '');
  StreamManager.loadSources().finally(() => UI.refreshBtn.removeAttribute('loading'));
});

// 初始化
StreamManager.loadSources();
