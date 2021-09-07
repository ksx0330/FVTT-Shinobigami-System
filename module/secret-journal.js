
export class SecretJournalSheet extends JournalSheet {

    /** @override */
    _getHeaderButtons() {
        let buttons = super._getHeaderButtons();

        // Show Secret Journal
        if (this.object.owner || this.object.hasPerm(game.user, "OBSERVER") ) {
            buttons.unshift({
                label: "Secret",
                class: "show-secret",
                icon: "fas fa-key",
                onclick: ev => this._showSecret(ev)
            });
        }

        // Set Secret Journal
        if ( game.user.isGM ) {
            buttons.unshift({
                label: "Set Secret",
                class: "set-secret",
                icon: "fas fa-lock",
                onclick: ev => this._setSecret(ev)
            });
        }

        return buttons;

    }

    _setSecret(ev) {
        let dialog = new SetDialog(this.object);
        dialog.render(true);

    }

    async _showSecret(ev) {
        try {
            var id = this.object.data.flags["shinobigami"].secret.journal._id;
            var mode = this.object.data.flags["shinobigami"].secret.mode;
            var user = game.user._id;
            var secretJournal = game.journal.get(id);

            if (secretJournal.owner || secretJournal.hasPerm(game.user, "OBSERVER"))
                await Journal._showEntry(secretJournal.uuid, mode, false);
            else 
                throw new Error("You don't have permission");

        } catch (error) {
            new Dialog({
                title: "Error!",
                content: "<p>You can't access this secret</p>",
                buttons: {}
            }).render(true);
        }
    }

}

class SetDialog extends Dialog {

    constructor(journal, options) {
        super(options);
        this.journal = journal;

        this.data = {
            title: "Set Journal",
            content: this._getContent(),
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
        }
    }

      /** @override */
	static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "templates/hud/dialog.html",
            classes: ["dialog"],
            width: 400
        });
    }

    _getContent() {
	var d = (this.journal.data.flags["shinobigami"] != undefined && this.journal.data.flags["shinobigami"].secret != undefined) ? this.journal.data.flags["shinobigami"].secret.journal.name : "";
        var content = "<p>Input Journal Name<br>";
        content += `<p><input type="text" id="setJournal" value="${d}"></p>Mode: <select id="mode"><option value="text">Text</option><option value="image">Image</option></select></p>`;

        return content;
    }

    async _submit() {
        var set = $("#setJournal").val();
        var secret = game.data.journal.find((item) => (item.name == set));
        var mode = $("#mode").val();

	    console.log(set);
	    console.log(secret);
	    console.log(mode);
	    
        if (secret == undefined) {
            await this.journal.unsetFlag("shinobigami", "secret");
            return;
        }

        var data = {"journal": secret, "mode": mode };
        await this.journal.setFlag("shinobigami", "secret", data);

    }


}
