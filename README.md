# Pantrix – Smart Pantry app

The iOS app for the Smart Pantry project (ÖH Hackathon FHV, AI4Green Challenge).
Built with **Vue 3 + TypeScript + Vite**; it will be wrapped as a native iOS app
with **Capacitor** and shipped via **TestFlight**.

The look follows the Figma file *PantryX* (colours, type, shapes).
All design values live in `src/styles/theme.css`.

## Related repositories

| Repo | What it is |
| --- | --- |
| `benjamin1988/Smart-Pantry` | Backend API (C# / ASP.NET Core, Supabase, AI receipt scan, Spoonacular recipes) |
| `StefanFraissler/smartpantry-frontend` | Test page for the API (login, test buttons) |
| this repo | The real app |

## Run it on your Mac

Requirement: Node.js 20 or newer.

```
npm install
npm run dev
```

Open the address shown in the terminal (e.g. http://localhost:5173).
Tip: in the browser press F12 → device toolbar → choose an iPhone to see the phone size.

## Project structure

```
src/
  main.ts              starts the app
  App.vue              app frame: current screen + tab bar
  router.ts            which URL shows which screen
  styles/theme.css     design tokens from Figma (colours, radii, font)
  styles/base.css      global basics, shared button and card styles
  data/pantry.ts       pantry data (sample data for now) + expiry helpers
  data/categories.ts   the 21 backend category codes with names and icons
  components/          reusable pieces (tab bar, item row, expiry badge …)
  views/               one file per screen
```

## Status

- [x] App frame, tab bar (Home, Pantry, Shopping list, Impact)
- [x] Home screen (sample data)
- [ ] Pantry screen with traffic light and "Eaten / Thrown away"
- [ ] Shopping list
- [ ] Impact statistics
- [ ] Login + backend connection (`GET/POST /api/v1/Items`)
- [ ] Receipt scan → review list → save (`POST /api/v1/Receipts`)
- [ ] Recipe ideas (`POST /api/v1/Recipes/findByIngredients`)
- [ ] Capacitor iOS build + TestFlight
