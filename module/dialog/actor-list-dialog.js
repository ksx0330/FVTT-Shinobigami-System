
import { PlotDialog } from "./plot-dialog.js";

export class ActorListDialog extends Dialog {
    constructor(actors, options) {
        super(options);

        this.actors = actors;

        this.data = {
            title: game.i18n.localize("Shinobigami.SelectActor"),
            content: this.getContent(),
            buttons: {
                "cancel": {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => console.log("Canceled")
                },
                "select": {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Select",
                    callback: () => this._submit()
                }
            },
            default: "select"
        };

    }

      /** @override */
	static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "templates/hud/dialog.html",
            classes: ["shinobigami", "dialog"],
            width: 400
        });
    }

    getContent() {
        var content = `<p>${game.i18n.localize("Shinobigami.SelectActor")}<br><div>`;
        content += '<select id="actor-select-dialog" multiple style="width: 100%; height: 100%">';

        for (let item of this.actors) {
            content += `<option value="${item._id}">${item.name}</option>`;
        }
        content += '</select></div>';

        return content;
    }

    async _submit() {
        var actors = $("#actor-select-dialog").val();
        for (let a of actors) {
            let actor = game.actors.get(a);
            await actor.setFlag("shinobigami", "plot", {state: false, dice: []});
            
            let share = game.user.id;
            for (let user of game.users)
                if (user.active && user.character != null && user.character.id === actor.id) {
                    share = user.id;
                    break;
                }
            
            if (share == game.user.id)
                new PlotDialog(actor, actors).render(true);
            else
                game.socket.emit("system.shinobigami", {share, data: {actorId: actor.id, actors: actors}});
        }
    }

}
