const express = require('express');
const paypal = require('paypal-rest-sdk');
const User = require('../models/user');

const paymentRouter = express.Router();

// --- CONFIGURATION ---
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'YOUR_PAYPAL_CLIENT_ID';
const PAYPAL_SECRET = process.env.PAYPAL_SECRET || 'YOUR_PAYPAL_SECRET';

paypal.configure({
    mode: 'sandbox', // change to 'live' for production
    client_id: PAYPAL_CLIENT_ID,
    client_secret: PAYPAL_SECRET,
});

// --- 1. CREATE PAYMENT ROUTE ---
paymentRouter.post('/create-payment', async (req, res) => {
    try {
        const { amount } = req.body;
        const user = req.session.user;

        if (!user) return res.redirect('/login');
        if (!amount) {
            req.flash('error', 'Please select an amount.');
            return res.redirect('/topup');
        }

        const totalAmount = parseFloat(amount);

        // PAYPAL CONFIGURATION
        const create_payment_json = {
            intent: "sale",
            payer: { "payment_method": "paypal" },
            redirect_urls: {
                return_url: `${req.protocol}://${req.get('host')}/payment/success`,
                cancel_url: `${req.protocol}://${req.get('host')}/topup`,
            },
            transactions: [{
                item_list: {
                    items: [{
                        name: "Wallet Top-up",
                        sku: "001",
                        price: totalAmount.toString(),
                        currency: "USD",
                        quantity: 1,
                    }]
                },
                amount: {
                    currency: "USD",
                    total: totalAmount.toString(),
                },
                description: `Wallet funds for ${user.email}`
            }]
        };

        // CREATE PAYMENT
        paypal.payment.create(create_payment_json, (error, payment) => {
            if (error) {
                console.error("PayPal Init Error:", error);
                req.flash('error', 'PayPal initialization failed. Please try again.');
                return res.redirect('/topup');
            } else {
                // Store payment details in SESSION
                req.session.pendingPayment = {
                    id: payment.id,
                    amount: totalAmount,
                }

                // Save sessionn too ensure data persists
                req.session.save((err) => {
                    if (err) {
                        console.error("Session Save Error:", err);
                        return res.redirect('/topup');
                    }
                });

                // Find approval URL and redirect
                for (let i = 0; i < payment.links.length; i++) {
                    if (payment.links[i].rel === 'approval_url') {
                        return res.redirect(payment.links[i].href);
                    }
                }
            }
        });

    } catch (err) {
        console.error("Payment Route Error:", err);
        req.flash('error', 'System error initializing payment.');
        res.redirect('/topup');
    }
});

// --- 2. SUCCESS ROUTE ---
paymentRouter.get('/payment/success', async (req, res) => {
    try {
        const { paymentId, PayerID } = req.query;
        const user = req.session.user;

        if (!user) return res.redirect('/login');

        // Retrieve amount from session
        const pendingPayment = req.session.pendingPayment;

        // verify pending payment record
        if (!pendingPayment) {
            req.flash('error', 'Session expiired on invalid payment request.');
            return res.redirect('/topup');
        }

        // Verfy the IDs match (Basic security check)
        if (pendingPayment.id !== paymentId) {
            console.error(`Security Mismatch! Session ID: ${pendingPayment}, Query ID: ${paymentId}`);
            delete req.session.pendingPayment; // clear invalid session
            req.flash('error', 'Security validation failed');
            return res.redirect('/topup');
        }

        const secureAmount = parseFloat(pendingPayment.amount);
        const execute_payment_json = { payer_id: PayerID };

        // EXECUTE PAYMENT
        paypal.payment.execute(paymentId, execute_payment_json, async (error, payment) => {
            if (error) {
                console.error("PayPal Execute Error:", error.response);
                req.flash('error', 'Transaction failed at the final step.');
                return res.redirect('/topup');
            } else {
                // Success: Update DB
                await User.findByIdAndUpdate(user.id, {
                    $inc: { walletBalance: secureAmount }
                });

                // Update Session User Data
                req.session.user.walletBalance = (req.session.user.walletBalance || 0) + secureAmount;

                // Clear pending payment from session
                delete req.session.pendingPayment;
                req.session.save();

                req.flash('success', `Successfully added $${secureAmount} to your wallet!`);
                return res.redirect('/profile');
            }
        });
    } catch (err) {
        console.error("Success Route Logic Error:", err);
        req.flash('error', 'Transaction verification error.');
        res.redirect('/topup');
    }
});

module.exports = paymentRouter;
