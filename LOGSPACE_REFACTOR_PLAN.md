# Plan refaktoru: logspace jadro + zachovani UI krokovani

## Cile

- Oddelit hlavni logiku prevodu od vizualizacni vrstvy.
- Udelat jadro prevodu tak, aby odpovidalo logspace pristupu (teoreticky i implementacne jako samostatna vrstva).
- Zachovat soucasne UI funkcionality (krokovani, zvyrazneni, prechody mezi kroky) bez omezeni UX.

## Co presne chceme dosahnout

1. MCVP -> Kombinatoricka hra:

- Mit "core" prevod, ktery neuklada historii kroku ani snapshoty pro UI.
- Core bude emitovat vysledek deterministicky a bez velkych pomocnych struktur navic.

2. MCVP -> Gramatika:

- Mit analogicky "core" prevod oddeleny od krokovaci vizualizace.
- Neterminaly/terminaly generovat deterministicky tak, aby nevznikala zavislost na rozsahlych mapach pouze kvuli UI.

3. UI vrstva:

- Krokovaci modaly zustanou funkcne stejne.
- Ukladani mezikroku zustane pouze v UI vrstve a bude explicitne oddeleno od core.

## Fazovy plan

### Faze 1: Navrh rozhrani a datovych toku (0.5 dne)

- Definovat API pro core prevody (vstup, vystup, chybove stavy).
- Definovat API pro "step builder" vrstvu, ktera z core dat sklada kroky pro UI.
- Domluvit jednotny format identifikatoru uzlu/symbolu pro oba prevody.

Vystup faze:

- Strucna technicka specifikace (co patri do core vs. co patri do UI vrstvy).

### Faze 2: Core prevod MCVP -> Kombinatoricka hra (0.5-1 den)

- Vyjmout cistou prevodni logiku do samostatneho modulu.
- Odstranit zavislost core casti na `steps`, `labels`, snapshot kopirovani stavu.
- Zachovat stejne finalni vysledky jako dnes (pro stejne vstupy).

Vystup faze:

- Nova core funkce + adapter pro stavajici UI.

### Faze 3: Core prevod MCVP -> Gramatika (1-1.5 dne)

- Vyjmout cistou logiku konstrukce gramatiky do samostatneho modulu.
- Upravit generovani symbolu tak, aby bylo deterministicke a opakovatelne.
- Zachovat stejnou semantiku produkci jako dnes.

Vystup faze:

- Nova core funkce + adapter pro stavajici UI.

### Faze 4: UI integrace bez zmen UX (0.5 dne)

- Zachovat step-by-step modaly a ovladani beze zmeny.
- Step builder bude stavet kroky nad core vrstvou (a pouze zde se budou ukladat mezikroky).
- Aktualizovat informacni texty tak, aby jasne oddelovaly teorii od implementacni vizualizace.

Vystup faze:

- Funkcne stejny frontend, ale cistsi architektura.

### Faze 5: Testy, porovnani vystupu, finalni kontrola (0.5 dne)

- Porovnat stare a nove finalni vystupy na pripravenych sadach.
- Overit, ze se nezmenilo uzivatelske chovani v modalech.
- Provest build/test check a rychlou regresni kontrolu konverznich flow.

Vystup faze:

- Potvrzeni kompatibility + seznam pripadnych odchylek.

## Odhad celkem

- Realisticky: 2.5 az 4 dny.
- Bezpecny plan s rezervou: 4 dny.

## Hlavni rizika

- Nechtena zmena finalnich vystupu pri refaktoru symbol mapovani.
- Rozdily v poradi kroku mezi starou a novou implementaci.
- Nejasna hranice mezi core a UI (nutnost discipliny pri rozdeleni vrstev).

## Mitigace rizik

- Golden tests nad finalnimi vysledky obou prevodu.
- Prubezne porovnani na existujicich sadech vstupu.
- Refaktor po malych krocich s castym overenim.

## Akceptacni kriterial

- Core prevody jsou samostatne moduly bez UI zavislosti.
- UI krokovani funguje stejne jako pred refaktorem.
- Finalni konverzni vystupy odpovidaji puvodnimu chovani.
- Informacni texty nerozporuji realne chovani implementace.
