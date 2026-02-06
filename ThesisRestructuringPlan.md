# Plán restrukturalizace bakalářské práce

## 🛑 Kritické pravidlo pro restrukturalizaci
Při přesouvání obsahu mezi kapitolami **NEMĚŇTE stávající text**. Úkolem je pouze změnit pozici (pořadí) textu v dokumentu tak, aby odpovídala nové struktuře. Výjimkou jsou pouze místa, kde je v plánu explicitně uvedeno doplnění nového textu (např. definice) nebo smazání (např. zbytečné obrázky). Po přesunu textu pouze upravte navazující věty, aby text dával smysl v novém kontextu (např. odkazy na kapitoly).

## 1. Nová struktura kapitol

Stávající soubory (`MCVP.tex`, `Games.tex`, `Grammars.tex`) budou rozděleny a jejich obsah přesunut do nových, obecnějších kapitol.

### Navrhovaný seznam souborů:
1.  **`Chapters/Introduction.tex`** (Zůstává, drobné úpravy)
2.  **`Chapters/Theory.tex`** (NOVÝ) - Teoretický základ
3.  **`Chapters/AnalysisAndDesign.tex`** (PŘEJMENOVÁNO z `Technologies.tex`) - Analýza a návrh
4.  **`Chapters/Implementation.tex`** (NOVÝ) - Implementace
5.  **`Chapters/Conclusion.tex`** (Zůstává)

## 2. Detailní přesuny obsahu

### Kapitola: Teoretický základ (`Theory.tex`)
Tato kapitola bude obsahovat veškerou teorii, která je nyní roztroušena v úvodech jednotlivých problémů.
*   **Formální definice:** Přidat novou sekci s definicemi (P, P-úplnost, Log-space redukce).
*   **MCVP:** Přesunout sekci 3.1 a 3.1.1 z `MCVP.tex`.
*   **Kombinatorické hry:** Přesunout sekci 4.1 a 4.1.1 z `Games.tex`.
*   **Bezkontextové gramatiky:** Přesunout sekci 5.1 a 5.1.1 z `Grammars.tex`.
*   **Principy redukcí:** Přesunout teoretické popisy redukcí:
    *   MCVP -> Hry (sekce 3.7.1 z `MCVP.tex`)
    *   MCVP -> Gramatiky (sekce 3.8.1 z `MCVP.tex`)

### Kapitola: Analýza a návrh (`AnalysisAndDesign.tex`)
Základem bude původní `Technologies.tex`.
*   **Technologie:** Ponechat sekce o React, Vite, atd.
*   **Architektura a Design:** Zde bude popis architektury (sekce 2.3).
*   **Diagramy tříd:** Přesunout sem diagramy, které jsou nyní v implementaci:
    *   MCVP Class Diagram (sekce 3.2.2, obr. `MCVP_class.png`)
    *   Game Class Diagram (sekce 4.4.1, obr. `CG_class.png`)
    *   Grammar Class Diagram (sekce 5.4.3, obr. `Grammar_class.png`)
    *   *Tip:* Sjednotit popis těchto tříd do jedné sekce "Návrh datových struktur".
*   **Návrh UI:** Přidat/přesunout popis rozložení stránky a ovládacích prvků (části sekcí o interaktivní editaci, pokud popisují *návrh* a ne *funkci*).

### Kapitola: Implementace (`Implementation.tex`)
Zde bude detailní popis fungování aplikace.
*   **Struktura:** Nejprve popsat implementaci jednotlivých problémů, poté implementaci převodů.
*   **MCVP:**
    *   Parsování a lexer (3.2, 3.2.1)
    *   Vyhodnocení (3.3 - algoritmus, krokování)
    *   Interaktivní editace (3.4) - *Pozor: Odstranit zbytečný obrázek 3.4 dle připomínek.*
    *   Generování (3.5)
    *   Vizualizace (3.6)
    *   Ukládání (3.9)
*   **Hry:**
    *   Algoritmus analýzy (4.7)
    *   Krokové vyhodnocení (4.8)
    *   Generování (4.4)
*   **Gramatiky:**
    *   Algoritmus vyhodnocení (5.6)
    *   Rekonstrukce derivace (5.6.2)
    *   Generování (5.4)
