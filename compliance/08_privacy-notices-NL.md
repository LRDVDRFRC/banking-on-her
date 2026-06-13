# Privacy notices & consent — Dutch (drop-in)

Ready-to-use Dutch text for the product. Two audiences: the **client crew**
(intake) and the **test panel** (consumers). The controller (client) confirms
the legal basis and is named in `[…]`.

> Draft for review by the controller's DPO before it goes live.

---

## A. Crew intake — privacy notice (Art. 13)

Place on `/s/<token>/intake`, above the form. The legal basis for employees is
typically the engagement / legitimate interest, set by the employer-controller.

> ### Even over je privacy
> Je vult deze intake in voor de Gender Capital Lab Sprint van **[Klant]**. Wat je
> hier invult — je naam, je rol, je antwoorden en de documenten die je uploadt —
> gebruiken we alleen om de sprint voor te bereiden.
>
> - **Wie is verantwoordelijk?** [Klant] is verantwoordelijk voor je gegevens;
>   Unlockt verwerkt ze in opdracht van [Klant].
> - **Wat doen we ermee?** We analyseren je antwoorden en documenten — deels met
>   AI (Claude van Anthropic) — om de bevindingen voor de sprintdag te maken.
>   Citaten gebruiken we in de ochtendpresentatie **anoniem**.
> - **Waar gaat het heen?** Je gegevens staan opgeslagen in de EU (Ierland). Voor
>   de AI-analyse gaat tekst naar de VS (Anthropic), onder wettelijke
>   waarborgen (SCC's); deze wordt **niet gebruikt om AI te trainen** en binnen
>   30 dagen verwijderd.
> - **Hoe lang?** We bewaren je antwoorden niet langer dan nodig voor de sprint
>   en de afgesproken opvolging (zie de afspraken met [Klant]).
> - **Geen bijzondere gegevens.** Upload geen documenten met bijzondere
>   persoonsgegevens (bijv. gezondheid).
> - **Je rechten.** Inzage, correctie of verwijdering? Neem contact op met
>   **[contact bij Klant / functionaris gegevensbescherming]**.

A short acknowledgement line by the submit button:

> Door verder te gaan ga je akkoord met deze verwerking zoals hierboven beschreven.

---

## B. Test panel — consent form (explicit opt-in)

For the evening panel. Consumers → **explicit consent** is the cleanest basis.
Show before the session; capture a tick / signature. Keep a record.

> ### Toestemming voor deelname aan het testpanel
> Bedankt dat je vanavond meedenkt met **[Klant]**. Voordat we beginnen, even dit:
>
> - **Wat we vastleggen:** je voornaam en leeftijd, je reacties op de ideeën, en
>   een aantal scores. Geen achternaam, geen contactgegevens in de testresultaten.
> - **Waarvoor:** om de concepten te verbeteren. [Klant] is verantwoordelijk voor
>   je gegevens; Unlockt verwerkt ze in opdracht.
> - **Citaten:** we gebruiken wat je zegt **anoniem** in de terugkoppeling.
> - **Waar gaat het heen:** opgeslagen in de EU; voor AI-analyse gaat tekst naar
>   de VS (Anthropic), onder wettelijke waarborgen, niet gebruikt voor
>   AI-training, binnen 30 dagen verwijderd.
> - **Hoe lang:** we bewaren je input maximaal **[3] maanden** na de sessie.
> - **Vrijwillig:** deelname is vrijwillig. Je mag op elk moment stoppen of je
>   toestemming intrekken — dan verwijderen we je input, zonder dat dit gevolgen
>   heeft voor je **[vergoeding: €/cadeaubon]**.
> - **Vragen of verwijderen:** **[contact bij Klant]**.
>
> ☐ **Ik geef toestemming** voor het vastleggen en verwerken van mijn input zoals
> hierboven beschreven.
>
> Naam: ______________   Datum: __________   Handtekening: ______________

---

## Wiring into the platform (next step)

These are text; to make them *true* they must appear in the product:
- Crew notice → render on the intake page (collapsible "Even over je privacy").
- Panel consent → a gate on `/s/<token>/test/<cid>` (or a paper form the panel
  host collects, recorded by name).

Scope this as a small UI task — flagged in `09_open-items-and-decisions.md`.
