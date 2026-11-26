# CampusGo user guide

CampusGo is a university course demo. You can place sample orders for campus-room delivery, but no money is charged and no food, supplies, or print jobs are dispatched.

## 1. Open CampusGo

1. On the computer, install Node.js LTS. Open the project folder and run `npm ci`, then `npm start`.
2. Install a compatible version of **Expo Go** on your phone. Connect the phone and computer to the same network.
3. On Android, scan the terminal QR code with Expo Go. On iPhone, scan it with the Camera app and open the link.
4. On first launch, tap **Next** through the introduction and then **Get started**, or use **Skip**.

For a browser preview, run `npm run web`. Local notifications are a phone feature. See the [project README](../README.md) for emulator and connection options.

## 2. Register or log in

- At Welcome, tap **Create account**. Enter your name, university email ending in `@ua.edu.lb`, and a password of at least six characters. Confirm the password and tap **Next**.
- Enter an unused student or staff ID with **exactly nine digits**, select your faculty and campus, and enter a Lebanese phone number such as `71123456`. Tap **Create account**. The form checks the ID format and uniqueness. It requires a unique email. New accounts start with **$10.00** in simulated wallet credit.
- To return to an existing account, tap **Log in** and enter your university email and password.
- To try the app with seeded data, tap **Use demo account** on Welcome and then **Log in**. The credentials are `student@ua.edu.lb` and `campus123`.

## 3. Browse, search, and customize

Open **Home** for the four campus stores. Search by store or product name, or tap **All**, **Food**, **Drinks**, **Stationery**, or **Printing** under **Campus stores**. Store cards show the location, approximate preparation time, and opening status. You can browse a closed store, but ordering is unavailable.

In **UA Cafeteria** or **Coffee Corner**, search within the menu or tap the filter icon beside the search field. Select the filters you want and tap **Apply filters**. All selected filters must match. Remove a chip to remove one filter, or use **Clear all** in the filter sheet. Coffee Corner may show the customization needed for a match. Bookstore has category browsing and no dietary filters. Use **Profile → Dietary preferences → Save** to keep your dietary choices for future menu visits.

Tap a product to see its details. Select a size, extras, or cover color where available, choose a quantity, and tap **Add to bag**. Some cards have a **+** shortcut. Products marked **Out of stock** cannot be added. After a successful addition, the temporary confirmation links to the Bag.

## 4. Order printed documents

Open **Print** or tap **Printing Office** on Home.

1. Tap **Choose a file** and select a PDF, Word file, or image of up to 25 MB. Tap **Use a sample document** to try the form without a file of your own.
2. Review or enter **Pages per copy**. Automatic estimates are approximate and may be blank.
3. Choose **Black & White** or **Color**, the double-sided option, and binding.
4. Set the number of copies, review the price, and tap **Add to bag**.

Black and white is **$0.05** per page and color is **$0.25** per page. Staple binding adds **$0.25** per copy, spiral adds **$1.50**, and no binding is free. The price is pages per copy × copies × page rate, plus the binding charge for each copy. Double-sided printing changes the sheet count at the same price. The limit is **200 printed pages across all jobs in the Bag**.

## 5. Manage the Bag

Open **Bag** to review the items and estimated total. Use the quantity controls, **Edit options** where available, or remove a line and use **Undo** if needed. **Clear bag** asks for confirmation. The Bag accepts items from one store at a time and asks before replacing existing items with another store's order.

The minimum is **$2.00** after any coffee reward. Delivery costs **$0.50** and becomes free automatically when the discounted subtotal exceeds **$10.00**. Tap **Proceed to checkout** when the Bag is eligible.

## 6. Check out

1. **Location.** Choose a saved location or select a building, floor, and room number at your campus. Use **Continue** for a new location. Turn on **Save this location** and enter a label to reuse it.
2. **Delivery.** Choose an available break. Each available row shows **Order by** and an **ETA**. Preparation time depends on the store, and transportation takes three additional minutes. The app schedules the earliest arrival within the break. A break that has started can still accept orders if enough time remains. An expired break or a break that cannot be served in time is unavailable.
3. **Payment.** Select **Campus wallet** or **Cash on delivery**. Wallet payments need enough balance. Use **Top up** or select cash if your balance is too low.
4. Tap **Place order**, review **Confirm your order**, and tap **Place order** again. **Placing your order…** leads to **Order placed!**, where you can select **Track order** or **Back to home**.

