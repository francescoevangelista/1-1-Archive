# 1:1 — Archivio Visivo

Software interattivo per la tesi "1:1 — L'omologazione visiva nell'era algoritmica"

## Setup

```bash
# Installa dipendenze
npm install

# Avvia dev server
npm run dev

# Build per produzione
npm run build
```

## File da aggiungere

### Font (obbligatorio per look corretto)
Copia i file font Suisse Int'l in `public/fonts/`:
- `SuisseIntl-Regular-WebS.woff`
- `SuisseIntl-Medium.woff`
- `SuisseIntl-Bold.woff2`

### Immagini (88 foto dell'archivio)
Copia le immagini in `public/assets/`:
- `img-1.png` ... `img-88.png`

## Categorie immagini

| Range | Categoria | Sigla |
|-------|-----------|-------|
| 1-22  | Ambienti  | AMB   |
| 23-44 | Still Life| STL   |
| 45-66 | Figure    | FIG   |
| 67-88 | Graphic   | GRA   |

## Controlli

- **Click/Touch prolungato**: Genera immagini
- **Drag**: Sposta immagini
- **Toolbar**: Cambia parametri visuali
- **Chaos**: Applica forze random

## Shortcuts

- `Esc`: Chiudi overlay

## Credits

Francesco Evangelista — NABA Roma — Marzo 2026
