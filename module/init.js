/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Atropos
 * Software License: GNU GPLv3
 */

// Import Modules
import { ShinobigamiItemSheet } from "./item-sheet.js";
import { ShinobigamiActorSheet } from "./actor-sheet.js";
import { SecretJournalSheet } from "./secret-journal.js";
import { ShinobigamiSettings } from "./settings.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function() {
    console.log(`Initializing Simple Shinobigami System`);

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("shinobigami", ShinobigamiActorSheet, { makeDefault: true });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("shinobigami", ShinobigamiItemSheet, {makeDefault: true});
    
    CONFIG.JournalEntry.sheetClass = SecretJournalSheet;
    ShinobigamiSettings.init();
    
    console.log(Actors);
    
});



