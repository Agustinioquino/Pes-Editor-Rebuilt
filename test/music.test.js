const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./load');

const spParse = load('mpsp.js', 'spParse');
const mpYtParse = load('mpyt.js', 'mpYtParse');

test('links de Spotify', () => {
  assert.deepStrictEqual({ ...spParse('https://open.spotify.com/intl-es/track/4cOdK2wGLETKBW3PvgPWqT?si=abc') }, { type: 'track', id: '4cOdK2wGLETKBW3PvgPWqT', uri: 'spotify:track:4cOdK2wGLETKBW3PvgPWqT', url: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT' });
  assert.strictEqual(spParse('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M').type, 'playlist');
  assert.strictEqual(spParse('https://open.spotify.com/embed/album/1DFixLWuPkv3KT3TnV35m3').uri, 'spotify:album:1DFixLWuPkv3KT3TnV35m3');
  assert.strictEqual(spParse('spotify:track:4cOdK2wGLETKBW3PvgPWqT').type, 'track');
  assert.strictEqual(spParse('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), null);
  assert.strictEqual(spParse('himno de la champions'), null);
});

test('links de YouTube', () => {
  assert.strictEqual(mpYtParse('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3').v, 'dQw4w9WgXcQ');
  assert.strictEqual(mpYtParse('https://youtu.be/dQw4w9WgXcQ').v, 'dQw4w9WgXcQ');
  assert.strictEqual(mpYtParse('https://music.youtube.com/playlist?list=PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG').list, 'PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG');
});
