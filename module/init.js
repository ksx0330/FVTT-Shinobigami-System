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
import { ActorListDialog } from "./dialog/actor-list-dialog.js";
import { PlotDialog } from "./dialog/plot-dialog.js";

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
    
    game.socket.on("system.shinobigami", ({share, data}) => {
        if (game.user.id === share) {
            new PlotDialog(game.actors.get(data.actorId), data.actors).render(true);
        }
    });
    
});

Hooks.on("getSceneControlButtons", function(controls) {
    controls[0].tools.push({
        name: "setPlot",
        title: "Set Plot",
        icon: "fas fa-dice",
        visible: game.user.isGM,
        onClick: () => setPlot(),
        button: true
    });

});

function setPlot() {
    var actors = game.data.actors.filter(element => (element.permission['default'] == 3 || element.permission[game.user.id] == 3) );

    let dialog = new ActorListDialog(actors)
    dialog.render(true);
}


