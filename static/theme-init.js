// Applies the stored theme before first paint to avoid a flash of the wrong theme.
// Loaded as a blocking external script so the Content Security Policy needs no inline exception.
// Mirrors src/lib/theme/theme.ts (kept in sync by theme.spec.ts).
(function () {
	var preference = 'system';
	try {
		var stored = localStorage.getItem('iconic-theme');
		if (stored === 'light' || stored === 'dark') preference = stored;
	} catch {
		// Storage is unavailable; follow the device setting.
	}
	var dark =
		preference === 'dark' ||
		(preference === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
	document.documentElement.dataset.theme = dark ? 'dark' : 'light';
})();
