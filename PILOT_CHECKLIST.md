# Profi.UZ — checklist before Samarkand pilot

Status: implementation review checklist; real two-account end-to-end tests are still required.

## Supabase migrations
1. Run `profi_chat_reads.sql` once in Supabase SQL Editor to enable cross-device read receipts.
2. Confirm `profi_transport.sql` and `profi_transport_booking.sql` completed successfully.
3. Confirm report/moderation migrations if complaint handling is enabled.
4. Check RLS policies using two ordinary user accounts, not the SQL editor administrator.

## Customer / specialist smoke test
1. Register separate customer and specialist accounts; sign in and out.
2. Customer publishes order; specialist finds it and sends proposal.
3. Customer accepts proposal; both parties see the same conversation.
4. Specialist sends a message; customer sees bell and unread conversation.
5. Customer opens conversation; bell disappears. Reload and sign in on another device; receipt should remain read.
6. Repeat in reverse (customer to specialist).
7. Attach JPG and PDF; ensure only conversation participants can access links.
8. Complete order; verify conversation history stays readable and sending is disabled.
9. Verify closed/cancelled orders and rejected proposals do not grant access to unrelated users.

## Intercity transport
1. Navigate Categories → Auto Services → Intercity Transport.
2. Driver posts ride; passenger filters by origin, destination and date.
3. Passenger requests seats; driver confirms, rejects or completes as appropriate.
4. Check no overbooking, no booking own ride, no unauthorized booking actions.
5. Passenger leaves rating only after completed trip.

## Mobile and localization
- Check narrow iPhone and Android widths; header chat button, dialog navigation and file picker.
- Check Russian, Uzbek, Tajik translations.
- Check error messages, empty states, slow network and reload.
- Confirm region filtering and Samarkand default behavior.

## Launch gate
Do not call the pilot production-ready until these flows have been manually verified with real accounts and Supabase migrations completed. Browser-tab notifications are not OS push or SMS delivery.
