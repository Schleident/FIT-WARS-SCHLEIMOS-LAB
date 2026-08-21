const express = require("express");
const Stripe = require("stripe");
require("dotenv").config();

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const PORT = process.env.PORT || 4242;

app.post(
    "/stripe-webhook",
    express.raw({ type: "application/json" }),
    async (request, response) => {
        const signature = request.headers["stripe-signature"];

        let event;

        try {
            event = stripe.webhooks.constructEvent(
                request.body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (error) {
            console.error(
                "Webhook signature verification failed:",
                error.message
            );
            return response
                .status(400)
                .send(`Webhook Error: ${error.message}`);
        }

        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;

                console.log("✅ Checkout completed!");
                console.log("Session ID:", session.id);
                console.log("Customer:", session.customer);
                console.log("Subscription:", session.subscription);

                try {
                    const lineItems =
                        await stripe.checkout.sessions.listLineItems(
                            session.id,
                            { limit: 1 }
                        );

                    const priceId = lineItems.data[0]?.price?.id;

                    const plans = {
                        "price_1U5uV63SMtB6iamNedugBzrD":
                            "PROGRAM ONLY",

                        "price_1U5uR43SMtB6iamNKBTmrvmI":
                            "COACHING",

                        "price_1U6Fcf3SMtB6iamNbNYBb98x":
                            "1-ON-1"
                    };

                    if (priceId && plans[priceId]) {
                        console.log(
                            "🏆 FIT WARS PLAN:",
                            plans[priceId]
                        );
                        console.log(
                            "Stripe Price ID:",
                            priceId
                        );
                    } else {
                        console.log(
                            "⚠️ Plan could not be identified."
                        );
                        console.log(
                            "Stripe Price ID:",
                            priceId || "none"
                        );
                    }
                } catch (error) {
                    console.error(
                        "❌ Could not retrieve Checkout line items:",
                        error.message
                    );
                }

                break;
            }

            default:
                console.log(
                    `Unhandled event type: ${event.type}`
                );
        }

        response.json({ received: true });
    }
);

app.get("/", (request, response) => {
    response.send("FIT WARS Stripe webhook is running.");
});

app.listen(PORT, () => {
    console.log(
        `🚀 FIT WARS webhook running on port ${PORT}`
    );
});