# XENON skin (vendored build)

This folder is a build of the reusable XENON player skin, from `src/skin` in
https://github.com/Chima30/Xenon. `SOURCE.json` records the exact commit.

- `xenon-skin.js`: the skin's components (`CinemaSkin` and friends), as an ES module.
- `xenon-skin.css`: the skin's styles, all scoped to `.cs-root` and its own custom properties.

Only the skin is built here. None of XENON's demo app (film catalogue, Test Lab, movie wheel data, My Atlas) is
included. React, the Video.js v10 packages (`@videojs/react`, `@videojs/mux-video`) and the Space Grotesk font are
not bundled: they come from this portfolio's own `package.json`.

Do not edit these files by hand. To update to a newer XENON, run from the portfolio folder, with a XENON checkout
that has had `npm install`:

```
node scripts/sync-xenon.mjs ../Xenon
```

It is used in `components/XenonPlayer.js`, shown in the Development page's Cinema section (`/development#cinema`).
