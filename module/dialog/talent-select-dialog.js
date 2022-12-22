

export class TalentSelectDialog extends Dialog {
    constructor(actor, callback, options) {
        super(options);

        this.actor = actor;
        this.select = null;

        this.data = {
            title: "Select Talent",
            content: this.getContent(),
            buttons: {
                "confirm": {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Confirm",
                    callback: () => {
                        let name = $(this.select).text().split("/")[0];
                        callback(name);
                    }
                }
            },
            default: "confirm"
        };

    }

      /** @override */
	static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "templates/hud/dialog.html",
            classes: ["shinobigami", "dialog"],
            width: 600
        });
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        html.find(".select").click(this._selectDice.bind(this));
    }


    getContent() {
        let table = Array.from({length: 12}, () => []);
        if (this.actor != null) {
            for (let j = 0; j < 6; ++j) {
                let name = String.fromCharCode(65 + j);
                table[0].push({
                    title: game.i18n.localize(`Shinobigami.${name}1`),
                    num: 0
                });
            }

            for (let i = 2; i <= 12; ++i)
            for (let j = 0; j < 6; ++j) {
                let name = String.fromCharCode(65 + j);
                table[i-1].push({
                    title: game.i18n.localize(`Shinobigami.${name}${i}`),
                    num: this.actor.system.talent.table[j][i - 2].num
                });
            }


        } else {
            for (let i = 1; i <= 12; ++i)
            for (let j = 0; j < 6; ++j) {
                let name = String.fromCharCode(65 + j);
                table[i-1].push({
                    title: game.i18n.localize(`Shinobigami.${name}${i}`),
                    num: 0
                });
            }

        }

        let content = `<table>`;
        content += `<tr>`;
        for (let block of table[0])
            content += `<th>${block.title}</th>`;
        content += `</tr>`;

        for (let i = 1; i < 12; ++i) {
            content += `<tr>`;
            for (let block of table[i]) {
                let text = block.title;
                if (block.num != 0)
                    text += "/" + block.num;

                content += `<td class="select">${text}</td>`;
            }
            content += `</tr>`;
        }
        content += `</table>`;

        return content;
    }

    _selectDice(event) {
        event.preventDefault();
    
        if ($(event.currentTarget).hasClass("talent-select")) {
            $(event.currentTarget).removeClass("talent-select");

            this.select = null;
            return;
        }
    
        $(event.currentTarget).parent().parent().find(".talent-select").removeClass("talent-select");
        $(event.currentTarget).addClass("talent-select");
    
        this.select = event.currentTarget;
    }

}
