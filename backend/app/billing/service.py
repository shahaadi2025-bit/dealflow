"""Stripe Checkout integration for the Pro tier.

IMPORTANT LIMITATION: DealFlow has no login system, so there is no server-side
concept of "this user owns this subscription." Checkout and payment are fully
real and secure (Stripe handles all card data; we never see it) -- but what we
grant after a successful payment is a client-side flag in the browser that paid,
not an account record. This is a deliberate trade-off to avoid building a full
auth + database system. It's fine for a solo project or soft-gating a feature;
it is not a substitute for real subscription enforcement if you intend to sell
access to strangers (anyone moderately technical could set the flag manually).
See /billing/verify-session below for the one mitigation we do apply: the
frontend doesn't just trust its own redirect, it confirms payment server-side
against Stripe before setting the flag.
"""
import os
import stripe

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_PRICE_ID = os.getenv("STRIPE_PRICE_ID", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY


class BillingNotConfigured(Exception):
    pass


def create_checkout_session() -> str:
    if not STRIPE_SECRET_KEY or not STRIPE_PRICE_ID:
        raise BillingNotConfigured("STRIPE_SECRET_KEY / STRIPE_PRICE_ID not set on the backend")
    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=[{"price": STRIPE_PRICE_ID, "quantity": 1}],
        success_url=f"{FRONTEND_URL}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{FRONTEND_URL}/#pricing",
    )
    return session.url


def verify_session(session_id: str) -> bool:
    if not STRIPE_SECRET_KEY:
        raise BillingNotConfigured("STRIPE_SECRET_KEY not set on the backend")
    session = stripe.checkout.Session.retrieve(session_id)
    return session.payment_status == "paid"