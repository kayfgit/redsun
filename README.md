<p align="center">
  <img src="public/readmebanner.png" alt="Redsun" />
</p>

# 红日 Redsun

> Redsun is a Chinese character (hanzi) lookup tool that helps Chinese learners
> learn and remember hanzi — look one up however you can recall it, then study
> its pronunciation, meaning, and the words it appears in.

---

## Live Demo

🌐 **[redsun.vercel.app](https://redsun.vercel.app)** *(placeholder — coming soon)*

## About

Redsun is a quick-consult dictionary built around a simple problem every learner
hits: you half-remember a character but can't quite reach it. Maybe you know how
it's drawn, maybe you know its pinyin, maybe you only know how it sounds. Redsun
lets you start from whichever fragment you have and walks you to the character —
and then helps it stick.

It's not a course or a streak-driven app. It's the tool you keep open in another
tab while you read, write, or study.

## Features

- **Three ways to look up a character**
  - ✏️ **Draw** — sketch the character on the canvas and Redsun recognizes it
    from your strokes in real time.
  - ⌨️ **Type** — enter pinyin (e.g. `ren` → 人) or the character directly, and
    browse candidate matches.
  - 🎙️ **Speak** — hold to speak a syllable or phrase and find matching
    characters by sound.

- **Character detail view** — every result opens a rich card with:
  - Pinyin with **tone-colored** display and a plain-language tone description.
  - English meaning and a one-tap **audio pronunciation**.
  - **Example phrases** showing the character in real words, with the character
    highlighted in context.
  - **Same-pinyin characters** to compare homophones at a glance.
  - One-click **copy** for the character or phrase.

- **Phrase builder** — chain characters together into a phrase and review the
  whole thing, then drill into any single character within it.

- **Similar character suggestions** — surfaces look-alike characters so you can
  tell easily-confused hanzi apart.

- **10-language interface** — the UI is available in English, 中文, हिन्दी,
  Español, Français, Português, 日本語, العربية, Русский, and Deutsch.

- **Ink-and-rice-paper design** — a calm, distraction-free interface inspired by
  traditional Chinese calligraphy.

## Roadmap

Planned features that aren't in the app yet:

- 🔐 **User accounts** — log in to save your progress across devices. *(The login
  button is currently a disabled placeholder while this is in development.)*
- 🗂️ **Card groups** — save any hanzi into named card groups for focused study.
- 🧠 **In-site practice** — review your saved card groups directly on Redsun.
- 📤 **Anki export** — export a card group to [Anki](https://apps.ankiweb.net/)
  so you can drop your saved characters straight into your existing spaced-
  repetition workflow.
- 🖌️ **Animated stroke order** — replace the static stroke-order preview with a
  proper animated walkthrough.

## Tech Stack

- [Next.js](https://nextjs.org) 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- [`msedge-tts`](https://www.npmjs.com/package/msedge-tts) for pronunciation audio

## Getting Started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** Speech input relies on the Web Speech API — use Chrome or Edge for
> the **Speak** mode.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Run the production build |
| `npm run lint` | Lint the codebase |
| `npm run generate-audio` | Pre-generate pronunciation audio |

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

## License

Released under the [MIT License](LICENSE).
