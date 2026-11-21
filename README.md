# PantryX – Smart Pantry app

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
cp .env.example .env     (then fill in the values)
npm run dev
```

Without `.env` the app runs in **demo mode**: no login, sample data, fake receipt scan.
With the Supabase values you get the login; with `VITE_API_URL` it uses Benny's backend.
Locally the backend runs on `http://localhost:5286` (`dotnet run` in Smart-Pantry) and
already allows `http://localhost:5173` (CORS). For the iOS app, the backend's `Cors:Origins`
must also contain `capacitor://localhost`.

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
- [x] Pantry screen with traffic light and "Eaten / Thrown away" (local only – needs PATCH endpoint)
- [x] Shopping list (saved on the phone – needs a shopping list API)
- [ ] Impact statistics
- [x] Login (Supabase) + backend connection (`GET/POST /api/v1/Items`) – still to be tested against the running backend
- [x] Receipt scan → review list → save (demo mode until login is connected; `POST /api/v1/Receipts`)
- [x] Recipe ideas (`POST /api/v1/Recipes/findByIngredients`, cached per ingredient set)
- [ ] Capacitor iOS build + TestFlight