For example, at the Cafeteria, a **12:20** order for **12:45–13:00** is expected at **12:45**. The same order confirmed at **12:35** is expected at **12:53**. The last valid confirmation is **12:42:00** on an open day.

## 7. Track, cancel, rate, or reorder

**Track order** shows the selected break, estimated arrival, location, and progress through **Received**, **Preparing**, **On the way**, and **Delivered**. In normal time, statuses follow the saved campus schedule. If preparation starts immediately, you may already see **Preparing** when tracking opens.

- Tap **Cancel order** while the order is **Received**. Wallet payments are refunded. Preparation ends the cancellation window as soon as it starts.
- After **Delivered**, select one to five stars and optionally add feedback. Tap **Submit rating**.
- In **My orders**, switch between **Active** and **Past** and use store or status filters. Open an order to see its progress. Tap **Reorder** on an eligible past order and review current prices and available items before tapping **Add to bag**.
- For a print reorder, the app reuses saved files when available. If a file is missing, tap **Select document again** beside that job, review the original print settings, then confirm the reorder. Cancelling leaves the Bag as it was.

## 8. Profile, wallet, and rewards

- **Campus and saved locations.** Use **Profile → Campus** to select your campus. In **Saved locations**, tap **+ Add location**, choose the room, and tap **Save location**. Use the edit or delete icon to manage an existing place.
- **Campus wallet.** Open it from Profile or tap **Top up** on Home. Choose **$5**, **$10**, **$20**, or enter a custom amount up to **$200**. Tap the top-up button to add simulated credit. **Transactions** shows top-ups, payments, and refunds. The wallet also shows spending insights.
- **Coffee Rewards.** View progress at Coffee Corner or through **Profile → Coffee Rewards**. Each eligible paid coffee earns one stamp when delivered. Ten stamps earn one free coffee reward. With a qualifying coffee in the Bag, tap **Apply** in the reward card. The reward covers one eligible coffee and its size. Extras remain payable. You can remove the discount before placing the order. An eligible cancelled order restores a consumed reward.
- **Appearance.** Choose **System**, **Light**, or **Dark** in Profile. System follows the device setting.
- **Notifications.** Open **Profile → Notifications**. Enable notifications through the app or phone settings, then choose order updates or break reminders. Reminders can be set to **10**, **15**, or **20 minutes** before a break. Tap **Send a test notification** to check permissions.
- **Log out.** Tap **Log out** in Profile and confirm.

## 9. Demonstrate the app

1. Sign in with the demo account and open **Profile → Demo settings**.
2. Enter an open academic date and tap **Set date**, or use a quick date. Enter **12:20** and tap **Set time**.
3. Under **Tracking speed (new orders)**, select **Fast** (8 seconds per stage), **Demo** (20 seconds), or **Slow** (60 seconds).
4. Place a Cafeteria order for **12:45–13:00** and open tracking. The simulated statuses advance quickly while the scheduled ETA stays at **12:45**.
5. Tap **Reset** to restore the real clock for new orders. Since saved orders keep their original schedules, resetting the clock does not change their progress. **Simulate offline** demonstrates the offline state. **Reset demo data** restores the demo account's starting order history, wallet, and stamps.

## 10. Troubleshooting

| Problem | What to check |
| --- | --- |
| The QR code does not connect | Use the same network, check that Expo Go supports the project's SDK, or start Metro with `npx expo start --tunnel`. |
| A store is closed | Check the store hours and campus calendar. In a demonstration, set an open weekday and a time during store hours. |
| No breaks are available | The store may be closed, or there may be too little time for preparation and transportation. Try an eligible later break or return on the next open day. |
| The Bag cannot check out | Meet the $2.00 discounted subtotal, check stock, and choose a valid room, break, and payment method. If offline, reconnect. |
| The print estimate is wrong | Enter the correct number under **Pages per copy**. For a missing reorder file, select it again in the reorder sheet. |
| A notification did not appear | Check system permissions on a phone and try **Send a test notification**. The web preview does not send local notifications. |
| You forgot a password | This prototype has no password reset. To continue demonstrating, use the demo account or a different unused email and ID. |
