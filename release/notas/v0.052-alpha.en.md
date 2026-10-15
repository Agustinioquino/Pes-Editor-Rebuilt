<div align="center">

# 🙂 Minifaces into the game and better crests

**[▶ Open PES Editor Rebuilt](https://agustinioquino.github.io/Pes-Editor-Rebuilt/)** · **[⬇️ Windows app (.exe)](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.052-alpha/PES-Editor-Rebuilt-Setup.exe)** · [📦 Portable version](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.052-alpha/PES-Editor-Rebuilt-Portable.exe)

</div>

## 🙂 Your player, with his own face

That reserve-team kid who has a generic face in the game? The new signing who still doesn't have a miniface? Now you fix it yourself, right from the editor, no extra programs needed.

Every player's profile has a new tab, **🙂 Miniface**:

1. **Upload a photo**, PNG or JPG (or just drop it on top).
2. **✨ Remove with AI** takes the background off in one click. The first time it downloads the model from the internet (about 7 MB), and after that it's instant. If you prefer, there's also **By color** or the **🪄 wand**: click the background and it's gone, with Undo.
3. **Frame it** with the zoom and the head guide, or click **🎯 Auto-frame**.
4. **💾 Save to the game**: the editor builds the `.dds` with transparency and the player's ID, in the game's miniface format (DXT3, 2048×2048 recommended).

It's saved in `livecpk\PESEditor-Minifaces`, a folder of its own that the editor puts **first in sider.ini** (with a backup), so your miniface wins and the ones you already had in other folders aren't touched. If the browser won't let it touch sider.ini, it saves it in a folder Sider already reads. Changed your mind? **🗑 Delete it** brings back the one that was there before.

<img alt="The Miniface tab with a photo already cut out, the head guide, the zoom, AI background removal, the size and Save to the game" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.052/miniface.png" width="100%">

## 🛡️ Crests: bigger, with a preview and for every background

The crest creator (in **Data and colours**) stepped up its game:

- **👀 Preview of all 11 files.** As soon as you load the image you see how each one looks, with its size. The `r_b` ones are shown on black and the `r_w` ones on white, just like in the game.
- **🌗 Versions for dark and light backgrounds.** If your crest has a lot of black, the editor asks whether you want the `r_b` to lighten the blacks and get a light outline, so it doesn't get lost on dark banners. If it has a lot of white, same thing with the `r_w`: it tones down the whites and adds a soft dark border. You decide, and your own files are never retouched.
- **🔍 Normal HD or 2K quality (experimental).** Normal HD copies the size of the crests you already have. 2K builds them at 512×520, 1028×1044 (`_l`) and 2056×2088 (`_ll`). ⚠️ **It's experimental:** in testing the game dropped 3 or 4 FPS and lagged in some menus. If that happens to you, switch back to Normal HD and save again.
- **🔤 What each letter means.** It's explained in "Where and how it is saved": `f` flat, `r` render, `r_b` for dark backgrounds, `r_w` for light backgrounds; no letter is the normal size, `_l` the large one and `_ll` the largest.
- **📂 It goes to the right folder.** The crest is saved where Sider already reads your crests, and the `PESEditor-Escudos` folder no longer stays empty when the browser won't let it touch sider.ini.

<img alt="The crest creator with Quality, the r_b and r_w touch-ups and the preview of the 11 files" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.052/escudo.png" width="100%">

## 🔧 And also

- **🧹 The `.bak-edit21` copies clean themselves up.** The copies of crests, minifaces and kits are there so you can undo while the editor is open. The next time you open it, with the Sider folder connected, they get cleaned up. `sider.ini.bak-pes-editor` isn't touched.
- **📸 Player photos that are faster and find more.** The search uses the full name (ESPN) and Wikipedia in the player's language. And if it doesn't show up, in Formation (Photos view) you can paste the link from **SoFIFA, Sortitoutsi, PES Master, SoccerWiki** or any photo.
- **📊 In development, with bars.** The panel shows how much is left on each item with a colored bar and its percentage, marks what's high priority (Football Life, the Windows app, CSV import and export, and visual improvements) and can be hidden.
- **✨ Metallic text in PES 6 mode**, stronger and just as readable.

<img alt="The In development panel with colored progress bars, percentages and high priority, in PES 6 mode" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.052/en-desarrollo.png" width="100%">

## ⬇️ Do I need to download anything?

**No.** All of this is in the editor, and the Windows app loads it from the internet on its own: the next time you open it (or when "A new version of the editor is available" shows up) you've got it.

> This is an alpha version: the miniface was tested with test folders. If something doesn't look right in the game, let us know.