*   **Implementace převodů:**
    *   MCVP -> Hry (sekce 3.7.2)
    *   MCVP -> Gramatiky (sekce 3.8.2)
    *   *Nové:* Přidat screenshoty konkrétního příkladu převodu (DAG -> Hra -> Gramatika), jak požaduje vedoucí.

## 3. Konkrétní texty k doplnění (Draft)

### Formální definice (do `Theory.tex`)
Vložit na začátek kapitoly.

```latex
\section{Základní pojmy a definice}
Pro formální ukotvení problematiky nejprve zavedeme klíčové pojmy z teorie složitosti, o které se tato práce opírá.

\begin{definition}[Třída P]
Třída \textbf{P} (Polynomial time) obsahuje všechny rozhodovací problémy, které jsou řešitelné na deterministickém Turingově stroji v čase $O(n^k)$, kde $n$ je velikost vstupu a $k$ je nezáporná konstanta.
\end{definition}

\begin{definition}[Logaritmická redukce]
Nechť $A$ a $B$ jsou jazyky (problémy). Řekneme, že $A$ je \textbf{převeditelný v logaritmickém prostoru} na $B$ (značíme $A \leq_L B$), jestliže existuje funkce $f$ vyčíslitelná Turingovým strojem s logaritmickou paměťovou složitostí taková, že pro každé slovo $w$ platí:
$$ w \in A \iff f(w) \in B $$
\end{definition}

\begin{definition}[P-úplnost]
Problém $A$ se nazývá \textbf{P-úplný}, jestliže platí dvě podmínky:
\begin{enumerate}
    	item $A \in P$ (problém je v třídě P).
    	item Pro každý problém $B \in P$ platí $B \leq_L A$ (každý problém z P lze na $A$ převést v logaritmickém prostoru).
\end{enumerate}
\end{definition}
```

## 4. Akční plán (kroky pro Gemini)

1.  **[HOTOVO] Vytvořit soubor `Chapters/Theory.tex`** a naplnit ho:
    *   Novým úvodem s definicemi.
    *   Přesunutými sekcemi teorie z původních souborů.
2.  **[HOTOVO] Přejmenovat `Chapters/Technologies.tex` na `Chapters/AnalysisAndDesign.tex`** a upravit:
    *   Přidat sekci "Návrh datových struktur" a přesunout do ní texty a obrázky k diagramům tříd.
3.  **[HOTOVO] Vytvořit soubor `Chapters/Implementation.tex`** a naplnit ho:
    *   Sekcemi o implementaci (algoritmy, parsery, generátory) ze všech tří modulů.
    *   Sekcemi o implementaci převodů (až na konec kapitoly).
4.  **[HOTOVO] Upravit `BachelorThesis.tex`**:
    *   Změnit seznam `\input` souborů.
5.  **[HOTOVO] Pročistit staré soubory**:
    *   Původní soubory `MCVP.tex`, `Games.tex`, `Grammars.tex` ponechány v adresáři jako záloha (nejsou již vkládány do hlavního dokumentu).

## 5. Poznámky k obrázkům
*   **Odstranit:** `IMGs/ControlsForInteractiveMCVP.png` (pokud se potvrdí, že je zbytečný - vedoucí to zmiňuje).
*   **Přidat:** Doporučeno pořídit screenshoty:
    1.  Jednoduchý MCVP obvod.
    2.  Tentýž obvod převedený na Kombinatorickou hru (screenshot z aplikace).
    3.  Tentýž obvod převedený na Gramatiku (výpis pravidel nebo strom).
    *Tyto obrázky by měly přijít do sekce Implementace převodů.

## 6. Návrh a specifikace nových diagramů
Vytvořit detailní textový popis a zadání pro dva nové diagramy, které uživatel následně vytvoří v externím nástroji (LucidChart):
1.  **Stavový diagram retrográdní analýzy:** Vizualizace přechodů stavů (Remíza -> Výhra/Prohra) pro kapitolu Implementace.
2.  **Třídní diagram hlavních komponent:** Vizualizace architektury (App, Moduly, Utils) pro kapitolu Analýza a návrh.

## 7. Integrace diagramů do textu
Jakmile uživatel vytvoří diagramy a uloží je jako obrázky (očekávané názvy: `RetrogradeStateDiagram.png` a `MainComponentsDiagram.png`), provést:
*   Vložení příkazu `\includegraphics` do příslušných `.tex` souborů.
*   Doplnění textového popisu k těmto diagramům přímo v bakalářské práci.


