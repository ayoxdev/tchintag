const AVAILABLE_COLORS = [
    { name: "NOIR", code: "#212721" },
    { name: "ORANGE", code: "#FF7338" },
    { name: "MARRON", code: "#927968" },
    { name: "POURPRE", code: "#744BD2" },
    { name: "PANTONE VIOLET", code: "#695FA2" },
    { name: "PANTONE VERT", code: "#89A84F" },
    { name: "PANTONE CYAN", code: "#23A3C7" },
    { name: "PANTONE ORANGE", code: "#FAB178" },
    { name: "MATTE ROSE", code: "#FFB5E6" }
];

const PRICE_FULL = 4;
const PRICE_DISCOUNT = 3.5;
const DISCOUNT_THRESHOLD = 10;

const itemsContainer = document.getElementById('itemsContainer');
const addItemBtn = document.getElementById('addItemBtn');
const totalPriceEl = document.getElementById('totalPrice');
const captchaCheckbox = document.getElementById('captcha');
const submitBtn = document.getElementById('submitBtn');
const buyForm = document.getElementById('buyForm');
const formMessage = document.getElementById('formMessage');

function createItem(index) {
    const div = document.createElement('div');
    div.className = 'buy-item';
    div.dataset.index = index;

    div.innerHTML = `
      <input type="text" name="name_${index}" placeholder="Texte (max 8)" required pattern="[A-Za-zÀ-ÖØ-öø-ÿ\\s-]{2,8}" maxlength="8" title="2 à 8 lettres seulement" />
      <div class="color-swatch" aria-hidden="true" style="background:#fff; border-color:#ccc;"></div>
      <select name="color_${index}" required aria-label="Couleur du prénom">
        <option value="">Choisir une couleur</option>
        ${AVAILABLE_COLORS.map(c => `<option value="${c.code}">${c.name}</option>`).join('')}
      </select>
      <button type="button" class="removeItemBtn" aria-label="Supprimer ce prénom">Supprimer</button>
    `;

    const swatch = div.querySelector('.color-swatch');
    const select = div.querySelector('select');

    select.addEventListener('change', () => {
        swatch.style.backgroundColor = select.value || '#fff';
        swatch.style.borderColor = select.value ? '#000' : '#ccc';
        updateTotalPrice();
    });

    div.querySelector('.removeItemBtn').addEventListener('click', () => {
        div.remove();
        updateTotalPrice();
    });

    div.querySelector('input').addEventListener('input', updateTotalPrice);
    select.addEventListener('change', updateTotalPrice);

    return div;
}

function updateTotalPrice() {
    const items = [...itemsContainer.querySelectorAll('.buy-item')];
    let validCount = 0;

    for (const item of items) {
        const nameInput = item.querySelector('input[type="text"]');
        const colorSelect = item.querySelector('select');
        if (nameInput.value.trim().length >= 2 && colorSelect.value) {
            validCount++;
        }
    }

    // Prix unitaire dégressif à partir de DISCOUNT_THRESHOLD
    const unitPrice = validCount >= DISCOUNT_THRESHOLD ? PRICE_DISCOUNT : PRICE_FULL;
    const total = validCount * unitPrice;
    totalPriceEl.textContent = total.toFixed(2);

    // Active bouton si captcha coché ET au moins un item valide ET infos client valides
    const isClientValid = validateClientInfo();
    submitBtn.disabled = !(captchaCheckbox.checked && validCount > 0 && isClientValid);

    clearMessage();
}

async function sendOrder(client, tags, price) {
    try {
        const response = await fetch('http://localhost:3001/api/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client, tags, price }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erreur lors de l\'envoi');
        return data;
    } catch (err) {
        throw err;
    }
}

function validateClientInfo() {
    const lastName = buyForm.querySelector('input[name="lastName"]');
    const firstName = buyForm.querySelector('input[name="firstName"]');
    const email = buyForm.querySelector('input[name="email"]');

    return (
        lastName.checkValidity() &&
        firstName.checkValidity() &&
        email.checkValidity()
    );
}

function clearMessage() {
    formMessage.textContent = '';
    formMessage.style.color = 'red';
}

addItemBtn.addEventListener('click', () => {
    const newIndex = itemsContainer.children.length;
    const newItem = createItem(newIndex);
    itemsContainer.appendChild(newItem);
    updateTotalPrice();
});

captchaCheckbox.addEventListener('change', updateTotalPrice);

// Validation dynamique des infos client
['lastName', 'firstName', 'email'].forEach(name => {
    buyForm.querySelector(`input[name="${name}"]`).addEventListener('input', updateTotalPrice);
});

buyForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (submitBtn.disabled) return;

    const formData = new FormData(buyForm);
    const orders = [];

    itemsContainer.querySelectorAll('.buy-item').forEach((item, i) => {
        const name = formData.get(`name_${i}`);
        const color = formData.get(`color_${i}`);
        if (name && color) {
            orders.push({ name, color });
        }
    });

    if (orders.length === 0) {
        showMessage("Veuillez ajouter au moins un prénom avec une couleur.");
        return;
    }

    if (!validateClientInfo()) {
        showMessage("Veuillez remplir correctement vos informations (Nom, Prénom, Email).");
        return;
    }

    if (!captchaCheckbox.checked) {
        showMessage("Veuillez confirmer que vous n'êtes pas un robot.");
        return;
    }

    const unitPrice = orders.length >= DISCOUNT_THRESHOLD ? PRICE_DISCOUNT : PRICE_FULL;
    const price = (orders.length * unitPrice).toFixed(2);

    try {
        await sendOrder(
            {
                lastName: formData.get('lastName'),
                firstName: formData.get('firstName'),
                email: formData.get('email')
            },
            orders,
            price
        );

        showMessage(`Commande reçue avec ${orders.length} TchinTag(s). Merci !`, 'green');

        // Reset form après envoi réussi, 2s délai
        setTimeout(() => {
            buyForm.reset();
            itemsContainer.innerHTML = '';
            addItemBtn.click();
            updateTotalPrice();
            clearMessage();
        }, 2000);
    } catch (error) {
        showMessage(`Erreur lors de l'envoi : ${error.message}`);
    }
});

function showMessage(msg, color = 'red') {
    formMessage.textContent = msg;
    formMessage.style.color = color;
}

function getColorName(code) {
    const found = AVAILABLE_COLORS.find(c => c.code.toLowerCase() === code.toLowerCase());
    return found ? found.name : code;
}

// Initialiser avec 1 champ déjà présent
addItemBtn.click();
