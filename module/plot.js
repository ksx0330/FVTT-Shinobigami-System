import { ActorListDialog } from "./dialog/actor-list-dialog.js";
import { PlotDialog } from "./dialog/plot-dialog.js";

export class PlotSettings {
    static initPlot() {
        game.shinobigami = {
            plot: [],
            plotDialogs: []
        }
        
        game.socket.on("system.shinobigami", ({id, sender, receiver, data}) => {
            if (id === "release")
                Hooks.call("releasePlot");
            
            if (game.user.id != receiver)
                return;
                
            if (id === "req") {
                let d = new PlotDialog(data.actorId, data.combatantId, data.name, sender).render(true);
                game.shinobigami.plotDialogs.push(d);
                
            } else if (id === "resp") {
                let plot = game.shinobigami.plot.find(a => (a.actorId === data.actorId && a.combatant === data.combatantId));
                plot.ready = data.ready;
                plot.dice = data.dice;
                
                Hooks.call("checkPlot");
            }
        
        });
        
        Hooks.on("initPlot", (list) => {
            game.shinobigami.plot = [];
            list.forEach( i => game.shinobigami.plot.push({ actorId: i.actorId,  name: i.name, ready: false, combatant: i.combatantId, dice: [] }) );
        });
        
        Hooks.on("spreadPlot", () => {
            let plots = game.shinobigami.plot;
            for (let plot of plots) {
                let share = game.user.id;
                for (let user of game.users)
                    if (user.active && user.character != null && user.character.id === plot.actorId) {
                        share = user.id;
                        break;
                    }

                if (share == game.user.id) {
                    let d = new PlotDialog(plot.actorId, plot.combatant, plot.name, game.user.id).render(true);
                    game.shinobigami.plotDialogs.push(d);
                } else
                    game.socket.emit("system.shinobigami", {id: "req", sender: game.user.id, receiver: share, data: { actorId: plot.actorId, combatantId: plot.combatant, name: plot.name } });
            }
            
        });
        
        Hooks.on("checkPlot", () => {
            for (let plot of game.shinobigami.plot.values())
                if (!plot.ready)
                    return;
                    
            let reveal = async () => {
                Hooks.call("releasePlot");
                game.socket.emit("system.shinobigami", {id: "release"});
                
                let content = `<table><colgroup><col style="width: 30%"><col style="width: 70%"></colgroup>`;
                for (let l of game.shinobigami.plot) {
                    content += `<tr><th>${l.name}</th><td class="dice-lists dice-lists-sm">`;
                    for (let [index, d] of l.dice.entries()) {
                        if (d == "?") {
                            d = await new Roll("1d6").roll().total;
                            l.dice[index] = d;
                            content += `<div class="random">${d}</div> `
                        } else
                            content += `<div>${d}</div> `
                    }
                    content += `</td></tr>`;
                }
                content += `</table>`;
                
                let chatData = {"content": content, "speaker": ChatMessage.getSpeaker({ alias: "PLOT" })};
                ChatMessage.create(chatData);
                
                let updates = [];
                for (let l of game.shinobigami.plot) {
                    if (l.combatant != null)
                        updates.push({_id: l.combatant, initiative: l.dice[0]});
                }
                if (updates.length != 0)
                    await game.combat.updateEmbeddedDocuments("Combatant", updates);
            };

            new Dialog({
                title: "Reveal?",
                content: "",
                buttons: {
                    "confirm": {
                        icon: '<i class="fas fa-check"></i>',
                        label: "Confirm",
                        callback: reveal
                    }
                }
            }).render(true);
            
        });
        
        Hooks.on("releasePlot", () => {
           for (let d of game.shinobigami.plotDialogs)
                d.close();
            game.shinobigami.plotDialogs = [];
        });
        
        Hooks.on("getSceneControlButtons", function(controls) {
            controls[0].tools.push({
                name: "setPlot",
                title: "Set Plot",
                icon: "fas fa-dice",
                visible: game.user.isGM,
                onClick: () => {
                    var actors = game.data.actors.filter(element => (element.permission['default'] == 3 || element.permission[game.user.id] == 3) );

                    let dialog = new ActorListDialog(actors)
                    dialog.render(true);
                },
                button: true
            });

        });
    }
}
