# D&D-Zauberbibliothek – JB2A für Foundry V14

Eine durchsuchbare, makrofreie Zauberbibliothek für **D&D 5E (2014)** und **D&D 5.5E (2024)** mit JB2A und Sequencer. **Prototyp 0.1.0 – noch nicht in Foundry live getestet.**

- Zauber aus lokal installierten Kompendien (keine D&D-Bücher mitgeliefert)
- Grad- und Regelfassungsfilter, Favoriten, originale Zaubersymbole
- Freie Platzierung von Projektilen, Explosionen und dauerhaften Flächen
- Eigene Verwaltung platzierter, dauerhafter Effekte
- Keine automatische Schadens-, Heilungs- oder Konzentrationsberechnung

## Foundry-Installation (sobald Release veröffentlicht)

Im Foundry-Setup unter **Zusatzmodule → Modul installieren → Manifest-URL** einfügen:

```text
https://github.com/Shining-Moon-54/jb2a-spell-browser/releases/latest/download/module.json
```

Anschließend in der Welt das Modul sowie Sequencer und JB2A aktivieren.

## Dokumentation

[Ausführliche deutsche Anleitung](README_DE.md) · [Änderungen](CHANGELOG.md)

## Release erstellen

GitHub **Actions → Foundry-Modul veröffentlichen → Run workflow**. Die Action erzeugt ein Foundry-kompatibles ZIP und lädt es zusammen mit `module.json` in einen GitHub-Release. Dafür muss GitHub Actions im Repository aktiviert sein.