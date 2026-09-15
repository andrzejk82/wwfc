"""Regenerate checked-in Polish extensions: pip install fonttools[woff]==4.63.0.

Latin fonts stay in @fontsource packages. Only the Polish extensions are subset,
so English and Polish content both retain the full required alphabet.
"""
from pathlib import Path
from fontTools import subset

root = Path(__file__).resolve().parents[1]
output = root / "src/assets/fonts"
output.mkdir(parents=True, exist_ok=True)
polish = "ĄąĆćĘęŁłŃńŚśŹźŻż"
sources = {
    "inter-polish.woff2": "@fontsource-variable/inter/files/inter-latin-ext-wght-normal.woff2",
    "barlow-polish-700.woff2": "@fontsource/barlow-condensed/files/barlow-condensed-latin-ext-700-normal.woff2",
    "barlow-polish-600.woff2": "@fontsource/barlow-condensed/files/barlow-condensed-latin-ext-600-normal.woff2",
}
for name, source in sources.items():
    options = subset.Options()
    options.flavor = "woff2"
    font = subset.load_font(str(root / "node_modules" / source), options)
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text=polish)
    subsetter.subset(font)
    subset.save_font(font, str(output / name), options)
    print(name, (output / name).stat().st_size)
