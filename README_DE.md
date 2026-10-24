# D&D-Zauberbibliothek (JB2A) – Modulprototyp 0.1.0

**Foundry:** V14, **D&D-System:** dnd5e, **Sequencer:** 4.x, **Animationen:** JB2A Free oder Patreon.

## Installation über GitHub (nach dem ersten Release)

1. Das öffentliche Repository muss unter `Shining-Moon-54/jb2a-spell-browser` existieren und die Dateien im **Repository-Stammverzeichnis** enthalten.
2. Unter **Actions → Foundry-Modul veröffentlichen → Run workflow** den ersten Release erzeugen (benötigt `contents: write`; das Workflow-Skript enthält die Berechtigung).
3. In Foundry **Setup → Zusatzmodule → Modul installieren** öffnen und als **Manifest-URL** verwenden:

   `https://github.com/Shining-Moon-54/jb2a-spell-browser/releases/latest/download/module.json`

4. Foundry lädt dann automatisch das Release-ZIP und kann zukünftige neue Versionen erkennen.
5. **Sequencer und JB2A** zusätzlich aktivieren; in der Welt das Zauberbibliothek-Modul aktivieren.

**Wichtig:** Die Manifest-URL funktioniert erst, wenn der erste GitHub-Release erfolgreich veröffentlicht wurde. Nur die Dateien im Repository reichen noch nicht aus.

## Installation (manuell)

1. Das heruntergeladene ZIP entpacken.
2. Den kompletten Ordner `jb2a-spell-browser` mit `module.json` nach `<Foundry User Data>/Data/modules/` kopieren, sodass `Data/modules/jb2a-spell-browser/module.json` existiert. Nicht in den Installationsprogrammordner von Foundry kopieren.
3. Foundry neu starten beziehungsweise im Setup die Module neu einlesen, Modul in der Welt unter **Module verwalten** aktivieren.
4. **Sequencer und JB2A** in derselben Welt aktivieren.
5. Als Spielleiter auf der Karte links **Token-Werkzeuge** wählen. Dort ist das Buchsymbol **D&D-Zauberbibliothek**. Anklicken.

Beim manuellen Installieren muss die `module.json` direkt im Modulordner liegen. Ein Repository-Quellcode-ZIP ist nicht identisch mit dem von GitHub Actions erzeugten Foundry-Modul-ZIP.

## Nutzung

- Nach Zaubern suchen, nach Grad und 2014/2024 filtern, Favoriten setzen.
- Auf Zauber klicken, optional Dauerhaft-Haken setzen, **Auf Karte ausführen** klicken.
- Einmalige Zauber laufen ab, dauerhafte Effekte (z. B. Feuerwand) bleiben mit `Sequencer.persist()` auf der Szene.
- **Aktive Effekte** zeigt die von dieser Bibliothek gesetzten persistenten Sequencer-Effekte und erlaubt das Entfernen. Andere Sequencer-Effekte über **Sequencer-Effektverwaltung** verwalten.
- Die Szene muss geladen sein; kein Token erforderlich.

## Grenzen der Version 0.1.0

- **Noch nicht live in der Foundry-Welt getestet:** erste technische Vorschau, keine Aussage, dass jedes Kompendium und jede JB2A-Variante zuverlässig funktioniert.
- Für viele Zauber gibt es bisher nur eine namensgleiche Animation oder eine **deutlich markierte Ersatzvisualisierung**, keine originalgetreue Spezialinszenierung. Spielregeln, Schadenswürfe, Konzentrationsende, Licht/Bewegungsblockade werden nicht automatisiert.
- Die **Regelfassung** richtet sich nach den Kompendiumdaten. Bei fehlenden Metadaten erscheint `?`.
- Spezialfälle: Feuerball (Wandkollision + visuelle Explosion), Feuerblitz (Flug + Impact), Feuerwand (Linie oder Ring), Nebelwolke, Dunkelheit, Mondstrahl, Magisches Geschoss, Nebelschritt und weitere Vorlagen.
- Ausgewählte visuelle Platzierungen orientieren sich an der Zauberform, sind jedoch keine vollständigen D&D-5E/2024-Wirkungsflächenberechnungen.
- Dauerhafte Animationen können je nach JB2A-Datei selbst nicht nahtlos loopen; passende Loop-Dateien müssen pro Zauber geprüft werden.

## Fehlerdiagnose

F12 → Konsole; Filter nach `[jb2a-spell-browser]` oder nach Zaubernamen. Screenshot der roten Fehlermeldung schicken.

## Daten

Es werden keine Zauberbücher oder Medien mitgeliefert. Das Modul liest ausschließlich die in deiner eigenen Welt vorhandenen Items/Kompendien und ruft bereits installierte JB2A-Effekte über Sequencer ab.

## Repository und Releases

- GitHub: https://github.com/Shining-Moon-54/jb2a-spell-browser
- Manifest: https://github.com/Shining-Moon-54/jb2a-spell-browser/releases/latest/download/module.json
- Im Repo `module.json` aktualisieren und `version` erhöhen; dann das Release-Workflow erneut ausführen.
- Das Modul liefert keine urheberrechtlich geschützten D&D-Buchtexte oder JB2A-Mediendateien mit.