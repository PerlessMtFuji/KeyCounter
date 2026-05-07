# Kiedy antywirus drze się na KeyCounter

🇬🇧 [English version](antivirus.md)

Pobrałeś KeyCounter i Defender / SmartScreen / twój ulubiony antywirus pokazał czerwoną flagę. Irytujące, ale spodziewane — i zaraz wytłumaczę dlaczego.

## Dlaczego tak się dzieje

Żeby globalnie liczyć klawisze, KeyCounter musi zarejestrować w systemie niskopoziomowy hook klawiatury:

- Windows: `SetWindowsHookEx(WH_KEYBOARD_LL)`
- macOS: `CGEventTap`
- Linux: nasłuch eventów X11

To dokładnie ta sama prymitywa systemowa, której używają **keyloggery**. Heurystyczne skanery AV nie potrafią z samego pliku binarnego stwierdzić, czy program liczy klawisze, czy kradnie hasła — więc każda niepodpisana binarka, która sięga po to API, dostaje flagę. Każdy istniejący licznik klawiszy (WhatPulse i pochodne) odbija się od tej samej ściany.

Obejścia nie ma. Nie da się globalnie liczyć klawiszy bez tej prymitywy.

## Co KeyCounter faktycznie robi w tym hooku

- Czyta tylko **virtual key code** (czyli: „to był klawisz w slocie 30") — nie znak, nie wpisany tekst
- Zwiększa licznik w pamięci
- Co jakiś czas zrzuca liczniki do lokalnego pliku SQLite
- Nigdy nie składa klawiszy w tekst
- Nigdy nie odpala wywołania sieciowego. Nigdzie. W całym kodzie nie ma żadnego wychodzącego HTTP

To mały plik, który zaudytujesz w minutę: [`src-tauri/src/`](../src-tauri/src/).

## Co robię w sprawie false-positive'ów

Kilka praktycznych rzeczy, w kolejności wysiłku:

1. **Wszystkie buildy lecą na GitHub Actions** — publicznie, reprodukowalne, możesz dopasować pobraną binarkę do konkretnego runa CI, który ją zbudował
2. **Zero trików anti-analysis** — nie ma packowania UPX-em, nie ma obfuskacji, nie ma anti-debugu, nie ma DLL injection
3. **Brak autostartu przez klucz `Run` w rejestrze** — KeyCounter używa Task Scheduler / Login Items przez oficjalne pluginy Tauri
4. **Zgłoszenia false-positive** do Microsoft Defender po każdym otagowanym release
5. **Code signing** — rozwiązałoby większość tego, ale prawdziwy certyfikat EV kosztuje więcej, niż chcę wydać na projekt po godzinach. Jeśli KeyCounter kiedykolwiek dorobi się popularności, która to uzasadni, kupię cert

## Jak właściwie odpalić niepodpisany build

Jeśli ufasz źródłom — przeczytaj kod, zbuduj sam, albo sprawdź hashe wobec runa GitHub Actions. Tu jest jak ominąć każde ostrzeżenie.

### Windows SmartScreen

1. Prawy klik na instalatorze → **Właściwości** → zaznacz **Odblokuj** → **OK**
2. Dwuklik na instalatorze → **Więcej informacji** → **Uruchom mimo to**

### Windows Defender wrzucił zainstalowaną binarkę do kwarantanny

1. **Zabezpieczenia Windows** → **Ochrona przed wirusami i zagrożeniami** → **Zarządzaj ustawieniami** → **Wykluczenia**
2. Dodaj folder instalacji (np. `C:\Program Files\KeyCounter`) jako wykluczenie
3. (Opcjonalnie, pomaga reszcie): zgłoś plik jako false-positive na [microsoft.com/wdsi/filesubmission](https://www.microsoft.com/en-us/wdsi/filesubmission)

### macOS Gatekeeper

1. Spróbuj otworzyć `.app` raz — wywali błąd
2. **Ustawienia systemowe → Prywatność i bezpieczeństwo** → przewiń na dół → **Otwórz mimo to** obok ostrzeżenia o KeyCounter
3. KeyCounter poprosi wtedy o uprawnienie **Accessibility** — to wymagane dla event tapa klawiatury; ekran powitalny prowadzi przez to

### Linux

Brak odpowiednika SmartScreena. `chmod +x` na AppImage i odpal, albo `dpkg -i` na .deb.

## Weryfikacja, czy pobrałeś prawdziwą binarkę

Każdy release na GitHubie ma plik `SHA256SUMS.txt` z hashami wszystkich artefaktów oraz link do runa GitHub Actions, który je zbudował. Jak sprawdzić, co pobrałeś:

```powershell
# Windows (PowerShell)
Get-FileHash KeyCounter-Setup-x64.exe -Algorithm SHA256
```

```bash
# macOS / Linux
shasum -a 256 KeyCounter.dmg
```

Porównaj wynik z odpowiednią linią w `SHA256SUMS.txt`. Jeśli się nie zgadzają — nie odpalaj, otwórz issue.

## Dalej ci nieswojo?

Zupełnie zrozumiale. Kod jest otwarty. Zbuduj sam:

```bash
git clone https://github.com/perlessmtfuji/keycounter.git
cd keycounter
npm install
npm run tauri:build
```

Dostaniesz binarkę zbudowaną na twoim sprzęcie ze źródeł, które przeczytałeś.
