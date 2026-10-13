// Lo único que ve la página: pedir una carpeta con el selector de Windows y leer o escribir dentro de ella.
// main.js revisa cada pedido (que venga del editor y que la ruta esté dentro de una carpeta elegida).
const { contextBridge, ipcRenderer } = require('electron');
const call = (ch, ...a) => ipcRenderer.invoke('pes:' + ch, ...a);
contextBridge.exposeInMainWorld('pesNative', {
  sep: process.platform === 'win32' ? '\\' : '/',
  info: () => call('info'),
  pick: o => call('pick', o),
  known: p => call('known', p),
  list: p => call('list', p),
  stat: p => call('stat', p),
  read: p => call('read', p),
  write: (p, d) => call('write', p, d),
  mkdir: p => call('mkdir', p),
  remove: (p, r) => call('remove', p, r)
});
