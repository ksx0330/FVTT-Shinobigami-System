/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Atropos
 * Software License: GNU GPLv3
 */

// Import Modules
import { ShinobigamiItemSheet } from "./sheet/item-sheet.js";
import { ShinobigamiActorSheet } from "./sheet/actor-sheet.js";
import { ShinobigamiActor } from "./sheet/actor.js";
import { SecretJournalSheet } from "./secret-journal.js";
import { ShinobigamiSettings } from "./settings.js";
import { PlotCombat } from "./combat.js";
import { PlotSettings } from "./plot.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function() {
    console.log(`Initializing Simple Shinobigami System`);


    CONFIG.Actor.documentClass = ShinobigamiActor;

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

Hooks.on("renderChatLog", (app, html, data) => chatListeners(html));
Hooks.on("renderChatPopout", (app, html, data) => chatListeners(html));

async function chatListeners(html) {
    html.on('click', '.roll-talent', async ev => {
        event.preventDefault();
        const data = ev.currentTarget.dataset;
        const speaker = ChatMessage.getSpeaker();
        let actor = null;
        
        if (speaker.token != null)
            actor = canvas.tokens.objects.children.find(e => e.id == speaker.token).actor;
        else if (speaker.actor != null)
            actor = game.actors.get(speaker.actor);
        else {
            new Dialog({
                title: "alert",
                content: `You must use actor`,
                buttons: {}
            }).render(true);
            return;
        }
        
        let add = false;
        if (!event.ctrlKey && !game.settings.get("shinobigami", "rollAddon"))
          add = true;
        
        for (var i = 2; i <= 12; ++i)
        for (var j = 0; j < 6; ++j) {
            let name = String.fromCharCode(65 + j);
            let title = game.settings.get("shinobigami", `Shinobigami.${name}${i}`);
            title = (title !== "") ? title : game.i18n.localize(`Shinobigami.${name}${i}`);
            
            if (title === data.talent) {
                let num = actor.data.data.talent.table[j][i - 2].num;
                
                return actor.rollTalent(title, num, add);
            }
        }
        
        new Dialog({
            title: "alert",
            content: `Error ${data.talent}`,
            buttons: {}
        }).render(true);
        return;
    });
}



