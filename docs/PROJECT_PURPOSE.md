# Project Purpose

Finance Sorter exists to make monthly household finances less stressful, less tedious, and more understandable.

It began as a family tool. Before this app, the monthly finance routine meant printing a bank transaction list, going line by line, manually categorizing each transaction, adding category totals, and then writing the results on a whiteboard so the household could talk through where the money went. That process worked, but it took a long time, used printer ink, and made a necessary family habit feel heavier than it needed to be.

This app was built to preserve the useful part of that routine while removing some of the friction.

## The Core Job

Finance Sorter helps a household answer a simple monthly question:

> Where did our money go?

The app does this by:

- Importing a bank CSV file.
- Normalizing the transaction rows.
- Grouping transactions into familiar spending categories.
- Letting the user correct and teach category rules.
- Showing totals that can support a real budget conversation.

The goal is not to replace judgment. The goal is to make the review process faster, clearer, and easier to repeat.

## Why Privacy Matters

This app intentionally runs in the browser. Transaction data should stay on the user's device.

The original hope was that family members could use the tool without worrying that their financial information was being uploaded, collected, or monitored. That privacy-first choice creates tradeoffs: there is no central account, no cloud sync, and custom category rules are tied to the same browser/device. For this project, that tradeoff is worth it.

Future changes should protect this trust unless the user explicitly chooses a different direction.

## Who It Is For

Finance Sorter is for people who want a practical monthly finance review without turning it into a complicated software system.

It is especially for households that:

- Review spending once a month.
- Want category totals without doing all the math by hand.
- Prefer a simple local tool over a connected financial app.
- Are trying to reduce stress, cut costs, pay down debt, save money, or rebuild financial stability.

It may not be the right tool for people who already have a budgeting system they love, or people who want automatic bank connections, mobile apps, cloud accounts, and advanced reporting.

## What Success Looks Like

Success is not measured by growth, accounts, analytics, or adoption curves.

Success looks like:

- A monthly finance session taking less time.
- Fewer printed pages and less wasted ink.
- Less stress around reviewing spending.
- A clearer conversation about what happened that month.
- A household finding one or two costs they can reduce.
- A family member feeling safe enough to try the tool because their data stays local.

The app is shaped by a long-running effort to rebuild financial stability, reduce money stress, and make household finances easier to face consistently. It is influenced by practical budgeting and debt-reduction ideas, including the kind of discipline taught in *The Total Money Makeover*.

## Product Values

Keep the app:

- **Private:** No financial data collection by default.
- **Simple:** A person should understand the workflow quickly.
- **Practical:** Focus on the monthly review, not feature sprawl.
- **Correctable:** Users should be able to fix categories when the app guesses wrong.
- **Transparent:** CSV formats and category rules should be easy to inspect.
- **Family-friendly:** It should feel safe enough to share with relatives who are not technical.

## History And Context

Wells Fargo was the original household bank format this app supported. US Bank support was added because a family member tried the app and used that bank.

That history matters because the app is not trying to support every financial institution perfectly. It grows from real monthly use. When a bank changes its CSV format, the right response is to support the new shape clearly and document what changed.

## What To Protect In Future Sessions

Future AI and human contributors should preserve these intentions:

- Do not add data collection casually.
- Do not commit real bank exports or private transaction data.
- Keep the app usable as a static GitHub Pages site.
- Prefer browser-only features unless there is a clear reason to change.
- Treat CSV support as a practical compatibility layer, not a reason to overcomplicate the app.
- Keep the monthly household budgeting workflow at the center.

The hope of this application is modest but real: help people see their finances more clearly, make better decisions together, and reduce the stress around money.
