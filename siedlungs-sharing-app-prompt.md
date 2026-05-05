# Master Prompt – Siedlungs-Sharing-App

## Rolle & Kontext

Du bist ein erfahrener Full-Stack Software Engineer. Deine Aufgabe ist es, eine mobile-first Web-Applikation zu bauen — eine geschlossene Sharing-Plattform für eine Wohnsiedlung mit ca. 100 Personen. Die App ermöglicht Bewohnern, persönliche Gegenstände kostenlos untereinander auszuleihen. Es gibt keine Zahlungsabwicklung — nur Vertrauen und Gemeinschaft.

---

## Produkt-Vision

**Name (Vorschlag):** SiedlungsShare  
**Ziel:** Weniger ungenutzte Gegenstände in Kellern, mehr Gemeinschaft in der Siedlung.  
**Prinzip:** Wer beitritt, verpflichtet sich, mindestens einen eigenen Gegenstand zur Verfügung zu stellen.

---

## Nutzer-Rollen

| Rolle | Beschreibung |
|---|---|
| **Admin** | Verwaltet Mitglieder, schaltet neue Accounts frei, kann alle Objekte und Anfragen sehen |
| **Mitglied** | Kann Objekte erfassen, durchsuchen und Anfragen stellen |

---

## Funktionale Anforderungen (MVP)

### 1. Authentifizierung & Zugang
- Registrierung öffentlich zugänglich (E-Mail + Passwort)
- Neues Konto landet im Status `pending` — sichtbar nur für Admin
- Admin schaltet Konto auf `active` frei (oder lehnt ab)
- Login nur für `active` Mitglieder möglich
- Passwort-Reset via E-Mail

### 2. Onboarding-Pflicht
- Beim ersten Login wird der User aufgefordert, mindestens 1 Objekt zu erfassen
- Bis dahin: eingeschränkter Zugriff (kein Browsing)

### 3. Objekte verwalten
- Objekt erfassen mit: Titel, Beschreibung, Foto (Upload), Kategorie, optionalem Standorthinweis (z.B. "Keller Haus B")
- Kategorien: Werkzeug, Haushalt, Garten, Sport & Freizeit, Elektronik, Sonstiges
- Status pro Objekt: `verfügbar` / `ausgeliehen`
- Eigene Objekte bearbeiten und deaktivieren (nicht löschen solange ausgeliehen)

### 4. Marktplatz / Übersicht
- Alle verfügbaren Objekte aller Mitglieder anzeigen
- Suche nach Stichwort
- Filter nach Kategorie
- Detailansicht: Foto, Beschreibung, Besitzername, Anfrage-Button
- Ausgeliehene Objekte sichtbar aber gesperrt (Status klar erkennbar)
- **Nur eingeloggte Mitglieder** sehen den Inhalt

### 5. Anfrage-System
- Mitglied klickt "Ausleihen anfragen" auf einem Objekt
- Optionales Freitextfeld: "Ich brauche es für…"
- Besitzer erhält Push-Benachrichtigung + In-App-Benachrichtigung
- Besitzer kann Anfrage **bestätigen** oder **ablehnen** (mit optionaler Begründung)
- Bei Bestätigung: Objekt-Status wechselt auf `ausgeliehen`, Anfragesteller wird benachrichtigt
- Kein Rückgabe-Tracking — Vertrauen genügt
- Besitzer kann Objekt manuell wieder auf `verfügbar` setzen

### 6. Push-Benachrichtigungen
- Bei neuer Ausleihanfrage → Besitzer benachrichtigen
- Bei Bestätigung/Ablehnung → Anfragesteller benachrichtigen
- Web Push (PWA-kompatibel)

### 7. Admin-Bereich
- Übersicht aller ausstehenden Registrierungen → freischalten / ablehnen
- Übersicht aller Mitglieder (Name, E-Mail, Anzahl Objekte, Status)
- Mitglied deaktivieren (z.B. bei Wegzug)

---

## Nicht-funktionale Anforderungen

- **Mobile-first:** Die App wird primär auf dem Smartphone genutzt
- **PWA:** Installierbar auf iOS & Android (Add to Homescreen), Offline-Startseite
- **Sprache:** Deutsch (UI vollständig auf Deutsch)
- **Performance:** Bilder werden beim Upload komprimiert (max. 800px, WebP)
- **Sicherheit:** Alle Daten nur für eingeloggte Mitglieder sichtbar, Row-Level Security in der Datenbank

---

## Technologie-Stack

