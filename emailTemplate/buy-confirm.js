const COLOR_NAMES = {
  "#212721": "NOIR",
  "#FF7338": "ORANGE",
  "#927968": "MARRON",
  "#744BD2": "POURPRE",
  "#695FA2": "PANTONE VIOLET",
  "#89A84F": "PANTONE VERT",
  "#23A3C7": "PANTONE CYAN",
  "#FAB178": "PANTONE ORANGE",
  "#FFB5E6": "MATTE ROSE"
};

function getColorName(hex) {
  return COLOR_NAMES[hex.toUpperCase()] || hex;
}

function generateConfirmationEmailHTML(tags, client, totalPrice) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="color-scheme" content="light dark">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de commande</title>
</head>
<body style="font-family: 'Segoe UI', 'Roboto', sans-serif; background: #f8f9fb; color: #333; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); overflow: hidden;">
    
    <div style="color: black; padding: 32px 24px; position: relative; align-items: center;">
      <h1 style="margin: 0; font-size: 24px;">Merci pour votre commande !</h1>
    </div>
    
    <div style="padding: 24px 32px;">
      <p style="font-size: 16px;">Bonjour <strong>${client.firstName}</strong>,</p>
      
      <p style="font-size: 16px;">
        Nous avons bien reçu votre commande de <strong>${tags.length} TchinTag${tags.length > 1 ? 's' : ''}</strong>.
        Voici le détail des textes choisis :
      </p>

      <ul style="padding-left: 20px; font-size: 16px; line-height: 1.6;">
        ${tags.map(t => `
          <li>
            "${t.name}" – 
            <span style="display: inline-block; padding: 2px 8px; background-color: ${t.color}; color: #fff; border-radius: 4px;">
            ${getColorName(t.color)}
          </span>
        </li>`).join('')}
      </ul>


      <p style="font-size: 16px; margin-top: 16px;">
        Le montant total de la commande est de <strong>${Number(totalPrice).toFixed(2)} €</strong>.
      </p>


      <p style="font-size: 16px;">
        <strong>Un second email de confirmation vous sera envoyé une fois votre commande prête.</strong><br />
        Le paiement se fera simplement <strong>lors de la remise en main propre</strong>.
      </p>

      <p style="font-size: 16px;">
        Nous vous recontacterons dans les plus brefs délais. Merci pour votre confiance 🙌
      </p>

      <p style="margin-top: 32px; font-size: 14px; color: #888;">
        — L'équipe TchinTags
      </p>
    </div>
    
    <div style="text-align: center; background: #fafafa; padding: 16px; font-size: 12px; color: #aaa;">
      Cet email vous a été envoyé automatiquement. Ne répondez pas directement.
    </div>
  </div>
</body>
</html>`};

module.exports = { generateConfirmationEmailHTML };