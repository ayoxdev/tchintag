require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Schéma commande
const orderSchema = new mongoose.Schema({
    client: {
        lastName: String,
        firstName: String,
        email: String,
    },
    tags: [
        {
            name: String,
            color: String,
        }
    ],
    price: Number,
    date: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Route GET racine pour test
app.get('/', (req, res) => {
    res.send('API TchinTags est en ligne');
});

// Route POST pour commande
app.post('/api/order', async (req, res) => {
    const { client, tags, price } = req.body;
    if (!client || !client.email || !tags || !Array.isArray(tags) || tags.length === 0 || !price) {
        return res.status(400).json({ message: 'Données manquantes ou invalides' });
    }
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

    try {
        // Sauvegarder commande
        const newOrder = new Order({ client, tags, price });
        await newOrder.save();

        // Mail admin
        await transporter.sendMail({
            from: `"TchinTags - NO REPLY" <${process.env.SMTP_USER}>`,
            to: process.env.ADMIN_EMAIL,
            subject: 'Nouvelle commande TchinTags reçue',
            html: `
        <h2>Nouvelle commande</h2>
        <p><b>Client:</b> ${client.firstName} ${client.lastName} (${client.email})</p>
        <p><b>Nombre de tags:</b> ${tags.length}</p>
        <p><b>Prix total:</b> ${price} €</p>
        <ul>
          ${tags.map(t => `<li>${t.name} - <span style="color:${t.color}">${getColorName(t.color)}</span></li>`).join('')}
        </ul>
        <p>Commande enregistrée le ${new Date().toLocaleString()}</p>
      `
        });

        // Mail client confirmation
        const { generateConfirmationEmailHTML } = require('./emailTemplate/buy-confirm.js');
        const htmlContent = generateConfirmationEmailHTML(tags, client, price);

        await transporter.sendMail({
            from: `"TchinTags - NO REPLY" <${process.env.SMTP_USER}>`,
            to: client.email,
            subject: "Votre commande TchinTags est bien reçue ✅",
            html: htmlContent
        });
        res.json({ message: 'Commande enregistrée et mails envoyés' });
    } catch (err) {
        console.error('Erreur serveur:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
