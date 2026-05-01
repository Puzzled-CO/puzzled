# puzzled Website

This is a one-page signup site for puzzled, a local bar speed puzzle game.

## What it does

- Promotes the event with a full-screen hero image.
- Uses the puzzled logo and icon from `assets/puzzled-logo.svg` and `assets/puzzled-mark.svg`.
- Shows upcoming Sunday events in a calendar.
- Limits each event to 5 teams in the local preview flow.
- Lets individuals or teams register with 1 to 4 players.
- Shows the $20 per-person entry price and updates the total as players are added.
- Notes that each paid entry includes one drink ticket.
- Explains that winners keep the puzzle.
- Explains that events use different 500-piece puzzles at the same skill level.
- Saves the registration in the browser for local testing.
- Redirects to a payment link once one is added.

## Connect payments

Open `script.js` and replace the empty `PAYMENT_LINK` value with your live checkout link:

```js
const PAYMENT_LINK = "https://your-checkout-link";
```

Stripe Payment Links, Square Online Checkout, PayPal buttons, or another hosted checkout link will work.

## Collect signups

The form includes Netlify-compatible attributes. If you deploy on Netlify, enable forms and submissions will be collected there.

For a production site with guaranteed registration plus payment reconciliation, connect the form to a backend or automation service so each paid checkout is matched to a submitted team.

The five-team event cap is enforced in browser storage for local testing. For a live site, enforce the same cap in your registration backend or payment workflow so two teams cannot claim the final spot at the same time.

## Customize

- Change the business/event name in `index.html`.
- Replace `hello@example.com` with your contact email.
- Update event copy, prize details, date, time, and location once confirmed.
