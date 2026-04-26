import NetworkVisual from './HPVisual/NodeVisual';

/**
 * Landing page that introduces available theoretical informatics modules.
 *
 * @returns {JSX.Element} Home page content.
 */
export function HomePage() {
  return (
    <>
      <NetworkVisual />
      <div id="home-page" className="div-content bg-trans-color mt-5 mb-5 p-3 p-md-5">
        <h1 className="display-4">Vítejte v Interaktivním Nástroji pro Teoretickou Informatiku.</h1>
        <p className="lead">
          Tato aplikace slouží k vizualizaci a řešení několika klíčových problémů z oblasti
          teoretické informatiky. Můžete zde prozkoumat a interaktivně pracovat s:
        </p>
        <ul className="list-unstyled">
          <li>
            <strong>MCVP (Monotone Circuit Value Problem):</strong> Analyzujte a vyhodnocujte
            monotonní logické obvody.
          </li>
          <li>
            <strong>Kombinatorické hry:</strong> Zkoumejte a hledejte výherní strategie v
            jednoduchých kombinatorických hrách.
          </li>
          <li>
            <strong>Bezkontextové gramatiky:</strong> Řešte problém neprázdnosti jazyků gramatik a
            analyzujte jejich derivační stromy.
          </li>
        </ul>
        <p className="lead">
          Nástroj také umožňuje převádět problémy z MCVP na ostatní domény a sledovat jednotlivé
          kroky transformace.
        </p>
      </div>
    </>
  );
}
