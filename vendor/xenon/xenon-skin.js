import { Container, Controls, ErrorDialog, FullscreenButton, Gesture, Hotkey, MuteButton, PiPButton, PlayButton, SeekButton, SeekIndicator, StatusAnnouncer, Time, TimeSlider, VERSION, VolumeSlider, useAudioTrackOptions, useMedia, useQualityOptions } from "@videojs/react";
import { usePlayer } from "@videojs/react/video";
import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import "@fontsource-variable/space-grotesk";
// ../player/src/skin/format.ts
/** Formats seconds as H:MM:SS or M:SS. Non-finite or negative input becomes 0:00. */
function formatTime(seconds) {
	const s = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
	const h = Math.floor(s / 3600);
	const m = Math.floor(s % 3600 / 60);
	const sec = s % 60;
	const two = (n) => String(n).padStart(2, "0");
	return h > 0 ? `${h}:${two(m)}:${two(sec)}` : `${m}:${two(sec)}`;
}
/** Spoken form for aria-valuetext / labels, e.g. "1 minute 5 seconds". */
function speakTime(seconds) {
	const s = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
	const h = Math.floor(s / 3600);
	const m = Math.floor(s % 3600 / 60);
	const sec = s % 60;
	const parts = [];
	if (h) parts.push(`${h} ${h === 1 ? "hour" : "hours"}`);
	if (m) parts.push(`${m} ${m === 1 ? "minute" : "minutes"}`);
	if (sec || parts.length === 0) parts.push(`${sec} ${sec === 1 ? "second" : "seconds"}`);
	return parts.join(" ");
}
/** Parses "90", "1:30" or "1:02:03" (also with decimals) into seconds; null when invalid. */
function parseTimeInput(text) {
	const parts = text.trim().split(":");
	if (parts.length < 1 || parts.length > 3 || parts.some((p) => !/^\d+(\.\d+)?$/.test(p))) return null;
	return parts.reduce((acc, p) => acc * 60 + Number(p), 0);
}
var clamp = (n, min, max) => Math.min(max, Math.max(min, n));
// ../player/src/skin/storage.ts
/**
* Small, defensive localStorage helpers. Every read is validated, every write is wrapped:
* storage can be missing (private windows), full (quota) or hold hand-edited garbage.
*/
var NS = "cinema-skin:v1:";
function readJSON(key, validate, fallback) {
	try {
		const raw = window.localStorage.getItem(NS + key);
		if (raw === null) return fallback;
		const result = validate(JSON.parse(raw));
		return result === null ? fallback : result;
	} catch {
		return fallback;
	}
}
function writeJSON(key, value) {
	try {
		window.localStorage.setItem(NS + key, JSON.stringify(value));
		return true;
	} catch {
		return false;
	}
}
var isRecord = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var SCRIM_MODES = [
	"default",
	"high-contrast",
	"theater"
];
var DEFAULT_PREFS$1 = { scrim: "default" };
function loadPrefs() {
	return readJSON("prefs", (v) => {
		if (!isRecord(v)) return null;
		return { scrim: SCRIM_MODES.find((m) => m === v.scrim) ?? DEFAULT_PREFS$1.scrim };
	}, DEFAULT_PREFS$1);
}
function savePrefs(prefs) {
	writeJSON("prefs", prefs);
}
// ../player/src/skin/appearance/color.ts
var lin$1 = (c) => {
	const s = c / 255;
	return s <= .03928 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4;
};
var luminance = ([r, g, b]) => .2126 * lin$1(r) + .7152 * lin$1(g) + .0722 * lin$1(b);
function contrastRatio(a, b) {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + .05) / (lo + .05);
}
function parseHex(text) {
	const m = text.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
	if (!m || !m[1]) return null;
	const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
	return [
		parseInt(h.slice(0, 2), 16),
		parseInt(h.slice(2, 4), 16),
		parseInt(h.slice(4, 6), 16)
	];
}
var toHex = ([r, g, b]) => "#" + [
	r,
	g,
	b
].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
function rgbToHsl([r, g, b]) {
	const rn = r / 255, gn = g / 255, bn = b / 255;
	const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
	const l = (max + min) / 2;
	const d = max - min;
	if (d === 0) return [
		0,
		0,
		l
	];
	const s = d / (1 - Math.abs(2 * l - 1));
	let h = max === rn ? (gn - bn) / d % 6 : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
	h = (h * 60 + 360) % 360;
	return [
		h,
		s,
		l
	];
}
function hslToRgb(h, s, l) {
	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(h / 60 % 2 - 1));
	const m = l - c / 2;
	const [r, g, b] = h < 60 ? [
		c,
		x,
		0
	] : h < 120 ? [
		x,
		c,
		0
	] : h < 180 ? [
		0,
		c,
		x
	] : h < 240 ? [
		0,
		x,
		c
	] : h < 300 ? [
		x,
		0,
		c
	] : [
		c,
		0,
		x
	];
	return [
		(r + m) * 255,
		(g + m) * 255,
		(b + m) * 255
	];
}
/** Surface that accent colours must read against (the skin's glass panel colour). */
var SURFACE = [
	21,
	27,
	44
];
var DEFAULT_ACCENT = [
	216,
	255,
	87
];
var INK_DARK = [
	10,
	14,
	23
];
var INK_LIGHT = [
	255,
	255,
	255
];
/** Text colour for content placed ON an accent-coloured button: whichever reads better. */
function inkOn(accent) {
	return contrastRatio(accent, INK_DARK) >= contrastRatio(accent, INK_LIGHT) ? INK_DARK : INK_LIGHT;
}
/**
* Makes `wanted` usable as an accent: it must reach `min` contrast against the panel surface (for focus rings, text
* links and selected states) AND leave readable ink on top of it. Lightens it step by step; falls back to the default.
*/
function safeAccent(wanted, min = 4.5) {
	const ok = (c) => contrastRatio(c, SURFACE) >= min && contrastRatio(c, inkOn(c)) >= min;
	if (ok(wanted)) return {
		color: wanted,
		adjusted: false,
		fellBack: false,
		ratio: contrastRatio(wanted, SURFACE)
	};
	const [h, s, l] = rgbToHsl(wanted);
	for (let step = 1; step <= 20; step++) {
		const candidate = hslToRgb(h, s, Math.min(.9, l + step * .03)).map(Math.round);
		if (ok(candidate)) return {
			color: candidate,
			adjusted: true,
			fellBack: false,
			ratio: contrastRatio(candidate, SURFACE)
		};
	}
	return {
		color: DEFAULT_ACCENT,
		adjusted: false,
		fellBack: true,
		ratio: contrastRatio(DEFAULT_ACCENT, SURFACE)
	};
}
/**
* Reads colours from artwork pixels. The result is only ever used through safeAccent() and a darkened tint,
* so a washed-out or neon poster can never make the interface unreadable.
*/
function paletteFromPixels(data) {
	let sumR = 0, sumG = 0, sumB = 0, n = 0;
	let wR = 0, wG = 0, wB = 0, wSum = 0;
	let bright = 0;
	for (let i = 0; i < data.length; i += 4) {
		if ((data[i + 3] ?? 255) < 128) continue;
		const px = [
			data[i] ?? 0,
			data[i + 1] ?? 0,
			data[i + 2] ?? 0
		];
		sumR += px[0];
		sumG += px[1];
		sumB += px[2];
		n++;
		const [, s, l] = rgbToHsl(px);
		bright += l;
		const w = s * (1 - Math.abs(2 * l - 1));
		if (s > .2 && l > .15 && l < .85) {
			wR += px[0] * w;
			wG += px[1] * w;
			wB += px[2] * w;
			wSum += w;
		}
	}
	if (n === 0) return fallbackPalette("The artwork has no readable pixels.");
	const avg = [
		sumR / n,
		sumG / n,
		sumB / n
	];
	const brightness = bright / n;
	if (wSum < .5) {
		const [h] = rgbToHsl(avg);
		return {
			tint: hslToRgb(h, .15, .09).map(Math.round),
			dominant: avg.map(Math.round),
			average: avg.map(Math.round),
			accent: {
				color: DEFAULT_ACCENT,
				adjusted: false,
				fellBack: true,
				ratio: contrastRatio(DEFAULT_ACCENT, SURFACE)
			},
			brightness,
			note: "The artwork is nearly grey, so the default accent is used."
		};
	}
	const dominant = [
		wR / wSum,
		wG / wSum,
		wB / wSum
	];
	const [h, s] = rgbToHsl(dominant);
	const accent = safeAccent(hslToRgb(h, Math.min(.95, Math.max(.55, s)), .62).map(Math.round));
	return {
		tint: hslToRgb(h, Math.min(s, .45), .1).map(Math.round),
		dominant: dominant.map(Math.round),
		average: avg.map(Math.round),
		accent,
		brightness,
		note: accent.fellBack ? "The poster colour could not reach 4.5:1 contrast, so the default accent is used." : accent.adjusted ? "The poster colour was lightened to reach 4.5:1 contrast." : "The poster colour already meets 4.5:1 contrast."
	};
}
function fallbackPalette(note) {
	return {
		tint: [
			10,
			14,
			23
		],
		dominant: [
			10,
			14,
			23
		],
		average: [
			10,
			14,
			23
		],
		accent: {
			color: DEFAULT_ACCENT,
			adjusted: false,
			fellBack: true,
			ratio: contrastRatio(DEFAULT_ACCENT, SURFACE)
		},
		brightness: .1,
		note
	};
}
/**
* Loads an image with CORS and samples a 32x32 copy. Rejects when the host forbids pixel access;
* callers then use fallbackPalette().
*/
function extractPalette(src) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.decoding = "async";
		img.onload = () => {
			try {
				const canvas = document.createElement("canvas");
				canvas.width = 32;
				canvas.height = 32;
				const ctx = canvas.getContext("2d", { willReadFrequently: true });
				if (!ctx) throw new Error("no canvas");
				ctx.drawImage(img, 0, 0, 32, 32);
				resolve(paletteFromPixels(ctx.getImageData(0, 0, 32, 32).data));
			} catch (e) {
				reject(e);
			}
		};
		img.onerror = () => reject(/* @__PURE__ */ new Error("image failed to load"));
		img.src = src;
	});
}
/**
* Size the readability scrim. Worst case for text is a flat area of the background, modelled as
* tint (root) + art at `opacity`, then a tint-coloured scrim of alpha `a` on top. Finds the smallest `a`
* that gives `target` contrast against `text`, and returns the contrast actually achieved.
*/
function solveScrim(tint, art, opacity, text, target) {
	const lerp = (x, y, t) => [
		x[0] + (y[0] - x[0]) * t,
		x[1] + (y[1] - x[1]) * t,
		x[2] + (y[2] - x[2]) * t
	];
	const compose = (a) => lerp(lerp(tint, art, opacity), tint, a);
	let lo = .15;
	let hi = .97;
	if (contrastRatio(compose(lo), text) >= target) return {
		alpha: lo,
		ratio: contrastRatio(compose(lo), text)
	};
	for (let i = 0; i < 14; i++) {
		const mid = (lo + hi) / 2;
		if (contrastRatio(compose(mid), text) >= target) hi = mid;
		else lo = mid;
	}
	return {
		alpha: hi,
		ratio: contrastRatio(compose(hi), text)
	};
}
// ../player/src/skin/appearance/AppearanceContext.tsx
var BACKGROUND_MODES = [
	"solid",
	"spectral",
	"artwork",
	"custom"
];
/** XENON's own spectrum, used in the Fixed theme and for videos without a palette. */
var XENON_SPECTRUM = [
	"#070a12",
	"#1a2336",
	"#4c6b8a",
	"#cad9e6"
];
/** Curated starting points. Ambient colour and background blur are the existing Appearance settings. */
var GRADIENT_PRESETS = {
	subtle: {
		intensity: 35,
		ambient: 20,
		panelAlpha: 94,
		blur: 32
	},
	cinematic: {
		intensity: 60,
		ambient: 35,
		panelAlpha: 90,
		blur: 28
	},
	vivid: {
		intensity: 85,
		ambient: 60,
		panelAlpha: 80,
		blur: 22
	}
};
var DEFAULT_APPEARANCE = {
	theme: "adaptive",
	background: "spectral",
	panelColor: null,
	enabled: false,
	source: "poster",
	opacity: 55,
	blur: 28,
	color: "#1f3b57",
	customImage: null,
	accent: "default",
	customAccent: "#ff7a59",
	contrast: "normal",
	ambient: 35,
	panels: {
		header: "glass",
		wheel: "glass",
		controls: "glass"
	},
	gradient: {
		preset: "cinematic",
		intensity: 60,
		direction: 160,
		panelAlpha: 90,
		paletteMode: "film",
		custom: [...XENON_SPECTRUM]
	}
};
var NAMED_ACCENTS = {
	lavender: "#ada0f8",
	teal: "#8dd3cf",
	rose: "#f59ac0"
};
var pick = (v, allowed, d) => allowed.find((a) => a === v) ?? d;
var num = (v, lo, hi, d) => typeof v === "number" && Number.isFinite(v) ? clamp(v, lo, hi) : d;
var hex$1 = (v, d) => typeof v === "string" && parseHex(v) ? v.startsWith("#") ? v : `#${v}` : d;
/**
* Keeps the artwork switch and source in step with the background mode: Artwork shows the film's still, Custom
* shows the viewer's image (or colour, until there is an image), Solid and Spectral show no image at all.
*/
function withBackground(a) {
	switch (a.background) {
		case "artwork": return {
			...a,
			enabled: true,
			source: "poster"
		};
		case "custom": return {
			...a,
			enabled: true,
			source: a.source === "poster" ? a.customImage ? "custom" : "color" : a.source
		};
		default: return {
			...a,
			enabled: false
		};
	}
}
/** How Appearance looked before background modes existed: artwork on, Cinematic gradients. */
var LEGACY_DEFAULTS = {
	opacity: 55,
	blur: 28,
	ambient: 35,
	intensity: 60,
	direction: 160,
	panelAlpha: 90
};
/**
* The background a saved setting from before background modes stands for. Someone who never touched the
* background controls gets the Spectral default; anyone who did keeps the look they chose.
*/
function legacyBackground(v) {
	if (!(v.enabled === true)) return "spectral";
	if (v.source === "custom" || v.source === "color") return "custom";
	const g = isRecord(v.gradient) ? v.gradient : {};
	return typeof v.opacity === "number" && v.opacity !== LEGACY_DEFAULTS.opacity || typeof v.blur === "number" && v.blur !== LEGACY_DEFAULTS.blur || typeof v.ambient === "number" && v.ambient !== LEGACY_DEFAULTS.ambient || typeof g.preset === "string" && g.preset !== "cinematic" || typeof g.intensity === "number" && g.intensity !== LEGACY_DEFAULTS.intensity || typeof g.direction === "number" && g.direction !== LEGACY_DEFAULTS.direction || typeof g.panelAlpha === "number" && g.panelAlpha !== LEGACY_DEFAULTS.panelAlpha || g.paletteMode === "custom" ? "artwork" : "spectral";
}
function parseAppearance(v) {
	if (!isRecord(v)) return null;
	const d = DEFAULT_APPEARANCE;
	const panels = isRecord(v.panels) ? v.panels : {};
	const styles = [
		"glass",
		"solid",
		"clear"
	];
	const background = BACKGROUND_MODES.find((m) => m === v.background) ?? legacyBackground(v);
	return withBackground({
		theme: pick(v.theme, ["adaptive", "fixed"], d.theme),
		background,
		panelColor: typeof v.panelColor === "string" && parseHex(v.panelColor) ? hex$1(v.panelColor, "#0a0e17") : null,
		enabled: v.enabled === true,
		source: pick(v.source, [
			"poster",
			"color",
			"custom"
		], d.source),
		opacity: num(v.opacity, 0, 100, d.opacity),
		blur: num(v.blur, 0, 60, d.blur),
		color: hex$1(v.color, d.color),
		customImage: typeof v.customImage === "string" && v.customImage.startsWith("data:image/") ? v.customImage : null,
		accent: pick(v.accent, [
			"default",
			"citron",
			"poster",
			"lavender",
			"teal",
			"rose",
			"custom"
		], d.accent),
		customAccent: hex$1(v.customAccent, d.customAccent),
		contrast: pick(v.contrast, ["normal", "high"], d.contrast),
		ambient: num(v.ambient, 0, 100, d.ambient),
		panels: {
			header: pick(panels.header, styles, d.panels.header),
			wheel: pick(panels.wheel, styles, d.panels.wheel),
			controls: pick(panels.controls, styles, d.panels.controls)
		},
		gradient: parseGradient(v.gradient)
	});
}
function parseGradient(v) {
	const d = DEFAULT_APPEARANCE.gradient;
	if (!isRecord(v)) return {
		...d,
		custom: [...d.custom]
	};
	const c = Array.isArray(v.custom) ? v.custom : [];
	return {
		preset: pick(v.preset, [
			"subtle",
			"cinematic",
			"vivid",
			"custom"
		], d.preset),
		intensity: num(v.intensity, 0, 100, d.intensity),
		direction: num(v.direction, 0, 360, d.direction),
		panelAlpha: num(v.panelAlpha, 40, 100, d.panelAlpha),
		paletteMode: pick(v.paletteMode, ["film", "custom"], d.paletteMode),
		custom: [
			0,
			1,
			2,
			3
		].map((i) => hex$1(c[i], d.custom[i]))
	};
}
/** A spectrum for a palette that has none: deepened base, base towards its secondary, its glow, its ink. */
function spectrumFor(p) {
	if (!p) return XENON_SPECTRUM;
	if (p.spectrum) return p.spectrum;
	const b = parseHex(p.base) ?? [
		10,
		14,
		23
	];
	const s = parseHex(p.secondary ?? p.accent) ?? b;
	const g = parseHex(p.glow ?? p.accent) ?? s;
	const ink = parseHex(p.ink ?? "#e7eef6") ?? [
		231,
		238,
		246
	];
	const mixc = (x, y, t) => x.map((v, i) => Math.round(v + ((y[i] ?? v) - v) * t));
	return [
		toHex(mixc(b, [
			0,
			0,
			0
		], .35)),
		toHex(mixc(b, s, .35)),
		toHex(mixc(g, b, .25)),
		toHex(mixc(ink, g, .15))
	];
}
function parsePresets(v) {
	if (!Array.isArray(v)) return null;
	const out = [];
	for (const p of v) {
		if (!isRecord(p) || typeof p.id !== "string" || typeof p.name !== "string") continue;
		const a = parseAppearance(p.appearance);
		if (!a) continue;
		const { customImage: _drop, ...rest } = a;
		out.push({
			id: p.id,
			name: p.name.slice(0, 30),
			appearance: rest
		});
	}
	return out;
}
var Ctx$2 = createContext(null);
function useAppearance() {
	const c = useContext(Ctx$2);
	if (!c) throw new Error("useAppearance must be used inside <CinemaSkin>");
	return c;
}
var MAX_PRESETS = 12;
/** Downscales a user image to 1280px wide JPEG so it fits comfortably in localStorage. */
async function fileToDataUrl(file) {
	const url = URL.createObjectURL(file);
	try {
		const img = await new Promise((resolve, reject) => {
			const i = new Image();
			i.onload = () => resolve(i);
			i.onerror = () => reject(/* @__PURE__ */ new Error("not an image"));
			i.src = url;
		});
		const scale = Math.min(1, 1280 / img.naturalWidth);
		const canvas = document.createElement("canvas");
		canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
		canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("no canvas");
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
		return canvas.toDataURL("image/jpeg", .8);
	} finally {
		URL.revokeObjectURL(url);
	}
}
function AppearanceProvider({ artwork, artworkLabel, palette: filmPalette, children }) {
	const [appearance, setAppearance] = useState(() => readJSON("appearance", parseAppearance, DEFAULT_APPEARANCE));
	const [presets, setPresets] = useState(() => readJSON("appearance-presets", parsePresets, []));
	const [wheelCollapsed, setWheelCollapsedState] = useState(() => readJSON("wheel-collapsed", (v) => v === true, false));
	const [persisted, setPersisted] = useState(true);
	const [palettes, setPalettes] = useState({});
	const imageUrl = !appearance.enabled ? null : appearance.source === "poster" ? artwork ?? null : appearance.source === "custom" ? appearance.customImage : null;
	useEffect(() => {
		if (!imageUrl || palettes[imageUrl] !== void 0) return;
		let cancelled = false;
		extractPalette(imageUrl).then((p) => !cancelled && setPalettes((m) => ({
			...m,
			[imageUrl]: p
		})), () => !cancelled && setPalettes((m) => ({
			...m,
			[imageUrl]: "unavailable"
		})));
		return () => {
			cancelled = true;
		};
	}, [imageUrl, palettes]);
	const save = useCallback((a) => {
		setPersisted(writeJSON("appearance", a));
	}, []);
	const update = useCallback((patch) => {
		setAppearance((prev) => {
			const next = withBackground({
				...prev,
				...patch
			});
			save(next);
			return next;
		});
	}, [save]);
	const updatePanel = useCallback((area, style) => {
		setAppearance((prev) => {
			const next = {
				...prev,
				panels: {
					...prev.panels,
					[area]: style
				}
			};
			save(next);
			return next;
		});
	}, [save]);
	const reset = useCallback(() => {
		setAppearance(DEFAULT_APPEARANCE);
		save(DEFAULT_APPEARANCE);
	}, [save]);
	const savePreset = useCallback((name) => {
		const clean = name.trim().slice(0, 30);
		if (!clean) return "Give the preset a name.";
		if (presets.length >= MAX_PRESETS) return `You can keep up to ${MAX_PRESETS} presets. Delete one first.`;
		const { customImage: _drop, ...rest } = appearance;
		const next = [...presets, {
			id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
			name: clean,
			appearance: rest
		}];
		setPresets(next);
		if (!writeJSON("appearance-presets", next)) return "Saved for this session only: the browser would not store it.";
		return null;
	}, [appearance, presets]);
	const applyPreset = useCallback((id) => {
		const p = presets.find((x) => x.id === id);
		if (!p) return;
		setAppearance((prev) => {
			const next = withBackground({
				...p.appearance,
				customImage: prev.customImage
			});
			save(next);
			return next;
		});
	}, [presets, save]);
	const deletePreset = useCallback((id) => {
		const next = presets.filter((p) => p.id !== id);
		setPresets(next);
		writeJSON("appearance-presets", next);
	}, [presets]);
	const setCustomImageFromFile = useCallback(async (file) => {
		if (!file.type.startsWith("image/")) return "Choose an image file.";
		try {
			const dataUrl = await fileToDataUrl(file);
			update({
				customImage: dataUrl,
				source: "custom",
				background: "custom"
			});
			return null;
		} catch {
			return "That file could not be read as an image.";
		}
	}, [update]);
	const setWheelCollapsed = useCallback((v) => {
		setWheelCollapsedState(v);
		writeJSON("wheel-collapsed", v);
	}, []);
	const activeFilm = appearance.theme === "adaptive" ? filmPalette ?? null : null;
	const derived = useMemo(() => {
		const a = appearance;
		const ink = a.contrast === "high" ? [
			255,
			255,
			255
		] : [
			244,
			246,
			242
		];
		const target = a.contrast === "high" ? 7 : 4.5;
		const entry = imageUrl ? palettes[imageUrl] : void 0;
		const palette = a.source === "color" ? paletteFromColor(a.color) : imageUrl ? entry && entry !== "unavailable" ? entry : entry === "unavailable" ? fallbackPalette("Pixel colours could not be read from this image (the host blocks it), so a safe default palette is used.") : null : a.source === "custom" ? fallbackPalette("No custom image chosen yet.") : fallbackPalette("This film has no artwork available.");
		const status = !a.enabled ? "idle" : a.source === "color" ? "ready" : imageUrl ? entry === void 0 ? "loading" : entry === "unavailable" ? "unavailable" : "ready" : "unavailable";
		const base = palette ?? fallbackPalette("");
		const filmAccent = activeFilm ? parseHex(activeFilm.accent) : null;
		let accent;
		if (a.accent === "poster") accent = palette && !palette.accent.fellBack ? palette.accent : safeAccent(filmAccent ?? DEFAULT_ACCENT);
		else if (a.accent === "default") accent = safeAccent(filmAccent ?? DEFAULT_ACCENT);
		else if (a.accent === "citron") accent = safeAccent(DEFAULT_ACCENT);
		else if (a.accent === "custom") accent = safeAccent(parseHex(a.customAccent) ?? DEFAULT_ACCENT);
		else accent = safeAccent(parseHex(NAMED_ACCENTS[a.accent]) ?? DEFAULT_ACCENT);
		const solved = solveScrim((a.panelColor ? parseHex(a.panelColor) : a.source !== "color" && activeFilm ? parseHex(activeFilm.base) : null) ?? base.tint, base.average, a.opacity / 100, ink, target);
		return {
			active: a.enabled,
			hasFilmPalette: Boolean(activeFilm),
			imageUrl,
			palette,
			paletteStatus: status,
			accent,
			textRatio: solved.ratio,
			scrimAlpha: solved.alpha,
			note: base.note
		};
	}, [
		appearance,
		imageUrl,
		palettes,
		activeFilm
	]);
	const cssVars = useMemo(() => {
		const a = appearance;
		const vars = {};
		const film = activeFilm;
		const extracted = derived.palette;
		const filmBase = film ? parseHex(film.base) : null;
		const baseColor = a.panelColor ? parseHex(a.panelColor) : a.enabled && a.source === "color" && extracted ? extracted.tint : filmBase ?? (a.enabled && extracted && derived.paletteStatus === "ready" ? extracted.tint : null);
		if (baseColor) vars["--cs-base"] = toHex(baseColor);
		if (a.accent !== "default" || film) {
			vars["--cs-citron"] = toHex(derived.accent.color);
			vars["--cs-ink-on-citron"] = toHex(inkOn(derived.accent.color));
		}
		const filmGlow = film ? parseHex(film.glow ?? film.accent) : null;
		if (filmGlow) vars["--cs-glow"] = toHex(filmGlow);
		else if (a.enabled && extracted && derived.paletteStatus === "ready") {
			const [h] = rgbToHsl(extracted.dominant);
			vars["--cs-glow"] = toHex(hslToRgb(h, .75, .5));
		}
		const filmInk = film?.ink ? parseHex(film.ink) : null;
		if (filmInk) vars["--cs-film-ink"] = toHex(filmInk);
		const filmSecondary = film?.secondary ? parseHex(film.secondary) : null;
		if (filmSecondary) vars["--cs-secondary"] = toHex(filmSecondary);
		spectrumIn(a, film).forEach((c, i) => {
			vars[`--sg-${i + 1}`] = c;
		});
		vars["--sg-k"] = a.gradient.intensity / 100;
		vars["--sg-amb"] = a.ambient / 100;
		vars["--sg-angle"] = `${a.gradient.direction}deg`;
		if (a.gradient.panelAlpha !== DEFAULT_APPEARANCE.gradient.panelAlpha) vars["--cs-panel-alpha"] = a.gradient.panelAlpha / 100;
		if (a.contrast === "high") {
			vars["--cs-ice"] = "#ffffff";
			vars["--cs-ice-dim"] = "#e6eaf2";
		}
		if (!derived.active) return vars;
		const alpha = (s) => s === "solid" ? 1 : s === "glass" ? a.contrast === "high" ? .9 : .62 : a.contrast === "high" ? .6 : .16;
		const blur = (s) => s === "glass" ? "18px" : "0px";
		const surf = (s) => `color-mix(in srgb, var(--cs-base) ${Math.round(alpha(s) * 100)}%, transparent)`;
		Object.assign(vars, {
			"--cs-atm-opacity": a.opacity / 100,
			"--cs-atm-blur": `${a.blur}px`,
			"--cs-atm-scrim": derived.scrimAlpha,
			"--cs-atm-glow-a": a.ambient / 100 * .55,
			"--cs-surf-header": surf(a.panels.header),
			"--cs-surf-wheel": surf(a.panels.wheel),
			"--cs-surf-controls": surf(a.panels.controls),
			"--cs-blur-header": blur(a.panels.header),
			"--cs-blur-wheel": blur(a.panels.wheel),
			"--cs-blur-controls": blur(a.panels.controls)
		});
		if (a.source === "color") vars["--cs-atm-color"] = toHex(parseHex(a.color) ?? [
			31,
			59,
			87
		]);
		if (derived.imageUrl) vars["--cs-atm-image"] = `url("${derived.imageUrl.replace(/"/g, "%22")}")`;
		return vars;
	}, [
		appearance,
		derived,
		activeFilm
	]);
	const resolved = useMemo(() => {
		const v = cssVars;
		return {
			base: v["--cs-base"] ?? "#0a0e17",
			accent: v["--cs-citron"] ?? toHex(DEFAULT_ACCENT),
			ink: v["--cs-film-ink"] ?? "#f4f6f2",
			glow: v["--cs-glow"] ?? "#5a78c8",
			secondary: v["--cs-secondary"] ?? "#ada0f8",
			image: derived.active && appearance.source !== "color" ? derived.imageUrl : null,
			background: appearance.background,
			spectrum: spectrumIn(appearance, activeFilm),
			angle: appearance.gradient.direction,
			ambient: appearance.ambient / 100
		};
	}, [
		cssVars,
		derived,
		appearance,
		activeFilm
	]);
	const value = useMemo(() => ({
		appearance,
		update,
		updatePanel,
		reset,
		presets,
		savePreset,
		applyPreset,
		deletePreset,
		setCustomImageFromFile,
		derived,
		cssVars,
		artworkLabel,
		wheelCollapsed,
		setWheelCollapsed,
		persisted,
		filmPalette: activeFilm,
		resolved
	}), [
		appearance,
		update,
		updatePanel,
		reset,
		presets,
		savePreset,
		applyPreset,
		deletePreset,
		setCustomImageFromFile,
		derived,
		cssVars,
		artworkLabel,
		wheelCollapsed,
		setWheelCollapsed,
		persisted,
		activeFilm,
		resolved
	]);
	return /* @__PURE__ */ jsx(Ctx$2.Provider, {
		value,
		children
	});
}
/** The spectrum a setting resolves to: the viewer's own, the film's, or XENON's. */
function spectrumIn(a, film) {
	if (a.gradient.paletteMode === "custom") return a.gradient.custom;
	return spectrumFor(film);
}
/** For the "solid colour" source: the chosen colour becomes the art; the tint is a darkened copy so panels stay dark. */
function paletteFromColor(hexColor) {
	const c = parseHex(hexColor) ?? [
		31,
		59,
		87
	];
	const [h, s] = rgbToHsl(c);
	return {
		tint: hslToRgb(h, Math.min(s, .45), .1).map(Math.round),
		dominant: c,
		average: c,
		accent: safeAccent(hslToRgb(h, Math.max(.55, s), .62).map(Math.round)),
		brightness: rgbToHsl(c)[2],
		note: "Using your chosen colour; panels use a darkened copy so text stays readable."
	};
}
// ../player/src/skin/appearance/Atmosphere.tsx
/**
* Background layers behind the interface. They sit under the layout (z-index 0) and are the only elements
* that blur or tint, so the video, which lives above them in its own opaque-or-transparent stage, is never filtered.
*/
function Atmosphere() {
	const { derived, appearance } = useAppearance();
	if (appearance.background === "solid") return /* @__PURE__ */ jsx("div", {
		className: "cs-atmosphere",
		"data-solid": true,
		"aria-hidden": "true"
	});
	if (!derived.active) return /* @__PURE__ */ jsx("div", {
		className: "cs-atmosphere",
		"data-light-only": true,
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("div", { className: "cs-atm-light" })
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "cs-atmosphere",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ jsx("div", { className: "cs-atm-light" }),
			appearance.source === "color" ? /* @__PURE__ */ jsx("div", { className: "cs-atm-color" }) : derived.imageUrl ? /* @__PURE__ */ jsx("div", { className: "cs-atm-art" }, derived.imageUrl) : null,
			/* @__PURE__ */ jsx("div", { className: "cs-atm-glow" }),
			/* @__PURE__ */ jsx("div", { className: "cs-atm-scrim" })
		]
	});
}
// ../player/src/skin/icons.tsx
function Base({ children, ...rest }) {
	return /* @__PURE__ */ jsx("svg", {
		viewBox: "0 0 24 24",
		width: "1em",
		height: "1em",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "1.8",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": "true",
		focusable: "false",
		...rest,
		children
	});
}
var PlayIcon = (p) => /* @__PURE__ */ jsx(Base, {
	...p,
	fill: "currentColor",
	stroke: "none",
	children: /* @__PURE__ */ jsx("path", { d: "M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2Z" })
});
var VolumeIcon = (p) => /* @__PURE__ */ jsxs(Base, {
	...p,
	children: [
		/* @__PURE__ */ jsx("path", { d: "M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" }),
		/* @__PURE__ */ jsx("path", { d: "M15.5 9a4 4 0 0 1 0 6" }),
		/* @__PURE__ */ jsx("path", { d: "M18 6.5a7.5 7.5 0 0 1 0 11" })
	]
});
var MuteIcon = (p) => /* @__PURE__ */ jsxs(Base, {
	...p,
	children: [
		/* @__PURE__ */ jsx("path", { d: "M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" }),
		/* @__PURE__ */ jsx("path", { d: "m16 9.5 5 5" }),
		/* @__PURE__ */ jsx("path", { d: "m21 9.5-5 5" })
	]
});
var CaptionsIcon = (p) => /* @__PURE__ */ jsxs(Base, {
	...p,
	children: [
		/* @__PURE__ */ jsx("rect", {
			x: "3",
			y: "5",
			width: "18",
			height: "14",
			rx: "3"
		}),
		/* @__PURE__ */ jsx("path", { d: "M10 10.2a2.2 2.2 0 1 0 0 3.6" }),
		/* @__PURE__ */ jsx("path", { d: "M17 10.2a2.2 2.2 0 1 0 0 3.6" })
	]
});
var SettingsIcon = (p) => /* @__PURE__ */ jsxs(Base, {
	...p,
	children: [
		/* @__PURE__ */ jsx("path", { d: "M4 7h9M17 7h3M4 17h3M11 17h9" }),
		/* @__PURE__ */ jsx("circle", {
			cx: "15",
			cy: "7",
			r: "2"
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: "9",
			cy: "17",
			r: "2"
		})
	]
});
var FullscreenIcon = (p) => /* @__PURE__ */ jsx(Base, {
	...p,
	children: /* @__PURE__ */ jsx("path", { d: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" })
});
var ExitFullscreenIcon = (p) => /* @__PURE__ */ jsx(Base, {
	...p,
	children: /* @__PURE__ */ jsx("path", { d: "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" })
});
var PipIcon = (p) => /* @__PURE__ */ jsxs(Base, {
	...p,
	children: [/* @__PURE__ */ jsx("rect", {
		x: "3",
		y: "5",
		width: "18",
		height: "14",
		rx: "2.5"
	}), /* @__PURE__ */ jsx("rect", {
		x: "12",
		y: "11",
		width: "6.5",
		height: "5",
		rx: "1",
		fill: "currentColor",
		stroke: "none"
	})]
});
var BookmarkIcon = (p) => /* @__PURE__ */ jsx(Base, {
	...p,
	children: /* @__PURE__ */ jsx("path", { d: "M6.5 4h11a1 1 0 0 1 1 1v15l-6.5-4-6.5 4V5a1 1 0 0 1 1-1Z" })
});
/** A grip: six dots, the handle that moves the pause slate. */
var GripIcon = (p) => /* @__PURE__ */ jsxs(Base, {
	...p,
	fill: "currentColor",
	stroke: "none",
	children: [
		/* @__PURE__ */ jsx("circle", {
			cx: "9",
			cy: "6",
			r: "1.6"
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: "15",
			cy: "6",
			r: "1.6"
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: "9",
			cy: "12",
			r: "1.6"
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: "15",
			cy: "12",
			r: "1.6"
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: "9",
			cy: "18",
			r: "1.6"
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: "15",
			cy: "18",
			r: "1.6"
		})
	]
});
/** Clear Frame: four corner markers around an empty frame. */
var FrameIcon = (p) => /* @__PURE__ */ jsxs(Base, {
	...p,
	children: [
		/* @__PURE__ */ jsx("path", { d: "M4 9V6a2 2 0 0 1 2-2h3" }),
		/* @__PURE__ */ jsx("path", { d: "M15 4h3a2 2 0 0 1 2 2v3" }),
		/* @__PURE__ */ jsx("path", { d: "M20 15v3a2 2 0 0 1-2 2h-3" }),
		/* @__PURE__ */ jsx("path", { d: "M9 20H6a2 2 0 0 1-2-2v-3" })
	]
});
var ReturnIcon = (p) => /* @__PURE__ */ jsxs(Base, {
	...p,
	children: [/* @__PURE__ */ jsx("path", { d: "M9 14 4 9l5-5" }), /* @__PURE__ */ jsx("path", { d: "M4 9h10a6 6 0 0 1 0 12h-3" })]
});
var HelpIcon = (p) => /* @__PURE__ */ jsxs(Base, {
	...p,
	children: [
		/* @__PURE__ */ jsx("circle", {
			cx: "12",
			cy: "12",
			r: "9"
		}),
		/* @__PURE__ */ jsx("path", { d: "M9.6 9.4a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.2 1-1.2 1.8" }),
		/* @__PURE__ */ jsx("path", { d: "M12 17h.01" })
	]
});
var PulseIcon = (p) => /* @__PURE__ */ jsx(Base, {
	...p,
	children: /* @__PURE__ */ jsx("path", { d: "M3 12h4l2.5-6 4 12 2.5-6H21" })
});
var CompassIcon = (p) => /* @__PURE__ */ jsxs(Base, {
	...p,
	children: [/* @__PURE__ */ jsx("circle", {
		cx: "12",
		cy: "12",
		r: "9"
	}), /* @__PURE__ */ jsx("path", { d: "m15.5 8.5-2 5-5 2 2-5 5-2Z" })]
});
var ScrimIcon = (p) => /* @__PURE__ */ jsxs(Base, {
	...p,
	children: [/* @__PURE__ */ jsx("circle", {
		cx: "12",
		cy: "12",
		r: "9"
	}), /* @__PURE__ */ jsx("path", {
		d: "M12 3a9 9 0 0 1 0 18V3Z",
		fill: "currentColor",
		stroke: "none"
	})]
});
var CloseIcon = (p) => /* @__PURE__ */ jsx(Base, {
	...p,
	children: /* @__PURE__ */ jsx("path", { d: "m6 6 12 12M18 6 6 18" })
});
var TrashIcon = (p) => /* @__PURE__ */ jsx(Base, {
	...p,
	children: /* @__PURE__ */ jsx("path", { d: "M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3" })
});
var PaletteIcon = (p) => /* @__PURE__ */ jsxs(Base, {
	...p,
	children: [
		/* @__PURE__ */ jsx("path", { d: "M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-1.4-1.3-1.6-1.3-2.9 0-1 .8-1.7 1.9-1.7H17a4 4 0 0 0 4-4C21 6.4 17 3 12 3Z" }),
		/* @__PURE__ */ jsx("circle", {
			cx: "7.5",
			cy: "11",
			r: "1",
			fill: "currentColor",
			stroke: "none"
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: "10",
			cy: "7",
			r: "1",
			fill: "currentColor",
			stroke: "none"
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: "15",
			cy: "7.5",
			r: "1",
			fill: "currentColor",
			stroke: "none"
		})
	]
});
var CastIcon = (p) => /* @__PURE__ */ jsxs(Base, {
	...p,
	children: [
		/* @__PURE__ */ jsx("path", { d: "M3 8V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" }),
		/* @__PURE__ */ jsx("path", { d: "M3 12a8 8 0 0 1 8 8M3 16a4 4 0 0 1 4 4" }),
		/* @__PURE__ */ jsx("path", { d: "M3 20h.01" })
	]
});
var ClipIcon = (p) => /* @__PURE__ */ jsxs(Base, {
	...p,
	children: [
		/* @__PURE__ */ jsx("circle", {
			cx: "6",
			cy: "6",
			r: "2.5"
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: "6",
			cy: "18",
			r: "2.5"
		}),
		/* @__PURE__ */ jsx("path", { d: "M8 7.5 20 17M8 16.5 20 7" })
	]
});
var MoreIcon = (p) => /* @__PURE__ */ jsxs(Base, {
	...p,
	children: [
		/* @__PURE__ */ jsx("circle", {
			cx: "5",
			cy: "12",
			r: "1.2",
			fill: "currentColor"
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: "12",
			cy: "12",
			r: "1.2",
			fill: "currentColor"
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: "19",
			cy: "12",
			r: "1.2",
			fill: "currentColor"
		})
	]
});
var ChevronLeftIcon = (p) => /* @__PURE__ */ jsx(Base, {
	...p,
	children: /* @__PURE__ */ jsx("path", { d: "m15 5-7 7 7 7" })
});
/** Time Lens: a loupe over a strip of frames. */
var LensIcon = (p) => /* @__PURE__ */ jsxs(Base, {
	...p,
	children: [
		/* @__PURE__ */ jsx("rect", {
			x: "2.5",
			y: "5",
			width: "13",
			height: "9",
			rx: "1.5"
		}),
		/* @__PURE__ */ jsx("path", { d: "M6.5 5v9M11.5 5v9" }),
		/* @__PURE__ */ jsx("circle", {
			cx: "16.5",
			cy: "15.5",
			r: "4"
		}),
		/* @__PURE__ */ jsx("path", { d: "m19.5 18.5 2.5 2.5" })
	]
});
/** Scene dial. `angle` (degrees, 0 = top) points the needle at the current position in the film. */
var DialIcon = ({ angle = 0, ...p }) => /* @__PURE__ */ jsxs(Base, {
	...p,
	children: [
		/* @__PURE__ */ jsx("circle", {
			cx: "12",
			cy: "12",
			r: "9"
		}),
		/* @__PURE__ */ jsx("path", { d: "M12 3v2M21 12h-2M12 21v-2M3 12h2" }),
		/* @__PURE__ */ jsx("path", {
			d: "M12 12 12 6.5",
			transform: `rotate(${angle} 12 12)`,
			strokeWidth: "2.2"
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: "12",
			cy: "12",
			r: "1.4",
			fill: "currentColor",
			stroke: "none"
		})
	]
});
/** Film reel, for the navigation wheel. */
var ReelIcon = (p) => /* @__PURE__ */ jsxs(Base, {
	...p,
	children: [
		/* @__PURE__ */ jsx("circle", {
			cx: "12",
			cy: "12",
			r: "9"
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: "12",
			cy: "12",
			r: "1.6"
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: "12",
			cy: "7",
			r: "1.8"
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: "12",
			cy: "17",
			r: "1.8"
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: "7",
			cy: "12",
			r: "1.8"
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: "17",
			cy: "12",
			r: "1.8"
		})
	]
});
// ../player/src/skin/FloatingPanel.tsx
/**
* A non-modal floating panel anchored over the video. Moves focus in on open, closes on Escape
* or an outside press, and gives focus back. Keys typed inside never reach the player hotkeys
* (so Space on a button or arrows in a slider do not pause or seek the video).
*/
function FloatingPanel({ open, onClose, title, children, wide, returnFocusTo }) {
	const ref = useRef(null);
	const titleId = useId();
	const closeRef = useRef(onClose);
	closeRef.current = onClose;
	const returnRef = useRef(returnFocusTo);
	returnRef.current = returnFocusTo;
	useEffect(() => {
		const el = ref.current;
		if (!open || !el) return;
		el.focus({ preventScroll: true });
		const onKey = (e) => {
			e.stopPropagation();
			if (e.key === "Escape") {
				e.preventDefault();
				closeRef.current();
			}
		};
		const onPointerDown = (e) => {
			const t = e.target;
			if (!t || el.contains(t)) return;
			if (t instanceof Element && t.closest("[data-panel-toggle]")) return;
			closeRef.current();
		};
		const onDocKey = (e) => {
			if (e.key !== "Escape" || e.defaultPrevented || document.querySelector("dialog[open]")) return;
			closeRef.current();
		};
		el.addEventListener("keydown", onKey);
		document.addEventListener("keydown", onDocKey);
		document.addEventListener("pointerdown", onPointerDown, true);
		const opener = returnRef.current;
		return () => {
			el.removeEventListener("keydown", onKey);
			document.removeEventListener("keydown", onDocKey);
			document.removeEventListener("pointerdown", onPointerDown, true);
			if (opener && opener.isConnected) opener.focus({ preventScroll: true });
		};
	}, [open]);
	if (!open) return null;
	return /* @__PURE__ */ jsxs("div", {
		ref,
		className: "cs-panel",
		"data-wide": wide || void 0,
		role: "dialog",
		"aria-modal": "false",
		"aria-labelledby": titleId,
		tabIndex: -1,
		children: [/* @__PURE__ */ jsxs("header", {
			className: "cs-panel-head",
			children: [/* @__PURE__ */ jsx("h2", {
				id: titleId,
				children: title
			}), /* @__PURE__ */ jsx("button", {
				type: "button",
				className: "cs-icon-btn",
				onClick: onClose,
				"aria-label": `Close ${title}`,
				children: /* @__PURE__ */ jsx(CloseIcon, {})
			})]
		}), /* @__PURE__ */ jsx("div", {
			className: "cs-panel-body",
			children
		})]
	});
}
// ../player/src/skin/ClipPanel.tsx
var EMPTY_CLIP = {
	start: null,
	end: null,
	loop: false
};
/**
* Marks a time range, loops it, and shares its timestamps. It does NOT cut or export a video file.
*/
function ClipPanel({ open, onClose, returnFocusTo, clip, onChange, onPlay, onAnnounce, onShare }) {
	const media = useMedia();
	const duration = usePlayer((s) => s.duration);
	const now = () => Math.min(media?.currentTime ?? 0, duration > 0 ? duration : Infinity);
	const complete = clip.start !== null && clip.end !== null && clip.end > clip.start;
	const setStart = (t) => {
		onChange({
			...clip,
			start: t,
			end: clip.end !== null && clip.end <= t ? null : clip.end
		});
		onAnnounce(`Clip start ${formatTime(t)}`);
	};
	const setEnd = (t) => {
		if (clip.start !== null && t <= clip.start) {
			onAnnounce("The end must be after the start");
			return;
		}
		onChange({
			...clip,
			end: t
		});
		onAnnounce(`Clip end ${formatTime(t)}`);
	};
	const copyTimes = async () => {
		if (!complete) return;
		const text = `${formatTime(clip.start ?? 0)}–${formatTime(clip.end ?? 0)}`;
		try {
			await navigator.clipboard.writeText(text);
			onAnnounce(`Copied ${text}`);
		} catch {
			onAnnounce(`Clip ${text}`);
		}
	};
	return /* @__PURE__ */ jsxs(FloatingPanel, {
		open,
		onClose,
		title: "Clip",
		returnFocusTo,
		children: [/* @__PURE__ */ jsx("p", {
			className: "cs-muted",
			children: "Mark a range to loop it or share its timestamps. This does not create a video file."
		}), /* @__PURE__ */ jsxs("div", {
			className: "cs-card cs-clip",
			children: [
				/* @__PURE__ */ jsx(TimeField, {
					label: "Start",
					value: clip.start,
					max: duration,
					onCommit: setStart,
					onNow: () => setStart(now())
				}),
				/* @__PURE__ */ jsx(TimeField, {
					label: "End",
					value: clip.end,
					max: duration,
					onCommit: setEnd,
					onNow: () => setEnd(now())
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "cs-chips",
					children: [
						/* @__PURE__ */ jsx("button", {
							type: "button",
							className: "cs-chip",
							"aria-pressed": clip.loop,
							onClick: () => onChange({
								...clip,
								loop: !clip.loop
							}),
							disabled: !complete,
							children: "Loop clip"
						}),
						/* @__PURE__ */ jsx("button", {
							type: "button",
							className: "cs-chip",
							onClick: onPlay,
							disabled: !complete,
							children: "Play clip"
						}),
						/* @__PURE__ */ jsx("button", {
							type: "button",
							className: "cs-chip",
							onClick: () => void copyTimes(),
							disabled: !complete,
							children: "Copy times"
						}),
						onShare ? /* @__PURE__ */ jsx("button", {
							type: "button",
							className: "cs-chip",
							onClick: () => onShare(clip.start ?? 0, clip.end ?? 0),
							disabled: !complete,
							children: "Copy share link"
						}) : null,
						/* @__PURE__ */ jsx("button", {
							type: "button",
							className: "cs-chip",
							onClick: () => onChange(EMPTY_CLIP),
							disabled: clip.start === null && clip.end === null,
							children: "Clear"
						})
					]
				}),
				complete ? /* @__PURE__ */ jsxs("p", {
					className: "cs-muted",
					role: "status",
					children: [
						"Clip: ",
						formatTime(clip.start ?? 0),
						" to ",
						formatTime(clip.end ?? 0),
						" (",
						formatTime((clip.end ?? 0) - (clip.start ?? 0)),
						" long)"
					]
				}) : /* @__PURE__ */ jsx("p", {
					className: "cs-muted",
					children: "Set a start and an end to enable looping and sharing."
				})
			]
		})]
	});
}
function TimeField({ label, value, max, onCommit, onNow }) {
	const [text, setText] = useState(value === null ? "" : formatTime(value));
	const [bad, setBad] = useState(false);
	useEffect(() => {
		setText(value === null ? "" : formatTime(value));
		setBad(false);
	}, [value]);
	const commit = () => {
		if (text.trim() === "") return;
		const t = parseTimeInput(text);
		if (t === null || max > 0 && t > max) {
			setBad(true);
			return;
		}
		setBad(false);
		onCommit(t);
	};
	const inputRef = useRef(null);
	const commitRef = useRef(commit);
	commitRef.current = commit;
	useEffect(() => {
		const el = inputRef.current;
		if (!el) return;
		const onKey = (e) => {
			if (e.key === "Enter") commitRef.current();
		};
		el.addEventListener("keydown", onKey);
		return () => el.removeEventListener("keydown", onKey);
	}, []);
	return /* @__PURE__ */ jsxs("div", {
		className: "cs-timefield",
		children: [
			/* @__PURE__ */ jsxs("label", { children: [label, /* @__PURE__ */ jsx("input", {
				ref: inputRef,
				value: text,
				inputMode: "numeric",
				placeholder: "m:ss",
				"aria-invalid": bad || void 0,
				onChange: (e) => setText(e.target.value),
				onBlur: commit
			})] }),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "cs-chip",
				onClick: onNow,
				children: "Set to now"
			}),
			bad ? /* @__PURE__ */ jsx("span", {
				className: "cs-form-msg",
				"data-kind": "error",
				role: "alert",
				children: "Use m:ss, within the video length."
			}) : null
		]
	});
}
// ../player/src/skin/ModalDialog.tsx
/**
* Accessible modal built on the native <dialog>: showModal() gives a real focus trap,
* makes the rest of the page inert, and closes on Escape. We additionally restore focus
* to whatever opened it, and stop key events from reaching the player's hotkeys.
*/
function ModalDialog({ open, onClose, title, children, className }) {
	const ref = useRef(null);
	const opener = useRef(null);
	const titleId = useId();
	useEffect(() => {
		const dialog = ref.current;
		if (!dialog) return;
		if (open && !dialog.open) {
			opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
			dialog.showModal();
		} else if (!open && dialog.open) dialog.close();
	}, [open]);
	useEffect(() => {
		const dialog = ref.current;
		if (!dialog) return;
		const stop = (e) => {
			e.stopPropagation();
		};
		const handleClose = () => {
			onClose();
			const target = opener.current;
			if (target && target.isConnected) target.focus();
		};
		dialog.addEventListener("keydown", stop);
		dialog.addEventListener("close", handleClose);
		return () => {
			dialog.removeEventListener("keydown", stop);
			dialog.removeEventListener("close", handleClose);
		};
	}, [onClose]);
	return /* @__PURE__ */ jsx("dialog", {
		ref,
		className: `cs-dialog ${className ?? ""}`,
		"aria-labelledby": titleId,
		"aria-modal": "true",
		onClick: (e) => {
			if (e.target === e.currentTarget) onClose();
		},
		children: /* @__PURE__ */ jsxs("div", {
			className: "cs-dialog-inner",
			children: [/* @__PURE__ */ jsxs("header", {
				className: "cs-dialog-header",
				children: [/* @__PURE__ */ jsx("h2", {
					id: titleId,
					children: title
				}), /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "cs-icon-btn",
					onClick: onClose,
					"aria-label": "Close dialog",
					children: /* @__PURE__ */ jsx(CloseIcon, {})
				})]
			}), /* @__PURE__ */ jsx("div", {
				className: "cs-dialog-body",
				tabIndex: 0,
				role: "group",
				"aria-labelledby": titleId,
				children: open ? children : null
			})]
		})
	});
}
// ../player/src/skin/DiagnosticsDialog.tsx
/**
* "Player Health": reads real player state. It reports what it can observe and says so when
* it cannot. It does not, and cannot, certify WCAG compliance.
*/
function DiagnosticsDialog({ open, onClose, extraRows = [] }) {
	return /* @__PURE__ */ jsx(ModalDialog, {
		open,
		onClose,
		title: "Player health",
		children: /* @__PURE__ */ jsx(DiagnosticsBody, { extraRows })
	});
}
function DiagnosticsBody({ extraRows }) {
	const error = usePlayer((s) => s.error);
	const canPlay = usePlayer((s) => s.canPlay);
	const currentSrc = usePlayer((s) => s.currentSrc);
	const duration = usePlayer((s) => s.duration);
	const rate = usePlayer((s) => s.playbackRate);
	const tracks = usePlayer((s) => s.textTrackList);
	const media = useMedia();
	const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
	const forced = typeof window !== "undefined" && window.matchMedia?.("(forced-colors: active)").matches === true;
	const width = media?.videoWidth ?? 0;
	const height = media?.videoHeight ?? 0;
	const rows = [
		{
			label: "Video.js",
			status: "Pass",
			detail: `@videojs/react ${VERSION}`
		},
		{
			label: "Media source",
			status: currentSrc ? "Pass" : "Unavailable",
			detail: currentSrc || "No source loaded yet"
		},
		{
			label: "Playback error",
			status: error ? "Needs review" : "Pass",
			detail: error ? `Code ${error.code}: ${error.message}` : "No media error reported"
		},
		{
			label: "Ready to play",
			status: canPlay ? "Pass" : "Needs review",
			detail: canPlay ? "Enough data is loaded to start" : "Still loading, or the source failed"
		},
		{
			label: "Duration",
			status: duration > 0 ? "Pass" : "Unavailable",
			detail: duration > 0 ? formatTime(duration) : "Not known yet (metadata not loaded)"
		},
		{
			label: "Video dimensions",
			status: width > 0 ? "Pass" : "Unavailable",
			detail: width > 0 ? `${width} × ${height} pixels decoded` : "Not reported by the media element"
		},
		{
			label: "Playback speed",
			status: "Pass",
			detail: `${rate}×`
		},
		{
			label: "Text tracks",
			status: tracks.length > 0 ? "Pass" : "Unavailable",
			detail: tracks.length > 0 ? `${tracks.length} track${tracks.length === 1 ? "" : "s"} on this media` : "This film has no captions, subtitles or chapters track"
		},
		{
			label: "Reduced motion",
			status: "Pass",
			detail: reduced ? "Requested by your system: spin and zoom effects are off" : "Not requested"
		},
		{
			label: "Forced colors",
			status: "Pass",
			detail: forced ? "Active: system colors are used for controls" : "Not active"
		},
		...extraRows
	];
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("ul", {
		className: "cs-diag-list",
		children: rows.map((r) => /* @__PURE__ */ jsxs("li", {
			className: "cs-diag-row",
			"data-status": r.status,
			children: [
				/* @__PURE__ */ jsx("span", {
					className: "cs-diag-label",
					children: r.label
				}),
				/* @__PURE__ */ jsx("span", {
					className: "cs-diag-status",
					children: r.status
				}),
				/* @__PURE__ */ jsx("span", {
					className: "cs-diag-detail",
					children: r.detail
				})
			]
		}, r.label))
	}), /* @__PURE__ */ jsx("p", {
		className: "cs-muted",
		children: "These are live readings from the player, not a compliance certificate. Keyboard and screen reader behavior still needs manual testing."
	})] });
}
// ../player/src/skin/scenes.ts
/** Index of the scene containing `time`, or -1 before the first scene / when there are none. */
function sceneIndexAt(scenes, time) {
	for (let i = scenes.length - 1; i >= 0; i--) {
		const s = scenes[i];
		if (s && time >= s.start) return i;
	}
	return -1;
}
/** "Chapter" or "Section", so labels stay honest about where scene data came from. */
var sceneKind = (scenes) => scenes.some((s) => s.authored) ? "Chapter" : "Section";
var isPrint = (v) => Array.isArray(v) && v.length === 24 && v.every((c) => c === null || typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c)) ? v : null;
/** Average colour of a small still, or null when the host does not allow its pixels to be read. */
function sample(src, signal) {
	return new Promise((resolve) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.decoding = "async";
		const done = (v) => {
			signal.removeEventListener("abort", abort);
			resolve(v);
		};
		const abort = () => {
			img.src = "";
			done(null);
		};
		signal.addEventListener("abort", abort);
		img.onload = () => {
			try {
				const c = document.createElement("canvas");
				c.width = 6;
				c.height = 4;
				const ctx = c.getContext("2d", { willReadFrequently: true });
				if (!ctx) return done(null);
				ctx.drawImage(img, 0, 0, 6, 4);
				const d = ctx.getImageData(0, 0, 6, 4).data;
				let r = 0;
				let g = 0;
				let b = 0;
				for (let i = 0; i < d.length; i += 4) {
					r += d[i] ?? 0;
					g += d[i + 1] ?? 0;
					b += d[i + 2] ?? 0;
				}
				const n = d.length / 4;
				done("#" + [
					r,
					g,
					b
				].map((v) => Math.round(v / n).toString(16).padStart(2, "0")).join(""));
			} catch {
				done(null);
			}
		};
		img.onerror = () => done(null);
		img.src = src;
	});
}
/**
* Filmprint: the film's colour fingerprint, read once from real stills (thumbnail metadata or a permitted frame
* service) and cached per video in localStorage. It is not continuous video analysis: 24 small images, sampled
* after the player has settled, four at a time. When the stills cannot be read, it returns null and the timeline
* stays an ordinary working timeline.
*/
function useFilmprint(key, thumbnailAt, duration) {
	const storageKey = key ? `filmprint:${key}` : null;
	const [print, setPrint] = useState(() => storageKey ? readJSON(storageKey, isPrint, null) : null);
	useEffect(() => {
		if (!storageKey || !thumbnailAt || !(duration > 0)) {
			setPrint(null);
			return;
		}
		const cached = readJSON(storageKey, isPrint, null);
		if (cached) {
			setPrint(cached);
			return;
		}
		setPrint(null);
		const ctrl = new AbortController();
		const start = window.setTimeout(async () => {
			const times = Array.from({ length: 24 }, (_, i) => Math.floor((i + .5) / 24 * duration));
			const out = new Array(24).fill(null);
			let next = 0;
			const worker = async () => {
				while (next < times.length && !ctrl.signal.aborted) {
					const i = next++;
					const src = thumbnailAt(times[i], 330);
					out[i] = src ? await sample(src, ctrl.signal) : null;
				}
			};
			await Promise.all([
				worker(),
				worker(),
				worker(),
				worker()
			]);
			if (ctrl.signal.aborted) return;
			if (out.filter(Boolean).length >= 12) {
				writeJSON(storageKey, out);
				setPrint(out);
			}
		}, 1500);
		return () => {
			ctrl.abort();
			window.clearTimeout(start);
		};
	}, [
		storageKey,
		thumbnailAt,
		duration
	]);
	return print;
}
/** A gradient that blends from one sample to the next; gaps (unreadable stills) borrow their neighbour. */
function filmprintGradient(print) {
	const filled = print.map((c, i) => c ?? print.slice(0, i).reverse().find(Boolean) ?? print.slice(i).find(Boolean) ?? "#000000");
	return `linear-gradient(90deg, ${filled.map((c, i) => `${c} ${((i + .5) / filled.length * 100).toFixed(2)}%`).join(", ")})`;
}
// ../player/src/skin/dock/Timeline.tsx
/**
* Precision filmstrip timeline. A real Video.js TimeSlider (keyboard, ARIA and seeking are native) dressed as a
* measured strip: one graduation per minute of runtime, scene boundaries as cuts, saved moments as lavender bars
* and the Return Anchor as a diamond. Hovering shows a real still near that second; it never seeks.
*/
function Timeline({ markers, clip, scenes, thumbnailAt, scenePreview, lensOpen, tether = null, filmprintKey }) {
	const duration = usePlayer((s) => s.duration);
	const nowPct = usePlayer((s) => s.duration > 0 ? Math.round(s.currentTime / s.duration * 400) / 4 : 0);
	const print = useFilmprint(filmprintKey, thumbnailAt, duration);
	const ref = useRef(null);
	const [hover, setHover] = useState(null);
	const [badImage, setBadImage] = useState(null);
	const time = hover !== null ? hover * duration : 0;
	let info = null;
	if (hover !== null) {
		if (scenePreview) info = scenePreview(time);
		else {
			const s = scenes[sceneIndexAt(scenes, time)];
			info = {
				image: thumbnailAt ? thumbnailAt(Math.floor(time / 5) * 5, 330) : null,
				label: s?.title
			};
		}
	}
	const image = info?.image && info.image !== badImage ? info.image : null;
	const motion = useStripMotion(nowPct, duration, scenes, filmprintKey, ref);
	const unit = duration > 3600 ? 300 : 60;
	const graduation = duration > unit ? `${unit / duration * 100}%` : null;
	const all = [...scenes.filter((s) => s.start > 0).map((s) => ({
		time: s.start,
		kind: "scene",
		label: s.title
	})), ...markers.filter((m) => m.kind !== "scene" || !scenes.length)];
	return /* @__PURE__ */ jsxs("div", {
		ref,
		className: "cs-tl",
		"data-filmprint": print ? "" : void 0,
		"data-develop": motion.developing ? "" : void 0,
		style: graduation ? { ["--tl-unit"]: graduation } : void 0,
		onPointerMove: (e) => {
			const r = ref.current?.getBoundingClientRect();
			if (r && r.width > 0 && duration > 0) setHover(clamp((e.clientX - r.left) / r.width, 0, 1));
		},
		onPointerLeave: () => setHover(null),
		onPointerCancel: () => setHover(null),
		children: [hover !== null && duration > 0 && !lensOpen ? /* @__PURE__ */ jsxs("div", {
			className: "cs-tl-preview",
			"aria-hidden": "true",
			"data-image": image ? "" : void 0,
			style: { ["--x"]: `${hover * 100}%` },
			children: [image ? /* @__PURE__ */ jsx("img", {
				src: image,
				alt: "",
				draggable: false,
				onError: () => setBadImage(image)
			}) : null, /* @__PURE__ */ jsxs("span", {
				className: "cs-tl-meta",
				children: [info?.label ? /* @__PURE__ */ jsx("span", {
					className: "cs-tl-label",
					children: info.label
				}) : null, /* @__PURE__ */ jsx("span", {
					className: "cs-tl-time",
					children: formatTime(time)
				})]
			})]
		}) : null, /* @__PURE__ */ jsxs(TimeSlider.Root, {
			className: "cs-timeslider",
			children: [
				/* @__PURE__ */ jsxs(TimeSlider.Track, {
					className: "cs-track",
					children: [
						print ? /* @__PURE__ */ jsx("span", {
							className: "cs-filmprint",
							"aria-hidden": "true",
							style: { backgroundImage: filmprintGradient(print) }
						}) : null,
						graduation ? /* @__PURE__ */ jsx("span", {
							className: "cs-graduation",
							"aria-hidden": "true"
						}) : null,
						tether !== null && duration > 0 ? /* @__PURE__ */ jsx("span", {
							className: "cs-tether-band",
							"aria-hidden": "true",
							style: {
								left: `${Math.min(nowPct, clamp(tether / duration * 100, 0, 100))}%`,
								width: `${Math.abs(nowPct - clamp(tether / duration * 100, 0, 100))}%`
							}
						}) : null,
						/* @__PURE__ */ jsx(TimeSlider.Buffer, { className: "cs-buffer" }),
						/* @__PURE__ */ jsx(TimeSlider.Fill, { className: "cs-fill" }),
						motion.streak ? /* @__PURE__ */ jsx("span", {
							className: "cs-streak",
							"aria-hidden": "true",
							"data-dir": motion.streak.to >= motion.streak.from ? "forward" : "back",
							style: {
								left: `${Math.min(motion.streak.from, motion.streak.to)}%`,
								width: `${Math.abs(motion.streak.to - motion.streak.from)}%`
							},
							onAnimationEnd: motion.clearStreak
						}, motion.streak.n) : null,
						motion.splice ? /* @__PURE__ */ jsx("span", {
							className: "cs-splice",
							"aria-hidden": "true",
							style: { left: `${motion.splice.at}%` },
							onAnimationEnd: motion.clearSplice
						}, motion.splice.n) : null
					]
				}),
				/* @__PURE__ */ jsx(Markers, {
					markers: all,
					clip,
					duration
				}),
				/* @__PURE__ */ jsx(TimeSlider.Thumb, { className: "cs-thumb" })
			]
		})]
	});
}
function Markers({ markers, clip, duration }) {
	if (!(duration > 0)) return null;
	const pct = (t) => `${clamp(t / duration * 100, 0, 100)}%`;
	return /* @__PURE__ */ jsxs(Fragment, { children: [clip.start !== null && clip.end !== null && clip.end > clip.start ? /* @__PURE__ */ jsx("span", {
		className: "cs-clip-range",
		"aria-hidden": "true",
		style: {
			left: pct(clip.start),
			width: `${clamp((clip.end - clip.start) / duration * 100, 0, 100)}%`
		}
	}) : null, markers.map((m, i) => /* @__PURE__ */ jsx("span", {
		className: "cs-marker",
		"data-kind": m.kind,
		style: {
			left: pct(m.time),
			["--i"]: i
		},
		"aria-hidden": "true"
	}, `${m.kind}-${m.time}-${i}`))] });
}
/**
* The strip's motion, all driven by real events and each played once:
* - Develop: when a film arrives, the strip exposes left to right and its scene cuts appear in turn.
* - Projector streak: a jump (seek, scene, moment, Time Lens) runs a beam of light from where you were to where you land.
* - Splice light: while playing, each scene cut lights as the playhead passes through it.
* Dragging the thumb draws no streak: the viewer is already watching the playhead move. The CSS switches it all off
* under reduced motion.
*/
function useStripMotion(nowPct, duration, scenes, filmKey, root) {
	const prev = useRef(null);
	const seq = useRef(0);
	const [streak, setStreak] = useState(null);
	const [splice, setSplice] = useState(null);
	const [developing, setDeveloping] = useState(false);
	const ready = duration > 0;
	useEffect(() => {
		if (!ready) return;
		prev.current = null;
		setDeveloping(true);
		const id = window.setTimeout(() => setDeveloping(false), 1100);
		return () => window.clearTimeout(id);
	}, [ready, filmKey]);
	useEffect(() => {
		const before = prev.current;
		prev.current = nowPct;
		if (before === null || !ready) return;
		const step = nowPct - before;
		const dragging = !!root.current?.querySelector(".cs-timeslider[data-dragging]");
		if (Math.abs(step) >= 1.5) {
			if (!dragging) setStreak({
				n: ++seq.current,
				from: before,
				to: nowPct
			});
			return;
		}
		if (step > 0) {
			const cut = scenes.find((s) => s.start > 0 && s.start / duration * 100 > before && s.start / duration * 100 <= nowPct);
			if (cut) setSplice({
				n: ++seq.current,
				at: cut.start / duration * 100
			});
		}
	}, [
		nowPct,
		ready,
		duration,
		scenes,
		root
	]);
	return {
		streak,
		splice,
		developing,
		clearStreak: () => setStreak(null),
		clearSplice: () => setSplice(null)
	};
}
// ../player/src/skin/dock/TimeLens.tsx
var SPANS = [
	{
		seconds: 120,
		label: "2 min"
	},
	{
		seconds: 40,
		label: "40 s"
	},
	{
		seconds: 12,
		label: "12 s"
	}
];
var FRAMES = 9;
/**
* Time Lens: the timeline opened up into a precision filmstrip. Moving the lens never seeks; the viewer inspects a
* moment (stills from the film itself, timestamps, scene cuts, saved moments) and explicitly chooses Jump.
* Without thumbnails it still works as a fine-grained timecode ruler.
*/
function TimeLens({ onClose, returnFocusTo, scenes, thumbnailAt, markers, onJump }) {
	const duration = usePlayer((s) => s.duration);
	const now = usePlayer((s) => Math.floor(s.currentTime));
	const [target, setTargetState] = useState(() => now);
	const [spanIdx, setSpanIdx] = useState(1);
	const [badImages, setBadImages] = useState(() => /* @__PURE__ */ new Set());
	const rootRef = useRef(null);
	const stripRef = useRef(null);
	const titleId = useId();
	const max = Math.max(0, Math.floor(duration));
	const setTarget = (t) => setTargetState(clamp(Math.round(t), 0, max));
	const span = Math.max(1, Math.min(SPANS[spanIdx]?.seconds ?? 40, max || 40));
	const step = span / FRAMES;
	const windowStart = clamp(Math.floor((target - span / 2) / step) * step, 0, Math.max(0, max - span));
	const pos = (t) => clamp((t - windowStart) / span * 100, 0, 100);
	const inWindow = (t) => t >= windowStart && t <= windowStart + span;
	const latest = useRef({
		target,
		step,
		span,
		max,
		windowStart
	});
	latest.current = {
		target,
		step,
		span,
		max,
		windowStart
	};
	const jumpRef = useRef(() => {});
	jumpRef.current = () => onJump(target, "the Time Lens position");
	const closeRef = useRef(onClose);
	closeRef.current = onClose;
	const opener = useRef(returnFocusTo);
	useEffect(() => {
		stripRef.current?.focus({ preventScroll: true });
		const back = opener.current;
		return () => {
			if (back && back.isConnected) back.focus({ preventScroll: true });
		};
	}, []);
	useEffect(() => {
		const root = rootRef.current;
		const strip = stripRef.current;
		if (!root || !strip) return;
		const onRootKey = (e) => {
			if (e.key === "Escape") {
				e.preventDefault();
				e.stopPropagation();
				closeRef.current();
				return;
			}
			if (e.target instanceof HTMLButtonElement && (e.key === " " || e.key === "Enter")) e.stopPropagation();
		};
		const onStripKey = (e) => {
			const { target: t, step: st, span: sp, max: mx } = latest.current;
			let next = null;
			switch (e.key) {
				case "ArrowLeft":
					next = t - (e.shiftKey ? 1 : Math.max(1, Math.round(st)));
					break;
				case "ArrowRight":
					next = t + (e.shiftKey ? 1 : Math.max(1, Math.round(st)));
					break;
				case "PageUp":
					next = t - sp;
					break;
				case "PageDown":
					next = t + sp;
					break;
				case "Home":
					next = 0;
					break;
				case "End":
					next = mx;
					break;
				case "ArrowUp":
					setSpanIdx((i) => Math.min(SPANS.length - 1, i + 1));
					break;
				case "ArrowDown":
					setSpanIdx((i) => Math.max(0, i - 1));
					break;
				case "Enter":
					jumpRef.current();
					break;
				default: return;
			}
			e.preventDefault();
			e.stopPropagation();
			if (next !== null) setTargetState(clamp(Math.round(next), 0, mx));
		};
		let acc = 0;
		const onWheel = (e) => {
			e.preventDefault();
			acc += e.deltaY + e.deltaX;
			if (Math.abs(acc) >= 40) {
				const { target: t, step: st, max: mx } = latest.current;
				setTargetState(clamp(Math.round(t + Math.sign(acc) * Math.max(1, Math.round(st))), 0, mx));
				acc = 0;
			}
		};
		root.addEventListener("keydown", onRootKey);
		strip.addEventListener("keydown", onStripKey);
		strip.addEventListener("wheel", onWheel, { passive: false });
		return () => {
			root.removeEventListener("keydown", onRootKey);
			strip.removeEventListener("keydown", onStripKey);
			strip.removeEventListener("wheel", onWheel);
		};
	}, []);
	const aimFromPointer = (clientX) => {
		const r = (stripRef.current?.querySelector(".cs-lens-frames"))?.getBoundingClientRect();
		if (!r || r.width <= 0) return;
		const { windowStart: ws, span: sp } = latest.current;
		setTarget(ws + clamp((clientX - r.left) / r.width, 0, 1) * sp);
	};
	const scene = scenes[sceneIndexAt(scenes, target)];
	const delta = target - now;
	const loupe = thumbnailAt ? thumbnailAt(target, 500) : null;
	const frames = Array.from({ length: FRAMES }, (_, i) => {
		const t0 = windowStart + i * step;
		const mid = Math.min(max, Math.round(t0 + step / 2));
		return {
			i,
			t0,
			mid,
			src: thumbnailAt ? thumbnailAt(mid, 330) : null,
			on: target >= t0 && target < t0 + step
		};
	});
	const cuts = scenes.filter((s) => s.start > windowStart && s.start < windowStart + span);
	const pins = markers.filter((m) => m.kind !== "scene" && inWindow(m.time));
	const failed = (src) => src ? badImages.has(src) : true;
	const markFailed = (src) => setBadImages((s) => new Set(s).add(src));
	return /* @__PURE__ */ jsxs("div", {
		ref: rootRef,
		className: "cs-lens",
		role: "dialog",
		"aria-modal": "false",
		"aria-labelledby": titleId,
		"data-interactive": true,
		children: [/* @__PURE__ */ jsxs("div", {
			className: "cs-lens-loupe",
			"aria-hidden": "true",
			children: [loupe && !failed(loupe) ? /* @__PURE__ */ jsx("img", {
				src: loupe,
				alt: "",
				draggable: false,
				onError: () => markFailed(loupe)
			}, loupe) : /* @__PURE__ */ jsx("span", {
				className: "cs-lens-loupe-fallback",
				children: formatTime(target)
			}), /* @__PURE__ */ jsx("span", { className: "cs-lens-reticle" })]
		}), /* @__PURE__ */ jsxs("div", {
			className: "cs-lens-main",
			children: [
				/* @__PURE__ */ jsxs("header", {
					className: "cs-lens-head",
					children: [
						/* @__PURE__ */ jsx("h2", {
							id: titleId,
							className: "cs-lens-title",
							children: "Time Lens"
						}),
						/* @__PURE__ */ jsx("strong", {
							className: "cs-lens-time",
							"aria-live": "polite",
							children: formatTime(target)
						}),
						scene ? /* @__PURE__ */ jsx("span", {
							className: "cs-lens-scene",
							children: scene.title
						}) : null,
						/* @__PURE__ */ jsx("span", {
							className: "cs-lens-delta",
							children: Math.abs(delta) < 1 ? "at the playhead" : `${delta > 0 ? "+" : "−"}${formatTime(Math.abs(delta))} from the playhead`
						}),
						/* @__PURE__ */ jsx("div", {
							className: "cs-lens-zoom",
							role: "group",
							"aria-label": "Lens span",
							children: SPANS.map((s, i) => /* @__PURE__ */ jsx("button", {
								type: "button",
								className: "cs-lens-chip",
								"aria-pressed": spanIdx === i,
								onClick: () => setSpanIdx(i),
								children: s.label
							}, s.label))
						}),
						/* @__PURE__ */ jsx("button", {
							type: "button",
							className: "cs-icon-btn cs-lens-close",
							onClick: onClose,
							"aria-label": "Close Time Lens",
							children: /* @__PURE__ */ jsx(CloseIcon, {})
						})
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					ref: stripRef,
					className: "cs-lens-strip",
					role: "slider",
					tabIndex: 0,
					"aria-label": "Time Lens position. Arrow keys move, Shift for one second, Up and Down zoom, Enter jumps.",
					"aria-valuemin": 0,
					"aria-valuemax": max,
					"aria-valuenow": target,
					"aria-valuetext": `${speakTime(target)}${scene ? `, ${scene.title}` : ""}`,
					onPointerDown: (e) => {
						if (e.button !== 0) return;
						e.currentTarget.setPointerCapture?.(e.pointerId);
						aimFromPointer(e.clientX);
					},
					onPointerMove: (e) => {
						if (e.buttons & 1) aimFromPointer(e.clientX);
					},
					children: [/* @__PURE__ */ jsx("ol", {
						className: "cs-lens-frames",
						"aria-hidden": "true",
						children: frames.map((f) => /* @__PURE__ */ jsxs("li", {
							className: "cs-lens-frame",
							"data-on": f.on || void 0,
							children: [f.src && !failed(f.src) ? /* @__PURE__ */ jsx("img", {
								src: f.src,
								alt: "",
								loading: "lazy",
								decoding: "async",
								draggable: false,
								onError: () => markFailed(f.src)
							}) : /* @__PURE__ */ jsx("span", { className: "cs-lens-frame-fallback" }), /* @__PURE__ */ jsx("span", {
								className: "cs-lens-frame-time",
								children: formatTime(f.mid)
							})]
						}, `${f.t0}`))
					}), /* @__PURE__ */ jsxs("div", {
						className: "cs-lens-overlay",
						"aria-hidden": "true",
						children: [
							cuts.map((c) => /* @__PURE__ */ jsx("span", {
								className: "cs-lens-cut",
								style: { left: `${pos(c.start)}%` },
								children: /* @__PURE__ */ jsx("span", { children: c.title })
							}, c.start)),
							pins.map((m, i) => /* @__PURE__ */ jsx("span", {
								className: "cs-lens-pin",
								"data-kind": m.kind,
								style: { left: `${pos(m.time)}%` }
							}, `${m.kind}-${m.time}-${i}`)),
							inWindow(now) ? /* @__PURE__ */ jsx("span", {
								className: "cs-lens-playhead",
								style: { left: `${pos(now)}%` }
							}) : null,
							/* @__PURE__ */ jsx("span", {
								className: "cs-lens-needle",
								style: { left: `${pos(target)}%` }
							})
						]
					})]
				}),
				/* @__PURE__ */ jsxs("footer", {
					className: "cs-lens-actions",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "cs-lens-nudge",
							role: "group",
							"aria-label": "Fine adjustment",
							children: [
								-5,
								-1,
								1,
								5
							].map((d) => /* @__PURE__ */ jsxs("button", {
								type: "button",
								className: "cs-lens-chip",
								onClick: () => setTarget(target + d),
								"aria-label": `Move the lens ${d < 0 ? "back" : "forward"} ${Math.abs(d)} second${Math.abs(d) === 1 ? "" : "s"}`,
								children: [d > 0 ? `+${d}` : `−${-d}`, " s"]
							}, d))
						}),
						/* @__PURE__ */ jsxs("button", {
							type: "button",
							className: "cs-lens-chip",
							onClick: () => setTarget(now),
							disabled: Math.abs(delta) < 1,
							children: [/* @__PURE__ */ jsx(ReturnIcon, { "aria-hidden": "true" }), " To playhead"]
						}),
						/* @__PURE__ */ jsxs("button", {
							type: "button",
							className: "cs-lens-jump",
							onClick: () => jumpRef.current(),
							disabled: Math.abs(delta) < 1,
							children: ["Jump to ", formatTime(target)]
						})
					]
				})
			]
		})]
	});
}
// ../player/src/skin/dock/PlaybackPod.tsx
var STEP = 10;
function PlayGlyph(p) {
	return /* @__PURE__ */ jsx("svg", {
		viewBox: "0 0 24 24",
		"aria-hidden": "true",
		focusable: "false",
		...p,
		children: /* @__PURE__ */ jsx("path", {
			d: "M8.6 5.4c0-.9 1-1.5 1.8-1l9.2 5.9c.8.5.8 1.6 0 2.1l-9.2 5.9c-.8.5-1.8-.1-1.8-1Z",
			fill: "currentColor"
		})
	});
}
function PauseGlyph(p) {
	return /* @__PURE__ */ jsxs("svg", {
		viewBox: "0 0 24 24",
		"aria-hidden": "true",
		focusable: "false",
		...p,
		children: [/* @__PURE__ */ jsx("rect", {
			x: "6.4",
			y: "5",
			width: "3.9",
			height: "14",
			rx: "1.3",
			fill: "currentColor"
		}), /* @__PURE__ */ jsx("rect", {
			x: "13.7",
			y: "5",
			width: "3.9",
			height: "14",
			rx: "1.3",
			fill: "currentColor"
		})]
	});
}
function ReplayGlyph(p) {
	return /* @__PURE__ */ jsxs("svg", {
		viewBox: "0 0 24 24",
		"aria-hidden": "true",
		focusable: "false",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2.2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		...p,
		children: [/* @__PURE__ */ jsx("path", { d: "M5.2 9.5a7.5 7.5 0 1 1 .3 6" }), /* @__PURE__ */ jsx("path", { d: "M4.6 4.8v4.9h4.9" })]
	});
}
/** A circular arrow, open at the top. Mirrored for forward, so the pair is symmetrical. */
function SeekGlyph({ side }) {
	return /* @__PURE__ */ jsx("svg", {
		className: "cs-pod-arc",
		viewBox: "0 0 32 32",
		"aria-hidden": "true",
		focusable: "false",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: /* @__PURE__ */ jsxs("g", {
			transform: side === "forward" ? "matrix(-1 0 0 1 32 0)" : void 0,
			children: [/* @__PURE__ */ jsx("path", { d: "M16 5.5a10.5 10.5 0 1 1-9.4 5.8" }), /* @__PURE__ */ jsx("path", { d: "M18.6 2.6 15.7 5.5l2.9 2.9" })]
		})
	});
}
/**
* XENON Precision Playback Pod: one horizontal capsule in three parts. Rewind 10 s, a dominant Play/Pause ring,
* Forward 10 s. Every part is a real Video.js button (PlayButton, SeekButton), so seeking, clamping to the start
* and end, playback state, hotkeys and screen-reader labels stay Video.js's own.
*
* Feedback is CSS on top of those buttons and never in the way of them: the original handler always runs first.
*   Play     a single sweep of light through the ring, and the icon turns into Pause.
*   Pause    a clean icon change; the ring keeps a restrained outline in the film's colour.
*   Seek     the arrow nudges in its direction and a "−10 s" / "+10 s" chip confirms it ("Start" or "End" when
*            the seek was clamped there).
* Under reduced motion the icon swaps and the chip simply appears; nothing moves.
*
* Rendered exactly once: over the picture in the Floating layout, inside the dock in Compact and Expanded.
*/
function PlaybackPod({ placement }) {
	const media = useMedia();
	const ended = usePlayer((s) => s.ended);
	const paused = usePlayer((s) => s.paused);
	const buffering = usePlayer((s) => s.waiting && !s.paused);
	const state = ended ? "ended" : paused ? "paused" : "playing";
	const [confirm, setConfirm] = useState(null);
	const timer = useRef(0);
	useEffect(() => () => window.clearTimeout(timer.current), []);
	/** What the seek will land on, read before Video.js seeks: the full step, or the clamp at either end. */
	const preview = (side) => {
		const t = media?.currentTime ?? 0;
		const d = media && Number.isFinite(media.duration) ? media.duration : Infinity;
		if (side === "back") return t - STEP <= .05 ? "Start" : `−${STEP} s`;
		return t + STEP >= d - .05 ? "End" : `+${STEP} s`;
	};
	const show = (side, text) => {
		setConfirm((c) => ({
			side,
			text,
			n: (c?.n ?? 0) + 1
		}));
		window.clearTimeout(timer.current);
		timer.current = window.setTimeout(() => setConfirm(null), 900);
	};
	/** Video.js activates on click (pointer), Enter (keydown) and Space (keyup). Wrap all three, never replace them. */
	const withFeedback = (side, props) => {
		const onClick = props.onClick;
		const onKeyDown = props.onKeyDown;
		const onKeyUp = props.onKeyUp;
		const enabled = (el) => el.getAttribute("aria-disabled") !== "true" && !el.disabled;
		return {
			onClick: (e) => {
				const text = preview(side);
				onClick?.(e);
				if (enabled(e.currentTarget)) show(side, text);
			},
			onKeyDown: (e) => {
				const text = preview(side);
				onKeyDown?.(e);
				if (e.key === "Enter" && e.target === e.currentTarget && enabled(e.currentTarget)) show(side, text);
			},
			onKeyUp: (e) => {
				const text = preview(side);
				onKeyUp?.(e);
				if (e.key === " " && e.target === e.currentTarget && enabled(e.currentTarget)) show(side, text);
			}
		};
	};
	const seek = (side) => /* @__PURE__ */ jsx(SeekButton, {
		seconds: side === "back" ? -10 : STEP,
		label: side === "back" ? `Rewind ${STEP} seconds` : `Forward ${STEP} seconds`,
		className: "cs-pod-btn cs-pod-seek",
		render: (props) => /* @__PURE__ */ jsx("button", {
			...props,
			...withFeedback(side, props),
			"data-side": side,
			"data-tip": side === "back" ? `Rewind ${STEP} s (J)` : `Forward ${STEP} s (L)`,
			"data-nudge": confirm?.side === side ? confirm.n % 2 : void 0,
			children: /* @__PURE__ */ jsxs("span", {
				className: "cs-pod-glyph",
				"aria-hidden": "true",
				children: [/* @__PURE__ */ jsx(SeekGlyph, { side }), /* @__PURE__ */ jsx("span", {
					className: "cs-pod-num",
					children: STEP
				})]
			})
		})
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "cs-pod",
		"data-placement": placement,
		"data-state": state,
		"data-buffering": buffering || void 0,
		role: "group",
		"aria-label": "Playback",
		children: [
			seek("back"),
			/* @__PURE__ */ jsx(PlayButton, {
				className: "cs-pod-btn cs-pod-play",
				render: (props, s) => /* @__PURE__ */ jsxs("button", {
					...props,
					"data-tip": s.ended || ended ? "Replay (K)" : s.paused ? "Play (K)" : "Pause (K)",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "cs-pod-ring",
							"aria-hidden": "true"
						}),
						/* @__PURE__ */ jsx("span", {
							className: "cs-pod-sweep",
							"aria-hidden": "true"
						}),
						/* @__PURE__ */ jsxs("span", {
							className: "cs-pod-icons",
							"aria-hidden": "true",
							children: [
								/* @__PURE__ */ jsx(PlayGlyph, { "data-icon": "play" }),
								/* @__PURE__ */ jsx(PauseGlyph, { "data-icon": "pause" }),
								/* @__PURE__ */ jsx(ReplayGlyph, { "data-icon": "replay" })
							]
						})
					]
				})
			}),
			seek("forward"),
			confirm ? /* @__PURE__ */ jsx("span", {
				className: "cs-pod-confirm",
				"data-side": confirm.side,
				"aria-hidden": "true",
				children: confirm.text
			}, confirm.n) : null
		]
	});
}
// ../player/src/skin/dock/SeekLens.tsx
/**
* The seek feedback for keys (J, L, the arrow keys) and double taps on either side of the picture: an "edge lens",
* a curved glow on the side the film moved towards, with the distance ("−10 s", "+20 s" for two quick presses) or
* "Start" / "End" when the seek was clamped there.
*
* It is Video.js's own SeekIndicator, which listens to the same input actions that do the seeking, so it shows
* exactly when a seek happened and never for the pod's buttons (they confirm on the pod itself). It is decorative:
* the status announcer already tells screen readers about the seek.
*/
function SeekLens() {
	const atStart = usePlayer((s) => s.currentTime <= .05);
	const atEnd = usePlayer((s) => s.duration > 0 && s.duration - s.currentTime <= .05);
	return /* @__PURE__ */ jsx(SeekIndicator.Root, {
		className: "cs-seeklens",
		render: (props, state) => {
			const back = state.direction === "backward";
			const text = back && atStart ? "Start" : state.direction === "forward" && atEnd ? "End" : state.seekTotal > 0 ? `${back ? "−" : "+"}${state.seekTotal} s` : state.currentTime;
			return /* @__PURE__ */ jsxs("div", {
				...props,
				"aria-hidden": "true",
				children: [/* @__PURE__ */ jsxs("span", {
					className: "cs-seeklens-arcs",
					children: [
						/* @__PURE__ */ jsx("i", {}),
						/* @__PURE__ */ jsx("i", {}),
						/* @__PURE__ */ jsx("i", {})
					]
				}), /* @__PURE__ */ jsx("span", {
					className: "cs-seeklens-text",
					children: text
				})]
			});
		}
	});
}
// ../player/src/skin/slate/frameColours.ts
var W$2 = 48;
var H$2 = 27;
/**
* Up to five dominant colours of an image or video frame, darkest first, or null when its pixels cannot be read
* (a cross-origin source without CORS headers taints the canvas). 4-bit buckets per channel; colours closer than
* a small distance to one already chosen are skipped, so the result describes the frame rather than one large area.
*/
function paletteOf(src) {
	try {
		const canvas = document.createElement("canvas");
		canvas.width = W$2;
		canvas.height = H$2;
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return null;
		ctx.drawImage(src, 0, 0, W$2, H$2);
		const d = ctx.getImageData(0, 0, W$2, H$2).data;
		const buckets = /* @__PURE__ */ new Map();
		for (let i = 0; i < d.length; i += 4) {
			const r = d[i] ?? 0;
			const g = d[i + 1] ?? 0;
			const b = d[i + 2] ?? 0;
			const key = r >> 4 << 8 | g >> 4 << 4 | b >> 4;
			const cell = buckets.get(key) ?? {
				n: 0,
				r: 0,
				g: 0,
				b: 0
			};
			cell.n += 1;
			cell.r += r;
			cell.g += g;
			cell.b += b;
			buckets.set(key, cell);
		}
		const ranked = [...buckets.values()].sort((a, b) => b.n - a.n).map((c) => [
			c.r / c.n,
			c.g / c.n,
			c.b / c.n
		]);
		const picked = [];
		for (const c of ranked) {
			if (picked.every((p) => Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) > 46)) picked.push(c);
			if (picked.length === 5) break;
		}
		if (picked.length === 0) return null;
		const lum = (c) => .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
		return picked.sort((a, b) => lum(a) - lum(b)).map((c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join(""));
	} catch {
		return null;
	}
}
function loadStill(url, signal) {
	return new Promise((resolve) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.decoding = "async";
		const stop = () => {
			img.src = "";
			resolve(null);
		};
		signal.addEventListener("abort", stop, { once: true });
		img.onload = () => {
			signal.removeEventListener("abort", stop);
			resolve(img);
		};
		img.onerror = () => {
			signal.removeEventListener("abort", stop);
			resolve(null);
		};
		img.src = url;
	});
}
/**
* The colours of the frame the viewer paused on. The paused video frame itself is read when its pixels are
* readable; otherwise a real still of the same second from the permitted frame service. Null until known, or when
* neither can be read: the caller then keeps the film's own palette.
*/
function useFrameColours(active, time, anchor, thumbnailAt) {
	const [colours, setColours] = useState(null);
	useEffect(() => {
		if (!active) return;
		const ctrl = new AbortController();
		const video = anchor.current?.closest(".cs-stage")?.querySelector("video") ?? null;
		const fromVideo = video && video.readyState >= 2 && video.videoWidth > 0 ? paletteOf(video) : null;
		if (fromVideo) {
			setColours(fromVideo);
			return;
		}
		const url = thumbnailAt?.(time, 330);
		if (!url) {
			setColours(null);
			return;
		}
		loadStill(url, ctrl.signal).then((img) => {
			if (!ctrl.signal.aborted) setColours(img ? paletteOf(img) : null);
		});
		return () => ctrl.abort();
	}, [
		active,
		time,
		anchor,
		thumbnailAt
	]);
	return active ? colours : null;
}
// ../player/src/skin/slate/SlateStick.tsx
/**
* The clapstick of the slate. Its stripes are painted with the colours of the frame (darkest first), or with the
* film's own palette until those are known. `tail` turns it upside down, the way a crew marks the end of a take.
*/
function SlateStick({ colours, tail = false }) {
	const style = colours ? Object.fromEntries(colours.map((c, i) => [`--sc${i + 1}`, c])) : void 0;
	return /* @__PURE__ */ jsx("div", {
		className: "cs-slate-stick",
		"data-tail": tail || void 0,
		"data-frame": colours ? "" : void 0,
		style,
		title: colours ? `Colours of this frame: ${colours.join(" ")}` : void 0,
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("span", { className: "cs-slate-hinge" })
	});
}
// ../player/src/skin/slate/TailSlate.tsx
/** The film after this one on the wheel that the viewer has not finished; else simply the next one. */
function nextFilm(films, activeId) {
	if (films.length < 2) return null;
	const at = Math.max(0, films.findIndex((f) => f.id === activeId));
	const order = films.slice(at + 1).concat(films.slice(0, at));
	return order.find((f) => (f.progress ?? 0) < .95) ?? order[0] ?? null;
}
/**
* The tail slate: the end of the film, marked the way a crew marks the end of a take, with the slate held upside
* down. It offers the next film on the wheel with an explicit Play (nothing starts by itself, no countdown) and
* the wheel for any other choice; Replay stays where it already is, on the pod. It takes no focus; its arrival is
* announced.
*/
function TailSlate({ title, films, activeFilmId, onPlayFilm, onOpenWheel, thumbnailAt, onAnnounce, tier, suppressed, cleared, onClear }) {
	const sectionRef = useRef(null);
	const ended = usePlayer((s) => s.ended);
	const duration = usePlayer((s) => s.duration);
	const [shown, setShown] = useState(false);
	const next = nextFilm(films, activeFilmId);
	const eligible = ended && tier !== "micro" && !suppressed && Boolean(next && onPlayFilm || onOpenWheel);
	useEffect(() => {
		if (!eligible) {
			setShown(false);
			return;
		}
		const t = window.setTimeout(() => setShown(true), 300);
		return () => window.clearTimeout(t);
	}, [eligible]);
	const visible = shown && !cleared;
	useEffect(() => {
		if (visible) onAnnounce(`End of ${title ?? "the film"}.${next ? ` Next on the wheel: ${next.title}.` : ""}`);
	}, [visible]);
	const colours = useFrameColours(visible, Math.max(0, Math.floor(duration) - 1), sectionRef, thumbnailAt);
	const [stillFailed, setStillFailed] = useState(false);
	useEffect(() => setStillFailed(false), [next?.id]);
	if (!visible) return null;
	return /* @__PURE__ */ jsx("section", {
		ref: sectionRef,
		className: "cs-pause cs-tail",
		"aria-label": `End of ${title ?? "the film"}`,
		"data-tier": tier,
		children: /* @__PURE__ */ jsxs("div", {
			className: "cs-slate",
			"data-tail": true,
			"data-interactive": true,
			children: [/* @__PURE__ */ jsxs("div", {
				className: "cs-slate-board",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "cs-slate-head",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "cs-pause-led",
								"aria-hidden": "true"
							}),
							/* @__PURE__ */ jsx("span", {
								className: "cs-slate-word",
								children: "End of reel"
							}),
							title ? /* @__PURE__ */ jsx("span", {
								className: "cs-slate-title",
								children: title
							}) : null,
							/* @__PURE__ */ jsx("button", {
								type: "button",
								className: "cs-pause-btn cs-pause-close",
								onClick: onClear,
								"aria-label": "Clear frame: hide the end-of-film information",
								"aria-keyshortcuts": "x",
								"data-tip": "Clear frame (X)",
								"data-tip-align": "end",
								children: /* @__PURE__ */ jsx(FrameIcon, {})
							})
						]
					}),
					next && onPlayFilm ? /* @__PURE__ */ jsxs("div", {
						className: "cs-tail-next",
						children: [/* @__PURE__ */ jsx("span", {
							className: "cs-tail-still",
							"aria-hidden": "true",
							children: next.image && !stillFailed ? /* @__PURE__ */ jsx("img", {
								src: next.image,
								alt: "",
								onError: () => setStillFailed(true)
							}) : /* @__PURE__ */ jsx(ReelIcon, {})
						}), /* @__PURE__ */ jsxs("span", {
							className: "cs-tail-text",
							children: [
								/* @__PURE__ */ jsx("span", {
									className: "cs-tail-kicker",
									children: "Next on the wheel"
								}),
								/* @__PURE__ */ jsx("span", {
									className: "cs-tail-title",
									children: next.title
								}),
								next.meta ? /* @__PURE__ */ jsx("span", {
									className: "cs-tail-meta",
									children: next.meta
								}) : null
							]
						})]
					}) : null,
					/* @__PURE__ */ jsxs("div", {
						className: "cs-tail-actions",
						children: [next && onPlayFilm ? /* @__PURE__ */ jsxs("button", {
							type: "button",
							className: "cs-chip cs-chip-primary cs-tail-play",
							onClick: () => onPlayFilm(next.id),
							children: [
								/* @__PURE__ */ jsx(PlayIcon, {
									"aria-hidden": "true",
									width: "14",
									height: "14"
								}),
								" Play ",
								next.title
							]
						}) : null, onOpenWheel && films.length > 1 ? /* @__PURE__ */ jsxs("button", {
							type: "button",
							className: "cs-chip",
							"data-nav-opener": true,
							onClick: (e) => onOpenWheel(e.currentTarget),
							children: [/* @__PURE__ */ jsx(ReelIcon, {
								"aria-hidden": "true",
								width: "14",
								height: "14"
							}), " Choose on the wheel"]
						}) : null]
					})
				]
			}), /* @__PURE__ */ jsx(SlateStick, {
				colours,
				tail: true
			})]
		})
	});
}
// ../player/src/skin/frame/PhotonFrame.tsx
var CORNERS = [
	"tl",
	"tr",
	"br",
	"bl"
];
/**
* XENON Photon Frame: the housing of the instrument. A thin machined rim follows the player's own radius, and four
* optical corner markers (a bracket on the rim and a small lens index inside it) carry the film's light.
*
* It is pure decoration drawn at the very edge: aria-hidden, no pointer events, nothing over the picture's
* content. Every state is CSS on attributes the skin already sets (data-playback, data-mode, :fullscreen) plus
* `flash`, so nothing animates continuously and no JavaScript runs per frame:
*   playing   minimal: a neutral rim, corners at rest
*   paused    the corners light in turn (a short pause-to-freeze pass) and stay softly lit
*   saved     a brief lavender pulse, the Moment Atlas colour, confirming the save
*   explore   the seam to the navigation wheel is lit; the wheel's coupler meets it
*   switching the frame's colours glide to the new film's palette
*   fullscreen the decoration steps aside for the picture
*/
function PhotonFrame({ flash }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "cs-photon",
		"aria-hidden": "true",
		"data-flash": flash > 0 ? flash % 2 ? "a" : "b" : void 0,
		children: [/* @__PURE__ */ jsx("span", { className: "cs-photon-rim" }), CORNERS.map((c) => /* @__PURE__ */ jsx("span", {
			className: "cs-photon-corner",
			"data-corner": c,
			children: /* @__PURE__ */ jsx("span", { className: "cs-photon-lens" })
		}, c))]
	});
}
// ../player/src/skin/frame/light.ts
var lin = (v) => {
	const c = v / 255;
	return c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4);
};
var luma = (r, g, b) => .2126 * lin(r) + .7152 * lin(g) + .0722 * lin(b);
var MID_GREY = Math.log2(.18);
var hex = (c) => "#" + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
/** Reads RGBA pixels of a `width`-wide frame. Null when there is nothing to read. */
function readPixels(data, width) {
	const rows = Math.floor(data.length / 4 / width);
	let n = 0;
	let logY = 0;
	let sr = 0;
	let sg = 0;
	let sb = 0;
	const buckets = /* @__PURE__ */ new Map();
	for (let y = 0; y < rows; y++) {
		let rowMax = 0;
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 4;
			rowMax = Math.max(rowMax, data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0);
		}
		if (rowMax < 12) continue;
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 4;
			const r = data[i] ?? 0;
			const g = data[i + 1] ?? 0;
			const b = data[i + 2] ?? 0;
			logY += Math.log2(luma(r, g, b) + 1e-4);
			sr += lin(r);
			sg += lin(g);
			sb += lin(b);
			n++;
			const key = r >> 4 << 8 | g >> 4 << 4 | b >> 4;
			const cell = buckets.get(key) ?? {
				n: 0,
				r: 0,
				g: 0,
				b: 0
			};
			cell.n++;
			cell.r += r;
			cell.g += g;
			cell.b += b;
			buckets.set(key, cell);
		}
	}
	if (n === 0) return null;
	const ev = logY / n - MID_GREY;
	const [R, G, B] = [
		sr / n,
		sg / n,
		sb / n
	];
	const X = .4124 * R + .3576 * G + .1805 * B;
	const Y = .2126 * R + .7152 * G + .0722 * B;
	const Z = .0193 * R + .1192 * G + .9505 * B;
	const sum = X + Y + Z || 1;
	const cx = X / sum;
	const cy = Y / sum;
	const m = (cx - .332) / (.1858 - cy);
	const kelvin = 449 * m ** 3 + 3525 * m ** 2 + 6823.3 * m + 5520.33;
	const ranked = [...buckets.values()].sort((a, b) => b.n - a.n).map((c) => [
		c.r / c.n,
		c.g / c.n,
		c.b / c.n
	]);
	const picked = [];
	for (const c of ranked) {
		if (picked.every((p) => Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) > 40)) picked.push(c);
		if (picked.length === 6) break;
	}
	const tones = picked.map((c) => ({
		c,
		ev: Math.log2(luma(c[0], c[1], c[2]) + 1e-4) - MID_GREY
	})).sort((a, b) => a.ev - b.ev);
	const sat = (c) => {
		const mx = Math.max(...c);
		return mx === 0 ? 0 : (mx - Math.min(...c)) / mx;
	};
	const bright = tones.slice(Math.floor(tones.length / 3));
	const key = (bright.length ? bright : tones).reduce((a, b) => sat(b.c) * (b.ev + 6) > sat(a.c) * (a.ev + 6) ? b : a).c;
	const top = Math.max(...key, 1);
	const lifted = key.map((v) => v / top * 255 * .78 + 56.1);
	return {
		ev,
		kelvin: Number.isFinite(kelvin) ? kelvin : 6500,
		tones: tones.map((t) => ({
			colour: hex(t.c),
			ev: t.ev
		})),
		light: hex(lifted)
	};
}
var W$1 = 48;
var H$1 = 27;
/** Reads the frame a <video> is showing. Null when its pixels cannot be read (no CORS) or it has no picture yet. */
function readFrame(video, canvas) {
	if (video.readyState < 2 || !video.videoWidth) return null;
	try {
		canvas.width = W$1;
		canvas.height = H$1;
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return null;
		ctx.drawImage(video, 0, 0, W$1, H$1);
		return readPixels(ctx.getImageData(0, 0, W$1, H$1).data, W$1);
	} catch {
		return null;
	}
}
/** A cut: the light changed enough that a viewer would see a new shot. */
function isCut(a, b) {
	const kRatio = Math.abs(Math.log(Math.max(1e3, b.kelvin) / Math.max(1e3, a.kelvin)));
	const hexRgb = (h) => [
		1,
		3,
		5
	].map((i) => parseInt(h.slice(i, i + 2), 16));
	const [p, q] = [hexRgb(a.light), hexRgb(b.light)];
	return Math.abs(b.ev - a.ev) >= .7 || kRatio >= .22 || Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) > 70;
}
var warmth = (k) => k < 4500 ? "Warm" : k > 6500 ? "Cool" : "Neutral";
var kelvinText = (k) => k >= 12e3 ? "12000+ K" : k <= 2e3 ? "2000− K" : `${Math.round(k / 100) * 100} K`;
var evText = (ev) => {
	const v = Math.round(ev * 10) / 10;
	return `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)} EV`;
};
/** The scale runs from −3 to +3 stops. */
var scalePos = (ev) => (Math.max(-3, Math.min(3, ev)) + 3) / 6;
/** The lens iris: wide open in a dark frame, stopped down in a bright one (1 … 0.35). */
var aperture$1 = (ev) => 1 - .65 * Math.max(0, Math.min(1, (ev + 3) / 4));
// ../player/src/skin/frame/Lightmeter.tsx
var STEP_MS = 1500;
var MARKS = [
	-3,
	-2,
	-1,
	0,
	1,
	2,
	3
];
/**
* XENON Lightmeter: a slim plate under the picture that reads the frame on screen, the way a cinematographer's
* meter would. The scale is painted with the frame's own tones, each where its brightness falls; the needle is the
* frame's key in stops; the reading adds its colour temperature.
*
* It also lights the Photon Frame: the corners take the frame's key light (--cs-light), the lens irises follow
* exposure (--pf-ap), and a cut sends one glint round the brackets (data-glint). These are written straight to the
* DOM, so a reading every 1.5 s re-renders only this plate.
*
* It reads a 48×27 copy of the frame every 1.5 s while playing, and once on pause, seek and load. Nothing runs while
* the tab is hidden. When a video's pixels cannot be read (no CORS), it says so instead of guessing.
*/
function Lightmeter({ mediaKey }) {
	const ref = useRef(null);
	const [reading, setReading] = useState("wait");
	const last = useRef(null);
	const newFilm = useRef(false);
	useEffect(() => {
		newFilm.current = true;
		last.current = null;
	}, [mediaKey]);
	useEffect(() => {
		const host = ref.current;
		const stage = host?.closest(".cs-stagewrap");
		const root = host?.closest(".cs-root");
		if (!host || !stage || !root) return;
		const canvas = document.createElement("canvas");
		let glints = 0;
		let glintTimer = 0;
		const still = () => root.dataset.motion === "reduce" || typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const glint = () => {
			const frame = root.querySelector(".cs-photon");
			if (!frame || still()) return;
			glints++;
			frame.setAttribute("data-glint", glints % 2 ? "a" : "b");
			window.clearTimeout(glintTimer);
			glintTimer = window.setTimeout(() => frame.removeAttribute("data-glint"), 1100);
		};
		const sample = () => {
			if (document.hidden) return;
			const video = stage.querySelector("video");
			if (!video || video.readyState < 2) return;
			const r = readFrame(video, canvas);
			if (!r) {
				if (video.videoWidth) {
					setReading(null);
					root.style.removeProperty("--cs-light");
					root.style.removeProperty("--pf-ap");
				}
				return;
			}
			const prev = last.current;
			last.current = r;
			setReading(r);
			root.style.setProperty("--cs-light", r.light);
			root.style.setProperty("--pf-ap", aperture$1(r.ev).toFixed(3));
			if (prev && isCut(prev, r) || newFilm.current) glint();
			newFilm.current = false;
		};
		const soon = () => requestAnimationFrame(sample);
		const timer = window.setInterval(() => {
			const video = stage.querySelector("video");
			if (video && !video.paused) sample();
		}, STEP_MS);
		const events = [
			"loadeddata",
			"seeked",
			"pause",
			"play"
		];
		events.forEach((e) => stage.addEventListener(e, soon, true));
		document.addEventListener("visibilitychange", soon);
		soon();
		return () => {
			window.clearInterval(timer);
			window.clearTimeout(glintTimer);
			events.forEach((e) => stage.removeEventListener(e, soon, true));
			document.removeEventListener("visibilitychange", soon);
			root.style.removeProperty("--cs-light");
			root.style.removeProperty("--pf-ap");
		};
	}, []);
	const r = reading === "wait" ? null : reading;
	const label = r ? `Light meter: ${evText(r.ev)}, ${warmth(r.kelvin).toLowerCase()}, ${kelvinText(r.kelvin)}` : reading === null ? "Light meter: this video does not allow its picture to be read" : "Light meter: waiting for the picture";
	const gradient = r && r.tones.length ? `linear-gradient(90deg, ${r.tones.map((t) => `${t.colour} ${(scalePos(t.ev) * 100).toFixed(1)}%`).join(", ")})` : void 0;
	return /* @__PURE__ */ jsx("div", {
		ref,
		className: "cs-plate",
		"data-reading": r ? "on" : reading === null ? "off" : "wait",
		children: /* @__PURE__ */ jsxs("div", {
			className: "cs-lm",
			role: "img",
			"aria-label": label,
			children: [
				/* @__PURE__ */ jsx("span", {
					className: "cs-lm-label",
					"aria-hidden": "true",
					children: "Light"
				}),
				/* @__PURE__ */ jsxs("span", {
					className: "cs-lm-gauge",
					"aria-hidden": "true",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "cs-lm-scale",
							style: gradient ? { backgroundImage: gradient } : void 0
						}),
						/* @__PURE__ */ jsx("span", { className: "cs-lm-ticks" }),
						/* @__PURE__ */ jsx("span", {
							className: "cs-lm-marks",
							children: MARKS.map((s) => /* @__PURE__ */ jsx("i", {
								style: { left: `${scalePos(s) * 100}%` },
								children: s > 0 ? `+${s}` : s < 0 ? `−${-s}` : "0"
							}, s))
						}),
						r ? /* @__PURE__ */ jsx("span", {
							className: "cs-lm-needle",
							style: { left: `${scalePos(r.ev) * 100}%` }
						}) : null
					]
				}),
				/* @__PURE__ */ jsx("span", {
					className: "cs-lm-read",
					"aria-hidden": "true",
					children: r ? /* @__PURE__ */ jsxs(Fragment, { children: [evText(r.ev), /* @__PURE__ */ jsxs("span", {
						className: "cs-lm-k",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "cs-lm-dot",
								children: " · "
							}),
							warmth(r.kelvin),
							" ",
							/* @__PURE__ */ jsx("span", {
								className: "cs-lm-dim",
								children: kelvinText(r.kelvin)
							})
						]
					})] }) : reading === null ? /* @__PURE__ */ jsx("span", {
						className: "cs-lm-dim",
						children: "No reading"
					}) : /* @__PURE__ */ jsx("span", {
						className: "cs-lm-dim",
						children: "Reading…"
					})
				})
			]
		})
	});
}
// ../player/src/skin/hooks.ts
/**
* Keydown handling for elements inside a FloatingPanel. Panels stop key events from reaching the player's
* hotkeys, which also hides them from React's root-level onKeyDown, so panel widgets attach a native listener
* (it fires at the target, before the panel's listener).
*/
function useNativeKeydown(ref, handler) {
	const latest = useRef(handler);
	latest.current = handler;
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const fn = (e) => latest.current(e);
		el.addEventListener("keydown", fn);
		return () => el.removeEventListener("keydown", fn);
	});
}
function tierForWidth(width) {
	return width >= 680 ? "full" : width >= 440 ? "compact" : width >= 340 ? "tiny" : "micro";
}
function useWidthTier(ref) {
	const [state, setState] = useState({
		tier: "full",
		width: 0
	});
	useLayoutEffect(() => {
		const el = ref.current;
		if (!el || typeof ResizeObserver === "undefined") return;
		const measure = () => {
			const width = Math.round(el.getBoundingClientRect().width);
			setState((prev) => {
				const tier = tierForWidth(width);
				return prev.tier === tier && prev.width === width ? prev : {
					tier,
					width
				};
			});
		};
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	}, [ref]);
	return state;
}
// ../player/src/skin/KeymapDialog.tsx
/** The single source of truth for bindings: the skin registers exactly these, the dialog lists exactly these. */
var SHORTCUT_GROUPS = [
	{
		title: "Playback",
		items: [
			{
				keys: ["Space", "K"],
				action: "Play or pause"
			},
			{
				keys: ["←", "J"],
				action: "Back 10 seconds"
			},
			{
				keys: ["→", "L"],
				action: "Forward 10 seconds"
			},
			{
				keys: ["F"],
				action: "Fullscreen"
			},
			{
				keys: ["I"],
				action: "Picture-in-picture (when supported)"
			},
			{
				keys: ["X"],
				action: "Clear frame: hide or show the pause information (when paused)"
			}
		]
	},
	{
		title: "Sound and captions",
		items: [
			{
				keys: ["M"],
				action: "Mute or unmute"
			},
			{
				keys: ["↑", "↓"],
				action: "Volume up or down"
			},
			{
				keys: ["C"],
				action: "Captions on or off (when a track exists)"
			}
		]
	},
	{
		title: "Navigation wheel",
		items: [
			{
				keys: ["W"],
				action: "Open or close the navigation wheel (films and scenes); focus it in Explore"
			},
			{
				keys: ["Tab"],
				action: "Move between the Movies / Scenes switch, the wheel and the card’s actions"
			},
			{
				keys: [
					"←",
					"→",
					"↑",
					"↓"
				],
				action: "Turn the wheel: the frame in the gate is described, nothing switches or seeks"
			},
			{
				keys: ["PgUp", "PgDn"],
				action: "Turn three frames at a time"
			},
			{
				keys: ["Home", "End"],
				action: "First or last film or scene"
			},
			{
				keys: ["Enter"],
				action: "Go to the card’s action; Enter again plays the film or jumps to the scene"
			},
			{
				keys: ["Esc"],
				action: "Close the navigation drawer"
			}
		]
	},
	{
		title: "Timeline, Time Tether and Journey",
		items: [{
			keys: ["T"],
			action: "Open the filmstrip (Time Lens); arrows aim it, Enter jumps"
		}, {
			keys: ["↑", "↓"],
			action: "Time Lens: zoom in or out"
		}]
	},
	{
		title: "Menus and dialogs",
		items: [
			{
				keys: ["?"],
				action: "Open this list"
			},
			{
				keys: ["Esc"],
				action: "Close a dialog, menu or panel and return focus"
			},
			{
				keys: ["←", "→"],
				action: "Switch settings categories (when a category tab has focus)"
			},
			{
				keys: [
					"Tab",
					"Shift",
					"+",
					"Tab"
				],
				action: "Move forward or back through controls"
			}
		]
	}
];
/** Flat list kept for anything that only needs the keys. */
var SHORTCUTS = SHORTCUT_GROUPS.flatMap((g) => g.items);
function KeymapDialog({ open, onClose }) {
	const [query, setQuery] = useState("");
	const q = query.trim().toLowerCase();
	const groups = SHORTCUT_GROUPS.map((g) => ({
		...g,
		items: g.items.filter((s) => !q || `${g.title} ${s.action} ${s.keys.join(" ")}`.toLowerCase().includes(q))
	})).filter((g) => g.items.length > 0);
	return /* @__PURE__ */ jsxs(ModalDialog, {
		open,
		onClose,
		title: "Keyboard shortcuts",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "cs-muted",
				children: "Shortcuts work while focus is inside the player. They pause while you type in a field, and a focused slider or the wheel uses its own arrow keys first."
			}),
			/* @__PURE__ */ jsxs("label", {
				className: "cs-search",
				children: [/* @__PURE__ */ jsx("span", {
					className: "cs-sr",
					children: "Search shortcuts"
				}), /* @__PURE__ */ jsx("input", {
					type: "search",
					value: query,
					onChange: (e) => setQuery(e.target.value),
					placeholder: "Search shortcuts, for example “mute”"
				})]
			}),
			/* @__PURE__ */ jsx("p", {
				className: "cs-sr",
				role: "status",
				children: q ? `${groups.reduce((n, g) => n + g.items.length, 0)} shortcuts match` : ""
			}),
			groups.length === 0 ? /* @__PURE__ */ jsxs("p", {
				className: "cs-empty",
				children: [
					"No shortcut matches “",
					query.trim(),
					"”."
				]
			}) : groups.map((g) => /* @__PURE__ */ jsxs("section", {
				className: "cs-keygroup",
				"aria-label": g.title,
				children: [/* @__PURE__ */ jsx("h3", {
					className: "cs-label",
					children: g.title
				}), /* @__PURE__ */ jsx("ul", {
					className: "cs-keylist",
					children: g.items.map((s) => /* @__PURE__ */ jsxs("li", {
						className: "cs-keyrow",
						children: [/* @__PURE__ */ jsx("span", {
							className: "cs-keys",
							children: s.keys.map((k, i) => /* @__PURE__ */ jsx("kbd", { children: k }, `${k}-${i}`))
						}), /* @__PURE__ */ jsx("span", { children: s.action })]
					}, s.action))
				})]
			}, g.title))
		]
	});
}
// ../player/src/skin/slate/movable.ts
var KEY = "slate-pos";
var GAP = 8;
var isPos = (v) => isRecord(v) && typeof v.x === "number" && typeof v.y === "number" && v.x >= 0 && v.x <= 1 && v.y >= 0 && v.y <= 1 ? {
	x: v.x,
	y: v.y
} : null;
/**
* Pure placement: clamps a slate box into the free area and, if it would sit on the Playback Pod, moves it to
* the nearest clear place (above or below the pod first, then beside it). Returns the stage-relative left/top.
*/
function settle(want, size, a) {
	const clampX = (x) => Math.min(Math.max(x, a.minLeft), Math.max(a.minLeft, a.maxLeft));
	const clampY = (y) => Math.min(Math.max(y, a.minTop), Math.max(a.minTop, a.maxTop));
	let left = clampX(want.left);
	let top = clampY(want.top);
	const p = a.pod;
	const hits = (l, t) => !!p && l < p.left + p.width + GAP && l + size.width > p.left - GAP && t < p.top + p.height + GAP && t + size.height > p.top - GAP;
	if (p && hits(left, top)) {
		const options = [
			{
				left,
				top: p.top - GAP - size.height
			},
			{
				left,
				top: p.top + p.height + GAP
			},
			{
				left: p.left - GAP - size.width,
				top
			},
			{
				left: p.left + p.width + GAP,
				top
			}
		].map((o) => ({
			left: clampX(o.left),
			top: clampY(o.top)
		})).filter((o) => !hits(o.left, o.top)).sort((m, n) => Math.hypot(m.left - left, m.top - top) - Math.hypot(n.left - left, n.top - top));
		if (options[0]) ({left, top} = options[0]);
	}
	return {
		left,
		top
	};
}
/**
* The movable Film Slate. Dragging its grip (mouse, pen or touch) moves it with a transform, so nothing re-renders
* while it moves; on release it settles clear of the top bar, the dock and the Playback Pod, and the position is
* saved. With the grip focused, the arrow keys move it (Shift: further) and Home puts it back where it started.
*/
function useMovableSlate(sectionRef, gripRef, visible) {
	const [pos, setPos] = useState(() => readJSON(KEY, isPos, null));
	const posRef = useRef(pos);
	posRef.current = pos;
	const measure = useCallback(() => {
		const section = sectionRef.current;
		const stage = section?.closest(".cs-stage");
		const slate = section?.querySelector(".cs-slate");
		if (!section || !stage || !slate) return null;
		const s = stage.getBoundingClientRect();
		const sl = slate.getBoundingClientRect();
		const rel = (r) => ({
			left: r.left - s.left,
			top: r.top - s.top,
			width: r.width,
			height: r.height
		});
		const top = stage.querySelector(".cs-top")?.getBoundingClientRect();
		const bottom = stage.querySelector(".cs-row")?.getBoundingClientRect();
		const pod = stage.querySelector(".cs-pod")?.getBoundingClientRect();
		const minTop = (top && top.height ? top.bottom - s.top : 0) + GAP;
		const floor = (bottom && bottom.height ? bottom.top - s.top : s.height) - GAP;
		return {
			a: {
				stageH: s.height,
				minLeft: GAP,
				maxLeft: s.width - sl.width - GAP,
				minTop,
				maxTop: floor - sl.height,
				pod: pod && pod.width ? rel(pod) : null
			},
			slate: rel(sl),
			stage: s
		};
	}, [sectionRef]);
	/** Puts the slate where `pos` says, anchored by its bottom edge so the scene list still opens upwards. */
	const place = useCallback(() => {
		const section = sectionRef.current;
		if (!section) return;
		const p = posRef.current;
		if (!p) {
			section.style.removeProperty("left");
			section.style.removeProperty("bottom");
			delete section.dataset.moved;
			return;
		}
		const m = measure();
		if (!m) return;
		const at = settle({
			left: m.a.minLeft + p.x * Math.max(0, m.a.maxLeft - m.a.minLeft),
			top: m.a.minTop + p.y * Math.max(0, m.a.maxTop - m.a.minTop)
		}, m.slate, m.a);
		section.style.left = `${at.left}px`;
		section.style.bottom = `${m.a.stageH - (at.top + m.slate.height)}px`;
		section.dataset.moved = "";
	}, [measure, sectionRef]);
	/** Settles a requested stage-relative top-left and saves it. */
	const commit = useCallback((want) => {
		const m = measure();
		if (!m) return;
		const at = settle(want, m.slate, m.a);
		const fx = m.a.maxLeft > m.a.minLeft ? (at.left - m.a.minLeft) / (m.a.maxLeft - m.a.minLeft) : 0;
		const fy = m.a.maxTop > m.a.minTop ? (at.top - m.a.minTop) / (m.a.maxTop - m.a.minTop) : 0;
		const next = {
			x: Math.min(1, Math.max(0, fx)),
			y: Math.min(1, Math.max(0, fy))
		};
		posRef.current = next;
		setPos(next);
		writeJSON(KEY, next);
		place();
	}, [measure, place]);
	const reset = useCallback(() => {
		posRef.current = null;
		setPos(null);
		writeJSON(KEY, null);
		place();
	}, [place]);
	useLayoutEffect(() => {
		if (visible) place();
	}, [
		visible,
		place,
		pos
	]);
	useEffect(() => {
		const section = sectionRef.current;
		const stage = section?.closest(".cs-stage");
		if (!visible || !section || !stage || typeof ResizeObserver === "undefined") return;
		const ro = new ResizeObserver(() => place());
		ro.observe(stage);
		return () => ro.disconnect();
	}, [
		visible,
		place,
		sectionRef
	]);
	useEffect(() => {
		const grip = gripRef.current;
		const section = sectionRef.current;
		if (!visible || !grip || !section) return;
		let start = null;
		const down = (e) => {
			if (e.pointerType === "mouse" && e.button !== 0) return;
			const m = measure();
			if (!m) return;
			e.preventDefault();
			grip.setPointerCapture(e.pointerId);
			start = {
				x: e.clientX,
				y: e.clientY,
				left: m.slate.left,
				top: m.slate.top
			};
			section.dataset.dragging = "";
		};
		const move = (e) => {
			if (!start) return;
			section.style.transform = `translate(${e.clientX - start.x}px, ${e.clientY - start.y}px)`;
		};
		const up = (e) => {
			if (!start) return;
			const s = start;
			start = null;
			section.style.removeProperty("transform");
			delete section.dataset.dragging;
			if (Math.hypot(e.clientX - s.x, e.clientY - s.y) < 3) return;
			commit({
				left: s.left + e.clientX - s.x,
				top: s.top + e.clientY - s.y
			});
		};
		const key = (e) => {
			const step = e.shiftKey ? 64 : 16;
			const d = {
				ArrowLeft: [-step, 0],
				ArrowRight: [step, 0],
				ArrowUp: [0, -step],
				ArrowDown: [0, step]
			};
			if (e.key === "Home") {
				e.preventDefault();
				e.stopPropagation();
				reset();
				return;
			}
			const v = d[e.key];
			if (!v) return;
			e.preventDefault();
			e.stopPropagation();
			const m = measure();
			if (m) commit({
				left: m.slate.left + v[0],
				top: m.slate.top + v[1]
			});
		};
		grip.addEventListener("pointerdown", down);
		grip.addEventListener("pointermove", move);
		grip.addEventListener("pointerup", up);
		grip.addEventListener("pointercancel", up);
		grip.addEventListener("keydown", key);
		grip.addEventListener("dblclick", reset);
		return () => {
			grip.removeEventListener("pointerdown", down);
			grip.removeEventListener("pointermove", move);
			grip.removeEventListener("pointerup", up);
			grip.removeEventListener("pointercancel", up);
			grip.removeEventListener("keydown", key);
			grip.removeEventListener("dblclick", reset);
		};
	}, [
		visible,
		gripRef,
		sectionRef,
		measure,
		commit,
		reset
	]);
	return {
		moved: pos !== null,
		reset
	};
}
// ../player/src/skin/PauseCanvas.tsx
/**
* The Film Slate: XENON's pause. Not a dimmed screen with a synopsis, but the clapperboard a film crew holds up to
* mark a moment. The frame keeps the stage; the slate sits low on the left with real data chalked on it (the film,
* the scene, the timecode, what is left), and its clapstick is painted with the colours of the very frame you
* paused on. It closes with a small clap as it appears.
*
* It is not a dialog: it takes no focus, and Space/K or the pod resumes. Neighbouring scenes appear only when asked
* for, and Clear Frame (its own button, or X) puts it away for this pause while the playback controls stay.
*/
function PauseCanvas({ title, subtitle, scenes, thumbnailAt, onSaveMoment, returnAnchor, onPreviewScene, tier, suppressed, cleared, onClear }) {
	const sectionRef = useRef(null);
	const gripRef = useRef(null);
	const paused = usePlayer((s) => s.paused);
	const ended = usePlayer((s) => s.ended);
	const canPlay = usePlayer((s) => s.canPlay);
	const error = usePlayer((s) => s.error);
	const seeking = usePlayer((s) => s.seeking);
	const now = usePlayer((s) => Math.floor(s.currentTime));
	const duration = usePlayer((s) => s.duration);
	const moreId = useId();
	const eligible = paused && !ended && canPlay && !error && !seeking && now >= 1 && tier !== "micro" && !suppressed;
	const [shown, setShown] = useState(false);
	const [more, setMore] = useState(false);
	useEffect(() => {
		if (!eligible) {
			setShown(false);
			return;
		}
		const t = window.setTimeout(() => setShown(true), 420);
		return () => window.clearTimeout(t);
	}, [eligible]);
	useEffect(() => {
		if (!paused) setMore(false);
	}, [paused]);
	const visible = shown && !cleared;
	const colours = useFrameColours(visible, now, sectionRef, thumbnailAt);
	useMovableSlate(sectionRef, gripRef, visible);
	if (!visible) return null;
	const idx = sceneIndexAt(scenes, now);
	const scene = scenes[idx];
	const prev = idx > 0 ? scenes[idx - 1] : void 0;
	const next = idx >= 0 && idx < scenes.length - 1 ? scenes[idx + 1] : idx < 0 ? scenes[0] : void 0;
	const kind = sceneKind(scenes);
	const roomy = tier === "full";
	const hasMore = roomy && Boolean(prev || next || scene?.description);
	const left = duration > 0 ? Math.max(0, duration - now) : null;
	return /* @__PURE__ */ jsxs("section", {
		ref: sectionRef,
		className: "cs-pause",
		"aria-label": `Paused${title ? `: ${title}` : ""}, ${formatTime(now)}`,
		"data-tier": tier,
		"data-more": more || void 0,
		children: [more && hasMore ? /* @__PURE__ */ jsxs("div", {
			id: moreId,
			className: "cs-pause-more",
			"data-interactive": true,
			role: "group",
			"aria-label": `${title ?? "This film"}: neighbouring ${kind.toLowerCase()}s`,
			children: [
				subtitle ? /* @__PURE__ */ jsx("p", {
					className: "cs-pause-sub",
					children: subtitle
				}) : null,
				scene?.description ? /* @__PURE__ */ jsxs("p", {
					className: "cs-pause-insight",
					children: [/* @__PURE__ */ jsx("span", {
						className: "cs-pause-label",
						children: "Scene insight"
					}), scene.description]
				}) : null,
				/* @__PURE__ */ jsxs("div", {
					className: "cs-pause-cards",
					children: [prev ? /* @__PURE__ */ jsx(Neighbour, {
						label: "Previous",
						scene: prev,
						thumbnailAt,
						onPreview: (el) => onPreviewScene(idx - 1, el)
					}) : null, next ? /* @__PURE__ */ jsx(Neighbour, {
						label: "Next",
						scene: next,
						thumbnailAt,
						onPreview: (el) => onPreviewScene(scenes.indexOf(next), el)
					}) : null]
				})
			]
		}) : null, /* @__PURE__ */ jsxs("div", {
			className: "cs-slate",
			"data-interactive": true,
			children: [/* @__PURE__ */ jsx(SlateStick, { colours }), /* @__PURE__ */ jsxs("div", {
				className: "cs-slate-board",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "cs-slate-head",
						children: [
							/* @__PURE__ */ jsx("button", {
								ref: gripRef,
								type: "button",
								className: "cs-slate-grip",
								"aria-label": "Move the pause slate. Drag, or use the arrow keys; Home puts it back",
								"aria-keyshortcuts": "ArrowLeft ArrowRight ArrowUp ArrowDown Home",
								"data-tip": "Drag to move · Home resets",
								"data-tip-pos": "below",
								children: /* @__PURE__ */ jsx(GripIcon, {})
							}),
							/* @__PURE__ */ jsx("span", {
								className: "cs-pause-led",
								"aria-hidden": "true"
							}),
							/* @__PURE__ */ jsx("span", {
								className: "cs-slate-word",
								children: "Paused"
							}),
							title ? /* @__PURE__ */ jsx("span", {
								className: "cs-slate-title",
								children: title
							}) : null,
							/* @__PURE__ */ jsx("button", {
								type: "button",
								className: "cs-pause-btn cs-pause-close",
								onClick: onClear,
								"aria-label": "Clear frame: hide the pause information",
								"aria-keyshortcuts": "x",
								"data-tip": "Clear frame (X)",
								"data-tip-align": "end",
								children: /* @__PURE__ */ jsx(FrameIcon, {})
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "cs-slate-row",
						children: [/* @__PURE__ */ jsxs("dl", {
							className: "cs-slate-fields",
							children: [
								scene ? /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", { children: kind }), /* @__PURE__ */ jsxs("dd", { children: [idx + 1, /* @__PURE__ */ jsxs("small", { children: ["/", scenes.length] })] })] }) : null,
								/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", { children: "Time" }), /* @__PURE__ */ jsx("dd", { children: formatTime(now) })] }),
								left !== null && roomy ? /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", { children: "Left" }), /* @__PURE__ */ jsx("dd", { children: formatTime(left) })] }) : null
							]
						}), /* @__PURE__ */ jsxs("div", {
							className: "cs-pause-tools",
							children: [
								hasMore ? /* @__PURE__ */ jsx("button", {
									type: "button",
									className: "cs-pause-btn",
									"aria-expanded": more,
									"aria-controls": moreId,
									onClick: () => setMore((m) => !m),
									children: more ? "Less" : `${kind}s`
								}) : null,
								roomy && onSaveMoment ? /* @__PURE__ */ jsx("button", {
									type: "button",
									className: "cs-pause-btn",
									onClick: onSaveMoment,
									"aria-label": "Save this moment",
									"data-tip": "Save moment",
									children: /* @__PURE__ */ jsx(BookmarkIcon, {})
								}) : null,
								returnAnchor ? /* @__PURE__ */ jsxs("button", {
									type: "button",
									className: "cs-pause-btn",
									onClick: returnAnchor.onReturn,
									"aria-label": `Back to where you were, ${formatTime(returnAnchor.time)}`,
									children: [
										/* @__PURE__ */ jsx(ReturnIcon, {}),
										" ",
										/* @__PURE__ */ jsx("span", { children: formatTime(returnAnchor.time) })
									]
								}) : null
							]
						})]
					}),
					scene?.authored ? /* @__PURE__ */ jsx("p", {
						className: "cs-slate-scene",
						children: scene.title
					}) : null
				]
			})]
		})]
	});
}
function Neighbour({ label, scene, thumbnailAt, onPreview }) {
	const [failed, setFailed] = useState(false);
	const src = thumbnailAt ? thumbnailAt(scene.start + 1, 330) : null;
	return /* @__PURE__ */ jsxs("button", {
		type: "button",
		className: "cs-pause-card",
		"data-nav-opener": true,
		onClick: (e) => onPreview(e.currentTarget),
		"aria-label": `${label} scene: ${scene.title}, ${formatTime(scene.start)}. Opens on the navigation wheel.`,
		children: [/* @__PURE__ */ jsx("span", {
			className: "cs-pause-still",
			"aria-hidden": "true",
			children: src && !failed ? /* @__PURE__ */ jsx("img", {
				src,
				alt: "",
				loading: "lazy",
				onError: () => setFailed(true)
			}) : /* @__PURE__ */ jsx("span", { children: formatTime(scene.start) })
		}), /* @__PURE__ */ jsxs("span", {
			className: "cs-pause-card-text",
			"aria-hidden": "true",
			children: [
				/* @__PURE__ */ jsx("span", {
					className: "cs-pause-label",
					children: label
				}),
				/* @__PURE__ */ jsx("span", {
					className: "cs-pause-card-title",
					children: scene.title
				}),
				/* @__PURE__ */ jsx("span", {
					className: "cs-pause-card-time",
					children: formatTime(scene.start)
				})
			]
		})]
	});
}
// ../player/src/skin/prefs/PrefsContext.tsx
var DOCK_LAYOUTS = [
	"floating",
	"compact",
	"expanded"
];
var DEFAULT_PREFS = {
	highContrast: false,
	largeControls: false,
	reducedMotion: false,
	dockLabels: true,
	dockCompact: false,
	dockLayout: "floating",
	pauseCanvas: true
};
var PROFILES = [
	{
		id: "standard",
		label: "Standard",
		description: "The default XENON look.",
		prefs: {}
	},
	{
		id: "high-contrast",
		label: "High contrast",
		description: "Solid control surfaces, strong borders and thick focus rings.",
		prefs: { highContrast: true }
	},
	{
		id: "large",
		label: "Large controls",
		description: "Bigger buttons, text and spacing for touch and low vision.",
		prefs: {
			largeControls: true,
			dockLabels: true
		}
	},
	{
		id: "reduced-motion",
		label: "Reduced motion",
		description: "No panel, wheel or background animation.",
		prefs: { reducedMotion: true }
	}
];
var parse = (v) => {
	if (!isRecord(v)) return null;
	const b = (x, d) => typeof x === "boolean" ? x : d;
	return {
		highContrast: b(v.highContrast, false),
		largeControls: b(v.largeControls, false),
		reducedMotion: b(v.reducedMotion, false),
		dockLabels: b(v.dockLabels, true),
		dockCompact: b(v.dockCompact, false),
		dockLayout: DOCK_LAYOUTS.find((l) => l === v.dockLayout) ?? "floating",
		pauseCanvas: b(v.pauseCanvas, true)
	};
};
/** Which preset the current settings match, or "custom" once the viewer has tweaked them. */
function activeProfile(p) {
	for (const profile of PROFILES) {
		const expected = {
			...DEFAULT_PREFS,
			...profile.prefs
		};
		if (expected.highContrast === p.highContrast && expected.largeControls === p.largeControls && expected.reducedMotion === p.reducedMotion && expected.dockLabels === p.dockLabels && expected.dockCompact === p.dockCompact) return profile.id;
	}
	return "custom";
}
var Ctx$1 = createContext(null);
function usePrefs() {
	const c = useContext(Ctx$1);
	if (!c) throw new Error("usePrefs must be used inside <CinemaSkin>");
	return c;
}
function PrefsProvider({ forceHighContrast, children }) {
	const [prefs, setPrefs] = useState(() => readJSON("view-prefs", parse, DEFAULT_PREFS));
	const commit = useCallback((next) => {
		setPrefs(next);
		writeJSON("view-prefs", next);
	}, []);
	const set = useCallback((patch) => commit({
		...prefs,
		...patch
	}), [prefs, commit]);
	const applyProfile = useCallback((id) => {
		const p = PROFILES.find((x) => x.id === id);
		if (p) commit({
			...DEFAULT_PREFS,
			dockLayout: prefs.dockLayout,
			pauseCanvas: prefs.pauseCanvas,
			...p.prefs
		});
	}, [
		commit,
		prefs.dockLayout,
		prefs.pauseCanvas
	]);
	const reset = useCallback(() => commit(DEFAULT_PREFS), [commit]);
	const value = useMemo(() => ({
		prefs,
		highContrast: prefs.highContrast || Boolean(forceHighContrast),
		set,
		applyProfile,
		reset,
		profile: activeProfile(prefs)
	}), [
		prefs,
		forceHighContrast,
		set,
		applyProfile,
		reset
	]);
	return /* @__PURE__ */ jsx(Ctx$1.Provider, {
		value,
		children
	});
}
// ../player/src/skin/ReelHandle.tsx
/**
* The reel handle: the outer edge of the navigation wheel, always present on the left of the picture in Watch
* mode so the instrument stays recognisable while you watch. It is a real button (Enter, Space or W opens the
* wheel) and shrinks to a sliver while the controls are idle, so it never sits over the film in earnest.
*/
function ReelHandle({ open, onToggle, artwork, controlsId, buttonRef }) {
	const [failed, setFailed] = useState(false);
	useEffect(() => setFailed(false), [artwork]);
	return /* @__PURE__ */ jsx("button", {
		ref: buttonRef,
		type: "button",
		className: "cs-reel",
		"aria-expanded": open,
		"aria-controls": controlsId,
		"aria-label": open ? "Close navigation" : "Open navigation: films and scenes",
		"data-tip": open ? "Close navigation (W)" : "Navigate (W)",
		"data-tip-pos": "right",
		onClick: (e) => onToggle(e.currentTarget),
		children: /* @__PURE__ */ jsxs("span", {
			className: "cs-reel-body",
			"aria-hidden": "true",
			children: [
				/* @__PURE__ */ jsx("span", {
					className: "cs-reel-window",
					children: artwork && !failed ? /* @__PURE__ */ jsx("img", {
						src: artwork,
						alt: "",
						draggable: false,
						onError: () => setFailed(true)
					}) : null
				}),
				/* @__PURE__ */ jsx("span", { className: "cs-reel-teeth" }),
				/* @__PURE__ */ jsx("span", { className: "cs-reel-led" })
			]
		})
	});
}
// ../player/src/skin/ui.tsx
/** A settings card: strong title, short description, then controls. */
function Card({ title, description, children, wide }) {
	return /* @__PURE__ */ jsxs("section", {
		className: "cs-card",
		"aria-label": title,
		"data-wide": wide || void 0,
		children: [/* @__PURE__ */ jsxs("header", {
			className: "cs-card-head",
			children: [/* @__PURE__ */ jsx("h3", {
				className: "cs-card-title",
				children: title
			}), description ? /* @__PURE__ */ jsx("p", {
				className: "cs-card-desc",
				children: description
			}) : null]
		}), children]
	});
}
/** Group of selection pills. Selected pills show a check mark as well as a colour, so colour is never the only cue. */
function Pills({ children, label }) {
	return /* @__PURE__ */ jsx("div", {
		className: "cs-chips",
		role: "group",
		"aria-label": label,
		children
	});
}
function Pill({ selected, onClick, children, disabled, label }) {
	return /* @__PURE__ */ jsx("button", {
		type: "button",
		className: "cs-chip",
		"aria-pressed": selected,
		"aria-label": label,
		disabled,
		onClick,
		children
	});
}
/** An on/off setting with a name and a one-line explanation. */
function SwitchRow({ label, description, checked, onChange, disabled }) {
	return /* @__PURE__ */ jsxs("button", {
		type: "button",
		role: "switch",
		"aria-checked": checked,
		disabled,
		className: "cs-switch",
		onClick: () => onChange(!checked),
		children: [
			/* @__PURE__ */ jsxs("span", {
				className: "cs-switch-text",
				children: [/* @__PURE__ */ jsx("strong", { children: label }), description ? /* @__PURE__ */ jsx("span", {
					className: "cs-card-desc",
					children: description
				}) : null]
			}),
			/* @__PURE__ */ jsx("span", {
				className: "cs-switch-track",
				"aria-hidden": "true",
				children: /* @__PURE__ */ jsx("span", { className: "cs-switch-knob" })
			}),
			/* @__PURE__ */ jsx("span", {
				className: "cs-sr",
				children: checked ? "On" : "Off"
			})
		]
	});
}
function Empty({ children }) {
	return /* @__PURE__ */ jsx("p", {
		className: "cs-empty",
		children
	});
}
// ../player/src/skin/appearance/AppearanceCards.tsx
var BACKGROUNDS = [
	{
		id: "solid",
		label: "Solid colour",
		desc: "One clean colour from the film’s palette fills the player, the page and the bars around the picture. No image, no gradient."
	},
	{
		id: "spectral",
		label: "Spectral gradient",
		desc: "The film’s four-colour gradient runs through the player and the page."
	},
	{
		id: "artwork",
		label: "Movie artwork",
		desc: "The film’s licensed still, blurred and tinted behind the interface. The video itself is never tinted."
	},
	{
		id: "custom",
		label: "Custom",
		desc: "Your own image or colour, kept in this browser only."
	}
];
var ACCENTS = [
	{
		id: "default",
		label: "Film"
	},
	{
		id: "citron",
		label: "Citron"
	},
	{
		id: "poster",
		label: "From artwork"
	},
	{
		id: "lavender",
		label: "Lavender"
	},
	{
		id: "teal",
		label: "Teal"
	},
	{
		id: "rose",
		label: "Rose"
	},
	{
		id: "custom",
		label: "Custom"
	}
];
var COLOR_SWATCHES = [
	{
		hex: "#1f3b57",
		name: "Deep blue"
	},
	{
		hex: "#2b4a3a",
		name: "Forest"
	},
	{
		hex: "#4a2b3f",
		name: "Plum"
	},
	{
		hex: "#5a3a1f",
		name: "Amber"
	},
	{
		hex: "#3a3f4a",
		name: "Slate"
	}
];
var AREAS = [
	{
		id: "header",
		label: "Header buttons"
	},
	{
		id: "wheel",
		label: "Wheel and side panels"
	},
	{
		id: "controls",
		label: "Control dock"
	}
];
var STYLES = [
	{
		id: "glass",
		label: "Glass"
	},
	{
		id: "solid",
		label: "Solid"
	},
	{
		id: "clear",
		label: "Clear"
	}
];
function Range({ label, value, min, max, unit, onChange }) {
	return /* @__PURE__ */ jsxs("label", {
		className: "cs-range",
		children: [/* @__PURE__ */ jsxs("span", { children: [
			label,
			": ",
			/* @__PURE__ */ jsxs("strong", { children: [value, unit] })
		] }), /* @__PURE__ */ jsx("input", {
			type: "range",
			min,
			max,
			step: 1,
			value,
			"aria-valuetext": `${value}${unit === "%" ? " percent" : unit === "°" ? " degrees" : " pixels"}`,
			onChange: (e) => onChange(Number(e.target.value))
		})]
	});
}
/** Adaptive movie atmosphere: the master switch and, when on, every control for it. */
function AppearanceCards() {
	const ap = useAppearance();
	const { appearance: a, derived } = ap;
	const fileRef = useRef(null);
	const [presetName, setPresetName] = useState("");
	const [msg, setMsg] = useState(null);
	const [hexText, setHexText] = useState(a.color);
	const [accentText, setAccentText] = useState(a.customAccent);
	const [panelText, setPanelText] = useState(a.panelColor ?? "#14161f");
	const film = ap.filmPalette;
	const bg = BACKGROUNDS.find((b) => b.id === a.background) ?? BACKGROUNDS[0];
	const showsImage = a.background === "artwork" || a.background === "custom" && a.source === "custom";
	const commitHex = (text, apply, fail) => {
		const rgb = parseHex(text);
		if (!rgb) return setMsg({
			kind: "error",
			text: fail
		});
		setMsg(null);
		apply(toHex(rgb));
	};
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsxs(Card, {
			title: "Theme",
			description: "Adaptive re-colours the whole player for each film. Fixed keeps one look for every film.",
			children: [/* @__PURE__ */ jsx(Pills, {
				label: "Theme",
				children: ["adaptive", "fixed"].map((t) => /* @__PURE__ */ jsx(Pill, {
					selected: a.theme === t,
					onClick: () => ap.update({ theme: t }),
					children: t === "adaptive" ? "Adaptive" : "Fixed"
				}, t))
			}), a.theme === "adaptive" && film ? /* @__PURE__ */ jsx("div", {
				className: "cs-palette",
				"aria-label": "This film's palette",
				children: [
					{
						name: "Surface",
						c: film.base
					},
					{
						name: "Accent",
						c: film.accent
					},
					{
						name: "Text",
						c: film.ink
					},
					{
						name: "Light",
						c: film.secondary
					}
				].filter((p) => Boolean(p.c)).map((p) => /* @__PURE__ */ jsxs("span", {
					className: "cs-palette-item",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "cs-swatch-dot cs-swatch-lg",
							style: { background: p.c },
							"aria-hidden": "true"
						}),
						p.name,
						" ",
						/* @__PURE__ */ jsx("code", { children: p.c })
					]
				}, p.name))
			}) : /* @__PURE__ */ jsx("p", {
				className: "cs-card-desc",
				children: a.theme === "fixed" ? "Fixed: XENON obsidian with your accent choice." : "This video has no signature palette; colours come from its artwork when it can be read."
			})]
		}),
		/* @__PURE__ */ jsxs(Card, {
			title: "Background",
			description: bg.desc,
			children: [
				/* @__PURE__ */ jsx(Pills, {
					label: "Background",
					children: BACKGROUNDS.map((b) => /* @__PURE__ */ jsx(Pill, {
						selected: a.background === b.id,
						onClick: () => ap.update({ background: b.id }),
						children: b.label
					}, b.id))
				}),
				a.background === "solid" ? /* @__PURE__ */ jsx("div", {
					className: "cs-palette",
					"aria-label": "Background colour",
					children: /* @__PURE__ */ jsxs("span", {
						className: "cs-palette-item",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "cs-swatch-dot cs-swatch-lg",
								style: { background: ap.resolved.base },
								"aria-hidden": "true"
							}),
							a.panelColor ? "Your panel colour" : film ? "This film’s colour" : "XENON obsidian",
							" ",
							/* @__PURE__ */ jsx("code", { children: ap.resolved.base })
						]
					})
				}) : null,
				a.background === "custom" ? /* @__PURE__ */ jsxs(Pills, {
					label: "Custom background",
					children: [/* @__PURE__ */ jsx(Pill, {
						selected: a.source === "color",
						onClick: () => ap.update({ source: "color" }),
						children: "Colour"
					}), /* @__PURE__ */ jsx(Pill, {
						selected: a.source === "custom",
						onClick: () => ap.update({ source: "custom" }),
						children: "Image"
					})]
				}) : null,
				a.background === "custom" && a.source === "color" ? /* @__PURE__ */ jsxs("div", {
					className: "cs-form",
					children: [/* @__PURE__ */ jsx(Pills, {
						label: "Colour swatches",
						children: COLOR_SWATCHES.map((c) => /* @__PURE__ */ jsxs(Pill, {
							selected: a.color.toLowerCase() === c.hex,
							onClick: () => {
								setHexText(c.hex);
								ap.update({ color: c.hex });
							},
							children: [
								/* @__PURE__ */ jsx("span", {
									className: "cs-swatch-dot",
									style: { background: c.hex },
									"aria-hidden": "true"
								}),
								" ",
								c.name
							]
						}, c.hex))
					}), /* @__PURE__ */ jsxs("label", { children: ["Colour (hex, for example #1f3b57)", /* @__PURE__ */ jsx("input", {
						value: hexText,
						maxLength: 7,
						onChange: (e) => {
							setHexText(e.target.value);
							const rgb = parseHex(e.target.value);
							if (rgb) {
								setMsg(null);
								ap.update({ color: toHex(rgb) });
							}
						},
						onBlur: () => commitHex(hexText, (h) => ap.update({ color: h }), "Use a hex colour like #1f3b57.")
					})] })]
				}) : null,
				a.background === "custom" && a.source === "custom" ? /* @__PURE__ */ jsxs("div", {
					className: "cs-form",
					children: [
						/* @__PURE__ */ jsxs(Pills, { children: [/* @__PURE__ */ jsx("button", {
							type: "button",
							className: "cs-chip",
							onClick: () => fileRef.current?.click(),
							children: "Choose image"
						}), a.customImage ? /* @__PURE__ */ jsx("button", {
							type: "button",
							className: "cs-chip",
							onClick: () => ap.update({ customImage: null }),
							children: "Remove image"
						}) : null] }),
						/* @__PURE__ */ jsx("input", {
							ref: fileRef,
							type: "file",
							accept: "image/*",
							className: "cs-sr",
							tabIndex: -1,
							"aria-label": "Background image file",
							onChange: async (e) => {
								const f = e.target.files?.[0];
								e.target.value = "";
								if (!f) return;
								const err = await ap.setCustomImageFromFile(f);
								setMsg(err ? {
									kind: "error",
									text: err
								} : {
									kind: "ok",
									text: "Image added. It is resized and kept in this browser only."
								});
							}
						}),
						!a.customImage ? /* @__PURE__ */ jsx(Empty, { children: "No image yet. Until you pick one, the film colour is used." }) : null
					]
				}) : null,
				a.enabled ? /* @__PURE__ */ jsx(Range, {
					label: a.background === "artwork" ? "Artwork opacity" : a.source === "color" ? "Colour strength" : "Image opacity",
					value: a.opacity,
					min: 0,
					max: 100,
					unit: "%",
					onChange: (v) => ap.update({ opacity: v })
				}) : null,
				showsImage ? /* @__PURE__ */ jsx(Range, {
					label: "Background blur",
					value: a.blur,
					min: 0,
					max: 60,
					unit: "px",
					onChange: (v) => ap.update({ blur: v })
				}) : null,
				a.enabled ? /* @__PURE__ */ jsx("p", {
					className: "cs-card-desc",
					children: "Backgrounds are always darkened enough for text to stay readable."
				}) : null
			]
		}),
		a.background !== "solid" ? /* @__PURE__ */ jsx(SpectralCard, {}) : null,
		/* @__PURE__ */ jsxs(Card, {
			title: "Accent and panel colour",
			description: "Accents always pass a 4.5:1 contrast check before they are used.",
			children: [
				/* @__PURE__ */ jsx(Pills, {
					label: "Accent colour",
					children: ACCENTS.map((c) => /* @__PURE__ */ jsx(Pill, {
						selected: a.accent === c.id,
						onClick: () => ap.update({ accent: c.id }),
						children: c.label
					}, c.id))
				}),
				a.accent === "custom" ? /* @__PURE__ */ jsxs("label", {
					className: "cs-form",
					children: ["Accent (hex)", /* @__PURE__ */ jsx("input", {
						value: accentText,
						maxLength: 7,
						onChange: (e) => {
							setAccentText(e.target.value);
							const rgb = parseHex(e.target.value);
							if (rgb) {
								setMsg(null);
								ap.update({ customAccent: toHex(rgb) });
							}
						},
						onBlur: () => commitHex(accentText, (h) => ap.update({ customAccent: h }), "Use a hex colour like #ff7a59.")
					})]
				}) : null,
				/* @__PURE__ */ jsxs("p", {
					className: "cs-card-desc",
					role: "status",
					children: [
						"Contrast on panels: ",
						derived.accent.ratio.toFixed(1),
						":1.",
						" ",
						derived.accent.fellBack ? "That colour could not be made readable, so the default accent is used." : derived.accent.adjusted ? "Lightened slightly to stay readable." : "Meets the 4.5:1 minimum."
					]
				}),
				/* @__PURE__ */ jsxs(Pills, {
					label: "Panel colour",
					children: [/* @__PURE__ */ jsx(Pill, {
						selected: a.panelColor === null,
						onClick: () => ap.update({ panelColor: null }),
						children: a.theme === "adaptive" ? "Film" : "XENON"
					}), /* @__PURE__ */ jsx(Pill, {
						selected: a.panelColor !== null,
						onClick: () => ap.update({ panelColor: parseHex(panelText) ? toHex(parseHex(panelText)) : "#14161f" }),
						children: "Custom"
					})]
				}),
				a.panelColor !== null ? /* @__PURE__ */ jsxs("label", {
					className: "cs-form",
					children: ["Panel colour (hex, keep it dark)", /* @__PURE__ */ jsx("input", {
						value: panelText,
						maxLength: 7,
						onChange: (e) => {
							setPanelText(e.target.value);
							const rgb = parseHex(e.target.value);
							if (rgb) ap.update({ panelColor: toHex(rgb) });
						},
						onBlur: () => commitHex(panelText, (h) => ap.update({ panelColor: h }), "Use a hex colour like #14161f.")
					})]
				}) : null
			]
		}),
		a.enabled ? /* @__PURE__ */ jsxs(Fragment, { children: [
			/* @__PURE__ */ jsxs(Card, {
				title: "Text contrast",
				description: "High raises the target from 4.5:1 to 7:1.",
				children: [/* @__PURE__ */ jsx(Pills, {
					label: "Text contrast",
					children: ["normal", "high"].map((c) => /* @__PURE__ */ jsx(Pill, {
						selected: a.contrast === c,
						onClick: () => ap.update({ contrast: c }),
						children: c === "normal" ? "Normal" : "High"
					}, c))
				}), /* @__PURE__ */ jsxs("p", {
					className: "cs-card-desc",
					role: "status",
					children: [
						"Body text on the background: ",
						derived.textRatio.toFixed(1),
						":1 (target ",
						a.contrast === "high" ? "7" : "4.5",
						":1)."
					]
				})]
			}),
			/* @__PURE__ */ jsx(Card, {
				title: "Panel style",
				description: "Glass is translucent, Solid is opaque, Clear is nearly transparent.",
				children: AREAS.map((area) => /* @__PURE__ */ jsxs("div", {
					className: "cs-arearow",
					role: "group",
					"aria-label": area.label,
					children: [/* @__PURE__ */ jsx("span", { children: area.label }), /* @__PURE__ */ jsx(Pills, { children: STYLES.map((s) => /* @__PURE__ */ jsx(Pill, {
						selected: a.panels[area.id] === s.id,
						label: `${area.label}: ${s.label}`,
						onClick: () => ap.updatePanel(area.id, s.id),
						children: s.label
					}, s.id)) })]
				}, area.id))
			}),
			/* @__PURE__ */ jsxs(Card, {
				title: "Colours from the artwork",
				description: derived.paletteStatus === "loading" ? "Reading colours…" : derived.note,
				children: [derived.palette ? /* @__PURE__ */ jsx("div", {
					className: "cs-palette",
					"aria-label": "Extracted colours",
					children: [
						{
							name: "Surface tint",
							c: derived.palette.tint
						},
						{
							name: "Dominant",
							c: derived.palette.dominant
						},
						{
							name: "Safe accent",
							c: derived.palette.accent.color
						}
					].map((p) => /* @__PURE__ */ jsxs("span", {
						className: "cs-palette-item",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "cs-swatch-dot cs-swatch-lg",
								style: { background: toHex(p.c) },
								"aria-hidden": "true"
							}),
							p.name,
							" ",
							/* @__PURE__ */ jsx("code", { children: toHex(p.c) })
						]
					}, p.name))
				}) : null, ap.artworkLabel && a.source === "poster" ? /* @__PURE__ */ jsxs("p", {
					className: "cs-card-desc",
					children: ["Artwork: ", ap.artworkLabel]
				}) : null]
			})
		] }) : null,
		/* @__PURE__ */ jsxs(Card, {
			title: "Theme presets",
			description: "Save these settings and restore them later. Presets do not include a custom image.",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "cs-timefield",
				children: [/* @__PURE__ */ jsxs("label", { children: ["Preset name", /* @__PURE__ */ jsx("input", {
					value: presetName,
					maxLength: 30,
					onChange: (e) => setPresetName(e.target.value),
					placeholder: "e.g. Night mode"
				})] }), /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "cs-chip",
					onClick: () => {
						const err = ap.savePreset(presetName);
						setMsg(err ? {
							kind: "error",
							text: err
						} : {
							kind: "ok",
							text: `Saved “${presetName.trim()}”.`
						});
						if (!err) setPresetName("");
					},
					children: "Save preset"
				})]
			}), ap.presets.length > 0 ? /* @__PURE__ */ jsx("ul", {
				className: "cs-list",
				children: ap.presets.map((p) => /* @__PURE__ */ jsxs("li", {
					className: "cs-list-row",
					children: [/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "cs-choice",
						onClick: () => {
							ap.applyPreset(p.id);
							setMsg({
								kind: "ok",
								text: `Applied “${p.name}”.`
							});
						},
						children: /* @__PURE__ */ jsx("span", {
							className: "cs-choice-main",
							children: p.name
						})
					}), /* @__PURE__ */ jsx("button", {
						type: "button",
						className: "cs-chip",
						onClick: () => ap.deletePreset(p.id),
						"aria-label": `Delete preset ${p.name}`,
						children: "Delete"
					})]
				}, p.id))
			}) : /* @__PURE__ */ jsx(Empty, { children: "No presets yet." })]
		}),
		msg ? /* @__PURE__ */ jsx("p", {
			className: "cs-form-msg",
			"data-kind": msg.kind,
			role: msg.kind === "error" ? "alert" : "status",
			children: msg.text
		}) : null,
		!ap.persisted ? /* @__PURE__ */ jsx("p", {
			className: "cs-form-msg",
			"data-kind": "error",
			role: "alert",
			children: "Your browser would not save these settings; they last until you close the tab."
		}) : null,
		a.background !== DEFAULT_APPEARANCE.background || a.theme !== "adaptive" || a.accent !== "default" || a.panelColor ? /* @__PURE__ */ jsx("div", {
			className: "cs-chips",
			children: /* @__PURE__ */ jsx("button", {
				type: "button",
				className: "cs-chip",
				onClick: () => {
					ap.reset();
					setHexText(DEFAULT_APPEARANCE.color);
					setAccentText(DEFAULT_APPEARANCE.customAccent);
					setPanelText("#14161f");
					setMsg({
						kind: "ok",
						text: "Appearance reset: Adaptive theme, film accent, spectral gradient background."
					});
				},
				children: "Reset appearance"
			})
		}) : null
	] });
}
var PRESETS = [
	{
		id: "subtle",
		label: "Subtle"
	},
	{
		id: "cinematic",
		label: "Cinematic"
	},
	{
		id: "vivid",
		label: "Vivid"
	}
];
var STOPS = [
	"Deep",
	"Mid",
	"Light accent",
	"Highlight"
];
/**
* Spectral gradients: the four-stop spectrum every surface is built from, and the dials for it. Presets set the
* dials; moving any dial makes the look your own ("Custom"). Saved with the rest of Appearance.
*/
function SpectralCard() {
	const ap = useAppearance();
	const { appearance: a, resolved } = ap;
	const g = a.gradient;
	const set = (patch, extra = {}) => ap.update({
		...extra,
		gradient: {
			...g,
			preset: "custom",
			...patch
		}
	});
	const sp = resolved.spectrum;
	return /* @__PURE__ */ jsxs(Card, {
		title: "Spectral gradients",
		description: "Every surface is layered from one four-colour spectrum, so the player, the wheel, the dock and the page share the film's light. The video itself is never tinted.",
		children: [
			/* @__PURE__ */ jsxs(Pills, {
				label: "Gradient preset",
				children: [PRESETS.map((p) => /* @__PURE__ */ jsx(Pill, {
					selected: g.preset === p.id,
					onClick: () => {
						const v = GRADIENT_PRESETS[p.id];
						ap.update({
							ambient: v.ambient,
							blur: v.blur,
							gradient: {
								...g,
								preset: p.id,
								intensity: v.intensity,
								panelAlpha: v.panelAlpha
							}
						});
					},
					children: p.label
				}, p.id)), g.preset === "custom" ? /* @__PURE__ */ jsx("span", {
					className: "cs-tag",
					children: "Custom"
				}) : null]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "cs-spectrum",
				"aria-label": `Spectrum in use: ${sp.join(", ")}`,
				role: "img",
				children: [/* @__PURE__ */ jsx("span", {
					className: "cs-spectrum-bar",
					style: { background: `linear-gradient(${g.direction}deg, ${sp[0]}, ${sp[1]} 38%, ${sp[2]} 74%, ${sp[3]})` }
				}), /* @__PURE__ */ jsx("span", {
					className: "cs-spectrum-stops",
					"aria-hidden": "true",
					children: sp.map((c, i) => /* @__PURE__ */ jsxs("span", {
						className: "cs-palette-item",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "cs-swatch-dot",
								style: { background: c }
							}),
							" ",
							STOPS[i],
							" ",
							/* @__PURE__ */ jsx("code", { children: c })
						]
					}, i))
				})]
			}),
			/* @__PURE__ */ jsxs(Pills, {
				label: "Palette",
				children: [/* @__PURE__ */ jsx(Pill, {
					selected: g.paletteMode === "film",
					onClick: () => set({ paletteMode: "film" }),
					children: a.theme === "adaptive" ? "Each film’s palette" : "XENON palette"
				}), /* @__PURE__ */ jsx(Pill, {
					selected: g.paletteMode === "custom",
					onClick: () => set({
						paletteMode: "custom",
						custom: [...sp]
					}),
					children: "My palette"
				})]
			}),
			g.paletteMode === "custom" ? /* @__PURE__ */ jsx("div", {
				className: "cs-spectrum-edit",
				role: "group",
				"aria-label": "My palette",
				children: STOPS.map((name, i) => /* @__PURE__ */ jsxs("label", {
					className: "cs-spectrum-input",
					children: [/* @__PURE__ */ jsx("input", {
						type: "color",
						value: g.custom[i],
						onChange: (e) => {
							const next = [...g.custom];
							next[i] = e.target.value;
							set({ custom: next });
						}
					}), /* @__PURE__ */ jsx("span", { children: name })]
				}, name))
			}) : null,
			/* @__PURE__ */ jsx(Range, {
				label: "Gradient intensity",
				value: g.intensity,
				min: 0,
				max: 100,
				unit: "%",
				onChange: (v) => set({ intensity: v })
			}),
			/* @__PURE__ */ jsx(Range, {
				label: "Ambient colour",
				value: a.ambient,
				min: 0,
				max: 100,
				unit: "%",
				onChange: (v) => set({}, { ambient: v })
			}),
			/* @__PURE__ */ jsx(Range, {
				label: "Gradient direction",
				value: g.direction,
				min: 0,
				max: 360,
				unit: "°",
				onChange: (v) => set({ direction: v })
			}),
			/* @__PURE__ */ jsx(Range, {
				label: "Panel transparency",
				value: 100 - g.panelAlpha,
				min: 0,
				max: 60,
				unit: "%",
				onChange: (v) => set({ panelAlpha: 100 - v })
			})
		]
	});
}
// ../player/src/skin/prefs/A11yCards.tsx
var LAYOUTS = [
	{
		id: "floating",
		label: "Floating",
		description: "The transport floats over the picture; a console sits below it and rests when idle."
	},
	{
		id: "compact",
		label: "Compact",
		description: "One slim bar with the timeline inline. Tools move into More."
	},
	{
		id: "expanded",
		label: "Expanded",
		description: "A labelled console under the picture. It never covers the film and never hides."
	}
];
/** Standard / High contrast / Large controls / Reduced motion. Anything can be tweaked afterwards. */
function ProfileCard() {
	const { profile, applyProfile } = usePrefs();
	const current = PROFILES.find((p) => p.id === profile);
	return /* @__PURE__ */ jsxs(Card, {
		title: "Accessibility profile",
		description: "Start from a preset, then adjust individual options.",
		children: [/* @__PURE__ */ jsx(Pills, {
			label: "Accessibility profile",
			children: PROFILES.map((p) => /* @__PURE__ */ jsx(Pill, {
				selected: profile === p.id,
				onClick: () => applyProfile(p.id),
				children: p.label
			}, p.id))
		}), /* @__PURE__ */ jsx("p", {
			className: "cs-card-desc",
			role: "status",
			children: current ? current.description : "Custom: your own mix of the options below."
		})]
	});
}
function ViewPrefsCard() {
	const { prefs, set } = usePrefs();
	return /* @__PURE__ */ jsxs(Card, {
		title: "Viewing preferences",
		description: "These apply to the whole player and are remembered in this browser.",
		children: [
			/* @__PURE__ */ jsx(SwitchRow, {
				label: "High contrast",
				description: "Solid surfaces, strong borders, thick focus rings.",
				checked: prefs.highContrast,
				onChange: (v) => set({ highContrast: v })
			}),
			/* @__PURE__ */ jsx(SwitchRow, {
				label: "Large controls",
				description: "Bigger buttons, larger text and more spacing.",
				checked: prefs.largeControls,
				onChange: (v) => set({ largeControls: v })
			}),
			/* @__PURE__ */ jsx(SwitchRow, {
				label: "Reduce motion",
				description: "Turns off panel, wheel and background animation. Your system setting is also respected.",
				checked: prefs.reducedMotion,
				onChange: (v) => set({ reducedMotion: v })
			})
		]
	});
}
function DockCard() {
	const { prefs, set } = usePrefs();
	return /* @__PURE__ */ jsxs(Card, {
		title: "Control dock",
		description: "How the playback controls are arranged. Small players adapt automatically; play, seek, time, sound and fullscreen are always reachable.",
		children: [
			/* @__PURE__ */ jsx(Pills, {
				label: "Control arrangement",
				children: LAYOUTS.map((l) => /* @__PURE__ */ jsx(Pill, {
					selected: prefs.dockLayout === l.id,
					onClick: () => set({ dockLayout: l.id }),
					children: l.label
				}, l.id))
			}),
			/* @__PURE__ */ jsx("p", {
				className: "cs-card-desc",
				role: "status",
				children: LAYOUTS.find((l) => l.id === prefs.dockLayout)?.description
			}),
			/* @__PURE__ */ jsx(SwitchRow, {
				label: "Pause Canvas",
				description: "When paused, show the title, where you are, the neighbouring scenes and quick actions beside the frame.",
				checked: prefs.pauseCanvas,
				onChange: (v) => set({ pauseCanvas: v })
			}),
			/* @__PURE__ */ jsx(SwitchRow, {
				label: "Show button labels",
				description: "Text beside icons such as Save moment, when there is room.",
				checked: prefs.dockLabels,
				onChange: (v) => set({ dockLabels: v })
			}),
			/* @__PURE__ */ jsx(SwitchRow, {
				label: "Compact dock",
				description: "Tighter spacing between playback controls.",
				checked: prefs.dockCompact,
				onChange: (v) => set({ dockCompact: v })
			})
		]
	});
}
// ../player/src/skin/subtitles/parse.ts
var TIME = /(?:(\d{1,3}):)?(\d{1,2}):(\d{2})[.,](\d{1,3})/;
function toSeconds(match) {
	const [, h, m, s, ms] = match;
	return Number(h ?? 0) * 3600 + Number(m) * 60 + Number(s) + Number((ms ?? "0").padEnd(3, "0")) / 1e3;
}
/** Strips WebVTT/SRT markup: <i>, <c.class>, <00:01.000> timestamps, {\an8} style overrides. */
function cleanText(lines) {
	return lines.join("\n").replace(/<[^>]*>/g, "").replace(/\{\\[^}]*\}/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").trim();
}
var SubtitleParseError = class extends Error {};
/**
* Parses SRT or WebVTT text in the browser. Tolerant of BOMs, CRLF, missing cue numbers and
* NOTE/STYLE/REGION blocks. Throws SubtitleParseError when no usable cue is found.
*/
function parseSubtitles(input) {
	const text = input.replace(/^﻿/, "").replace(/\r\n?/g, "\n").trim();
	if (!text) throw new SubtitleParseError("The subtitle text is empty.");
	const cues = [];
	for (const block of text.split(/\n{2,}/)) {
		const lines = block.split("\n");
		if (/^(WEBVTT|NOTE|STYLE|REGION)\b/.test(lines[0] ?? "")) continue;
		const timingIndex = lines.findIndex((l) => l.includes("-->"));
		if (timingIndex === -1) continue;
		const [a = "", b = ""] = (lines[timingIndex] ?? "").split("-->");
		const start = a.match(TIME);
		const end = b.trim().match(TIME);
		if (!start || !end) continue;
		const s = toSeconds(start);
		const e = toSeconds(end);
		const body = cleanText(lines.slice(timingIndex + 1));
		if (!body || !(e > s)) continue;
		cues.push({
			start: s,
			end: e,
			text: body
		});
	}
	if (cues.length === 0) throw new SubtitleParseError("No cues found. Expected SRT or WebVTT with lines like \"00:00:01,000 --> 00:00:03,000\".");
	return cues.sort((x, y) => x.start - y.start);
}
/** Text of every cue active at `time` (seconds), joined by newlines. */
function activeText(cues, time) {
	let out = "";
	for (const c of cues) {
		if (c.start > time) break;
		if (time < c.end) out += (out ? "\n" : "") + c.text;
	}
	return out;
}
/** Index of the last cue that started at or before `time`, or -1. */
function cueIndexAt(cues, time) {
	let lo = 0;
	let hi = cues.length - 1;
	let ans = -1;
	while (lo <= hi) {
		const mid = lo + hi >> 1;
		if ((cues[mid]?.start ?? Infinity) <= time) {
			ans = mid;
			lo = mid + 1;
		} else hi = mid - 1;
	}
	return ans;
}
/** "fr" -> "French" in the viewer's language, falling back to the code itself. */
function languageName(code) {
	if (!code) return null;
	try {
		return new Intl.DisplayNames([navigator.language || "en"], { type: "language" }).of(code) ?? code;
	} catch {
		return code;
	}
}
/** Flag emoji, only when the code carries a region (pt-BR, en-GB). Languages are not countries, so "en" alone gets none. */
function flagFor(code) {
	const region = code?.split(/[-_]/)[1]?.toUpperCase();
	if (!region || !/^[A-Z]{2}$/.test(region)) return null;
	return String.fromCodePoint(...[...region].map((c) => 127462 + c.charCodeAt(0) - 65));
}
// ../player/src/skin/subtitles/SubtitleContext.tsx
var CAPTION_COLORS = [
	{
		value: "#ffffff",
		name: "White"
	},
	{
		value: "#d8ff57",
		name: "Citron"
	},
	{
		value: "#ffe14d",
		name: "Yellow"
	},
	{
		value: "#8dd3cf",
		name: "Teal"
	},
	{
		value: "#ada0f8",
		name: "Lavender"
	}
];
var DEFAULT_STYLE = {
	size: "md",
	color: "#ffffff",
	bgOpacity: 75,
	position: "bottom",
	outline: "none",
	font: "brand"
};
var parseStyle = (v) => {
	if (!isRecord(v)) return null;
	const pick = (x, allowed, d) => allowed.find((a) => a === x) ?? d;
	return {
		size: pick(v.size, [
			"sm",
			"md",
			"lg",
			"xl"
		], DEFAULT_STYLE.size),
		color: CAPTION_COLORS.find((c) => c.value === v.color)?.value ?? DEFAULT_STYLE.color,
		bgOpacity: typeof v.bgOpacity === "number" ? clamp(v.bgOpacity, 0, 100) : DEFAULT_STYLE.bgOpacity,
		position: pick(v.position, [
			"bottom",
			"raised",
			"top"
		], DEFAULT_STYLE.position),
		outline: pick(v.outline, [
			"none",
			"shadow",
			"outline"
		], DEFAULT_STYLE.outline),
		font: pick(v.font, [
			"brand",
			"system",
			"serif",
			"mono"
		], DEFAULT_STYLE.font)
	};
};
var parseStored = (v) => {
	if (!isRecord(v) || !Array.isArray(v.tracks)) return null;
	return {
		tracks: v.tracks.filter((t) => isRecord(t) && typeof t.id === "string" && typeof t.label === "string" && typeof t.raw === "string" && (t.origin === "upload" || t.origin === "paste")),
		activeId: typeof v.activeId === "string" ? v.activeId : null,
		offset: typeof v.offset === "number" && Number.isFinite(v.offset) ? clamp(v.offset, -30, 30) : 0
	};
};
var Ctx = createContext(null);
function useSubtitles() {
	const ctx = useContext(Ctx);
	if (!ctx) throw new Error("useSubtitles must be used inside <CinemaSkin>");
	return ctx;
}
function SubtitleProvider({ mediaKey, children }) {
	const media = useMedia();
	const storageKey = `subs:${mediaKey}`;
	const [native, setNative] = useState([]);
	const [user, setUser] = useState([]);
	const [activeId, setActiveId] = useState(null);
	const [lastId, setLastId] = useState(null);
	const [offset, setOffsetState] = useState(0);
	const [style, setStyleState] = useState(() => readJSON("subtitle-style", parseStyle, DEFAULT_STYLE));
	const [userTurnedOff, setUserTurnedOff] = useState(() => readJSON("captions-off", (v) => v === true, false));
	const skipPersist = useRef(false);
	useEffect(() => {
		skipPersist.current = true;
		const stored = readJSON(storageKey, parseStored, {
			tracks: [],
			activeId: null,
			offset: 0
		});
		const restored = [];
		for (const t of stored.tracks) try {
			restored.push({
				...t,
				cues: parseSubtitles(t.raw)
			});
		} catch {}
		setUser(restored);
		setNative([]);
		setActiveId(restored.some((t) => t.id === stored.activeId) ? stored.activeId : null);
		setOffsetState(stored.offset);
	}, [storageKey]);
	useEffect(() => {
		if (skipPersist.current) {
			skipPersist.current = false;
			return;
		}
		writeJSON(storageKey, {
			tracks: user.map(({ id, label, lang, origin, raw }) => ({
				id,
				label,
				lang,
				origin: origin === "paste" ? "paste" : "upload",
				raw: raw ?? ""
			})),
			activeId: activeId?.startsWith("native:") ? null : activeId,
			offset
		});
	}, [
		storageKey,
		user,
		activeId,
		offset
	]);
	useEffect(() => {
		const tt = media?.textTracks;
		if (!media || !tt) return;
		const sync = () => {
			const found = [];
			for (let i = 0; i < tt.length; i++) {
				const t = tt[i];
				if (!t || t.kind !== "captions" && t.kind !== "subtitles") continue;
				if (t.mode !== "showing") t.mode = "showing";
				if (!t.cues || t.cues.length === 0) continue;
				found.push({
					id: `native:${i}:${t.language || t.label}`,
					label: t.label || languageName(t.language) || `Track ${i + 1}`,
					lang: t.language || void 0,
					origin: "native",
					cues: Array.from(t.cues).map((c) => ({
						start: c.startTime,
						end: c.endTime,
						text: (c.text ?? "").replace(/<[^>]*>/g, "")
					}))
				});
			}
			setNative((prev) => prev.length === found.length && prev.every((p, i) => p.id === found[i]?.id) ? prev : found);
		};
		sync();
		const timers = [window.setTimeout(sync, 800), window.setTimeout(sync, 2500)];
		tt.addEventListener("addtrack", sync);
		media.addEventListener("loadedmetadata", sync);
		const known = /* @__PURE__ */ new Map();
		const onCue = (e) => {
			const t = e.target;
			const n = t.cues?.length ?? 0;
			if (known.get(t) !== n) {
				known.set(t, n);
				sync();
			}
		};
		const watched = [];
		const watchAll = () => {
			for (let i = 0; i < tt.length; i++) {
				const t = tt[i];
				if (t && !watched.includes(t)) {
					watched.push(t);
					t.addEventListener("cuechange", onCue);
				}
			}
		};
		watchAll();
		tt.addEventListener("addtrack", watchAll);
		return () => {
			timers.forEach(window.clearTimeout);
			tt.removeEventListener("addtrack", sync);
			tt.removeEventListener("addtrack", watchAll);
			media.removeEventListener("loadedmetadata", sync);
			watched.forEach((t) => t.removeEventListener("cuechange", onCue));
		};
	}, [media, mediaKey]);
	useEffect(() => {
		if (activeId !== null || userTurnedOff || native.length === 0) return;
		const want = (navigator.language || "en").split("-")[0];
		const match = native.find((t) => t.lang?.split("-")[0] === want) ?? native.find((t) => t.lang === void 0);
		if (match) setActiveId(match.id);
	}, [
		native,
		activeId,
		userTurnedOff
	]);
	const tracks = useMemo(() => [...native, ...user], [native, user]);
	const active = tracks.find((t) => t.id === activeId) ?? null;
	const setActive = useCallback((id) => {
		setActiveId(id);
		if (id) setLastId(id);
		setUserTurnedOff(id === null);
		writeJSON("captions-off", id === null);
	}, []);
	const addTrack = useCallback((label, lang, raw, origin) => {
		try {
			const cues = parseSubtitles(raw);
			const id = `${origin}:${Date.now().toString(36)}`;
			const code = lang.trim() || void 0;
			const track = {
				id,
				label: label.trim() || languageName(code) || "Subtitles",
				lang: code,
				origin,
				cues,
				raw
			};
			setUser((u) => [...u, track]);
			setActive(id);
			return null;
		} catch (e) {
			return e instanceof SubtitleParseError ? e.message : "Could not read those subtitles.";
		}
	}, [setActive]);
	const removeTrack = useCallback((id) => {
		setUser((u) => u.filter((t) => t.id !== id));
		if (activeId === id) setActiveId(null);
	}, [activeId]);
	const setOffset = useCallback((s) => setOffsetState(Math.round(clamp(s, -30, 30) * 10) / 10), []);
	const setStyle = useCallback((patch) => {
		setStyleState((prev) => {
			const next = {
				...prev,
				...patch
			};
			writeJSON("subtitle-style", next);
			return next;
		});
	}, []);
	const toggle = useCallback(() => {
		if (active) setActive(null);
		else {
			const target = tracks.find((t) => t.id === lastId) ?? tracks[0];
			if (target) setActive(target.id);
		}
	}, [
		active,
		lastId,
		tracks,
		setActive
	]);
	const value = useMemo(() => ({
		tracks,
		active,
		activeId,
		setActive,
		addTrack,
		removeTrack,
		offset,
		setOffset,
		style,
		setStyle,
		toggle
	}), [
		tracks,
		active,
		activeId,
		setActive,
		addTrack,
		removeTrack,
		offset,
		setOffset,
		style,
		setStyle,
		toggle
	]);
	return /* @__PURE__ */ jsx(Ctx.Provider, {
		value,
		children
	});
}
// ../player/src/skin/subtitles/CaptionOverlay.tsx
var FONTS = {
	brand: "var(--cs-font)",
	system: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
	serif: "ui-serif, Georgia, 'Times New Roman', serif",
	mono: "ui-monospace, Consolas, 'Courier New', monospace"
};
var SIZES = {
	sm: "0.85rem",
	md: "1.1rem",
	lg: "1.5rem",
	xl: "2rem"
};
function captionCssVars(style) {
	const outline = style.outline === "outline" ? "-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 0 0 4px #000" : style.outline === "shadow" ? "0 2px 4px rgb(0 0 0 / 0.9), 0 0 8px rgb(0 0 0 / 0.7)" : "none";
	return {
		["--cap-size"]: SIZES[style.size],
		["--cap-font"]: FONTS[style.font],
		["--cap-color"]: style.color,
		["--cap-bg"]: `rgb(5 7 12 / ${style.bgOpacity / 100})`,
		["--cap-shadow"]: outline
	};
}
/** Draws the active subtitle line. The selector returns a string, so it re-renders only when the text changes. */
function CaptionOverlay() {
	const { active, offset, style } = useSubtitles();
	const cues = active?.cues;
	const text = usePlayer((s) => cues ? activeText(cues, s.currentTime - offset) : "");
	if (!text) return null;
	return /* @__PURE__ */ jsx("div", {
		className: "cs-captions",
		"data-position": style.position,
		style: captionCssVars(style),
		"aria-hidden": "true",
		children: /* @__PURE__ */ jsx("span", {
			className: "cs-caption-text",
			children: text
		})
	});
}
// ../player/src/skin/subtitles/SubtitleCards.tsx
var MAX_BYTES = 2097152;
var trackName = (t) => t.label || languageName(t.lang) || "Subtitles";
/** Language list and the on/off switch. */
function SubtitleTracksCard() {
	const sub = useSubtitles();
	return /* @__PURE__ */ jsxs(Card, {
		title: "Subtitle language",
		description: "Pick a language, or turn captions off.",
		children: [/* @__PURE__ */ jsx(SwitchRow, {
			label: "Show captions",
			description: sub.active ? `Showing ${trackName(sub.active)}` : "Captions are off",
			checked: sub.active !== null,
			disabled: sub.tracks.length === 0,
			onChange: () => sub.toggle()
		}), sub.tracks.length === 0 ? /* @__PURE__ */ jsx(Empty, { children: "This video has no subtitle tracks. Add your own under “Add subtitles”." }) : /* @__PURE__ */ jsx("ul", {
			className: "cs-list",
			children: sub.tracks.map((t) => {
				const flag = flagFor(t.lang);
				const lang = languageName(t.lang);
				return /* @__PURE__ */ jsxs("li", {
					className: "cs-list-row",
					children: [/* @__PURE__ */ jsxs("button", {
						type: "button",
						className: "cs-choice",
						"aria-pressed": sub.activeId === t.id,
						onClick: () => sub.setActive(t.id),
						children: [/* @__PURE__ */ jsxs("span", {
							className: "cs-choice-main",
							children: [flag ? /* @__PURE__ */ jsxs("span", {
								"aria-hidden": "true",
								children: [flag, " "]
							}) : null, trackName(t)]
						}), /* @__PURE__ */ jsxs("span", {
							className: "cs-tag",
							children: [lang && lang !== trackName(t) ? `${lang} · ` : "", t.origin === "native" ? "from video" : t.origin === "upload" ? "uploaded" : "pasted"]
						})]
					}), t.origin !== "native" ? /* @__PURE__ */ jsx("button", {
						type: "button",
						className: "cs-icon-btn",
						onClick: () => sub.removeTrack(t.id),
						"aria-label": `Remove ${trackName(t)}`,
						children: /* @__PURE__ */ jsx(TrashIcon, {})
					}) : null]
				}, t.id);
			})
		})]
	});
}
/** Timing offset, optional alignment service, and the transcript shortcut. */
function SubtitleTimingCard({ onOpenTranscript, autoSync }) {
	const sub = useSubtitles();
	const [syncing, setSyncing] = useState(false);
	const [msg, setMsg] = useState(null);
	const nudge = (d) => sub.setOffset(sub.offset + d);
	const runSync = async () => {
		if (!autoSync || !sub.active) return;
		setSyncing(true);
		try {
			sub.setOffset(await autoSync(sub.active));
			setMsg({
				kind: "ok",
				text: "Timing adjusted by the alignment service."
			});
		} catch {
			setMsg({
				kind: "error",
				text: "The alignment service did not return a result."
			});
		} finally {
			setSyncing(false);
		}
	};
	return /* @__PURE__ */ jsx(Card, {
		title: "Timing and transcript",
		description: "Fix captions that run early or late, or read along.",
		children: sub.active ? /* @__PURE__ */ jsxs(Fragment, { children: [
			/* @__PURE__ */ jsxs("div", {
				className: "cs-offset",
				role: "group",
				"aria-label": "Adjust subtitle timing",
				children: [
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "cs-chip",
						onClick: () => nudge(-.5),
						children: "−0.5 s"
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "cs-chip",
						onClick: () => nudge(-.1),
						children: "−0.1 s"
					}),
					/* @__PURE__ */ jsxs("output", {
						className: "cs-offset-val",
						"aria-live": "polite",
						children: [
							sub.offset > 0 ? "+" : "",
							sub.offset.toFixed(1),
							" s"
						]
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "cs-chip",
						onClick: () => nudge(.1),
						children: "+0.1 s"
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "cs-chip",
						onClick: () => nudge(.5),
						children: "+0.5 s"
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "cs-chip",
						onClick: () => sub.setOffset(0),
						disabled: sub.offset === 0,
						children: "Reset"
					})
				]
			}),
			/* @__PURE__ */ jsx("p", {
				className: "cs-card-desc",
				children: "Positive values show lines later."
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "cs-chips",
				children: [autoSync ? /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "cs-chip",
					onClick: () => void runSync(),
					disabled: syncing,
					children: syncing ? "Aligning…" : "Auto-sync with alignment service"
				}) : null, /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "cs-chip",
					onClick: onOpenTranscript,
					children: "Open transcript"
				})]
			}),
			msg ? /* @__PURE__ */ jsx("p", {
				className: "cs-form-msg",
				"data-kind": msg.kind,
				role: msg.kind === "error" ? "alert" : "status",
				children: msg.text
			}) : null
		] }) : /* @__PURE__ */ jsx(Empty, { children: "Choose a subtitle track to adjust its timing or open its transcript." })
	});
}
/** Upload a .srt/.vtt file or paste subtitle text. Parsed in the browser. */
function SubtitleAddCard() {
	const sub = useSubtitles();
	const fileRef = useRef(null);
	const [label, setLabel] = useState("");
	const [lang, setLang] = useState("");
	const [pasted, setPasted] = useState("");
	const [message, setMessage] = useState(null);
	const onFile = async (file) => {
		if (!/\.(srt|vtt)$/i.test(file.name)) return setMessage({
			kind: "error",
			text: "Choose a .srt or .vtt file."
		});
		if (file.size > MAX_BYTES) return setMessage({
			kind: "error",
			text: "That file is larger than 2 MB."
		});
		const err = sub.addTrack(label || file.name.replace(/\.(srt|vtt)$/i, ""), lang, await file.text(), "upload");
		setMessage(err ? {
			kind: "error",
			text: err
		} : {
			kind: "ok",
			text: `Added ${file.name}. It stays in this browser.`
		});
		if (!err) setLabel("");
	};
	const onPaste = () => {
		const err = sub.addTrack(label || "Pasted subtitles", lang, pasted, "paste");
		setMessage(err ? {
			kind: "error",
			text: err
		} : {
			kind: "ok",
			text: "Subtitles added."
		});
		if (!err) {
			setPasted("");
			setLabel("");
		}
	};
	return /* @__PURE__ */ jsx(Card, {
		title: "Add subtitles",
		description: "Upload a file or paste text. Nothing leaves your browser.",
		children: /* @__PURE__ */ jsxs("div", {
			className: "cs-form",
			children: [
				/* @__PURE__ */ jsxs("label", { children: ["Name", /* @__PURE__ */ jsx("input", {
					value: label,
					maxLength: 40,
					onChange: (e) => setLabel(e.target.value),
					placeholder: "e.g. French"
				})] }),
				/* @__PURE__ */ jsxs("label", { children: ["Language code (optional)", /* @__PURE__ */ jsx("input", {
					value: lang,
					maxLength: 10,
					onChange: (e) => setLang(e.target.value),
					placeholder: "e.g. fr or pt-BR"
				})] }),
				/* @__PURE__ */ jsx("div", {
					className: "cs-chips",
					children: /* @__PURE__ */ jsx("button", {
						type: "button",
						className: "cs-chip",
						onClick: () => fileRef.current?.click(),
						children: "Upload .srt or .vtt"
					})
				}),
				/* @__PURE__ */ jsx("input", {
					ref: fileRef,
					type: "file",
					accept: ".srt,.vtt,text/vtt,application/x-subrip",
					className: "cs-sr",
					tabIndex: -1,
					"aria-label": "Subtitle file",
					onChange: (e) => {
						const f = e.target.files?.[0];
						if (f) onFile(f);
						e.target.value = "";
					}
				}),
				/* @__PURE__ */ jsxs("label", { children: ["Or paste subtitle text", /* @__PURE__ */ jsx("textarea", {
					rows: 5,
					value: pasted,
					onChange: (e) => setPasted(e.target.value),
					placeholder: "1\n00:00:01,000 --> 00:00:03,000\nHello"
				})] }),
				/* @__PURE__ */ jsx("div", {
					className: "cs-chips",
					children: /* @__PURE__ */ jsx("button", {
						type: "button",
						className: "cs-chip",
						onClick: onPaste,
						disabled: !pasted.trim(),
						children: "Add pasted subtitles"
					})
				}),
				message ? /* @__PURE__ */ jsx("p", {
					className: "cs-form-msg",
					"data-kind": message.kind,
					role: message.kind === "error" ? "alert" : "status",
					children: message.text
				}) : null
			]
		})
	});
}
/** Subtitle appearance. Independent of the interface typography so it can be tuned for readability. */
function SubtitleStyleCard() {
	const sub = useSubtitles();
	const st = sub.style;
	return /* @__PURE__ */ jsx(Card, {
		title: "Subtitle appearance",
		description: "Size, typeface, colour, background, position and text edge.",
		children: /* @__PURE__ */ jsxs("div", {
			className: "cs-form",
			children: [
				/* @__PURE__ */ jsxs("fieldset", { children: [/* @__PURE__ */ jsx("legend", { children: "Size" }), /* @__PURE__ */ jsx(Pills, { children: [
					"sm",
					"md",
					"lg",
					"xl"
				].map((s) => /* @__PURE__ */ jsx(Pill, {
					selected: st.size === s,
					onClick: () => sub.setStyle({ size: s }),
					children: {
						sm: "Small",
						md: "Medium",
						lg: "Large",
						xl: "Extra large"
					}[s]
				}, s)) })] }),
				/* @__PURE__ */ jsxs("fieldset", { children: [/* @__PURE__ */ jsx("legend", { children: "Typeface" }), /* @__PURE__ */ jsx(Pills, { children: [
					"brand",
					"system",
					"serif",
					"mono"
				].map((f) => /* @__PURE__ */ jsx(Pill, {
					selected: st.font === f,
					onClick: () => sub.setStyle({ font: f }),
					children: {
						brand: "Space Grotesk",
						system: "System sans",
						serif: "Serif",
						mono: "Monospace"
					}[f]
				}, f)) })] }),
				/* @__PURE__ */ jsxs("fieldset", { children: [/* @__PURE__ */ jsx("legend", { children: "Colour" }), /* @__PURE__ */ jsx(Pills, { children: CAPTION_COLORS.map((c) => /* @__PURE__ */ jsxs(Pill, {
					selected: st.color === c.value,
					onClick: () => sub.setStyle({ color: c.value }),
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "cs-swatch-dot",
							style: { background: c.value },
							"aria-hidden": "true"
						}),
						" ",
						c.name
					]
				}, c.value)) })] }),
				/* @__PURE__ */ jsxs("label", { children: [
					"Background opacity: ",
					st.bgOpacity,
					"%",
					/* @__PURE__ */ jsx("input", {
						type: "range",
						min: 0,
						max: 100,
						step: 5,
						value: st.bgOpacity,
						"aria-valuetext": `${st.bgOpacity} percent`,
						onChange: (e) => sub.setStyle({ bgOpacity: Number(e.target.value) })
					})
				] }),
				/* @__PURE__ */ jsxs("fieldset", { children: [/* @__PURE__ */ jsx("legend", { children: "Position" }), /* @__PURE__ */ jsx(Pills, { children: [
					"bottom",
					"raised",
					"top"
				].map((p) => /* @__PURE__ */ jsx(Pill, {
					selected: st.position === p,
					onClick: () => sub.setStyle({ position: p }),
					children: {
						bottom: "Bottom",
						raised: "Raised",
						top: "Top"
					}[p]
				}, p)) })] }),
				/* @__PURE__ */ jsxs("fieldset", { children: [/* @__PURE__ */ jsx("legend", { children: "Text edge" }), /* @__PURE__ */ jsx(Pills, { children: [
					"none",
					"shadow",
					"outline"
				].map((o) => /* @__PURE__ */ jsx(Pill, {
					selected: st.outline === o,
					onClick: () => sub.setStyle({ outline: o }),
					children: {
						none: "None",
						shadow: "Shadow",
						outline: "Outline"
					}[o]
				}, o)) })] }),
				/* @__PURE__ */ jsx("div", {
					className: "cs-cap-preview",
					style: captionCssVars(st),
					"aria-hidden": "true",
					children: /* @__PURE__ */ jsx("span", {
						className: "cs-caption-text",
						children: "Preview: the quick brown fox"
					})
				})
			]
		})
	});
}
// ../player/src/skin/SettingsPanel.tsx
var TABS = [
	{
		id: "playback",
		label: "Playback"
	},
	{
		id: "subtitles",
		label: "Subtitles"
	},
	{
		id: "appearance",
		label: "Appearance"
	},
	{
		id: "accessibility",
		label: "Accessibility"
	},
	{
		id: "advanced",
		label: "Advanced"
	}
];
var RATES = [
	.5,
	.75,
	1,
	1.25,
	1.5,
	2
];
var SEGMENT_LABEL = {
	intro: "Skip intro",
	recap: "Skip recap",
	credits: "Skip credits"
};
function SettingsPanel(props) {
	const { open, onClose, returnFocusTo, tab, onTab } = props;
	const store = usePlayer();
	const rate = usePlayer((s) => s.playbackRate);
	const rateAvail = usePlayer((s) => s.playbackRateAvailability);
	const adaptive = useQualityOptions();
	const audio = useAudioTrackOptions();
	const [query, setQuery] = useState("");
	useEffect(() => {
		if (!open) setQuery("");
	}, [open]);
	const baseId = useId();
	const tablistRef = useRef(null);
	useNativeKeydown(tablistRef, (e) => {
		const i = TABS.findIndex((t) => t.id === tab);
		let next = i;
		if (e.key === "ArrowRight") next = (i + 1) % TABS.length;
		else if (e.key === "ArrowLeft") next = (i - 1 + TABS.length) % TABS.length;
		else if (e.key === "Home") next = 0;
		else if (e.key === "End") next = TABS.length - 1;
		else return;
		e.preventDefault();
		const target = TABS[next];
		if (target) {
			onTab(target.id);
			requestAnimationFrame(() => document.getElementById(`${baseId}-tab-${target.id}`)?.focus());
		}
	});
	const adaptiveOptions = adaptive?.state.availability === "available" ? adaptive.options : null;
	const fileQualities = props.qualities && props.qualities.options.length > 1 ? props.qualities : null;
	const audioOptions = audio?.state.availability === "available" && audio.options.length > 1 ? audio.options : null;
	const segments = props.segments ?? [];
	const servers = props.servers && props.servers.options.length > 1 ? props.servers : null;
	const entries = (() => {
		const list = [];
		if (rateAvail === "available") list.push({
			id: "speed",
			tab: "playback",
			title: "Playback speed",
			keywords: "rate faster slower tempo",
			node: /* @__PURE__ */ jsx(Card, {
				title: "Playback speed",
				description: "Slow down to follow dialogue, speed up to skim.",
				children: /* @__PURE__ */ jsx(Pills, {
					label: "Playback speed",
					children: RATES.map((r) => /* @__PURE__ */ jsxs(Pill, {
						selected: rate === r,
						onClick: () => store.setPlaybackRate(r),
						children: [r, "×"]
					}, r))
				})
			})
		});
		list.push({
			id: "quality",
			tab: "playback",
			title: "Video quality",
			keywords: "resolution 480p 1080p hd bitrate",
			node: /* @__PURE__ */ jsx(Card, {
				title: "Video quality",
				description: "Only qualities this source really offers are listed.",
				children: adaptiveOptions && adaptive ? /* @__PURE__ */ jsx(Pills, {
					label: "Video quality",
					children: adaptiveOptions.map((o) => /* @__PURE__ */ jsx(Pill, {
						selected: adaptive.value === o.value,
						disabled: o.disabled,
						onClick: () => adaptive.setValue(o.value),
						children: o.label
					}, o.value))
				}) : fileQualities ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(Pills, {
					label: "Video quality",
					children: fileQualities.options.map((o) => /* @__PURE__ */ jsx(Pill, {
						selected: fileQualities.activeId === o.id,
						onClick: () => fileQualities.onChange(o.id),
						children: o.label
					}, o.id))
				}), /* @__PURE__ */ jsx("p", {
					className: "cs-card-desc",
					children: "Changing quality reloads the file and keeps your place."
				})] }) : /* @__PURE__ */ jsx(Empty, { children: "This source offers a single quality." })
			})
		});
		if (audioOptions && audio) list.push({
			id: "audio",
			tab: "playback",
			title: "Audio track",
			keywords: "language dub commentary sound",
			node: /* @__PURE__ */ jsx(Card, {
				title: "Audio track",
				children: /* @__PURE__ */ jsx(Pills, {
					label: "Audio track",
					children: audioOptions.map((o) => /* @__PURE__ */ jsx(Pill, {
						selected: audio.value === o.value,
						onClick: () => audio.setValue(o.value),
						children: o.label
					}, o.value))
				})
			})
		});
		if (servers) list.push({
			id: "server",
			tab: "playback",
			title: "Source",
			keywords: "server host mux commons archive alternative",
			node: /* @__PURE__ */ jsx(Card, {
				title: "Source",
				description: "Where the video is streamed from. Switching keeps your place.",
				children: /* @__PURE__ */ jsx(Pills, {
					label: "Source",
					children: servers.options.map((o) => /* @__PURE__ */ jsx(Pill, {
						selected: servers.activeId === o.id,
						onClick: () => servers.onChange(o.id),
						children: o.label
					}, o.id))
				})
			})
		});
		if (segments.length > 0) list.push({
			id: "skip",
			tab: "playback",
			title: "Skip segments",
			keywords: "intro recap credits",
			node: /* @__PURE__ */ jsx(Card, {
				title: "Skip segments",
				children: /* @__PURE__ */ jsx(Pills, { children: segments.map((s) => /* @__PURE__ */ jsxs("button", {
					type: "button",
					className: "cs-chip",
					onClick: () => props.onSkip(s.end, SEGMENT_LABEL[s.type]),
					children: [
						SEGMENT_LABEL[s.type],
						" ",
						/* @__PURE__ */ jsxs("span", {
							className: "cs-tag",
							children: [
								formatTime(s.start),
								"–",
								formatTime(s.end)
							]
						})
					]
				}, s.type + s.start)) })
			})
		});
		if (props.download) {
			const d = props.download;
			list.push({
				id: "download",
				tab: "playback",
				title: "Download",
				keywords: "save file offline licence",
				node: /* @__PURE__ */ jsx(Card, {
					title: "Download",
					description: d.note,
					children: /* @__PURE__ */ jsx("div", {
						className: "cs-chips",
						children: /* @__PURE__ */ jsx("a", {
							className: "cs-chip",
							href: d.href,
							download: d.filename,
							target: "_blank",
							rel: "noreferrer",
							children: "Open file to save"
						})
					})
				})
			});
		}
		list.push({
			id: "sub-tracks",
			tab: "subtitles",
			title: "Subtitle language",
			keywords: "captions cc enable disable show hide on off",
			node: /* @__PURE__ */ jsx(SubtitleTracksCard, {})
		}, {
			id: "sub-timing",
			tab: "subtitles",
			title: "Timing and transcript",
			keywords: "offset sync delay early late alignment transcript search",
			node: /* @__PURE__ */ jsx(SubtitleTimingCard, {
				onOpenTranscript: props.onOpenTranscript,
				autoSync: props.autoSync
			})
		}, {
			id: "sub-add",
			tab: "subtitles",
			title: "Add subtitles",
			keywords: "upload srt vtt paste file local",
			node: /* @__PURE__ */ jsx(SubtitleAddCard, {})
		}, {
			id: "sub-style",
			tab: "subtitles",
			title: "Subtitle appearance",
			keywords: "size font typeface colour color background opacity position outline shadow",
			node: /* @__PURE__ */ jsx(SubtitleStyleCard, {})
		}, {
			id: "profile-a",
			tab: "appearance",
			title: "Accessibility profile",
			keywords: "preset standard high contrast large controls reduced motion",
			node: /* @__PURE__ */ jsx(ProfileCard, {})
		}, {
			id: "atmosphere",
			tab: "appearance",
			title: "Adaptive movie atmosphere",
			keywords: "theme adaptive fixed film atmosphere background colour color accent panel blur opacity ambient glow light glass solid preset artwork poster image custom",
			node: /* @__PURE__ */ jsx(AppearanceCards, {})
		}, {
			id: "dock",
			tab: "appearance",
			title: "Control dock",
			keywords: "labels compact floating expanded console buttons layout toolbar pause canvas arrangement",
			node: /* @__PURE__ */ jsx(DockCard, {})
		}, {
			id: "profile-b",
			tab: "accessibility",
			title: "Accessibility profile",
			keywords: "preset standard high contrast large controls reduced motion",
			node: /* @__PURE__ */ jsx(ProfileCard, {})
		}, {
			id: "view",
			tab: "accessibility",
			title: "Viewing preferences",
			keywords: "high contrast large controls reduce motion animation size touch",
			node: /* @__PURE__ */ jsx(ViewPrefsCard, {})
		}, {
			id: "diag",
			tab: "advanced",
			title: "Playback diagnostics",
			keywords: "health media information source duration dimensions tracks error technical",
			node: /* @__PURE__ */ jsx(Card, {
				title: "Playback diagnostics",
				description: "Live readings from the player, not a compliance certificate.",
				children: /* @__PURE__ */ jsx(DiagnosticsBody, { extraRows: props.diagnosticsRows ?? [] })
			})
		}, {
			id: "shortcuts",
			tab: "advanced",
			title: "Keyboard shortcuts",
			keywords: "keys hotkeys help keyboard",
			node: /* @__PURE__ */ jsx(Card, {
				title: "Keyboard shortcuts",
				description: "Every shortcut, grouped and searchable.",
				children: /* @__PURE__ */ jsx("div", {
					className: "cs-chips",
					children: /* @__PURE__ */ jsx("button", {
						type: "button",
						className: "cs-chip",
						onClick: props.onOpenHelp,
						children: "Show shortcuts"
					})
				})
			})
		}, {
			id: "reset",
			tab: "advanced",
			title: "Reset preferences",
			keywords: "restore default clear appearance accessibility",
			node: /* @__PURE__ */ jsx(Card, {
				title: "Reset preferences",
				description: "Restores the default appearance, accessibility and dock settings. Your saved moments and subtitles are kept.",
				children: /* @__PURE__ */ jsx("div", {
					className: "cs-chips",
					children: /* @__PURE__ */ jsx("button", {
						type: "button",
						className: "cs-chip cs-chip-danger",
						onClick: props.onResetAll,
						children: "Restore defaults"
					})
				})
			})
		});
		return list;
	})();
	const q = query.trim().toLowerCase();
	const results = q ? entries.filter((e) => {
		if (e.id === "profile-b") return false;
		const hay = `${e.title} ${e.keywords} ${TABS.find((t) => t.id === e.tab)?.label ?? ""}`.toLowerCase();
		return q.split(/\s+/).every((w) => hay.includes(w));
	}) : [];
	const tabEntries = entries.filter((e) => e.tab === tab);
	const tabLabel = (t) => TABS.find((x) => x.id === t)?.label ?? "";
	return /* @__PURE__ */ jsxs(FloatingPanel, {
		open,
		onClose,
		title: "Settings",
		wide: true,
		returnFocusTo,
		children: [/* @__PURE__ */ jsxs("div", {
			className: "cs-sethead",
			children: [
				/* @__PURE__ */ jsxs("label", {
					className: "cs-search",
					children: [/* @__PURE__ */ jsx("span", {
						className: "cs-sr",
						children: "Search settings"
					}), /* @__PURE__ */ jsx("input", {
						type: "search",
						value: query,
						onChange: (e) => setQuery(e.target.value),
						placeholder: "Search settings",
						"aria-describedby": `${baseId}-count`
					})]
				}),
				!q ? /* @__PURE__ */ jsx("div", {
					ref: tablistRef,
					className: "cs-tabs",
					role: "tablist",
					"aria-label": "Settings categories",
					children: TABS.map((t) => /* @__PURE__ */ jsx("button", {
						id: `${baseId}-tab-${t.id}`,
						type: "button",
						role: "tab",
						className: "cs-tab",
						"aria-selected": tab === t.id,
						"aria-controls": `${baseId}-panel`,
						tabIndex: tab === t.id ? 0 : -1,
						onClick: () => onTab(t.id),
						children: t.label
					}, t.id))
				}) : null,
				/* @__PURE__ */ jsx("p", {
					id: `${baseId}-count`,
					className: "cs-sr",
					role: "status",
					children: q ? `${results.length} ${results.length === 1 ? "setting matches" : "settings match"}` : ""
				})
			]
		}), /* @__PURE__ */ jsx("div", {
			id: `${baseId}-panel`,
			className: "cs-cards",
			role: q ? "region" : "tabpanel",
			"aria-label": q ? "Search results" : void 0,
			"aria-labelledby": q ? void 0 : `${baseId}-tab-${tab}`,
			children: q ? results.length === 0 ? /* @__PURE__ */ jsxs(Empty, { children: [
				"No setting matches “",
				query.trim(),
				"”. Try “speed”, “captions”, “contrast” or “theme”."
			] }) : results.map((e) => /* @__PURE__ */ jsxs("div", {
				className: "cs-result",
				children: [/* @__PURE__ */ jsx("p", {
					className: "cs-result-cat",
					children: tabLabel(e.tab)
				}), e.node]
			}, e.id)) : tabEntries.map((e) => /* @__PURE__ */ jsx("div", { children: e.node }, e.id))
		})]
	});
}
// ../player/src/skin/subtitles/TranscriptPanel.tsx
/** Searchable, timestamped transcript of the active subtitle track. Activating a line seeks to it. */
function TranscriptPanel({ open, onClose, returnFocusTo, onSeek }) {
	const { active, offset } = useSubtitles();
	const [query, setQuery] = useState("");
	const listRef = useRef(null);
	const cues = active?.cues;
	const current = usePlayer((s) => cues ? cueIndexAt(cues, s.currentTime - offset) : -1);
	const rows = useMemo(() => {
		if (!cues) return [];
		const q = query.trim().toLowerCase();
		return cues.map((c, i) => ({
			c,
			i
		})).filter(({ c }) => !q || c.text.toLowerCase().includes(q));
	}, [cues, query]);
	useEffect(() => {
		if (!open || query) return;
		listRef.current?.querySelector("[aria-current=\"true\"]")?.scrollIntoView({ block: "nearest" });
	}, [
		current,
		open,
		query
	]);
	return /* @__PURE__ */ jsx(FloatingPanel, {
		open,
		onClose,
		title: "Transcript",
		wide: true,
		returnFocusTo,
		children: !active ? /* @__PURE__ */ jsx("p", {
			className: "cs-muted",
			children: "Choose a subtitle track first. The transcript is built from the active track."
		}) : /* @__PURE__ */ jsxs(Fragment, { children: [
			/* @__PURE__ */ jsxs("label", {
				className: "cs-search",
				children: [/* @__PURE__ */ jsx("span", {
					className: "cs-sr",
					children: "Search transcript"
				}), /* @__PURE__ */ jsx("input", {
					type: "search",
					value: query,
					onChange: (e) => setQuery(e.target.value),
					placeholder: `Search ${active.label}`
				})]
			}),
			/* @__PURE__ */ jsx("p", {
				className: "cs-muted",
				role: "status",
				children: query ? `${rows.length} of ${cues?.length ?? 0} lines match` : `${cues?.length ?? 0} lines`
			}),
			/* @__PURE__ */ jsx("ul", {
				ref: listRef,
				className: "cs-transcript",
				children: rows.map(({ c, i }) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("button", {
					type: "button",
					className: "cs-line",
					"aria-current": i === current ? "true" : void 0,
					onClick: () => onSeek(Math.max(0, c.start + offset)),
					children: [/* @__PURE__ */ jsx("span", {
						className: "cs-line-time",
						children: formatTime(c.start + offset)
					}), /* @__PURE__ */ jsx("span", { children: c.text })]
				}) }, i))
			})
		] })
	});
}
// ../player/src/skin/IrisTransition.tsx
var W = 160;
var H = 90;
var BLADES = 8;
var R_MAX = Math.hypot(W, H) / 2 + 4;
var DURATION = 760;
/** Smooth in, smooth out. */
var ease = (t) => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
/** Aperture radius (0..1) and blade rotation over the run: close, hold a beat, open. */
function aperture(p) {
	if (p < .4) {
		const k = ease(p / .4);
		return {
			r: 1 - k,
			turn: k
		};
	}
	if (p < .5) return {
		r: 0,
		turn: 1
	};
	const k = ease((p - .5) / .5);
	return {
		r: k,
		turn: 1 - k
	};
}
function shapes(r, turn) {
	const cx = W / 2;
	const cy = H / 2;
	const radius = Math.max(.01, r) * R_MAX;
	const rot = turn * (Math.PI / 4);
	const pts = Array.from({ length: BLADES }, (_, i) => {
		const a = rot + i / BLADES * Math.PI * 2;
		return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius];
	});
	return {
		shade: `M -20 -20 H 180 V 110 H -20 Z ${`M ${pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(" L ")} Z`}`,
		seams: pts.map(([x, y], i) => {
			const [nx, ny] = pts[(i + 1) % BLADES];
			const dx = nx - x;
			const dy = ny - y;
			const len = Math.hypot(dx, dy) || 1;
			const reach = R_MAX * 2;
			return `M ${x.toFixed(2)} ${y.toFixed(2)} L ${(x - dx / len * reach).toFixed(2)} ${(y - dy / len * reach).toFixed(2)}`;
		}).join(" ")
	};
}
/**
* Optical Iris: a short camera-aperture close-and-open over the picture whenever the viewer explicitly switches
* films. It sits under the controls, takes no pointer events and never waits for the new film to load; it simply
* runs once alongside the switch. Reduced motion swaps it for a brief dissolve.
*/
function IrisTransition({ trigger, reduced }) {
	const [run, setRun] = useState(0);
	const [mode, setMode] = useState("iris");
	const first = useRef(true);
	const shadeRef = useRef(null);
	const seamRef = useRef(null);
	useEffect(() => {
		if (first.current) {
			first.current = false;
			return;
		}
		const prefersReduced = reduced || typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		setMode(prefersReduced ? "fade" : "iris");
		setRun((r) => r + 1);
	}, [trigger, reduced]);
	useEffect(() => {
		if (!run) return;
		let frame = 0;
		let done = false;
		const start = performance.now();
		const draw = (p) => {
			const { r, turn } = aperture(p);
			const s = shapes(r, turn);
			shadeRef.current?.setAttribute("d", s.shade);
			seamRef.current?.setAttribute("d", s.seams);
		};
		const finish = () => {
			if (done) return;
			done = true;
			cancelAnimationFrame(frame);
			setRun(0);
		};
		if (mode === "iris") {
			draw(0);
			const tick = (now) => {
				const p = Math.min(1, (now - start) / DURATION);
				draw(p);
				if (p < 1) frame = requestAnimationFrame(tick);
				else finish();
			};
			frame = requestAnimationFrame(tick);
		}
		const t = window.setTimeout(finish, mode === "iris" ? 960 : 420);
		return () => {
			cancelAnimationFrame(frame);
			window.clearTimeout(t);
		};
	}, [run, mode]);
	if (!run) return null;
	return /* @__PURE__ */ jsx("div", {
		className: "cs-iris",
		"data-mode": mode,
		"aria-hidden": "true",
		children: mode === "iris" ? /* @__PURE__ */ jsxs("svg", {
			viewBox: `0 0 ${W} ${H}`,
			preserveAspectRatio: "xMidYMid slice",
			children: [/* @__PURE__ */ jsx("path", {
				ref: shadeRef,
				className: "cs-iris-shade",
				fillRule: "evenodd"
			}), /* @__PURE__ */ jsx("path", {
				ref: seamRef,
				className: "cs-iris-seams"
			})]
		}) : null
	});
}
// ../player/src/skin/JourneyPanel.tsx
/**
* Journey Replay: the session's own trail of places the viewer jumped to, so they can step back and forth between
* them. It is history, not bookmarks: nothing here is saved; saving is what My Atlas is for.
*/
function JourneyPanel({ open, onClose, returnFocusTo, journey, thumbnailAt }) {
	return /* @__PURE__ */ jsxs(FloatingPanel, {
		open,
		onClose,
		title: "Journey",
		returnFocusTo,
		children: [/* @__PURE__ */ jsx("p", {
			className: "cs-card-desc",
			children: "Places you have jumped to in this session. Choose one to go back there; your trail is kept."
		}), /* @__PURE__ */ jsx("ol", {
			className: "cs-journey",
			"data-interactive": true,
			children: journey.stops.map((s, i) => {
				const src = thumbnailAt ? thumbnailAt(s.time, 330) : null;
				return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("button", {
					type: "button",
					className: "cs-journey-stop",
					"aria-current": i === journey.index ? "step" : void 0,
					"aria-label": `${i === 0 ? "Start: " : ""}${s.label}, ${speakTime(s.time)}${i === journey.index ? ", you are here" : ""}`,
					onClick: () => {
						journey.onGo(i);
						onClose();
					},
					children: [/* @__PURE__ */ jsx("span", {
						className: "cs-journey-still",
						"aria-hidden": "true",
						children: src ? /* @__PURE__ */ jsx("img", {
							src,
							alt: "",
							loading: "lazy"
						}) : null
					}), /* @__PURE__ */ jsxs("span", {
						className: "cs-journey-text",
						"aria-hidden": "true",
						children: [/* @__PURE__ */ jsx("span", {
							className: "cs-journey-label",
							children: i === 0 ? "Where you were" : s.label
						}), /* @__PURE__ */ jsx("span", {
							className: "cs-journey-time",
							children: formatTime(s.time)
						})]
					})]
				}) }, `${s.time}-${i}`);
			})
		})]
	});
}
// ../player/src/skin/wheel/NavigationWheel.tsx
var NAV_KEYS = /* @__PURE__ */ new Set([
	"ArrowUp",
	"ArrowDown",
	"ArrowLeft",
	"ArrowRight",
	"Home",
	"End",
	"PageUp",
	"PageDown"
]);
/** Pointer travel, in px, that turns the wheel by one frame. Roughly the arc length between two frames. */
var DRAG_STEP = {
	movies: 92,
	scenes: 74
};
/** Wheel-event travel, in px, per frame: one notch of a mouse wheel turns one frame; trackpads turn smoothly. */
var SCROLL_STEP = 100;
var SPRING_C = 27;
/** How quickly a flick loses speed (1/s). A flick at v frames/s coasts about v / FRICTION frames. */
var FRICTION = 4;
var WheelMotion = class {
	el;
	onNearest;
	pos = 0;
	vel = 0;
	target = 0;
	fan = 1;
	max = 0;
	springing = false;
	fanFrom = 1;
	fanTo = 1;
	fanStart = 0;
	fanMs = 0;
	fanDone = null;
	raf = 0;
	last = 0;
	nearest = -1;
	constructor(el, onNearest) {
		this.el = el;
		this.onNearest = onNearest;
	}
	setCount(count) {
		this.max = Math.max(0, count - 1);
	}
	write() {
		const s = this.el.style;
		s.setProperty("--wheel-h", this.pos.toFixed(4));
		s.setProperty("--wheel-fan", this.fan.toFixed(4));
		s.setProperty("--wheel-lock", (1 - Math.min(1, Math.abs(this.pos - Math.round(this.pos)) * 2.4)).toFixed(3));
		const n = clamp(Math.round(this.pos), 0, this.max);
		if (n !== this.nearest) {
			this.nearest = n;
			this.onNearest(n);
		}
	}
	/** Places the wheel at once: first paint, a new face, reduced motion. */
	jump(index) {
		this.pos = this.target = clamp(index, 0, this.max);
		this.vel = 0;
		this.springing = false;
		this.write();
	}
	/** Turns to a position on the spring, carrying whatever speed the wheel already has. */
	to(position) {
		this.target = clamp(position, 0, this.max);
		this.springing = true;
		this.run();
	}
	/** Direct manipulation: the wheel follows the pointer exactly, with a little give past either end. */
	drag(position, velocity) {
		this.pos = clamp(position, -.4, this.max + .4);
		this.vel = velocity;
		this.springing = false;
		this.write();
	}
	/** Lets go: the flick decelerates and the wheel snaps to the frame it would have come to rest nearest. */
	release() {
		const rest = this.pos + this.vel / FRICTION;
		const snap = clamp(Math.round(rest), 0, this.max);
		this.to(snap);
		return snap;
	}
	/** Folds the frames into the hub (0) or fans them back out (1). */
	fold(to, ms, done) {
		this.fanFrom = this.fan;
		this.fanTo = to;
		this.fanStart = -1;
		this.fanMs = ms;
		this.fanDone = done ?? null;
		this.run();
	}
	/** Ends every animation where it stands. */
	settle() {
		if (this.fanMs > 0) {
			this.fan = this.fanTo;
			this.fanMs = 0;
			const done = this.fanDone;
			this.fanDone = null;
			done?.();
		}
		if (this.springing) this.jump(Math.round(this.target));
	}
	stop() {
		cancelAnimationFrame(this.raf);
		this.raf = 0;
	}
	run() {
		if (this.raf) return;
		this.last = -1;
		this.raf = requestAnimationFrame(this.tick);
	}
	tick = (now) => {
		this.raf = 0;
		const dt = this.last < 0 ? 1 / 60 : Math.min(.034, Math.max(0, (now - this.last) / 1e3));
		this.last = now;
		if (this.springing) {
			for (let k = 0; k < 2; k++) {
				const h = dt / 2;
				const a = -230 * (this.pos - this.target) - SPRING_C * this.vel;
				this.vel += a * h;
				this.pos += this.vel * h;
			}
			if (Math.abs(this.pos - this.target) < .0015 && Math.abs(this.vel) < .02) {
				this.pos = this.target;
				this.vel = 0;
				this.springing = false;
			}
		}
		if (this.fanMs > 0) {
			if (this.fanStart < 0) this.fanStart = now - 1e3 / 60;
			const p = Math.min(1, (now - this.fanStart) / this.fanMs);
			const e = this.fanTo < this.fanFrom ? p * p * p : 1 - Math.pow(1 - p, 3);
			this.fan = this.fanFrom + (this.fanTo - this.fanFrom) * e;
			if (p >= 1) {
				this.fanMs = 0;
				this.fan = this.fanTo;
				const done = this.fanDone;
				this.fanDone = null;
				done?.();
			}
		}
		this.write();
		if (!this.raf && (this.springing || this.fanMs > 0)) this.raf = requestAnimationFrame(this.tick);
	};
};
/** True while the surrounding player container is narrow; the wheel then becomes a snap carousel. */
function useNarrow(ref) {
	const [narrow, setNarrow] = useState(false);
	useLayoutEffect(() => {
		const host = ref.current?.closest(".cs-root");
		if (!host || typeof ResizeObserver === "undefined") return;
		const measure = () => setNarrow(host.getBoundingClientRect().width < 761);
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(host);
		return () => ro.disconnect();
	}, [ref]);
	return narrow;
}
function prefersReducedMotion(el) {
	if (el?.closest("[data-motion=\"reduce\"]")) return true;
	return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
var pad2 = (n) => String(n).padStart(2, "0");
/**
* Focus an element, trying again on the next few frames if it cannot take focus yet (a host page's reduced-motion
* reset can leave a just-revealed subtree visibility:hidden for one frame).
*/
function focusSoon(el, preventScroll, tries = 4) {
	if (!el) return;
	el.focus({ preventScroll });
	if (document.activeElement !== el && tries > 0 && el.isConnected) requestAnimationFrame(() => focusSoon(el, preventScroll, tries - 1));
}
/**
* XENON's navigation wheel: a curved filmstrip riding round a hub. One instrument with two faces (Movies and
* Scenes). Changing face folds the frames into the hub and fans the others out of it.
*
* The wheel only ever POINTS at something while it turns. Nothing loads or seeks until the viewer chooses the
* action offered for the frame in the gate, so browsing is always safe.
*
* Motion: drag and scroll move the wheel directly; a flick coasts, decelerates and snaps to the nearest frame on
* a spring. Positions are written to CSS custom properties every animation frame, and the frames' arc, depth,
* scale and light are all computed in CSS from them, so turning costs no React renders and no layout.
*/
function NavigationWheel({ variant, sets, point, onPoint }) {
	const rootRef = useRef(null);
	const buttons = useRef([]);
	const motion = useRef(null);
	const narrow = useNarrow(rootRef);
	const [shown, setShown] = useState(variant);
	const set = sets[shown];
	const { items, activeId } = set;
	const itemCount = items.length;
	const activeIndex = Math.max(0, items.findIndex((i) => i.id === activeId));
	/** The frame nearest the gate right now (follows the animation, one render per frame passed). */
	const [nearest, setNearest] = useState(activeIndex);
	/** Where the wheel is headed: the frame the viewer aimed at. Drives the tab stop and the detail card. */
	const [aim, setAim] = useState(activeIndex);
	/** Bumped on every selection to replay the gate's confirmation flash. */
	const [fired, setFired] = useState(0);
	const [dragging, setDragging] = useState(false);
	const latest = useRef({
		aim,
		itemCount,
		shown,
		narrow,
		onPoint
	});
	latest.current = {
		aim,
		itemCount,
		shown,
		narrow,
		onPoint
	};
	/** True while a drag or scroll is turning the wheel freely: the gate frame then becomes the aim as it passes. */
	const free = useRef(false);
	/** A frame to focus once React has rendered it as the aim (it may be outside the visible arc until then). */
	const pendingFocus = useRef(null);
	/** Bumped with every focus request, so the request is honoured even when the aim does not change. */
	const [focusReq, setFocusReq] = useState(0);
	const requestFocus = (index) => {
		pendingFocus.current = index;
		setFocusReq((n) => n + 1);
	};
	const report = (index, source) => {
		latest.current.aim = index;
		setAim(index);
		latest.current.onPoint?.(latest.current.shown, index, source);
	};
	const wanted = useRef(variant);
	wanted.current = variant;
	const shownRef = useRef(shown);
	shownRef.current = shown;
	useLayoutEffect(() => {
		const el = rootRef.current;
		if (!el) return;
		const m = new WheelMotion(el, (n) => {
			setNearest(n);
			if (free.current && n !== latest.current.aim) report(n, "user");
		});
		m.setCount(itemCount);
		m.jump(activeIndex);
		motion.current = m;
		return () => m.stop();
	}, []);
	const reduced = () => prefersReducedMotion(rootRef.current);
	/** Turns to a frame: on the spring, or at once under reduced motion. */
	const turnTo = (index) => {
		const m = motion.current;
		if (!m) return;
		if (reduced() || latest.current.narrow) m.jump(index);
		else m.to(index);
	};
	useEffect(() => {
		if (variant === shown) return;
		const m = motion.current;
		if (!m || narrow || reduced()) {
			m?.settle();
			setShown(variant);
			return;
		}
		m.fold(0, 170, () => {
			if (wanted.current === shownRef.current) m.fold(1, 260);
			else setShown(wanted.current);
		});
	}, [variant]);
	const appliedPoint = useRef(null);
	const pointId = point?.id;
	useLayoutEffect(() => {
		const m = motion.current;
		if (!m) return;
		m.setCount(itemCount);
		const request = point && point.face === shown && appliedPoint.current !== point.id ? point : null;
		if (request) appliedPoint.current = request.id;
		const index = clamp(request ? request.index : activeIndex, 0, Math.max(0, itemCount - 1));
		if (m.fan < 1) {
			m.jump(index);
			if (reduced() || narrow) m.settle();
			else m.fold(1, 260);
		} else if (request) turnTo(index);
		else {
			m.jump(index);
			setNearest(index);
		}
		report(index, request ? "point" : "live");
		if (request?.focus) requestFocus(index);
	}, [
		shown,
		itemCount,
		pointId
	]);
	const prevActive = useRef(activeIndex);
	useEffect(() => {
		const was = prevActive.current;
		prevActive.current = activeIndex;
		if (was === activeIndex || free.current) return;
		if (latest.current.aim !== was) return;
		turnTo(activeIndex);
		report(activeIndex, "live");
	}, [activeIndex]);
	useEffect(() => {
		if (pendingFocus.current === null || pendingFocus.current !== aim) return;
		pendingFocus.current = null;
		focusSoon(buttons.current[aim], !narrow);
	}, [
		aim,
		narrow,
		nearest,
		focusReq
	]);
	useEffect(() => {
		if (narrow) buttons.current[aim]?.scrollIntoView?.({
			inline: "center",
			block: "nearest"
		});
	}, [aim, narrow]);
	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;
		const step = DRAG_STEP[shown];
		const onKey = (e) => {
			if (e.ctrlKey || e.metaKey || e.altKey) return;
			if (e.key === " " || e.key === "Enter") {
				e.stopPropagation();
				return;
			}
			if (!NAV_KEYS.has(e.key)) return;
			e.stopPropagation();
			e.preventDefault();
			const { aim: cur, itemCount: count } = latest.current;
			let next = cur;
			if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = cur - 1;
			else if (e.key === "ArrowDown" || e.key === "ArrowRight") next = cur + 1;
			else if (e.key === "PageUp") next = cur - 3;
			else if (e.key === "PageDown") next = cur + 3;
			else if (e.key === "Home") next = 0;
			else if (e.key === "End") next = count - 1;
			next = clamp(next, 0, Math.max(0, count - 1));
			free.current = false;
			requestFocus(next);
			turnTo(next);
			report(next, "user");
		};
		let scrollPos = 0;
		let scrolling = false;
		let scrollTimer = 0;
		const onWheel = (e) => {
			const m = motion.current;
			if (latest.current.narrow || !m) return;
			e.preventDefault();
			const px = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * root.clientHeight : e.deltaY;
			if (!scrolling) {
				scrolling = true;
				scrollPos = m.target;
				free.current = true;
			}
			const max = Math.max(0, latest.current.itemCount - 1);
			scrollPos = clamp(scrollPos + px / SCROLL_STEP, -.3, max + .3);
			if (reduced()) m.jump(Math.round(clamp(scrollPos, 0, max)));
			else m.to(scrollPos);
			window.clearTimeout(scrollTimer);
			scrollTimer = window.setTimeout(() => {
				scrolling = false;
				free.current = false;
				const snap = clamp(Math.round(scrollPos), 0, max);
				turnTo(snap);
				if (snap !== latest.current.aim) report(snap, "user");
			}, 130);
		};
		let startY = 0;
		let startPos = 0;
		let moved = false;
		let samples = [];
		const onDown = (e) => {
			const m = motion.current;
			if (latest.current.narrow || !m || e.pointerType === "mouse" && e.button !== 0) return;
			startY = e.clientY;
			startPos = m.pos;
			moved = false;
			samples = [{
				t: e.timeStamp,
				y: e.clientY
			}];
			window.addEventListener("pointermove", onMove);
			window.addEventListener("pointerup", onUp, { once: true });
			window.addEventListener("pointercancel", onUp, { once: true });
		};
		const onMove = (e) => {
			const m = motion.current;
			if (!m) return;
			const dy = e.clientY - startY;
			if (!moved && Math.abs(dy) > 6) {
				moved = true;
				free.current = true;
				setDragging(true);
			}
			if (!moved) return;
			samples.push({
				t: e.timeStamp,
				y: e.clientY
			});
			while (samples.length > 2 && e.timeStamp - samples[0].t > 90) samples.shift();
			const first = samples[0];
			const span = Math.max(1, e.timeStamp - first.t);
			const velocity = -(e.clientY - first.y) / step / span * 1e3;
			m.drag(startPos - dy / step, velocity);
		};
		const onUp = (e) => {
			window.removeEventListener("pointermove", onMove);
			const m = motion.current;
			if (!moved || !m) return;
			const lastSample = samples[samples.length - 1];
			if (lastSample && e.timeStamp - lastSample.t > 80) m.vel = 0;
			free.current = false;
			setDragging(false);
			let snap;
			if (reduced()) {
				snap = clamp(Math.round(m.pos), 0, Math.max(0, latest.current.itemCount - 1));
				m.jump(snap);
			} else snap = m.release();
			if (snap !== latest.current.aim) report(snap, "user");
			const swallow = (ev) => ev.stopPropagation();
			root.addEventListener("click", swallow, {
				capture: true,
				once: true
			});
			window.setTimeout(() => root.removeEventListener("click", swallow, { capture: true }), 0);
		};
		root.addEventListener("keydown", onKey);
		root.addEventListener("wheel", onWheel, { passive: false });
		root.addEventListener("pointerdown", onDown);
		return () => {
			root.removeEventListener("keydown", onKey);
			root.removeEventListener("wheel", onWheel);
			root.removeEventListener("pointerdown", onDown);
			window.removeEventListener("pointermove", onMove);
			window.clearTimeout(scrollTimer);
		};
	}, [shown]);
	const reach = shown === "scenes" ? 3 : 2;
	const gate = narrow ? aim : nearest;
	return /* @__PURE__ */ jsxs("div", {
		ref: rootRef,
		className: "wheel",
		"data-layout": narrow ? "carousel" : "arc",
		"data-variant": shown,
		"data-dragging": dragging || void 0,
		children: [!narrow ? /* @__PURE__ */ jsxs(Fragment, { children: [
			/* @__PURE__ */ jsx("div", {
				className: "wheel-dial",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ jsx("div", {
				className: "wheel-ring",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ jsx("div", {
				className: "wheel-light",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "wheel-hub",
				"aria-hidden": "true",
				children: [
					set.hubImage ? /* @__PURE__ */ jsx(HubLens, { src: set.hubImage }) : null,
					/* @__PURE__ */ jsxs("span", {
						className: "wheel-readout",
						children: [/* @__PURE__ */ jsx("strong", { children: itemCount > 0 ? pad2(gate + 1) : "--" }), /* @__PURE__ */ jsxs("span", { children: ["/ ", pad2(itemCount)] })]
					}),
					/* @__PURE__ */ jsx("span", {
						className: "wheel-unit",
						children: set.unit
					})
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "wheel-gate",
				"data-fired": fired > 0 || void 0,
				"aria-hidden": "true"
			}, fired),
			/* @__PURE__ */ jsx("div", {
				className: "wheel-coupler",
				"aria-hidden": "true"
			}, `coupler-${shown}-${gate}`)
		] }) : null, /* @__PURE__ */ jsx("ul", {
			className: "wheel-list",
			"aria-label": set.label,
			children: items.map((item, i) => {
				const d = i - gate;
				const hidden = !narrow && Math.abs(d) > reach + 1 && i !== aim;
				const isActive = item.id === activeId;
				return /* @__PURE__ */ jsx("li", {
					className: "wheel-li",
					"data-d": narrow ? 0 : clamp(d, -4, 4),
					"data-hidden": hidden || void 0,
					style: { ["--i"]: i },
					children: /* @__PURE__ */ jsxs("button", {
						ref: (el) => {
							buttons.current[i] = el;
						},
						type: "button",
						className: "wheel-item",
						tabIndex: i === aim ? 0 : -1,
						"aria-current": isActive ? "true" : void 0,
						"aria-hidden": hidden || void 0,
						"aria-label": `${item.label}${item.meta ? `, ${item.meta}` : ""}${isActive ? `, ${set.activeWord}` : ""}`,
						"data-active": isActive || void 0,
						"data-highlight": i === gate || void 0,
						onClick: (e) => {
							free.current = false;
							if (i !== latest.current.aim) {
								turnTo(i);
								report(i, "user");
							}
							setFired((n) => n + 1);
							set.onSelect(item.id, e.currentTarget, e.detail === 0);
						},
						onFocus: (e) => {
							let keyboard = true;
							try {
								keyboard = e.currentTarget.matches(":focus-visible");
							} catch {}
							if (keyboard && latest.current.aim !== i && !free.current) {
								turnTo(i);
								report(i, "user");
							}
						},
						children: [
							/* @__PURE__ */ jsx(Thumb, {
								src: item.image ?? null,
								fallback: item.fallbackText ?? item.label
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "wheel-caption",
								children: [/* @__PURE__ */ jsx("span", {
									className: "wheel-label",
									children: item.label
								}), item.meta ? /* @__PURE__ */ jsx("span", {
									className: "wheel-meta",
									children: item.meta
								}) : null]
							}),
							isActive ? /* @__PURE__ */ jsxs("span", {
								className: "wheel-badge",
								children: [/* @__PURE__ */ jsx("span", {
									className: "wheel-badge-dot",
									"aria-hidden": "true"
								}), set.activeWord]
							}) : null,
							item.progress && item.progress > 0 ? /* @__PURE__ */ jsx("span", {
								className: "wheel-progress",
								"aria-hidden": "true",
								children: /* @__PURE__ */ jsx("span", { style: { width: `${clamp(item.progress, 0, 1) * 100}%` } })
							}) : null
						]
					})
				}, `${shown}-${item.id}`);
			})
		})]
	});
}
function HubLens({ src }) {
	const [failed, setFailed] = useState(false);
	useEffect(() => setFailed(false), [src]);
	if (failed) return null;
	return /* @__PURE__ */ jsx("img", {
		className: "wheel-lens",
		src,
		alt: "",
		draggable: false,
		onError: () => setFailed(true)
	});
}
function Thumb({ src, fallback }) {
	const [failed, setFailed] = useState(false);
	useEffect(() => setFailed(false), [src]);
	if (!src || failed) return /* @__PURE__ */ jsx("span", {
		className: "wheel-thumb wheel-thumb-fallback",
		"aria-hidden": "true",
		children: fallback
	});
	return /* @__PURE__ */ jsx("img", {
		className: "wheel-thumb",
		src,
		alt: "",
		loading: "lazy",
		decoding: "async",
		draggable: false,
		onError: () => setFailed(true)
	});
}
// ../player/src/skin/wheel/NavigationRail.tsx
/** "3:20 ahead of you": its own subscriber, so the rail does not re-render every second. */
function Distance({ time }) {
	const d = time - usePlayer((s) => Math.floor(s.currentTime));
	return /* @__PURE__ */ jsx(Fragment, { children: Math.abs(d) < 2 ? "you are here" : d > 0 ? `${formatTime(d)} ahead of you` : `${formatTime(-d)} behind you` });
}
/**
* The navigation rail: the NAVIGATE instrument. A Movies / Scenes switch, the curved wheel, and a detail card
* for whatever sits in the wheel's gate. The card carries the only action that changes anything (Play a film,
* Jump to a scene), so turning the wheel is always safe.
*/
function NavigationRail({ films, activeFilmId, onPlayFilm, scenes, thumbnailAt, onJump, tether, target }) {
	const hasFilms = films.length > 0;
	const hasScenes = scenes.length > 0;
	const [face, setFace] = useState(hasFilms ? "movies" : "scenes");
	const [aim, setAim] = useState({
		face,
		index: 0
	});
	const [moment, setMoment] = useState(null);
	const [point, setPoint] = useState(null);
	const seq = useRef(0);
	const actionRef = useRef(null);
	const railRef = useRef(null);
	const cardRef = useRef(null);
	/** True when the card's text is taller than its box: it then becomes a focusable region keyboards can scroll. */
	const [cardScrolls, setCardScrolls] = useState(false);
	const focusAction = useRef(false);
	const playing = usePlayer((s) => sceneIndexAt(scenes, s.currentTime));
	const activeFilm = Math.max(0, films.findIndex((f) => f.id === activeFilmId));
	const kind = sceneKind(scenes);
	useEffect(() => {
		if (!hasFilms && face === "movies") setFace("scenes");
	}, [hasFilms, face]);
	useEffect(() => setMoment(null), [activeFilmId]);
	const targetId = target?.id;
	useEffect(() => {
		if (!target) return;
		const v = target.value;
		if ("moment" in v) {
			setFace("scenes");
			setMoment(v.moment);
			setPoint({
				id: ++seq.current,
				face: "scenes",
				index: Math.max(0, sceneIndexAt(scenes, v.moment.time))
			});
			focusAction.current = true;
			return;
		}
		const f = v.face === "scenes" && hasScenes ? "scenes" : hasFilms ? "movies" : "scenes";
		setFace(f);
		setMoment(null);
		setPoint({
			id: ++seq.current,
			face: f,
			index: v.index ?? (f === "movies" ? activeFilm : Math.max(0, playing)),
			focus: true
		});
	}, [targetId]);
	const onPoint = (f, index, source) => {
		setAim({
			face: f,
			index
		});
		if (source === "user") setMoment(null);
	};
	const filmItems = useMemo(() => films.map((f) => ({
		id: f.id,
		label: f.title,
		meta: f.meta,
		image: f.image ?? null,
		fallbackText: f.title,
		progress: f.progress
	})), [films]);
	const sceneItems = useMemo(() => scenes.map((s, i) => ({
		id: String(i),
		label: `${s.title} · ${formatTime(s.start)}`,
		meta: `${formatTime(s.start)}–${formatTime(s.end)}`,
		image: thumbnailAt ? thumbnailAt(s.start + 1, 330) : null,
		fallbackText: formatTime(s.start)
	})), [scenes, thumbnailAt]);
	const filmStill = films[activeFilm]?.image ?? null;
	const current = playing >= 0 ? scenes[playing] : void 0;
	let detail;
	if (moment) detail = {
		kicker: "Saved moment",
		title: moment.title,
		facts: /* @__PURE__ */ jsxs(Fragment, { children: [
			formatTime(moment.time),
			" · ",
			/* @__PURE__ */ jsx(Distance, { time: moment.time })
		] }),
		note: moment.note,
		action: {
			label: `Jump to ${formatTime(moment.time)}`,
			run: () => onJump(moment.time, moment.title)
		}
	};
	else if (face === "movies" && aim.face === "movies" && films[aim.index]) {
		const film = films[aim.index];
		const live = aim.index === activeFilm;
		detail = {
			kicker: live ? "Now playing" : `Film ${aim.index + 1} of ${films.length}`,
			title: film.title,
			facts: film.meta,
			note: film.description,
			action: live || !onPlayFilm ? null : {
				label: `Play ${film.title}`,
				run: () => onPlayFilm(film.id)
			}
		};
	} else if (face === "scenes" && aim.face === "scenes" && scenes[aim.index]) {
		const s = scenes[aim.index];
		const here = aim.index === playing;
		detail = {
			kicker: here ? "You are in" : `${kind} ${aim.index + 1} of ${scenes.length}`,
			title: s.title,
			facts: /* @__PURE__ */ jsxs(Fragment, { children: [
				formatTime(s.start),
				"–",
				formatTime(s.end),
				" · ",
				/* @__PURE__ */ jsx(Distance, { time: s.start })
			] }),
			note: s.description ?? (here ? `Part ${aim.index + 1} of ${scenes.length}. Your place is kept until you jump.` : void 0),
			action: here ? null : {
				label: `Jump to ${formatTime(s.start)}`,
				run: () => onJump(s.start, s.title)
			}
		};
	} else if (face === "movies" && films[activeFilm]) {
		const film = films[activeFilm];
		detail = {
			kicker: "Now playing",
			title: film.title,
			facts: film.meta,
			note: film.description,
			action: null
		};
	} else detail = {
		kicker: current ? "You are in" : "Scenes",
		title: current ? current.title : "Waiting for the video",
		facts: current ? `${formatTime(current.start)}–${formatTime(current.end)}` : "Scenes appear once the duration is known.",
		action: null
	};
	useEffect(() => {
		if (!focusAction.current) return;
		focusAction.current = false;
		requestAnimationFrame(() => actionRef.current?.focus({ preventScroll: true }));
	});
	useLayoutEffect(() => {
		const el = cardRef.current;
		if (!el) return;
		const measure = () => setCardScrolls(el.scrollHeight > el.clientHeight + 1);
		measure();
		if (typeof ResizeObserver === "undefined") return;
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	}, [
		detail.title,
		detail.note,
		face
	]);
	/** Enter or Space on a frame: the next Enter is the card's action (Play or Jump), one Tab-free step away. */
	const toAction = () => requestAnimationFrame(() => actionRef.current?.focus({ preventScroll: true }));
	const switchFace = (f) => {
		if (f === face) return;
		setMoment(null);
		setFace(f);
	};
	return /* @__PURE__ */ jsxs("div", {
		ref: railRef,
		className: "rail",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "rail-head",
				children: [hasFilms && hasScenes ? /* @__PURE__ */ jsxs("div", {
					className: "rail-tabs",
					role: "group",
					"aria-label": "Wheel shows",
					"data-face": face,
					children: [/* @__PURE__ */ jsxs("button", {
						type: "button",
						className: "rail-tab",
						"aria-pressed": face === "movies",
						onClick: () => switchFace("movies"),
						children: [
							/* @__PURE__ */ jsx(PlayIcon, {
								"aria-hidden": "true",
								width: "14",
								height: "14"
							}),
							"Movies ",
							/* @__PURE__ */ jsx("span", {
								className: "rail-tab-count",
								children: films.length
							})
						]
					}), /* @__PURE__ */ jsxs("button", {
						type: "button",
						className: "rail-tab",
						"aria-pressed": face === "scenes",
						onClick: () => switchFace("scenes"),
						children: [
							/* @__PURE__ */ jsx(CompassIcon, {
								"aria-hidden": "true",
								width: "14",
								height: "14"
							}),
							"Scenes ",
							/* @__PURE__ */ jsx("span", {
								className: "rail-tab-count",
								children: scenes.length
							})
						]
					})]
				}) : null, /* @__PURE__ */ jsx("p", {
					className: "rail-note",
					children: face === "movies" ? "Turn with the arrow keys, the scroll wheel or a drag. Nothing changes until you choose Play." : scenes.some((s) => s.authored) ? "Chapters of this film. Turn to one and choose Jump; your place is kept until then." : "No chapters are published for this file, so its runtime is split into equal, plainly labelled sections."
				})]
			}),
			face === "movies" || hasScenes ? /* @__PURE__ */ jsx(NavigationWheel, {
				variant: face,
				point,
				onPoint,
				sets: {
					movies: {
						items: filmItems,
						activeId: activeFilmId ?? null,
						onSelect: (_id, _el, keyboard) => {
							if (keyboard) toAction();
						},
						label: "Films",
						activeWord: "Now showing",
						unit: "Films",
						hubImage: filmStill
					},
					scenes: {
						items: sceneItems,
						activeId: playing >= 0 ? String(playing) : null,
						onSelect: (_id, _el, keyboard) => {
							setMoment(null);
							if (keyboard) toAction();
						},
						label: `${kind}s of ${films[activeFilm]?.title ?? "this video"}`,
						activeWord: "Now",
						unit: `${kind}s`,
						hubImage: current && thumbnailAt ? thumbnailAt(current.start + 1, 330) : filmStill
					}
				}
			}) : /* @__PURE__ */ jsx("p", {
				className: "rail-wait",
				children: "Waiting for the video duration before scenes can be listed."
			}),
			/* @__PURE__ */ jsxs("div", {
				ref: cardRef,
				className: "rail-detail",
				"data-face": moment ? "moment" : face,
				...cardScrolls ? {
					tabIndex: 0,
					role: "region",
					"aria-label": `${detail.kicker}: ${detail.title}`
				} : {},
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "rail-kicker",
						children: detail.kicker
					}),
					/* @__PURE__ */ jsx("h2", { children: detail.title }),
					detail.facts ? /* @__PURE__ */ jsx("p", {
						className: "rail-facts",
						children: detail.facts
					}) : null,
					detail.note ? /* @__PURE__ */ jsx("p", {
						className: "rail-note-body",
						children: detail.note
					}) : null,
					detail.action || tether ? /* @__PURE__ */ jsxs("div", {
						className: "rail-actions",
						children: [detail.action ? /* @__PURE__ */ jsxs("button", {
							ref: actionRef,
							type: "button",
							className: "cs-chip cs-chip-primary rail-primary",
							onClick: () => {
								detail.action?.run();
								requestAnimationFrame(() => {
									if ((!document.activeElement || document.activeElement === document.body) && !railRef.current?.closest("[inert]")) railRef.current?.querySelector(".wheel-item[tabindex=\"0\"]")?.focus({ preventScroll: true });
								});
							},
							children: [/* @__PURE__ */ jsx(PlayIcon, {
								"aria-hidden": "true",
								width: "14",
								height: "14"
							}), detail.action.label]
						}) : null, tether ? /* @__PURE__ */ jsxs("button", {
							type: "button",
							className: "cs-chip rail-secondary",
							onClick: tether.onReturn,
							children: [
								/* @__PURE__ */ jsx(ReturnIcon, {
									"aria-hidden": "true",
									width: "14",
									height: "14"
								}),
								" Back to ",
								formatTime(tether.time)
							]
						}) : null]
					}) : null
				]
			})
		]
	});
}
// ../player/src/skin/CinemaSkin.tsx
var SkinContext = createContext(null);
function useCinemaSkin() {
	const ctx = useContext(SkinContext);
	if (!ctx) throw new Error("useCinemaSkin must be used inside <CinemaSkin>");
	return ctx;
}
var SCRIM_LABEL = {
	default: "Default",
	"high-contrast": "High contrast",
	theater: "Theater"
};
function isEditable(target) {
	if (!(target instanceof HTMLElement)) return false;
	return target.isContentEditable || [
		"INPUT",
		"TEXTAREA",
		"SELECT"
	].includes(target.tagName);
}
var NO_SCENES = [];
var NO_FILMS = [];
function CinemaSkin(props) {
	return /* @__PURE__ */ jsx(AppearanceProvider, {
		artwork: props.artwork,
		artworkLabel: props.artworkLabel,
		palette: props.palette,
		children: /* @__PURE__ */ jsx(PrefsProvider, {
			forceHighContrast: props.forceHighContrast,
			children: /* @__PURE__ */ jsx(SubtitleProvider, {
				mediaKey: props.mediaKey ?? "default",
				children: /* @__PURE__ */ jsx(SkinInner, { ...props })
			})
		})
	});
}
function SkinInner({ children, title, subtitle, railSlot, atlasSlot, topActions, markers, onSaveMoment, diagnosticsRows, defaultMode = "watch", className, notice, qualities, servers, segments, download, autoSync, onShareClip, initialClip, onJump, returnAnchor, artwork, onAtmosphere, scenes = NO_SCENES, thumbnailAt, films = NO_FILMS, activeFilmId, onPlayFilm, journey, mediaKey, videoOverlay, stageSlot, scenePreview }) {
	const store = usePlayer();
	const media = useMedia();
	const subs = useSubtitles();
	const look = useAppearance();
	const view = usePrefs();
	const wrapRef = useRef(null);
	const railRef = useRef(null);
	const reelRef = useRef(null);
	const { tier, width: stageWidth } = useWidthTier(wrapRef);
	const layout = view.prefs.dockLayout;
	const [mode, setModeState] = useState(defaultMode);
	const [scrim, setScrim] = useState(() => loadPrefs().scrim);
	const [helpOpen, setHelpOpen] = useState(false);
	const [diagOpen, setDiagOpen] = useState(false);
	const [status, setStatus] = useState("");
	const [panel, setPanel] = useState(null);
	const [settingsTab, setSettingsTab] = useState("playback");
	const [panelOpener, setPanelOpener] = useState(null);
	const [clip, setClip] = useState(initialClip ?? EMPTY_CLIP);
	const [lens, setLens] = useState(null);
	const [drawer, setDrawer] = useState(false);
	const [drawerClosing, setDrawerClosing] = useState(false);
	const [navTarget, setNavTarget] = useState(null);
	const navSeq = useRef(0);
	const drawerOpener = useRef(null);
	const clipRun = useRef(false);
	const hasNav = films.length > 0 || scenes.length > 0;
	const hasRail = hasNav || Boolean(railSlot);
	const hasModes = Boolean(hasRail || atlasSlot);
	const effectiveMode = mode === "explore" && !hasRail ? "watch" : mode === "remember" && !atlasSlot ? "watch" : mode;
	const drawerOpen = drawer && effectiveMode !== "explore" && hasRail;
	const reduced = view.prefs.reducedMotion;
	const setMode = useCallback((m) => {
		setModeState(m);
		setDrawer(false);
	}, []);
	const announce = useCallback((message) => {
		setStatus("");
		window.setTimeout(() => setStatus(message), 30);
	}, []);
	const noticeId = notice?.id;
	const noticeMessage = notice?.message;
	useEffect(() => {
		if (noticeId !== void 0 && noticeMessage) announce(noticeMessage);
	}, [
		noticeId,
		noticeMessage,
		announce
	]);
	useEffect(() => {
		if (!status) return;
		const t = window.setTimeout(() => setStatus(""), 4e3);
		return () => window.clearTimeout(t);
	}, [status]);
	const resolved = look.resolved;
	useEffect(() => {
		onAtmosphere?.(resolved);
	}, [resolved, onAtmosphere]);
	const openPanel = (name, opener) => {
		setPanelOpener(opener ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null));
		setPanel(name);
	};
	const closePanel = () => setPanel(null);
	const toggleSimple = (name, opener) => panel === name ? closePanel() : openPanel(name, opener);
	/** Settings is one panel with five tabs; callers pick the tab to land on. */
	const toggleSettings = (tab, opener) => {
		if (panel === "settings" && (tab === null || tab === settingsTab)) return closePanel();
		if (tab) setSettingsTab(tab);
		openPanel("settings", opener);
	};
	const toggleLens = (opener) => {
		if (lens) setLens(null);
		else {
			setPanel(null);
			setLens({ opener });
		}
	};
	const closeNavigation = useCallback(() => setDrawer(false), []);
	const drawerWasOpen = useRef(false);
	const closingTimer = useRef(0);
	const stopClosing = useRef(() => {});
	useEffect(() => () => stopClosing.current(), []);
	useLayoutEffect(() => {
		const rail = railRef.current;
		if (drawerOpen) {
			drawerWasOpen.current = true;
			stopClosing.current();
			setDrawerClosing(false);
			requestAnimationFrame(() => {
				if (rail && rail.getBoundingClientRect().top > window.innerHeight - 80) rail.scrollIntoView({ block: "nearest" });
				if (rail?.contains(document.activeElement)) return;
				[
					".wheel-item[tabindex=\"0\"]",
					".rail-tab[aria-pressed=\"true\"]",
					".cs-rail-body button"
				].map((q) => rail?.querySelector(q)).find(Boolean)?.focus({ preventScroll: true });
			});
			const onDown = (e) => {
				const t = e.target;
				if (!t || rail?.contains(t) || t.closest(".cs-reel, .cs-panel, dialog, [data-nav-opener]")) return;
				setDrawer(false);
			};
			document.addEventListener("pointerdown", onDown, true);
			return () => document.removeEventListener("pointerdown", onDown, true);
		}
		if (drawerWasOpen.current) {
			drawerWasOpen.current = false;
			const still = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
			if (effectiveMode !== "explore" && !reduced && !still) {
				setDrawerClosing(true);
				stopClosing.current();
				const onEnd = (e) => {
					if (e.target === rail && e.animationName === "cs-drawer-out") done();
				};
				const stop = () => {
					window.clearTimeout(closingTimer.current);
					rail?.removeEventListener("animationend", onEnd);
				};
				const done = () => {
					stop();
					setDrawerClosing(false);
				};
				stopClosing.current = stop;
				rail?.addEventListener("animationend", onEnd);
				closingTimer.current = window.setTimeout(done, 600);
				requestAnimationFrame(() => {
					if (rail && !getComputedStyle(rail).animationName.includes("cs-drawer-out")) done();
				});
			}
			const active = document.activeElement;
			if (!active || active === document.body || rail?.contains(active)) (drawerOpener.current?.isConnected && !drawerOpener.current.closest("[inert]") ? drawerOpener.current : reelRef.current)?.focus({ preventScroll: true });
			drawerOpener.current = null;
		}
	}, [drawerOpen]);
	const openNavigation = useCallback((target, opener) => {
		setNavTarget({
			id: ++navSeq.current,
			value: target
		});
		if (mode !== "explore") {
			drawerOpener.current = opener ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
			setDrawer(true);
		} else if (look.wheelCollapsed) look.setWheelCollapsed(false);
	}, [mode, look]);
	const filmsFace = films.length > 0 ? "movies" : "scenes";
	const clipEnd = clip.end;
	const clipStart = clip.start;
	const clipLoop = clip.loop;
	useEffect(() => {
		if (!media || clipEnd === null || clipStart === null || clipEnd <= clipStart) return;
		const tick = () => {
			if (!media.paused && media.currentTime >= clipEnd) {
				if (clipLoop) media.currentTime = clipStart;
				else if (clipRun.current) {
					clipRun.current = false;
					media.pause();
				}
			}
		};
		const id = window.setInterval(tick, 40);
		return () => window.clearInterval(id);
	}, [
		media,
		clipStart,
		clipEnd,
		clipLoop
	]);
	const playClip = () => {
		if (clipStart === null || clipEnd === null) return;
		clipRun.current = true;
		store.seek(clipStart);
		store.play();
		announce(`Playing clip ${clipStart.toFixed(0)} to ${clipEnd.toFixed(0)} seconds`);
	};
	const cycleScrim = () => {
		const next = SCRIM_MODES[(SCRIM_MODES.indexOf(scrim) + 1) % SCRIM_MODES.length] ?? "default";
		setScrim(next);
		savePrefs({ scrim: next });
		announce(`Scrim: ${SCRIM_LABEL[next]}`);
	};
	const resetAll = () => {
		view.reset();
		look.reset();
		setScrim("default");
		savePrefs({ scrim: "default" });
		announce("Appearance, accessibility and dock settings restored to defaults");
	};
	/** Every intentional jump goes through the host (which keeps the Return Anchor and announces it), or seeks here. */
	const jump = (time, label) => {
		if (onJump) onJump(time, label);
		else {
			store.seek(time);
			announce(`Jumped to ${label}, ${formatTime(time)}`);
		}
	};
	/** Scene previews from the dock, the lens and the Pause Canvas all go to the same instrument: the wheel. */
	const previewScene = (index, opener) => openNavigation({
		face: "scenes",
		index
	}, opener);
	/** Explicit film switch from the wheel: the iris marks it, the drawer gets out of the way. */
	const currentSrc = usePlayer((s) => s.currentSrc);
	const canPlayNow = usePlayer((s) => s.canPlay);
	const playAfterSwitch = useRef(null);
	const playFilm = useCallback((id) => {
		playAfterSwitch.current = currentSrc || "";
		onPlayFilm?.(id);
		setDrawer(false);
	}, [onPlayFilm, currentSrc]);
	useEffect(() => {
		const from = playAfterSwitch.current;
		if (from === null || !canPlayNow || !currentSrc || currentSrc === from) return;
		playAfterSwitch.current = null;
		store.play();
	}, [
		canPlayNow,
		currentSrc,
		store
	]);
	const onKeyDown = (e) => {
		if (isEditable(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
		if (e.target.closest?.("dialog")) return;
		const inPanel = e.target.closest(".cs-panel, .cs-atlas, .cs-lens");
		if ((e.key === "x" || e.key === "X") && playbackPaused && !inPanel && !e.target.closest(".cs-rail")) {
			e.preventDefault();
			toggleClearFrame();
		} else if (e.key === "Escape" && drawerOpen) {
			e.preventDefault();
			setDrawer(false);
		} else if (e.key === "?") {
			e.preventDefault();
			setHelpOpen(true);
		} else if ((e.key === "t" || e.key === "T") && !inPanel) {
			e.preventDefault();
			toggleLens(document.activeElement instanceof HTMLElement ? document.activeElement : null);
		} else if ((e.key === "w" || e.key === "W") && hasRail && !inPanel) {
			e.preventDefault();
			if (effectiveMode === "explore") {
				if (look.wheelCollapsed) look.setWheelCollapsed(false);
				requestAnimationFrame(() => (railRef.current?.querySelector(".wheel-item[tabindex=\"0\"]") ?? railRef.current?.querySelector(".rail-tab"))?.focus());
			} else if (drawerOpen) setDrawer(false);
			else {
				const here = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : reelRef.current;
				openNavigation({ face: filmsFace }, here);
			}
		} else if ((e.key === "c" || e.key === "C") && !e.target.closest(".cs-panel, .cs-rail, .cs-atlas")) {
			e.preventDefault();
			if (subs.tracks.length === 0) announce("No subtitles available. Open the subtitle settings to add some.");
			else {
				subs.toggle();
				announce(subs.active ? "Captions off" : "Captions on");
			}
		}
	};
	const layoutRef = useRef(null);
	const keyHandler = useRef(onKeyDown);
	keyHandler.current = onKeyDown;
	useEffect(() => {
		const root = layoutRef.current?.closest(".cs-root");
		if (!root) return;
		const listen = (e) => keyHandler.current(e);
		root.addEventListener("keydown", listen);
		return () => root.removeEventListener("keydown", listen);
	}, []);
	const ctx = useMemo(() => ({
		mode: effectiveMode,
		setMode,
		announce,
		tier,
		openNavigation,
		closeNavigation
	}), [
		effectiveMode,
		setMode,
		announce,
		tier,
		openNavigation,
		closeNavigation
	]);
	const hasScenes = scenes.length > 0;
	const busy = Boolean(lens || drawerOpen || panel);
	const playbackPaused = usePlayer((s) => s.paused);
	const playback = usePlayer((s) => s.ended) ? "ended" : playbackPaused ? "paused" : "playing";
	const momentCount = useMemo(() => (markers ?? []).filter((m) => m.kind === "moment").length, [markers]);
	const [savedFlash, setSavedFlash] = useState(0);
	const lastMoments = useRef({
		key: mediaKey,
		n: momentCount
	});
	useEffect(() => {
		const prev = lastMoments.current;
		lastMoments.current = {
			key: mediaKey,
			n: momentCount
		};
		if (prev.key === mediaKey && momentCount > prev.n) setSavedFlash((f) => f + 1);
	}, [momentCount, mediaKey]);
	useEffect(() => {
		if (!savedFlash) return;
		const t = window.setTimeout(() => setSavedFlash(0), 900);
		return () => window.clearTimeout(t);
	}, [savedFlash]);
	const [frameCleared, setFrameCleared] = useState(false);
	useEffect(() => {
		if (!playbackPaused) setFrameCleared(false);
	}, [playbackPaused]);
	const toggleClearFrame = () => {
		const next = !frameCleared;
		setFrameCleared(next);
		announce(next ? "Frame cleared. Press X to show the pause information again." : "Pause information shown");
		if (next) requestAnimationFrame(() => {
			const a = document.activeElement;
			if (!a || a === document.body || !a.isConnected || a.closest(".cs-pause")) wrapRef.current?.querySelector(".cs-pod-play")?.focus({ preventScroll: true });
		});
	};
	return /* @__PURE__ */ jsx(SkinContext.Provider, {
		value: ctx,
		children: /* @__PURE__ */ jsxs(Container, {
			className: `cs-root ${className ?? ""}`,
			"data-scrim": scrim,
			"data-mode": effectiveMode,
			"data-playback": playback,
			"data-atm": look.derived.active ? "on" : "off",
			"data-bg": look.appearance.background,
			"data-has-rail": hasRail ? "" : void 0,
			"data-rail": look.wheelCollapsed ? "collapsed" : "open",
			"data-drawer": drawerOpen ? "open" : drawerClosing && effectiveMode !== "explore" ? "closing" : void 0,
			"data-dock": layout,
			"data-lens": lens ? "open" : void 0,
			"data-tier": tier,
			"data-large": view.prefs.largeControls || void 0,
			"data-hc": view.highContrast || void 0,
			"data-motion": reduced ? "reduce" : void 0,
			"data-dock-labels": view.prefs.dockLabels ? "on" : "off",
			"data-dock-compact": view.prefs.dockCompact || void 0,
			"data-theme": "cinema",
			style: look.cssVars,
			children: [
				/* @__PURE__ */ jsx(Atmosphere, {}),
				/* @__PURE__ */ jsxs("div", {
					className: "cs-layout",
					ref: layoutRef,
					children: [
						hasRail ? /* @__PURE__ */ jsx("section", {
							ref: railRef,
							id: "cs-rail",
							className: "cs-rail",
							"aria-label": "Navigate films and scenes",
							inert: !(effectiveMode === "explore" || drawerOpen),
							"data-interactive": true,
							children: /* @__PURE__ */ jsxs("div", {
								className: "cs-rail-inner",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "cs-rail-bar",
									children: [/* @__PURE__ */ jsxs("span", {
										className: "cs-rail-title",
										"aria-hidden": "true",
										children: [/* @__PURE__ */ jsx(ReelIcon, {}), " Navigate"]
									}), drawerOpen ? /* @__PURE__ */ jsx("button", {
										type: "button",
										className: "cs-icon-btn cs-rail-toggle",
										"aria-label": "Close navigation",
										"data-tip": "Close (Esc)",
										"data-tip-align": "end",
										onClick: () => setDrawer(false),
										children: /* @__PURE__ */ jsx(ChevronLeftIcon, {})
									}) : /* @__PURE__ */ jsx("button", {
										type: "button",
										className: "cs-icon-btn cs-rail-toggle",
										"aria-expanded": !look.wheelCollapsed,
										"aria-controls": "cs-rail-body",
										"aria-label": look.wheelCollapsed ? "Expand navigation" : "Collapse navigation",
										"data-tip": look.wheelCollapsed ? "Expand" : "Collapse",
										"data-tip-align": "end",
										onClick: () => {
											look.setWheelCollapsed(!look.wheelCollapsed);
											announce(look.wheelCollapsed ? "Navigation expanded" : "Navigation collapsed");
										},
										children: /* @__PURE__ */ jsx(ChevronLeftIcon, {})
									})]
								}), /* @__PURE__ */ jsxs("div", {
									id: "cs-rail-body",
									className: "cs-rail-body",
									inert: look.wheelCollapsed && !drawerOpen,
									children: [hasNav ? /* @__PURE__ */ jsx(NavigationRail, {
										films,
										activeFilmId,
										onPlayFilm: onPlayFilm ? playFilm : void 0,
										scenes,
										thumbnailAt,
										onJump: (t, label) => {
											jump(t, label);
											if (drawerOpen) setDrawer(false);
										},
										tether: returnAnchor,
										target: navTarget
									}) : null, railSlot]
								})]
							})
						}) : null,
						/* @__PURE__ */ jsxs("div", {
							ref: wrapRef,
							className: "cs-stagewrap",
							"data-tier": tier,
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "cs-stage",
									children: [
										children,
										/* @__PURE__ */ jsx(IrisTransition, {
											trigger: mediaKey ?? "",
											reduced
										}),
										videoOverlay ? /* @__PURE__ */ jsx("div", {
											className: "cs-video-overlay",
											"aria-hidden": "true",
											children: videoOverlay
										}) : null,
										/* @__PURE__ */ jsx(PauseCanvas, {
											title,
											subtitle,
											scenes,
											thumbnailAt,
											onSaveMoment,
											returnAnchor,
											onPreviewScene: previewScene,
											tier,
											suppressed: !view.prefs.pauseCanvas || busy || layout === "floating" && tier !== "full",
											cleared: frameCleared,
											onClear: toggleClearFrame
										}),
										/* @__PURE__ */ jsx(TailSlate, {
											cleared: frameCleared,
											onClear: toggleClearFrame,
											title,
											films,
											activeFilmId,
											onPlayFilm: onPlayFilm ? playFilm : void 0,
											onOpenWheel: hasRail && films.length > 1 ? (el) => openNavigation({ face: "movies" }, el) : void 0,
											thumbnailAt,
											onAnnounce: announce,
											tier,
											suppressed: busy || layout === "floating" && tier !== "full"
										}),
										/* @__PURE__ */ jsx(SeekLens, {}),
										/* @__PURE__ */ jsx(CaptionOverlay, {}),
										hasRail && effectiveMode === "watch" && tier !== "micro" ? /* @__PURE__ */ jsx(ReelHandle, {
											buttonRef: reelRef,
											open: drawerOpen,
											onToggle: (el) => drawerOpen ? setDrawer(false) : openNavigation({ face: filmsFace }, el),
											artwork: artwork ?? null,
											controlsId: "cs-rail"
										}) : null,
										/* @__PURE__ */ jsx(Controls.Root, { children: /* @__PURE__ */ jsxs(Controls.Content, {
											className: "cs-controls",
											children: [
												/* @__PURE__ */ jsx(TopBar, {
													title,
													subtitle,
													tier,
													hasModes,
													mode: effectiveMode,
													onMode: setMode,
													showAtlas: Boolean(atlasSlot),
													showRail: hasRail,
													scrim,
													onScrim: cycleScrim,
													onHelp: () => setHelpOpen(true),
													onDiag: () => setDiagOpen(true),
													onAppearance: (el) => toggleSettings("appearance", el),
													appearanceOpen: panel === "settings" && settingsTab === "appearance",
													extra: topActions
												}),
												layout === "floating" ? /* @__PURE__ */ jsx("div", {
													className: "cs-center",
													children: /* @__PURE__ */ jsx(PlaybackPod, { placement: "stage" })
												}) : /* @__PURE__ */ jsx("div", {
													className: "cs-center",
													"aria-hidden": "true"
												}),
												/* @__PURE__ */ jsx(BottomBar, {
													tier,
													stageWidth,
													layout,
													markers: markers ?? [],
													scenes,
													thumbnailAt,
													scenePreview,
													clip,
													onSaveMoment,
													panel,
													settingsTab,
													onSettings: (tab, el) => toggleSettings(tab, el),
													onSimple: toggleSimple,
													lensOpen: Boolean(lens),
													onLens: toggleLens,
													onScenes: hasScenes ? (el) => openNavigation({ face: "scenes" }, el) : void 0,
													navOpen: drawerOpen,
													tether: returnAnchor,
													journey,
													filmprintKey: mediaKey,
													lens: lens ? /* @__PURE__ */ jsx(TimeLens, {
														onClose: () => setLens(null),
														returnFocusTo: lens.opener,
														scenes,
														thumbnailAt,
														markers: markers ?? [],
														onJump: jump
													}) : null
												})
											]
										}) }),
										/* @__PURE__ */ jsx(SkipButton, {
											segments,
											onSkip: jump
										}),
										/* @__PURE__ */ jsx(LoadingState, {}),
										/* @__PURE__ */ jsx("p", {
											className: "cs-toast",
											role: "status",
											"aria-live": "polite",
											children: status
										})
									]
								}),
								/* @__PURE__ */ jsx(Lightmeter, { mediaKey }),
								/* @__PURE__ */ jsx(SettingsPanel, {
									open: panel === "settings",
									onClose: closePanel,
									returnFocusTo: panelOpener,
									tab: settingsTab,
									onTab: setSettingsTab,
									onOpenTranscript: () => openPanel("transcript", panelOpener),
									onOpenHelp: () => setHelpOpen(true),
									onResetAll: resetAll,
									qualities,
									servers,
									segments,
									download,
									autoSync,
									diagnosticsRows,
									onSkip: jump
								}),
								/* @__PURE__ */ jsx(TranscriptPanel, {
									open: panel === "transcript",
									onClose: closePanel,
									returnFocusTo: panelOpener,
									onSeek: (t) => jump(t, "Transcript line")
								}),
								/* @__PURE__ */ jsx(ClipPanel, {
									open: panel === "clip",
									onClose: closePanel,
									returnFocusTo: panelOpener,
									clip,
									onChange: setClip,
									onPlay: playClip,
									onAnnounce: announce,
									onShare: onShareClip
								}),
								journey && journey.stops.length > 1 ? /* @__PURE__ */ jsx(JourneyPanel, {
									open: panel === "journey",
									onClose: closePanel,
									returnFocusTo: panelOpener,
									journey,
									thumbnailAt
								}) : null,
								/* @__PURE__ */ jsx(MorePanel, {
									open: panel === "more",
									onClose: closePanel,
									returnFocusTo: panelOpener,
									tier,
									onSaveMoment,
									onClip: () => openPanel("clip", panelOpener),
									onLens: () => toggleLens(panelOpener),
									onDial: hasScenes ? () => openNavigation({ face: "scenes" }, panelOpener) : void 0,
									onWheel: hasRail && effectiveMode !== "explore" ? () => openNavigation({ face: filmsFace }, panelOpener) : void 0,
									onJourney: journey && journey.stops.length > 1 ? () => openPanel("journey", panelOpener) : void 0,
									onSettings: (tab) => {
										setSettingsTab(tab);
										openPanel("settings", panelOpener);
									},
									onScrim: cycleScrim,
									scrim,
									onDiag: () => setDiagOpen(true),
									onHelp: () => setHelpOpen(true),
									extra: topActions
								}),
								stageSlot
							]
						}),
						atlasSlot ? /* @__PURE__ */ jsx("section", {
							className: "cs-atlas",
							"aria-label": "My Atlas: saved moments",
							inert: effectiveMode !== "remember",
							children: /* @__PURE__ */ jsx("div", {
								className: "cs-atlas-inner",
								children: atlasSlot
							})
						}) : null
					]
				}),
				/* @__PURE__ */ jsx(PhotonFrame, { flash: savedFlash }),
				/* @__PURE__ */ jsx(KeymapDialog, {
					open: helpOpen,
					onClose: () => setHelpOpen(false)
				}),
				/* @__PURE__ */ jsx(DiagnosticsDialog, {
					open: diagOpen,
					onClose: () => setDiagOpen(false),
					extraRows: diagnosticsRows
				}),
				/* @__PURE__ */ jsx(Hotkey, {
					keys: "Space",
					action: "togglePaused"
				}),
				/* @__PURE__ */ jsx(Hotkey, {
					keys: "k",
					action: "togglePaused"
				}),
				/* @__PURE__ */ jsx(Hotkey, {
					keys: "m",
					action: "toggleMuted"
				}),
				/* @__PURE__ */ jsx(Hotkey, {
					keys: "f",
					action: "toggleFullscreen"
				}),
				/* @__PURE__ */ jsx(Hotkey, {
					keys: "i",
					action: "togglePictureInPicture"
				}),
				/* @__PURE__ */ jsx(Hotkey, {
					keys: "ArrowLeft",
					action: "seekStep",
					value: -10
				}),
				/* @__PURE__ */ jsx(Hotkey, {
					keys: "ArrowRight",
					action: "seekStep",
					value: 10
				}),
				/* @__PURE__ */ jsx(Hotkey, {
					keys: "j",
					action: "seekStep",
					value: -10
				}),
				/* @__PURE__ */ jsx(Hotkey, {
					keys: "l",
					action: "seekStep",
					value: 10
				}),
				/* @__PURE__ */ jsx(Hotkey, {
					keys: "ArrowUp",
					action: "volumeStep",
					value: .1
				}),
				/* @__PURE__ */ jsx(Hotkey, {
					keys: "ArrowDown",
					action: "volumeStep",
					value: -.1
				}),
				/* @__PURE__ */ jsx(Gesture, {
					type: "tap",
					action: "togglePaused",
					pointer: "mouse",
					region: "center"
				}),
				/* @__PURE__ */ jsx(Gesture, {
					type: "tap",
					action: "toggleControls",
					pointer: "touch"
				}),
				/* @__PURE__ */ jsx(Gesture, {
					type: "doubletap",
					action: "seekStep",
					value: -10,
					region: "left"
				}),
				/* @__PURE__ */ jsx(Gesture, {
					type: "doubletap",
					action: "seekStep",
					value: 10,
					region: "right"
				}),
				/* @__PURE__ */ jsx(StatusAnnouncer, { className: "cs-announcer" }),
				/* @__PURE__ */ jsx(ErrorDialog.Root, { children: /* @__PURE__ */ jsxs(ErrorDialog.Popup, {
					className: "cs-error",
					children: [
						/* @__PURE__ */ jsx(ErrorDialog.Title, { className: "cs-error-title" }),
						/* @__PURE__ */ jsx(ErrorDialog.Description, { className: "cs-error-desc" }),
						/* @__PURE__ */ jsxs("div", {
							className: "cs-error-actions",
							children: [/* @__PURE__ */ jsx("button", {
								type: "button",
								className: "cs-btn cs-btn-label",
								onClick: () => {
									store.dismissError();
									media?.load();
								},
								children: /* @__PURE__ */ jsx("span", { children: "Try again" })
							}), /* @__PURE__ */ jsx(ErrorDialog.Close, { className: "cs-btn cs-btn-label" })]
						})
					]
				}) })
			]
		})
	});
}
function TopBar(p) {
	const tiny = p.tier === "tiny" || p.tier === "micro";
	return /* @__PURE__ */ jsxs("div", {
		className: "cs-top",
		children: [!tiny ? /* @__PURE__ */ jsxs("div", {
			className: "cs-titleblock",
			children: [p.title ? /* @__PURE__ */ jsx("p", {
				className: "cs-title",
				children: p.title
			}) : null, p.subtitle ? /* @__PURE__ */ jsx("p", {
				className: "cs-subtitle",
				children: p.subtitle
			}) : null]
		}) : null, /* @__PURE__ */ jsxs("div", {
			className: "cs-toolbar",
			children: [p.hasModes ? /* @__PURE__ */ jsxs("div", {
				className: "cs-seg",
				role: "group",
				"aria-label": "View mode",
				children: [
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						className: "cs-seg-btn",
						"aria-pressed": p.mode === "watch",
						onClick: () => p.onMode("watch"),
						children: [
							/* @__PURE__ */ jsx(PlayIcon, {}),
							" ",
							/* @__PURE__ */ jsx("span", { children: "Watch" })
						]
					}),
					p.showRail ? /* @__PURE__ */ jsxs("button", {
						type: "button",
						className: "cs-seg-btn",
						"aria-pressed": p.mode === "explore",
						onClick: () => p.onMode("explore"),
						children: [
							/* @__PURE__ */ jsx(CompassIcon, {}),
							" ",
							/* @__PURE__ */ jsx("span", { children: "Explore" })
						]
					}) : null,
					p.showAtlas ? /* @__PURE__ */ jsxs("button", {
						type: "button",
						className: "cs-seg-btn",
						"aria-pressed": p.mode === "remember",
						onClick: () => p.onMode("remember"),
						children: [
							/* @__PURE__ */ jsx(BookmarkIcon, {}),
							" ",
							/* @__PURE__ */ jsx("span", { children: "My Atlas" })
						]
					}) : null
				]
			}) : null, !tiny ? /* @__PURE__ */ jsxs(Fragment, { children: [
				p.extra,
				/* @__PURE__ */ jsx("button", {
					type: "button",
					className: "cs-icon-btn",
					onClick: p.onScrim,
					"aria-label": `Change scrim. Current: ${SCRIM_LABEL[p.scrim]}`,
					"data-tip": `Scrim: ${SCRIM_LABEL[p.scrim]}`,
					"data-tip-pos": "below",
					children: /* @__PURE__ */ jsx(ScrimIcon, {})
				}),
				/* @__PURE__ */ jsx("button", {
					type: "button",
					className: "cs-icon-btn",
					"data-panel-toggle": true,
					"aria-expanded": p.appearanceOpen,
					"aria-haspopup": "dialog",
					"aria-label": "Appearance settings",
					"data-tip": "Appearance",
					"data-tip-pos": "below",
					onClick: (e) => p.onAppearance(e.currentTarget),
					children: /* @__PURE__ */ jsx(PaletteIcon, {})
				}),
				/* @__PURE__ */ jsx("button", {
					type: "button",
					className: "cs-icon-btn",
					onClick: p.onDiag,
					"aria-label": "Open player health",
					"data-tip": "Player health",
					"data-tip-pos": "below",
					children: /* @__PURE__ */ jsx(PulseIcon, {})
				}),
				/* @__PURE__ */ jsx("button", {
					type: "button",
					className: "cs-icon-btn",
					onClick: p.onHelp,
					"aria-label": "Open keyboard shortcuts",
					"data-tip": "Shortcuts (?)",
					"data-tip-pos": "below",
					"data-tip-align": "end",
					children: /* @__PURE__ */ jsx(HelpIcon, {})
				})
			] }) : null]
		})]
	});
}
/** Spinner for the first load, with a visible label so it is never a mystery. Mid-play buffering spins the play bezel. */
function LoadingState() {
	const waiting = usePlayer((s) => s.waiting);
	const paused = usePlayer((s) => s.paused);
	const canPlay = usePlayer((s) => s.canPlay);
	const error = usePlayer((s) => s.error);
	const initial = !canPlay && !error;
	if (!(initial || waiting && !paused)) return null;
	return /* @__PURE__ */ jsxs("div", {
		className: "cs-buffering",
		role: "status",
		"data-initial": initial || void 0,
		children: [/* @__PURE__ */ jsx("span", {
			className: "cs-spinner",
			"aria-hidden": "true"
		}), /* @__PURE__ */ jsx("span", {
			className: initial ? "cs-loading-label" : "cs-sr",
			children: initial ? "Loading video…" : "Buffering"
		})]
	});
}
/** A skip button that appears only while playback is inside an intro / recap / credits range. */
function SkipButton({ segments, onSkip }) {
	const idx = usePlayer((s) => (segments ?? []).findIndex((g) => s.currentTime >= g.start && s.currentTime < g.end - 1));
	const seg = idx >= 0 ? segments?.[idx] : void 0;
	if (!seg) return null;
	const label = {
		intro: "Skip intro",
		recap: "Skip recap",
		credits: "Skip credits"
	}[seg.type];
	return /* @__PURE__ */ jsx("button", {
		type: "button",
		className: "cs-btn cs-btn-label cs-skip",
		"data-keep": true,
		onClick: () => onSkip(seg.end, label),
		children: /* @__PURE__ */ jsx("span", { children: label })
	});
}
/** Live needle for the Scenes button: where the playhead sits in the runtime, in 5-degree steps. */
function DialButtonIcon() {
	const angle = usePlayer((s) => s.duration > 0 ? Math.round(s.currentTime / s.duration * 72) * 5 : 0);
	return /* @__PURE__ */ jsx(DialIcon, { angle });
}
/**
* The control dock, organised as an instrument: Primary (transport), Timeline (filmprint, time, tether), Tools,
* Sound and Viewing. What does not fit at the current width moves into More; play, seek, time, sound and
* fullscreen never do.
*/
function BottomBar({ tier, stageWidth, layout, markers, scenes, thumbnailAt, scenePreview, clip, onSaveMoment, panel, settingsTab, onSettings, onSimple, lensOpen, onLens, lens, onScenes, navOpen, tether, journey, filmprintKey }) {
	const store = usePlayer();
	const pip = usePlayer((s) => s.pictureInPictureAvailability);
	const cast = usePlayer((s) => s.remotePlaybackAvailability);
	const volume = usePlayer((s) => s.volume);
	const muted = usePlayer((s) => s.muted);
	const subs = useSubtitles();
	const tiny = tier === "tiny" || tier === "micro";
	const micro = tier === "micro";
	const hasClip = clip.start !== null || clip.end !== null;
	const roomy = tier === "full" && (layout === "floating" || layout === "expanded" && stageWidth >= 900);
	const inlineTimeline = layout === "compact" && tier === "full";
	const showMore = !roomy;
	const hasScenes = scenes.length > 0;
	const playing = usePlayer((s) => sceneIndexAt(scenes, s.currentTime));
	const hasJourney = Boolean(journey && journey.stops.length > 1);
	const timeline = /* @__PURE__ */ jsxs("div", {
		className: "cs-tl-row",
		children: [/* @__PURE__ */ jsx(Timeline, {
			markers,
			clip,
			scenes,
			thumbnailAt,
			scenePreview,
			lensOpen,
			tether: tether?.time ?? null,
			filmprintKey
		}), !tiny ? /* @__PURE__ */ jsx("button", {
			type: "button",
			className: "cs-tl-expand",
			"aria-expanded": lensOpen,
			"aria-haspopup": "dialog",
			"aria-label": "Expand the filmstrip (Time Lens)",
			"data-tip": "Expand filmstrip (T)",
			"data-tip-align": "end",
			onClick: (e) => onLens(e.currentTarget),
			children: /* @__PURE__ */ jsx(LensIcon, {})
		}) : null]
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "cs-bottom",
		"data-layout": layout,
		children: [
			lens,
			!inlineTimeline ? timeline : null,
			/* @__PURE__ */ jsxs(Controls.Group, {
				className: "cs-row",
				"aria-label": "Playback controls",
				children: [
					layout !== "floating" ? /* @__PURE__ */ jsxs("div", {
						className: "cs-group",
						"data-group": "primary",
						children: [/* @__PURE__ */ jsx("span", {
							className: "cs-group-cap",
							"aria-hidden": "true",
							children: "Play"
						}), /* @__PURE__ */ jsx(PlaybackPod, { placement: "dock" })]
					}) : null,
					/* @__PURE__ */ jsxs("div", {
						className: "cs-group",
						"data-group": "time",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "cs-group-cap",
								"aria-hidden": "true",
								children: hasScenes && playing >= 0 ? scenes[playing]?.title : "Time"
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "cs-time",
								children: [
									/* @__PURE__ */ jsx(Time.Value, { type: "current" }),
									/* @__PURE__ */ jsx("span", {
										"aria-hidden": "true",
										children: "/"
									}),
									/* @__PURE__ */ jsx(Time.Value, { type: "duration" })
								]
							}),
							tether ? /* @__PURE__ */ jsxs("button", {
								type: "button",
								className: "cs-tether-chip",
								onClick: tether.onReturn,
								"aria-label": `Return to where you were, ${formatTime(tether.time)}`,
								"data-tip": "Back to where you were",
								children: [/* @__PURE__ */ jsx(ReturnIcon, {}), /* @__PURE__ */ jsx("span", { children: formatTime(tether.time) })]
							}) : null,
							hasJourney && !tiny ? /* @__PURE__ */ jsx("button", {
								type: "button",
								className: "cs-btn cs-journey-btn",
								"data-panel-toggle": true,
								"aria-expanded": panel === "journey",
								"aria-haspopup": "dialog",
								"aria-label": `Journey: ${journey.stops.length} places this session`,
								"data-tip": "Journey",
								onClick: (e) => onSimple("journey", e.currentTarget),
								children: /* @__PURE__ */ jsx("span", {
									className: "cs-journey-dots",
									"aria-hidden": "true",
									children: journey.stops.slice(-5).map((_, i) => /* @__PURE__ */ jsx("span", {}, i))
								})
							}) : null
						]
					}),
					inlineTimeline ? /* @__PURE__ */ jsx("div", {
						className: "cs-group cs-group-timeline",
						children: timeline
					}) : /* @__PURE__ */ jsx("div", { className: "cs-spacer" }),
					roomy ? /* @__PURE__ */ jsxs("div", {
						className: "cs-group",
						"data-group": "tools",
						role: "group",
						"aria-label": "Tools",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "cs-group-cap",
								"aria-hidden": "true",
								children: "Tools"
							}),
							onSaveMoment ? /* @__PURE__ */ jsxs("button", {
								type: "button",
								className: "cs-btn cs-btn-label",
								onClick: onSaveMoment,
								"data-tip": "Save this moment",
								children: [/* @__PURE__ */ jsx(BookmarkIcon, {}), /* @__PURE__ */ jsx("span", { children: "Save moment" })]
							}) : null,
							/* @__PURE__ */ jsx("button", {
								type: "button",
								className: "cs-btn",
								"data-panel-toggle": true,
								"data-on": hasClip ? "" : void 0,
								"aria-expanded": panel === "clip",
								"aria-haspopup": "dialog",
								"aria-label": "Clip selection",
								"data-tip": "Clip",
								onClick: (e) => onSimple("clip", e.currentTarget),
								children: /* @__PURE__ */ jsx(ClipIcon, {})
							}),
							hasScenes && onScenes ? /* @__PURE__ */ jsx("button", {
								type: "button",
								className: "cs-btn",
								"data-nav-opener": true,
								"aria-expanded": navOpen,
								"aria-controls": "cs-rail",
								"aria-label": "Scenes on the navigation wheel",
								"data-tip": "Scenes",
								onClick: (e) => onScenes(e.currentTarget),
								children: /* @__PURE__ */ jsx(DialButtonIcon, {})
							}) : null
						]
					}) : null,
					/* @__PURE__ */ jsxs("div", {
						className: "cs-group cs-volume",
						"data-group": "audio",
						role: "group",
						"aria-label": "Sound",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "cs-group-cap",
								"aria-hidden": "true",
								children: "Sound"
							}),
							/* @__PURE__ */ jsx(MuteButton, {
								className: "cs-btn",
								render: (props, state) => /* @__PURE__ */ jsx("button", {
									...props,
									"data-tip": state.muted || volume === 0 || muted ? "Unmute (M)" : "Mute (M)",
									children: state.muted || volume === 0 || muted ? /* @__PURE__ */ jsx(MuteIcon, {}) : /* @__PURE__ */ jsx(VolumeIcon, {})
								})
							}),
							!tiny ? /* @__PURE__ */ jsxs(VolumeSlider.Root, {
								className: "cs-volslider",
								children: [/* @__PURE__ */ jsx(VolumeSlider.Track, {
									className: "cs-track",
									children: /* @__PURE__ */ jsx(VolumeSlider.Fill, { className: "cs-fill" })
								}), /* @__PURE__ */ jsx(VolumeSlider.Thumb, { className: "cs-thumb" })]
							}) : null
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "cs-group",
						"data-group": "view",
						role: "group",
						"aria-label": "Viewing",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "cs-group-cap",
								"aria-hidden": "true",
								children: "View"
							}),
							!tiny ? /* @__PURE__ */ jsx("button", {
								type: "button",
								className: "cs-btn",
								"data-panel-toggle": true,
								"data-on": subs.active ? "" : void 0,
								"aria-expanded": panel === "settings" && settingsTab === "subtitles",
								"aria-haspopup": "dialog",
								"aria-label": subs.active ? `Subtitles: ${subs.active.label}` : "Subtitles: off",
								"data-tip": "Subtitles (C)",
								onClick: (e) => onSettings("subtitles", e.currentTarget),
								children: /* @__PURE__ */ jsx(CaptionsIcon, {})
							}) : null,
							!tiny && cast === "available" ? /* @__PURE__ */ jsx("button", {
								type: "button",
								className: "cs-btn",
								"aria-label": "Cast to a device",
								"data-tip": "Cast",
								onClick: () => void store.promptRemotePlayback(),
								children: /* @__PURE__ */ jsx(CastIcon, {})
							}) : null,
							!tiny && pip === "available" ? /* @__PURE__ */ jsx(PiPButton, {
								className: "cs-btn",
								render: (props) => /* @__PURE__ */ jsx("button", {
									...props,
									"data-tip": "Picture-in-picture (I)",
									children: /* @__PURE__ */ jsx(PipIcon, {})
								})
							}) : null,
							!micro ? /* @__PURE__ */ jsx("button", {
								type: "button",
								className: "cs-btn",
								"data-panel-toggle": true,
								"aria-expanded": panel === "settings" && settingsTab !== "subtitles" && settingsTab !== "appearance",
								"aria-haspopup": "dialog",
								"aria-label": "Settings",
								"data-tip": "Settings",
								onClick: (e) => onSettings(settingsTab === "subtitles" || settingsTab === "appearance" ? "playback" : null, e.currentTarget),
								children: /* @__PURE__ */ jsx(SettingsIcon, {})
							}) : null,
							showMore ? /* @__PURE__ */ jsx("button", {
								type: "button",
								className: "cs-btn",
								"data-panel-toggle": true,
								"aria-expanded": panel === "more",
								"aria-haspopup": "dialog",
								"aria-label": "More controls",
								"data-tip": "More",
								onClick: (e) => onSimple("more", e.currentTarget),
								children: /* @__PURE__ */ jsx(MoreIcon, {})
							}) : null,
							/* @__PURE__ */ jsx(FullscreenButton, {
								className: "cs-btn",
								render: (props, state) => /* @__PURE__ */ jsx("button", {
									...props,
									"data-tip": state.fullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)",
									"data-tip-align": "end",
									children: state.fullscreen ? /* @__PURE__ */ jsx(ExitFullscreenIcon, {}) : /* @__PURE__ */ jsx(FullscreenIcon, {})
								})
							})
						]
					})
				]
			})
		]
	});
}
/** Secondary actions for smaller players and the Compact layout, where the dock keeps only the essentials. */
function MorePanel({ open, onClose, returnFocusTo, tier, onSaveMoment, onClip, onLens, onDial, onWheel, onJourney, onSettings, onScrim, scrim, onDiag, onHelp, extra }) {
	const store = usePlayer();
	const pip = usePlayer((s) => s.pictureInPictureAvailability);
	const cast = usePlayer((s) => s.remotePlaybackAvailability);
	const act = (fn) => () => {
		onClose();
		window.setTimeout(fn, 0);
	};
	return /* @__PURE__ */ jsx(FloatingPanel, {
		open,
		onClose,
		title: "More controls",
		returnFocusTo,
		children: /* @__PURE__ */ jsxs("div", {
			className: "cs-more",
			"data-interactive": true,
			children: [
				extra && (tier === "tiny" || tier === "micro") ? /* @__PURE__ */ jsx("div", {
					className: "cs-more-extra",
					children: extra
				}) : null,
				onSaveMoment ? /* @__PURE__ */ jsxs("button", {
					type: "button",
					className: "cs-row-btn",
					onClick: act(onSaveMoment),
					children: [
						/* @__PURE__ */ jsx(BookmarkIcon, {}),
						" ",
						/* @__PURE__ */ jsx("span", { children: "Save this moment" })
					]
				}) : null,
				/* @__PURE__ */ jsxs("button", {
					type: "button",
					className: "cs-row-btn",
					onClick: act(onLens),
					children: [
						/* @__PURE__ */ jsx(LensIcon, {}),
						" ",
						/* @__PURE__ */ jsx("span", { children: "Time Lens (filmstrip)" })
					]
				}),
				onWheel ? /* @__PURE__ */ jsxs("button", {
					type: "button",
					className: "cs-row-btn",
					onClick: act(onWheel),
					children: [
						/* @__PURE__ */ jsx(ReelIcon, {}),
						" ",
						/* @__PURE__ */ jsx("span", { children: "Navigate: films and scenes" })
					]
				}) : onDial ? /* @__PURE__ */ jsxs("button", {
					type: "button",
					className: "cs-row-btn",
					onClick: act(onDial),
					children: [
						/* @__PURE__ */ jsx(DialIcon, {}),
						" ",
						/* @__PURE__ */ jsx("span", { children: "Navigate: scenes" })
					]
				}) : null,
				onJourney ? /* @__PURE__ */ jsxs("button", {
					type: "button",
					className: "cs-row-btn",
					onClick: act(onJourney),
					children: [
						/* @__PURE__ */ jsx(ReturnIcon, {}),
						" ",
						/* @__PURE__ */ jsx("span", { children: "Journey" })
					]
				}) : null,
				/* @__PURE__ */ jsxs("button", {
					type: "button",
					className: "cs-row-btn",
					onClick: act(onClip),
					children: [
						/* @__PURE__ */ jsx(ClipIcon, {}),
						" ",
						/* @__PURE__ */ jsx("span", { children: "Clip selection" })
					]
				}),
				pip === "available" ? /* @__PURE__ */ jsxs("button", {
					type: "button",
					className: "cs-row-btn",
					onClick: act(() => void store.requestPictureInPicture()),
					children: [
						/* @__PURE__ */ jsx(PipIcon, {}),
						" ",
						/* @__PURE__ */ jsx("span", { children: "Picture-in-picture" })
					]
				}) : null,
				cast === "available" ? /* @__PURE__ */ jsxs("button", {
					type: "button",
					className: "cs-row-btn",
					onClick: act(() => void store.promptRemotePlayback()),
					children: [
						/* @__PURE__ */ jsx(CastIcon, {}),
						" ",
						/* @__PURE__ */ jsx("span", { children: "Cast to a device" })
					]
				}) : null,
				/* @__PURE__ */ jsxs("button", {
					type: "button",
					className: "cs-row-btn",
					onClick: act(() => onSettings("subtitles")),
					children: [
						/* @__PURE__ */ jsx(CaptionsIcon, {}),
						" ",
						/* @__PURE__ */ jsx("span", { children: "Subtitles" })
					]
				}),
				tier === "micro" ? /* @__PURE__ */ jsxs("button", {
					type: "button",
					className: "cs-row-btn",
					onClick: act(() => onSettings("playback")),
					children: [
						/* @__PURE__ */ jsx(SettingsIcon, {}),
						" ",
						/* @__PURE__ */ jsx("span", { children: "Settings" })
					]
				}) : null,
				/* @__PURE__ */ jsxs("button", {
					type: "button",
					className: "cs-row-btn",
					onClick: act(() => onSettings("appearance")),
					children: [
						/* @__PURE__ */ jsx(PaletteIcon, {}),
						" ",
						/* @__PURE__ */ jsx("span", { children: "Appearance" })
					]
				}),
				/* @__PURE__ */ jsxs("button", {
					type: "button",
					className: "cs-row-btn",
					onClick: onScrim,
					children: [
						/* @__PURE__ */ jsx(ScrimIcon, {}),
						" ",
						/* @__PURE__ */ jsxs("span", { children: ["Scrim: ", SCRIM_LABEL[scrim]] })
					]
				}),
				/* @__PURE__ */ jsxs("button", {
					type: "button",
					className: "cs-row-btn",
					onClick: act(onDiag),
					children: [
						/* @__PURE__ */ jsx(PulseIcon, {}),
						" ",
						/* @__PURE__ */ jsx("span", { children: "Player health" })
					]
				}),
				/* @__PURE__ */ jsxs("button", {
					type: "button",
					className: "cs-row-btn",
					onClick: act(onHelp),
					children: [
						/* @__PURE__ */ jsx(HelpIcon, {}),
						" ",
						/* @__PURE__ */ jsx("span", { children: "Keyboard shortcuts" })
					]
				})
			]
		})
	});
}
export { CinemaSkin, DiagnosticsBody, DiagnosticsDialog, KeymapDialog, ModalDialog, NavigationRail, NavigationWheel, SCRIM_MODES, SHORTCUTS, clamp, formatTime, isRecord, loadPrefs, readJSON, savePrefs, sceneIndexAt, speakTime, useCinemaSkin, usePrefs, writeJSON };
