/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Atropos
 * Software License: GNU GPLv3
 */

// Import Modules
import { ShinobigamiItemSheet } from "./sheet/item-sheet.js";
import { ShinobigamiActorSheet } from "./sheet/actor-sheet.js";
import { SecretJournalSheet } from "./secret-journal.js";
import { ShinobigamiSettings } from "./settings.js";
import { PlotCombat } from "./combat.js";
import { PlotSettings } from "./plot.js";

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

    CONFIG.Combat.documentClass = PlotCombat;
    CONFIG.Combat.initiative.formula = "1d6";
    CONFIG.JournalEntry.sheetClass = SecretJournalSheet;
    ShinobigamiSettings.init();
    
    PlotSettings.initPlot();
    
});




