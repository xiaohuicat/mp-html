// EventChannel.js
class EventChannel {
  constructor() {
    this.listeners = {};
  }

  // 绑定事件（确保每个事件只有一个回调）
  on(event, callback) {
    this.listeners[event] = [callback];  // 仅保存一个回调
  }

  // 触发事件
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  // 解除事件监听
  off(event, callback) {
    if (this.listeners[event]) {
      const index = this.listeners[event].indexOf(callback);
      if (index !== -1) {
        this.listeners[event].splice(index, 1);
      }
    }
  }
}

const channel = new EventChannel();

const mpEventWatch = (callback) =>{
  channel.on('channel', callback);
}

const mpEventSend = (data) => {
  channel.emit('channel', data);
};

const mpEventOff = () => {
  channel.off('channel');
}

module.exports = {
  mpEventSend,
  mpEventWatch,
  mpEventOff,
};
