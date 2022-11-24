/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class ShinobigamiItemSheet extends ItemSheet {

  /** @override */
	static get defaultOptions() {
	  return mergeObject(super.defaultOptions, {
			classes: ["shinobigami", "sheet", "item"],
			width: 520,
			height: 480,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}]
		});
  }

  /* -------------------------------------------- */

  /** @override */
  get template() {
    const path = "systems/shinobigami/templates";
    return `${path}/${this.item.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(options={}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 192;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /* -------------------------------------------- */

  /** @override */
	activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

  }
  
    /** @override */
  async getData(options) {
    let isOwner = false;
    let isEditable = this.isEditable;

    const data = super.getData(options);
    let items = {};
    let effects = {};
    let actor = null;

    data.userId = game.user.id;

    this.options.title = this.document.name;
    isOwner = this.document.isOwner;
    isEditable = this.isEditable;
    
    const itemData = this.item.toObject(false);
    data.system = this.item.system;
    
    data.dtypes = ["String", "Number", "Boolean"];
    data.isGM = game.user.isGM;

    if (this.item.type == "finish" || this.item.type == "handout") {
      data.users = []
      for (let i of game.users) {
        if (i.isGM)
          continue;
        data.users.push(i)
      }
    }
    
    data.enrichedBiography = await TextEditor.enrichHTML(this.object.system.description, {async: true});
    if (this.object.type == "handout") {
      data.enrichedSecret = await TextEditor.enrichHTML(this.object.system.secret, {async: true});
    }

    return data;
  }


}
