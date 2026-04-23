# Bakalářská práce - Komponenta výukového serveru TI - P-úplné problémy

Tento projekt je interaktivní webová aplikace vyvinutá v Reactu, která slouží k vizualizaci a řešení P-úplných problémů. Zaměřuje se na Monotone Circuit Value Problem (MCVP), Kombinatorické hry a Bezkontextové gramatiky, přičemž umožňuje uživatelům interaktivně zadávat, generovat, analyzovat a převádět tyto problémy mezi sebou.

## Hlavní funkce

- Interaktivní práce s MCVP, kombinatorickými hrami a bezkontextovými gramatikami.
- Krokové řešení a vizualizace struktur (grafy, stromy, odvozovací postupy).
- Generování vstupů, práce s připravenými sadami i manuální zadávání.
- Konverze mezi reprezentacemi problémů (MCVP, gramatiky, kombinatorické hry).

## Použité technologie

- React 18
- Vite 5
- Vitest
- ESLint 9
- Prettier
- D3, react-force-graph-2d, bootstrap

## Požadavky

- Node.js 18 nebo novější
- npm 9 nebo novější

## Instalace

Pro spuštění a vývoj projektu postupujte podle následujících kroků:

1. Klonujte repozitář:
   ```bash
   git clone https://github.com/tomaskirnig/Bakalarka.git
   ```
2. Přesuňte se do adresáře projektu:
   ```bash
   cd Bakalarka
   ```
3. Nainstalujte všechny potřebné závislosti:
   ```bash
   npm install
   ```
4. Spusťte aplikaci v režimu vývoje:

   ```bash
   npm run dev
   ```

   > **Důležité:** Pro správné fungování aplikace je nutné mít nainstalované prostředí Node.js, které zahrnuje nástroj `npm`.

## Dostupné skripty

- `npm run dev` - Spustí vývojový server.
- `npm run build` - Vytvoří produkční build.
- `npm run preview` - Spustí lokální náhled produkčního buildu.
- `npm run test` - Spustí testy jednorázově.
- `npm run test:watch` - Spustí testy v režimu sledování změn.
- `npm run lint` - Spustí statickou kontrolu kódu přes ESLint.
- `npm run format` - Naformátuje projekt pomocí Prettieru.
- `npm run format:check` - Zkontroluje formátování bez změn souborů.

## Testování a kvalita kódu

Pro ověření funkčnosti a kvality kódu používejte minimálně tyto příkazy:

```bash
npm run test
npm run lint
npm run format:check
```

## Struktura projektu (zkráceně)

- `src/Components/MCVP` - komponenty pro MCVP.
- `src/Components/CombinatorialGame` - komponenty pro kombinatorické hry.
- `src/Components/Grammar` - komponenty pro bezkontextové gramatiky.
- `src/Components/Conversions` - převody mezi reprezentacemi problémů.
- `tests/` - automatické testy pro hlavní oblasti aplikace.
- `Sady/` - připravené vstupní sady.

## Kontext bakalářské práce

Tato aplikace je implementační částí bakalářské práce zaměřené na výukovou podporu P-úplných problémů. Cílem je nabídnout interaktivní prostředí pro pochopení řešení i vztahů mezi implementovanými problémi.

## Odkaz na živou ukázku

[Živá ukázka aplikace je dostupná zde](https://bakalarka-eight.vercel.app)
