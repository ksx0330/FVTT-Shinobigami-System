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
import { PlotDialog } from "./dialog/plot-dialog.js";

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

Hooks.once("ready", async function() {
    let basedoc = document.getElementsByClassName("vtt game system-shinobigami");
    let hotbar = document.createElement("div");
    hotbar.className = "plot-bar";

    basedoc[0].appendChild(hotbar);
});

Hooks.on("renderChatLog", (app, html, data) => chatListeners(html));
Hooks.on("renderChatPopout", (app, html, data) => chatListeners(html));
Hooks.on("updatePlotBar", (html) => chatListeners(html));

Hooks.on("getSceneControlButtons", function(controls) {
    controls[0].tools.push({
        name: "rollTalent",
        title: "Roll Talent",
        icon: "fas fa-dice-d6",
        visible: game.user.isGM,
        onClick: () => {
            Dialog.prompt({
              title: "Roll Talent",
              content: `
                <h2>
                  ${game.i18n.localize("Shinobigami.Talent")}
                </h2>
                <p><input type="text" id="talent" /></p>
              `,
              render: () => $("#talent").focus(),
              callback: async () => {
                const talent = $("#talent").val().trim();
                let context = `
                  <h2>${game.i18n.localize("Shinobigami.Talent")}: ${talent}</h2>
                  <button type="button" class="roll-talent" data-talent="${talent}">${talent}</button>
                `

                // GM rolls.
                let chatData = {
                  user: game.user.id,
                  speaker: ChatMessage.getSpeaker({ alias: "GM" }),
                  content: context
                };

                ChatMessage.create(chatData);
              }
            });
        },
        button: true
    });

});

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
        
        let add = true;
        if (!event.ctrlKey && !game.settings.get("shinobigami", "rollAddon"))
          add = false;

        let secret = false;
        if (event.altKey)
          secret = true;
        
        for (var i = 2; i <= 12; ++i)
        for (var j = 0; j < 6; ++j) {
            let name = String.fromCharCode(65 + j);
            let title = game.settings.get("shinobigami", `Shinobigami.${name}${i}`);
            title = (title !== "") ? title : game.i18n.localize(`Shinobigami.${name}${i}`);
            
            if (title === data.talent) {
                let num = actor.data.data.talent.table[j][i - 2].num;
                
                return actor.rollTalent(title, num, add, secret);
            }
        }
        
        new Dialog({
            title: "alert",
            content: `Error ${data.talent}`,
            buttons: {}
        }).render(true);
        return;
    });


    html.on('click', '.plot-dialog', async ev => {
        event.preventDefault();
        const data = ev.currentTarget.dataset;

        let d = new PlotDialog(data.actorId, data.combatantId, data.name, data.sender).render(true);
        game.shinobigami.plotDialogs.push(d);

    });
}



