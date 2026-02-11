"use client"

import Link from "next/link"

export default function WorkflowPage() {
  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Fraunces:opsz,wght@9..144,600;9..144,700;9..144,800&display=swap");

        .workflow-page {
          --bg: #fafaf8;
          --surface: #ffffff;
          --border: #e8e6e1;
          --ink: #1a1917;
          --ink2: #6b6860;
          --ink3: #9e9b93;
          --accent: #2563eb;
          --prod: #7c3aed;
          --valid: #dc2626;
          --regie: #0d9488;
          --preval: #d97706;
          --ok: #16a34a;
          --reject: #dc2626;
          --radius: 16px;
          --shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.04);
          --shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.08),
            0 16px 48px rgba(0, 0, 0, 0.06);
        }
        .workflow-page {
          font-family: "DM Sans", system-ui, sans-serif;
          background: var(--bg);
          color: var(--ink);
          -webkit-font-smoothing: antialiased;
          min-height: 100vh;
        }

        .workflow-header {
          text-align: center;
          padding: 56px 24px 40px;
          background: linear-gradient(180deg, #f5f3ef 0%, var(--bg) 100%);
        }
        .workflow-header .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 100px;
          padding: 6px 16px 6px 8px;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--ink2);
          margin-bottom: 20px;
          letter-spacing: 0.3px;
        }
        .workflow-header .badge .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--ok);
        }
        .workflow-header h1 {
          font-family: "Fraunces", serif;
          font-weight: 800;
          font-size: clamp(2rem, 5vw, 3.2rem);
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin-bottom: 12px;
        }
        .workflow-header h1 span {
          color: var(--accent);
        }
        .workflow-header p {
          font-size: 1.05rem;
          color: var(--ink2);
          max-width: 580px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .actors {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          padding: 0 24px 48px;
        }
        .actor {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 10px 18px;
          font-size: 0.85rem;
          font-weight: 600;
          box-shadow: var(--shadow);
        }
        .actor .icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          font-size: 1.1rem;
          color: #fff;
          flex-shrink: 0;
        }
        .actor .meta {
          text-align: left;
        }
        .actor .meta small {
          display: block;
          font-weight: 400;
          font-size: 0.72rem;
          color: var(--ink3);
          margin-top: 1px;
        }

        .flow {
          max-width: 960px;
          margin: 0 auto;
          padding: 0 24px 80px;
          position: relative;
        }
        .flow::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 80px;
          width: 2px;
          background: repeating-linear-gradient(
            180deg,
            var(--border) 0,
            var(--border) 8px,
            transparent 8px,
            transparent 16px
          );
          transform: translateX(-1px);
        }

        .step {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 48px 1fr;
          align-items: start;
          margin-bottom: 8px;
        }
        .step .connector {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding-top: 28px;
          z-index: 2;
        }
        .step .node {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--surface);
          border: 3px solid var(--border);
          display: grid;
          place-items: center;
          font-size: 1rem;
          font-weight: 700;
          color: var(--ink2);
          box-shadow: var(--shadow);
          transition: all 0.3s ease;
        }
        .step:hover .node {
          transform: scale(1.12);
          border-color: var(--accent);
          color: var(--accent);
        }
        .step .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px 28px;
          box-shadow: var(--shadow);
          transition: all 0.3s ease;
          position: relative;
        }
        .step:hover .card {
          box-shadow: var(--shadow-lg);
          transform: translateY(-2px);
        }
        .step .card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          border-radius: var(--radius) var(--radius) 0 0;
        }

        .step.left .card {
          grid-column: 1;
          grid-row: 1;
        }
        .step.left .connector {
          grid-column: 2;
          grid-row: 1;
        }
        .step.left .spacer {
          grid-column: 3;
          grid-row: 1;
        }
        .step.right .spacer {
          grid-column: 1;
          grid-row: 1;
        }
        .step.right .connector {
          grid-column: 2;
          grid-row: 1;
        }
        .step.right .card {
          grid-column: 3;
          grid-row: 1;
        }

        .step[data-actor="prod"] .card::before {
          background: var(--prod);
        }
        .step[data-actor="prod"] .node {
          border-color: var(--prod);
          color: var(--prod);
        }
        .step[data-actor="valid"] .card::before {
          background: var(--valid);
        }
        .step[data-actor="valid"] .node {
          border-color: var(--valid);
          color: var(--valid);
        }
        .step[data-actor="regie"] .card::before {
          background: var(--regie);
        }
        .step[data-actor="regie"] .node {
          border-color: var(--regie);
          color: var(--regie);
        }
        .step[data-actor="preval"] .card::before {
          background: var(--preval);
        }
        .step[data-actor="preval"] .node {
          border-color: var(--preval);
          color: var(--preval);
        }
        .step[data-actor="system"] .card::before {
          background: var(--accent);
        }
        .step[data-actor="system"] .node {
          border-color: var(--accent);
          color: var(--accent);
        }

        .step .card h3 {
          font-family: "Fraunces", serif;
          font-weight: 700;
          font-size: 1.1rem;
          margin-bottom: 6px;
          line-height: 1.25;
        }
        .step .card .who {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 10px;
          padding: 3px 10px;
          border-radius: 100px;
        }
        .step[data-actor="prod"] .who {
          background: #f3ecff;
          color: var(--prod);
        }
        .step[data-actor="valid"] .who {
          background: #fee2e2;
          color: var(--valid);
        }
        .step[data-actor="regie"] .who {
          background: #ccfbf1;
          color: var(--regie);
        }
        .step[data-actor="preval"] .who {
          background: #fef3c7;
          color: var(--preval);
        }
        .step[data-actor="system"] .who {
          background: #dbeafe;
          color: var(--accent);
        }

        .step .card p {
          font-size: 0.88rem;
          color: var(--ink2);
          line-height: 1.55;
        }
        .step .card .detail {
          margin-top: 12px;
          padding: 10px 14px;
          background: #f9f8f6;
          border-radius: 10px;
          border: 1px solid var(--border);
        }
        .step .card .detail code {
          font-family: "DM Sans", sans-serif;
          font-size: 0.78rem;
          color: var(--ink3);
          display: block;
          line-height: 1.6;
        }

        .decision {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 8px auto;
          z-index: 2;
          max-width: 480px;
        }
        .diamond {
          width: 56px;
          height: 56px;
          background: var(--surface);
          border: 3px solid var(--valid);
          transform: rotate(45deg);
          border-radius: 8px;
          display: grid;
          place-items: center;
          box-shadow: var(--shadow);
          margin-bottom: 16px;
        }
        .diamond span {
          transform: rotate(-45deg);
          font-size: 1.3rem;
        }
        .decision-label {
          font-family: "Fraunces", serif;
          font-weight: 700;
          font-size: 1rem;
          text-align: center;
          color: var(--ink);
          margin-bottom: 12px;
        }
        .branches {
          display: flex;
          gap: 16px;
          width: 100%;
        }
        .branch {
          flex: 1;
          padding: 16px 18px;
          border-radius: 12px;
          text-align: center;
          font-size: 0.85rem;
          font-weight: 600;
          border: 2px solid;
        }
        .branch.yes {
          border-color: var(--ok);
          background: #f0fdf4;
          color: #15803d;
        }
        .branch.no {
          border-color: var(--reject);
          background: #fef2f2;
          color: #b91c1c;
        }
        .branch small {
          display: block;
          font-weight: 400;
          font-size: 0.76rem;
          margin-top: 4px;
          color: var(--ink2);
        }

        .arrow-down {
          display: flex;
          justify-content: center;
          padding: 4px 0;
          position: relative;
          z-index: 2;
        }
        .arrow-down svg {
          width: 20px;
          height: 20px;
          color: var(--ink3);
        }

        .finale {
          text-align: center;
          padding: 40px 24px;
          position: relative;
          z-index: 2;
        }
        .finale .big-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          margin: 0 auto 16px;
          background: linear-gradient(135deg, var(--ok), #059669);
          display: grid;
          place-items: center;
          font-size: 2rem;
          color: #fff;
          box-shadow: 0 4px 24px rgba(22, 163, 74, 0.3);
        }
        .finale h3 {
          font-family: "Fraunces", serif;
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .finale p {
          color: var(--ink2);
          font-size: 0.9rem;
        }

        .workflow-footer {
          text-align: center;
          padding: 32px 24px;
          border-top: 1px solid var(--border);
          font-size: 0.78rem;
          color: var(--ink3);
        }
        .workflow-footer a {
          color: var(--accent);
          text-decoration: none;
          font-weight: 600;
        }

        @media (max-width: 700px) {
          .flow::before {
            left: 24px;
          }
          .step {
            grid-template-columns: 48px 1fr;
          }
          .step .connector {
            grid-column: 1 !important;
            grid-row: 1 !important;
          }
          .step .card {
            grid-column: 2 !important;
            grid-row: 1 !important;
          }
          .step .spacer {
            display: none;
          }
          .branches {
            flex-direction: column;
          }
        }

        .step,
        .decision,
        .finale {
          opacity: 0;
          transform: translateY(20px);
          animation: fadeUp 0.5s ease forwards;
        }
        .step:nth-child(1) {
          animation-delay: 0.1s;
        }
        .step:nth-child(2) {
          animation-delay: 0.2s;
        }
        .step:nth-child(3) {
          animation-delay: 0.3s;
        }
        .step:nth-child(4) {
          animation-delay: 0.4s;
        }
        .step:nth-child(5) {
          animation-delay: 0.5s;
        }
        .step:nth-child(6) {
          animation-delay: 0.6s;
        }
        .step:nth-child(7) {
          animation-delay: 0.7s;
        }
        .decision {
          animation-delay: 0.55s;
        }
        .finale {
          animation-delay: 0.8s;
        }
        @keyframes fadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="workflow-page">
        {/* HEADER */}
        <header className="workflow-header">
          <div className="badge">
            <span className="dot" />
            mediaflow.iccrennes.fr
          </div>
          <h1>
            Workflow <span>MediaFlow</span>
          </h1>
          <p>
            Le processus complet de validation des photos, visuels et vidéos —
            de la capture à la diffusion.
          </p>
        </header>

        {/* ACTORS */}
        <div className="actors">
          <div className="actor">
            <div className="icon" style={{ background: "var(--prod)" }}>
              🎨
            </div>
            <div className="meta">
              Équipe Production Visuelle
              <small>Upload &amp; traitement</small>
            </div>
          </div>
          <div className="actor">
            <div className="icon" style={{ background: "var(--preval)" }}>
              🔍
            </div>
            <div className="meta">
              Prévalidateur
              <small>Premier tri (optionnel)</small>
            </div>
          </div>
          <div className="actor">
            <div className="icon" style={{ background: "var(--valid)" }}>
              ✋
            </div>
            <div className="meta">
              Pasteure / Responsable Com
              <small>Validation des médias</small>
            </div>
          </div>
          <div className="actor">
            <div className="icon" style={{ background: "var(--regie)" }}>
              🖥️
            </div>
            <div className="meta">
              Régie technique
              <small>Téléchargement &amp; diffusion</small>
            </div>
          </div>
        </div>

        {/* FLOW */}
        <div className="flow">
          {/* STEP 1 */}
          <div className="step left" data-actor="prod">
            <div className="card">
              <div className="who">🎨 Production visuelle</div>
              <h3>① Capturer &amp; traiter les médias</h3>
              <p>
                Photographier, filmer ou créer les visuels de l&apos;événement.
                Importer et traiter les fichiers bruts (tri, retouche, export
                HD).
              </p>
              <div className="detail">
                <code>
                  📷 Photos → Lightroom (tri + retouche)
                  <br />
                  🎬 Vidéos → Montage (CapCut)
                  <br />
                  🖼️ Visuels → Photoshop / Canva (création)
                </code>
              </div>
            </div>
            <div className="connector">
              <div className="node">1</div>
            </div>
            <div className="spacer" />
          </div>

          <div className="arrow-down">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 14l-5-5h3V4h4v5h3l-5 5z" />
            </svg>
          </div>

          {/* STEP 2 */}
          <div className="step right" data-actor="prod">
            <div className="spacer" />
            <div className="connector">
              <div className="node">2</div>
            </div>
            <div className="card">
              <div className="who">🎨 Production visuelle</div>
              <h3>② Créer l&apos;événement sur MediaFlow</h3>
              <p>
                Se connecter à <strong>mediaflow.iccrennes.fr</strong>, créer un
                nouvel événement (nom, date, type) puis uploader les fichiers
                traités en qualité HD.
              </p>
              <div className="detail">
                <code>
                  🔑 Connexion → Google OAuth
                  <br />
                  📁 Nouvel événement → « Culte 02 Fév 2026 »
                  <br />
                  ⬆️ Upload → Photos triées + visuels + vidéos
                </code>
              </div>
            </div>
          </div>

          <div className="arrow-down">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 14l-5-5h3V4h4v5h3l-5 5z" />
            </svg>
          </div>

          {/* STEP 3 */}
          <div className="step left" data-actor="system">
            <div className="card">
              <div className="who">⚙️ MediaFlow</div>
              <h3>③ Générer les liens de partage</h3>
              <p>
                MediaFlow génère des <strong>liens uniques</strong> —
                des URL partageables qui ne nécessitent aucun compte. L&apos;admin
                peut créer un lien de <strong>prévalidation</strong> (optionnel)
                et/ou un lien de <strong>validation</strong>, puis les envoyer
                par WhatsApp, SMS ou email.
              </p>
              <div className="detail">
                <code>
                  🔗 Lien unique → mediaflow.iccrennes.fr/v/abc123
                  <br />
                  🔍 Prévalidation → Premier tri (optionnel)
                  <br />
                  ✋ Validation → Décision finale
                  <br />
                  📲 Envoi → WhatsApp / SMS / Email
                </code>
              </div>
            </div>
            <div className="connector">
              <div className="node">3</div>
            </div>
            <div className="spacer" />
          </div>

          <div className="arrow-down">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 14l-5-5h3V4h4v5h3l-5 5z" />
            </svg>
          </div>

          {/* STEP 4 — PREVALIDATION (optionnel) */}
          <div className="step right" data-actor="preval">
            <div className="spacer" />
            <div className="connector">
              <div className="node">4</div>
            </div>
            <div className="card">
              <div className="who">🔍 Prévalidateur</div>
              <h3>④ Prévalidation — premier tri (optionnel)</h3>
              <p>
                Si un lien de prévalidation a été créé, une personne de confiance
                fait un <strong>premier tri</strong> des médias avant la
                validation finale. Les médias écartés sont masqués pour le
                validateur.
              </p>
              <div className="detail">
                <code>
                  👉 Swipe droite → Garder (prévalidé)
                  <br />
                  👈 Swipe gauche → Écarter (masqué)
                  <br />
                  🔄 Décisions réversibles
                  <br />
                  🚫 Étape optionnelle — peut être ignorée
                </code>
              </div>
            </div>
          </div>

          <div className="arrow-down">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 14l-5-5h3V4h4v5h3l-5 5z" />
            </svg>
          </div>

          {/* STEP 5 */}
          <div className="step left" data-actor="valid">
            <div className="card">
              <div className="who">✋ Pasteure / Responsable</div>
              <h3>⑤ Valider ou rejeter chaque média</h3>
              <p>
                Le validateur ouvre le lien sur son{" "}
                <strong>téléphone ou son ordinateur</strong> — l&apos;interface
                est intuitive dans les deux cas.{" "}
                <strong>Swipe à droite</strong> pour approuver,{" "}
                <strong>swipe à gauche</strong> pour rejeter.
                {" "}Si une prévalidation a eu lieu, seuls les médias gardés sont
                visibles.
              </p>
              <div className="detail">
                <code>
                  📱💻 Mobile ou ordinateur — interface intuitive
                  <br />
                  👉 Swipe droite → ✅ Approuvé
                  <br />
                  👈 Swipe gauche → ❌ Rejeté
                  <br />
                  👆 Tap / Clic → Voir en plein écran
                </code>
              </div>
            </div>
            <div className="connector">
              <div className="node">5</div>
            </div>
            <div className="spacer" />
          </div>

          <div className="arrow-down">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 14l-5-5h3V4h4v5h3l-5 5z" />
            </svg>
          </div>

          {/* DECISION */}
          <div className="decision">
            <div className="diamond">
              <span>?</span>
            </div>
            <div className="decision-label">Résultat de la validation</div>
            <div className="branches">
              <div className="branch yes">
                ✅ Approuvé
                <small>
                  Le média passe dans le centre de téléchargement
                </small>
              </div>
              <div className="branch no">
                ❌ Rejeté
                <small>
                  Le média est exclu — il n&apos;apparaîtra pas dans les
                  téléchargements
                </small>
              </div>
            </div>
          </div>

          <div className="arrow-down">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 14l-5-5h3V4h4v5h3l-5 5z" />
            </svg>
          </div>

          {/* STEP 6 */}
          <div className="step right" data-actor="regie">
            <div className="spacer" />
            <div className="connector">
              <div className="node">6</div>
            </div>
            <div className="card">
              <div className="who">🖥️ Régie technique</div>
              <h3>⑥ Télécharger les médias validés</h3>
              <p>
                La régie accède au <strong>centre de téléchargement</strong> de
                l&apos;événement. Seuls les médias approuvés sont disponibles, en
                qualité HD originale. Téléchargement individuel ou par lot.
              </p>
              <div className="detail">
                <code>
                  ⬇️ Téléchargement → Qualité HD intégrale
                  <br />
                  📦 Par lot ou individuel
                  <br />
                  🎯 Uniquement les médias ✅ approuvés
                </code>
              </div>
            </div>
          </div>

          <div className="arrow-down">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 14l-5-5h3V4h4v5h3l-5 5z" />
            </svg>
          </div>

          {/* STEP 7 */}
          <div className="step left" data-actor="regie">
            <div className="card">
              <div className="who">🖥️ Régie / Communication</div>
              <h3>⑦ Diffuser les contenus</h3>
              <p>
                Les médias validés sont intégrés aux supports de communication :
                projection en culte, réseaux sociaux, site web, streaming.
              </p>
              <div className="detail">
                <code>
                  📺 Projection culte (ProPresenter / OBS)
                  <br />
                  📱 Réseaux sociaux (Instagram, Facebook)
                  <br />
                  🌐 Site web &amp; YouTube
                </code>
              </div>
            </div>
            <div className="connector">
              <div className="node">7</div>
            </div>
            <div className="spacer" />
          </div>

          {/* FINALE */}
          <div className="finale">
            <div className="big-icon">✓</div>
            <h3>Médias publiés &amp; archivés</h3>
            <p>
              Tous les médias restent accessibles sur MediaFlow pour archivage
              et réutilisation future.
            </p>
          </div>
        </div>

        <footer className="workflow-footer">
          <strong>MediaFlow</strong> · Outil de validation médias d&apos;
          <a href="https://mediaflow.iccrennes.fr">
            Impact Centre Chrétien Rennes
          </a>
          <br />
          Source :{" "}
          <a href="https://github.com/iccbretagne/mediaflow">
            github.com/iccbretagne/mediaflow
          </a>
          <br />
          <br />
          <Link href="/" className="text-icc-violet hover:underline">
            ← Retour à l&apos;accueil
          </Link>
        </footer>
      </div>
    </>
  )
}
