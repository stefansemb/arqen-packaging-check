# Arqen Packaging Check

See your YouTube title and thumbnail where viewers will see them: the desktop home grid, the phone feed, search results and "Up next", in dark and light mode, next to the videos you compete with. Then get a checklist for the title, thumbnail, description, chapters and tags before you publish. Everything runs in your browser: no account, no uploads.

## What it checks

- **Title:** length (100 max, the end is cut off on phones after about 70), shouting in capitals, emoji and "!!" overuse, characters YouTube rejects.
- **Thumbnail:** under 2 MB, a format YouTube accepts, 16:9, at least 1280 × 720.
- **Description:** within 5000 characters, the title's key words in the first 150 characters (what search shows), no link as the first thing, hashtags (only 3 show, over 15 and all are ignored).
- **Chapters:** start at 0:00, at least 3, in order, each at least 10 seconds.
- **Tags:** within 500 characters the way YouTube counts them (commas, and quotes around tags with spaces), no duplicates.

The previews are close approximations of YouTube's layouts, not screenshots of it.

## Run it

A static page with no build step:

```bash
python -m http.server 5180
```

Open http://localhost:5180. Run the checks' tests with `node --test`.

## Files

| File | What it does |
|---|---|
| `checks.js` | The rules, as pure functions |
| `checks.test.mjs` | Tests for the rules |
| `app.js` | The editor, feed previews and checklist |
| `index.html`, `style.css` | The page |

## License

MIT, see [LICENSE](LICENSE). Not affiliated with YouTube.

Made by [samidatools](https://samidatools.com/).
