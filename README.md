# DartsStatisticsDashboard

Eine interaktive Web-Anwendung, die Statistiken für Dart-Teams anzeigt, basierend auf Echtzeit-Daten. Diese Anwendung ermöglicht die Anzeige von Teamdurchschnitten, Siegquoten, individuellen Spielerstatistiken und Club-Standorten. Das Dashboard nutzt React und Axios für Datenabrufe und wird im Next.js-Umfeld verwendet.

## Installation

1. **Repository klonen**
   ```bash
   git clone https://github.com/dein-benutzername/DartsStatisticsDashboard.git
   cd DartsStatisticsDashboard
   ```

2. **Abhängigkeiten installieren**
   Installiere die benötigten Pakete mit npm:
   ```bash
   npm install
   ```

3. **Starten der Anwendung**
   ```bash
   npm run dev
   ```

4. **API-Verfügbarkeit prüfen**
   Stelle sicher, dass die API auf dem Server (`https://v2202406227836275390.happysrv.de`) verfügbar ist und die Endpunkte korrekt funktionieren.

## Verwendete Technologien

- **React**: Für die Benutzeroberfläche.
- **TypeScript**: Für Typensicherheit und klar definierte Interfaces.
- **Axios**: Zum Abrufen der API-Daten.
- **ClipLoader**: Ein Ladeindikator von react-spinners.
- **Lucide-React**: Für Icons im Dashboard.

## Funktionen

### Team-Auswahl und Suchfunktion
- Die Anwendung enthält eine Dropdown-Suche, um Teams einfach auszuwählen und anzusehen.
- Die aktuelle Mannschaft wird in der Kopfzeile angezeigt.

### Datenanzeige

1. **Team-Position und Saison**
   - Zeigt die Position des Teams in der Liga und die Saison an.
   
2. **Top-Performer**
   - Zeigt die besten Spieler im Team mit ihren angepassten Durchschnittswerten.
   
3. **Team-Durchschnitt**
   - Der Durchschnitt der Punktzahlen aller Spieler im Team.
   
4. **Siegquote**
   - Die Siegesrate des Teams basierend auf den letzten gespielten Matches.

5. **Spielberichte**
   - Liste der letzten Matches mit Gegner, Aufstellung und den erzielten Checkouts.

6. **Spielerstatistiken**
   - Tabellarische Ansicht aller Spieler des Teams mit ihren Durchschnittswerten.

7. **Club-Informationen**
   - Anzeige der Club-Adresse, Telefonnummer und anderer Kontaktinformationen.

## API-Endpunkte

- **`/api/league-position/:teamName`** - Liefert die Position des Teams in der Liga.
- **`/api/club-venue/:teamName`** - Liefert die Club- und Standortinformationen des Teams.
- **`/api/team-players-average/:teamName`** - Liefert die durchschnittlichen Werte aller Spieler des Teams.
- **`/api/dart-ids/:teamName`** - Liefert IDs für die Spielberichte.
- **`/api/match-report/:matchId/:teamName`** - Liefert Details eines einzelnen Matches.

## Anwendungsschnittstelle

Die Benutzeroberfläche verwendet Komponenten wie `Card`, `Tabs`, und Icons, um Informationen übersichtlich und visuell ansprechend darzustellen. Die Daten werden beim Laden oder Wechsel des Teams neu abgerufen.

## Entwicklung

- **Component-Design**: Die Anwendung verwendet eine komponentenbasierte Struktur mit klaren Schnittstellen, um Modularität und Wiederverwendbarkeit zu gewährleisten.
- **Styling**: Basierend auf einem anpassbaren Design für eine saubere Darstellung auf verschiedenen Bildschirmgrößen.

## Fehlerbehandlung

- Fehler beim Abrufen von Daten werden in der Konsole protokolliert und die Ladeanzeige bleibt bestehen, bis die Daten erfolgreich geladen sind.

🫡