| Schicht | Technologie | Begründung |
|---|---|---|
| Framework | **Next.js 14** (App Router) | PWA-fähig, SSR, API Routes integriert |
| Styling | **Tailwind CSS** | Mobile-first, schnell, konsistent |
| Datenbank | **Supabase** (PostgreSQL) | Auth, Storage und DB in einem, Free Tier reicht für 100 User |
| Auth | **Supabase Auth** | E-Mail/Passwort, Session-Management, Row-Level Security |
| Bild-Storage | **Supabase Storage** | Direkter Upload vom Client |
| Push | **Web Push API** + Supabase Edge Functions | Serverless Benachrichtigungen |
| Hosting | **Vercel** | Nahtlose Next.js-Integration, Free Tier |
| Bildoptimierung | **browser-image-compression** (npm) | Client-seitig vor Upload |

---

## Datenmodell

```sql
-- Benutzer (via Supabase Auth ergänzt)
profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users,
  name        text NOT NULL,
  wohnung     text,                        -- z.B. "Haus A, Nr. 12"
  status      text DEFAULT 'pending',      -- 'pending' | 'active' | 'inactive'
  is_admin    boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
)

-- Objekte
items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid REFERENCES profiles(id),
  titel       text NOT NULL,
  beschreibung text,
  foto_url    text,
  kategorie   text NOT NULL,              -- 'werkzeug' | 'haushalt' | 'garten' | 'sport' | 'elektronik' | 'sonstiges'
  standort    text,                        -- optional, z.B. "Keller Haus B"
  status      text DEFAULT 'verfuegbar',  -- 'verfuegbar' | 'ausgeliehen' | 'inaktiv'
  created_at  timestamptz DEFAULT now()
)

-- Ausleihanfragen
loan_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         uuid REFERENCES items(id),
  requester_id    uuid REFERENCES profiles(id),
  nachricht       text,
  status          text DEFAULT 'pending', -- 'pending' | 'accepted' | 'declined'
  owner_antwort   text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
)

-- Push-Subscriptions
push_subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id),
  subscription jsonb NOT NULL,            -- Web Push subscription object
  created_at  timestamptz DEFAULT now()
)
```

---

## Projekt-Struktur (Next.js App Router)

```
/app
  /login              → Login-Seite
  /register           → Registrierungs-Seite
  /onboarding         → Erstes Objekt erfassen (Pflicht)
  /(protected)
    /marktplatz        → Alle Objekte durchsuchen
    /objekte           → Meine Objekte verwalten
    /objekte/neu       → Objekt erfassen
    /anfragen          → Meine gesendeten & empfangenen Anfragen
    /admin             → Admin-Bereich (nur für is_admin=true)
/components
  ItemCard, ItemForm, RequestCard, AdminUserList, ...
/lib
  supabase.ts, push.ts, imageUtils.ts
```

---

## Entwicklungs-Phasen

### Phase 1 – Fundament (Woche 1)
- [ ] Supabase Projekt aufsetzen (DB, Auth, Storage, RLS Policies)
- [ ] Next.js Projekt initialisieren (Tailwind, Supabase Client)
- [ ] Login / Registrierung / Session-Handling
- [ ] Admin-Freischaltung implementieren
- [ ] Onboarding-Pflicht (Redirect wenn kein Objekt vorhanden)

### Phase 2 – Kern-Features (Woche 2)
- [ ] Objekte erfassen (mit Foto-Upload & Komprimierung)
- [ ] Marktplatz-Übersicht (Suche, Filter, Kategorien)
- [ ] Detailansicht pro Objekt

### Phase 3 – Interaktion (Woche 3)
- [ ] Anfrage-System (senden, bestätigen, ablehnen)
- [ ] In-App Benachrichtigungen (ungelesene Anfragen)
- [ ] Web Push Benachrichtigungen

### Phase 4 – PWA & Feinschliff (Woche 4)
- [ ] PWA Manifest & Service Worker
- [ ] Mobile UX Review (Touch-Targets, Navigation)
- [ ] Admin-Bereich verfeinern
- [ ] Deployment auf Vercel

---

## Design-Vorgaben

- **Mobile-first**, untere Navigation (Tab-Bar) für Hauptbereiche
- **Deutsch** in der gesamten UI
- Klare Status-Badges: grün = verfügbar, grau = ausgeliehen
- Foto ist Pflichtfeld beim Erfassen (kein Platzhalter-Bild)
- Einfach & vertrauenswürdig — kein over-engineered Design

---

## Out of Scope (bewusst weggelassen)

- Kein Chat-System (Kommunikation direkt zwischen Personen)
- Kein Rückgabe-Tracking
- Keine Zahlungsabwicklung
- Kein öffentlicher Zugriff (alles hinter Login)
- Keine mobile Native App (PWA reicht)
