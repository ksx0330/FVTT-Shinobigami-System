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
    return `${path}/${this.item.data.type}-sheet.html`;
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

    this.options.title = this.document.data.name;
    isOwner = this.document.isOwner;
    isEditable = this.isEditable;
    
    const itemData = this.item.data.toObject(false);
    data.data = itemData.data;
    
    data.dtypes = ["String", "Number", "Boolean"];

    console.log(data);

    return data;
  }


}
