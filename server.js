const express = require("express");
const Stripe = require("stripe");
const cors = require("cors");
require("dotenv").config();

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
const plans = {
    "PROGRAM ONLY": "price_1U5uV63SMtB6iamNedugBzrD",
    "COACHING": "price_1U5uR43SMtB6iamNKBTmrvmI",
    "1-ON-1": "price_1U6Fcf3SMtB6iamNbNYBb98x"
};

app.post("/create-checkout-session", async (request, response) => {
    try {
        const { plan, athleteId } = request.body;

        if (!plan || !plans[plan]) {
            return response.status(400).json({
                error: "Invalid FIT WARS plan."
            });
        }

        if (!athleteId) {
            return response.status(400).json({
                error: "Athlete ID is required."
            });
        }

        const session = await stripe.checkout.sessions.create({
            mode: plan === "PROGRAM ONLY" ? "payment" : "subscription",

            line_items: [
                {
                    price: plans[plan],
                    quantity: 1
                }
            ],

            client_reference_id: athleteId,

            metadata: {
                athleteId: athleteId,
                plan: plan
            },

            success_url:
                "https://fantastic-space-potato-96vgx46pg46h7xgq-4242.app.github.dev/dashboard.html?payment=success",

            cancel_url:
                "https://fantastic-space-potato-96vgx46pg46h7xgq-4242.app.github.dev/index.html?payment=cancelled"
        });

        response.json({
            url: session.url
        });

    } catch (error) {
        console.error("❌ Checkout session error:", error.message);

        response.status(500).json({
            error: "Unable to create checkout session."
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 FIT WARS checkout server running on port ${PORT}`);
});
